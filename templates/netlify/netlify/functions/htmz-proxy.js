/*
 * Netlify function for htmz proxy
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

exports.handler = async (event, context) => {
    const { httpMethod, headers, body, origin } = event;

    // Enable CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
        'Access-Control-Allow-Credentials': 'true'
    };

    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            })
        };
    }

    try {
        const requestBody = JSON.parse(body);
        const { url, method = 'GET', headers: requestHeaders = {}, body: requestData } = requestBody;

        if (!url) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required field: url'
                })
            };
        }

        // Resolve environment variables
        const resolvedUrl = resolveEnvVars(url);
        const resolvedHeaders = resolveObjectEnvVars(requestHeaders);
        const resolvedBody = resolveObjectEnvVars(requestData);

        console.log(`htmz-proxy: ${method.toUpperCase()} ${resolvedUrl}`);

        // Set up fetch options
        const fetchOptions = {
            method: method.toUpperCase(),
            headers: {
                'User-Agent': 'htmz-proxy-netlify/1.0.0',
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
        return {
            statusCode: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: responseData,
                headers: Object.fromEntries(response.headers.entries())
            })
        };

    } catch (error) {
        console.error('htmz-proxy: Request failed:', error.message);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: error.message,
                type: 'proxy_error'
            })
        };
    }
};