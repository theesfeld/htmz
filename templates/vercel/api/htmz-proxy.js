/*
 * Vercel serverless function for htmz proxy
 * Handles environment variable resolution and API proxying
 */

// Environment variable patterns that indicate sensitive data
const SENSITIVE_PATTERNS = [
    /key$/i, /secret$/i, /token$/i, /password$/i, /pass$/i,
    /auth$/i, /api_key$/i, /private$/i, /credential$/i,
    /jwt$/i, /bearer$/i, /oauth$/i, /client_secret$/i
];

function isSensitiveKey(key) {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

function resolveEnvVars(str) {
    if (typeof str !== 'string') return str;

    return str.replace(/\{\{env\.([^}]+)\}\}/g, (match, key) => {
        const value = process.env[key];
        if (value === undefined) {
            console.warn(`htmz-proxy: Environment variable '${key}' not found`);
            return match;
        }
        return value;
    });
}

function resolveObjectEnvVars(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const resolved = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            resolved[key] = resolveEnvVars(value);
        } else if (typeof value === 'object') {
            resolved[key] = resolveObjectEnvVars(value);
        } else {
            resolved[key] = value;
        }
    }
    return resolved;
}

export default async function handler(req, res) {
    // Enable CORS for frontend
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { url, method = 'GET', headers = {}, body } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: url'
            });
        }

        // Resolve environment variables
        const resolvedUrl = resolveEnvVars(url);
        const resolvedHeaders = resolveObjectEnvVars(headers);
        const resolvedBody = resolveObjectEnvVars(body);

        console.log(`htmz-proxy: ${method.toUpperCase()} ${resolvedUrl}`);

        // Set up fetch options
        const fetchOptions = {
            method: method.toUpperCase(),
            headers: {
                'User-Agent': 'htmz-proxy-vercel/1.0.0',
                ...resolvedHeaders
            }
        };

        // Add body for non-GET requests
        if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method) && resolvedBody) {
            fetchOptions.body = typeof resolvedBody === 'string'
                ? resolvedBody
                : JSON.stringify(resolvedBody);

            if (!fetchOptions.headers['Content-Type'] && typeof resolvedBody === 'object') {
                fetchOptions.headers['Content-Type'] = 'application/json';
            }
        }

        // Make the API request
        const response = await fetch(resolvedUrl, fetchOptions);

        // Get response data
        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        // Return response
        res.status(response.status).json({
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: responseData,
            headers: Object.fromEntries(response.headers.entries())
        });

    } catch (error) {
        console.error('htmz-proxy: Request failed:', error.message);

        res.status(500).json({
            success: false,
            error: error.message,
            type: 'proxy_error'
        });
    }
}