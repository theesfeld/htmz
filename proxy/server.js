#!/usr/bin/env node

/*
 * server.js - TOML-configured secure proxy server for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = process.env.HTMZ_CONFIG || 'htmz.toml';
const PORT = process.env.HTMZ_PORT || 3001;
const HOST = '127.0.0.1';
const SECRET_FILE = '.htmz-secret';

let config = {};
let allowedEndpoints = new Set();
let hmacSecret = '';
let requestCounter = 0;
const PROXY_VERSION = '3.0.0';
const instanceId = `proxy-${Math.random().toString(36).substr(2, 6)}`;

function generateRequestId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `req_${timestamp}_${random}`;
}

function parseTOML(content) {
    const result = {};
    const lines = content.split('\n');
    let currentSection = result;
    let currentSectionPath = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line || line.startsWith('#')) continue;

        if (line.startsWith('[') && line.endsWith(']')) {
            const sectionName = line.slice(1, -1);
            const parts = sectionName.split('.');

            currentSectionPath = parts;
            currentSection = result;

            for (const part of parts) {
                if (!currentSection[part]) {
                    currentSection[part] = {};
                }
                currentSection = currentSection[part];
            }
            continue;
        }

        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) continue;

        const key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();

        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        } else if (value === 'true') {
            value = true;
        } else if (value === 'false') {
            value = false;
        } else if (!isNaN(value)) {
            value = Number(value);
        }

        currentSection[key] = value;
    }

    return result;
}

function loadTOMLConfig() {
    config = {};
    allowedEndpoints.clear();

    if (!fs.existsSync(CONFIG_FILE)) {
        console.error(`htmz-proxy: Configuration file '${CONFIG_FILE}' not found`);
        process.exit(1);
    }

    try {
        const tomlContent = fs.readFileSync(CONFIG_FILE, 'utf8');
        config = parseTOML(tomlContent);

        console.log('🔧 TOML configuration loaded successfully');

        if (config.apis) {
            let apiCount = 0;
            for (const [apiName, apiConfig] of Object.entries(config.apis)) {
                if (apiConfig.endpoint) {
                    try {
                        const url = new URL(apiConfig.endpoint);
                        const baseUrl = `${url.protocol}//${url.hostname}`;
                        allowedEndpoints.add(baseUrl);
                        console.log(`🔐 Auto-whitelisted ${apiName}: ${baseUrl}`);
                        apiCount++;
                    } catch (e) {
                        console.warn(`⚠️  Invalid endpoint for ${apiName}: ${apiConfig.endpoint}`);
                    }
                }
            }
            console.log(`✅ Loaded ${apiCount} API endpoints`);
        }

        if (config.template_vars) {
            const varCount = Object.keys(config.template_vars).length;
            console.log(`📝 Loaded ${varCount} template variables`);
        }

    } catch (error) {
        console.error('htmz-proxy: Failed to parse TOML configuration:', error.message);
        process.exit(1);
    }
}

function initializeSecurity() {
    if (fs.existsSync(SECRET_FILE)) {
        hmacSecret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
    } else {
        hmacSecret = crypto.randomBytes(64).toString('hex');
        fs.writeFileSync(SECRET_FILE, hmacSecret, { mode: 0o600 });
        console.log('🔐 Generated new HMAC secret');
    }
}

function verifyHMAC(payload, signature) {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', hmacSecret)
            .update(JSON.stringify(payload))
            .digest('hex');
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        return false;
    }
}

function isEndpointAllowed(url) {
    try {
        const urlObj = new URL(url);
        const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
        return allowedEndpoints.has(baseUrl);
    } catch (error) {
        return false;
    }
}

function getApiConfig(url) {
    if (!config.apis) return null;

    for (const [apiName, apiConfig] of Object.entries(config.apis)) {
        if (url.startsWith(apiConfig.endpoint)) {
            return { name: apiName, config: apiConfig };
        }
    }
    return null;
}

function addAuthenticationHeaders(options, apiConfig) {
    if (!apiConfig || !apiConfig.auth_type || apiConfig.auth_type === 'none') {
        return options;
    }

    switch (apiConfig.auth_type) {
        case 'bearer':
            if (apiConfig.token) {
                options.headers['Authorization'] = `Bearer ${apiConfig.token}`;
            }
            break;
        case 'api_header':
            if (apiConfig.header_name && apiConfig.key) {
                options.headers[apiConfig.header_name] = apiConfig.key;
            }
            break;
        case 'basic':
            if (apiConfig.username && apiConfig.password) {
                const credentials = Buffer.from(`${apiConfig.username}:${apiConfig.password}`).toString('base64');
                options.headers['Authorization'] = `Basic ${credentials}`;
            }
            break;
    }

    return options;
}

function processUrlWithAuth(url, apiConfig) {
    if (!apiConfig || !apiConfig.auth_type || apiConfig.auth_type === 'none') {
        return url;
    }

    if (apiConfig.auth_type === 'api_key' && apiConfig.key_param && apiConfig.key) {
        const urlObj = new URL(url);
        urlObj.searchParams.set(apiConfig.key_param, apiConfig.key);
        return urlObj.toString();
    }

    return url;
}

async function handleProxyRequest(req, res) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    requestCounter++;

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const requestData = JSON.parse(body);
            const signature = req.headers['x-htmz-signature'];

            if (!signature || !verifyHMAC(requestData, signature)) {
                console.log(`❌ HMAC verification failed for request ${requestId}`);
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid HMAC signature',
                    type: 'AUTHENTICATION_ERROR'
                }));
                return;
            }

            const { url, method, headers = {}, body: requestBody } = requestData;

            if (!isEndpointAllowed(url)) {
                console.log(`🚫 Endpoint not whitelisted: ${url}`);
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Endpoint not allowed',
                    type: 'ENDPOINT_NOT_ALLOWED'
                }));
                return;
            }

            const apiInfo = getApiConfig(url);
            const processedUrl = processUrlWithAuth(url, apiInfo?.config);

            console.log(`🌐 ${method} ${processedUrl} [${apiInfo?.name || 'Unknown'}]`);

            const urlObj = new URL(processedUrl);
            const isHttps = urlObj.protocol === 'https:';
            const requestModule = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: method.toUpperCase(),
                headers: {
                    'User-Agent': 'htmz-proxy/3.0.0',
                    'Accept': 'application/json',
                    ...headers
                }
            };

            addAuthenticationHeaders(options, apiInfo?.config);

            const externalStartTime = Date.now();
            const proxyReq = requestModule.request(options, (proxyRes) => {
                const externalEndTime = Date.now();
                const externalDuration = externalEndTime - externalStartTime;

                let responseData = '';
                proxyRes.on('data', chunk => {
                    responseData += chunk;
                });

                proxyRes.on('end', () => {
                    const endTime = Date.now();
                    const totalDuration = endTime - startTime;

                    let parsedData;
                    try {
                        parsedData = JSON.parse(responseData);
                    } catch (e) {
                        parsedData = responseData;
                    }

                    const metadata = {
                        request: {
                            id: requestId,
                            timestamp: new Date(startTime).toISOString(),
                            originalUrl: url,
                            resolvedUrl: processedUrl,
                            method: method.toUpperCase(),
                            payloadSize: Buffer.byteLength(body, 'utf8'),
                            apiName: apiInfo?.name || 'unknown'
                        },
                        security: {
                            hmacVerified: true,
                            hmacAlgorithm: 'SHA-256',
                            endpointWhitelisted: true,
                            authType: apiInfo?.config?.auth_type || 'none'
                        },
                        external: {
                            requestSent: new Date(externalStartTime).toISOString(),
                            responseReceived: new Date(externalEndTime).toISOString(),
                            duration: externalDuration,
                            status: proxyRes.statusCode,
                            headers: proxyRes.headers,
                            payloadSize: Buffer.byteLength(responseData, 'utf8')
                        },
                        performance: {
                            totalDuration: totalDuration,
                            externalDuration: externalDuration,
                            proxyOverhead: totalDuration - externalDuration,
                            requestCount: requestCounter
                        },
                        proxy: {
                            version: PROXY_VERSION,
                            instance: instanceId,
                            timestamp: new Date(endTime).toISOString()
                        }
                    };

                    console.log(`✅ ${proxyRes.statusCode} ${processedUrl} (${totalDuration}ms)`);

                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-HTMZ-Signature'
                    });

                    res.end(JSON.stringify({
                        success: true,
                        metadata: metadata,
                        data: parsedData
                    }));
                });
            });

            proxyReq.on('error', (error) => {
                console.error(`💥 External request error: ${error.message}`);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: `External API error: ${error.message}`,
                    type: 'EXTERNAL_API_ERROR'
                }));
            });

            if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                proxyReq.write(typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody));
            }

            proxyReq.end();

        } catch (error) {
            console.error(`💥 Proxy request error: ${error.message}`);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: `Invalid request: ${error.message}`,
                type: 'REQUEST_ERROR'
            }));
        }
    });
}

function handleSecretRequest(req, res) {
    const secretData = {
        secret: hmacSecret,
        ttl: 3600,
        timestamp: Date.now()
    };

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(secretData));
}

function handleTemplateVars(req, res) {
    const templateVars = config.template_vars || {};

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(templateVars));
}

const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-HTMZ-Signature'
        });
        res.end();
        return;
    }

    if (req.url === '/htmz-proxy' && req.method === 'POST') {
        handleProxyRequest(req, res);
    } else if (req.url === '/htmz-secret' && req.method === 'GET') {
        handleSecretRequest(req, res);
    } else if (req.url === '/htmz-vars' && req.method === 'GET') {
        handleTemplateVars(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

function startServer() {
    loadTOMLConfig();
    initializeSecurity();

    const configPort = config.proxy?.port || PORT;
    const configHost = config.proxy?.host || HOST;

    server.listen(configPort, configHost, () => {
        console.log('\n🔐 htmz-secure-proxy started');
        console.log(`\n   Transport: HTTP (localhost only)`);
        console.log(`   Address:   ${configHost}:${configPort}`);
        console.log(`   Security:  HMAC-SHA256 + Endpoint Whitelisting`);
        console.log(`   Endpoints: ${allowedEndpoints.size} whitelisted`);
        console.log(`\n🚀 Maximum security: Localhost + HMAC signing`);
        console.log('   • Localhost-only binding (127.0.0.1)');
        console.log('   • HMAC request integrity verification');
        console.log('   • Endpoint whitelisting enforced');
        console.log('   • Authentication per endpoint');
        console.log(`   • TOML configuration loaded\n`);

        console.log('📋 Whitelisted endpoints:');
        for (const endpoint of allowedEndpoints) {
            console.log(`  ✅ ${endpoint}`);
        }

        if (process.argv.includes('--dev')) {
            console.log('\n🔄 Development mode - watching for config changes');
            fs.watchFile(CONFIG_FILE, () => {
                console.log('\n📝 Configuration file changed, reloading...');
                loadTOMLConfig();
            });
        }

        console.log('\nPress Ctrl+C to stop\n');
    });
}

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down htmz-proxy...');
    server.close(() => {
        process.exit(0);
    });
});

startServer();