#!/usr/bin/env node

/*
 * server.js - Secure proxy server for htmz environment variables
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const ENV_FILE = process.env.HTMZ_ENV || '.env';

// Environment variables cache
let envVars = {};

function loadEnvironmentVariables() {
    const envPath = path.resolve(ENV_FILE);

    if (!fs.existsSync(envPath)) {
        console.warn(`htmz-proxy: Environment file '${envPath}' not found`);
        return;
    }

    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envVars = parseEnvFile(envContent);

        const keyCount = Object.keys(envVars).length;
        console.log(`htmz-proxy: Loaded ${keyCount} environment variables from ${envPath}`);

        // Log non-sensitive variables for debugging
        Object.keys(envVars).forEach(key => {
            if (!isSensitiveKey(key)) {
                console.log(`  ${key}=${envVars[key]}`);
            } else {
                console.log(`  ${key}=*** (hidden)`);
            }
        });

    } catch (error) {
        console.error(`htmz-proxy: Failed to load environment file: ${error.message}`);
    }
}

function parseEnvFile(content) {
    const vars = {};
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
            // Handle quoted values
            let value = valueParts.join('=');
            value = value.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
            vars[key.trim()] = value;
        }
    }

    return vars;
}

function isSensitiveKey(key) {
    const sensitivePatterns = [
        /key$/i, /secret$/i, /token$/i, /password$/i, /pass$/i,
        /auth$/i, /api_key$/i, /private$/i, /credential$/i,
        /jwt$/i, /bearer$/i, /oauth$/i, /client_secret$/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
}

function resolveEnvVars(str) {
    if (typeof str !== 'string') return str;

    return str.replace(/\{\{env\.([^}]+)\}\}/g, (match, key) => {
        if (envVars.hasOwnProperty(key)) {
            return envVars[key];
        }

        console.warn(`htmz-proxy: Environment variable '${key}' not found`);
        return match; // Keep original if not found
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

function hasEnvVars(obj) {
    if (typeof obj === 'string') {
        return /\{\{env\.[^}]+\}\}/.test(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(hasEnvVars);
    }

    return false;
}

// Middleware
app.use(express.json());

// CORS configuration - restrictive by default
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost and 127.0.0.1 for development
        const allowedOrigins = [
            'http://localhost:8000',
            'http://localhost:8001',
            'http://localhost:8002',
            'http://localhost:3000',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:8001',
            'http://127.0.0.1:8002',
            'http://127.0.0.1:3000',
            'file://' // For local file:// protocol testing
        ];

        // In production, you'd configure specific allowed origins
        if (process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGINS) {
            allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
        }

        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            callback(null, true);
        } else {
            console.warn(`htmz-proxy: Blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
};

app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'htmz-proxy',
        version: '1.0.0',
        envVarsLoaded: Object.keys(envVars).length
    });
});

// Main proxy endpoint
app.post('/htmz-proxy', async (req, res) => {
    const { url, method = 'GET', headers = {}, body } = req.body;

    if (!url) {
        return res.status(400).json({
            error: 'Missing required field: url'
        });
    }

    try {
        // Resolve environment variables in URL and headers
        const resolvedUrl = resolveEnvVars(url);
        const resolvedHeaders = resolveObjectEnvVars(headers);
        const resolvedBody = resolveObjectEnvVars(body);

        // Log the request (without sensitive data)
        console.log(`htmz-proxy: ${method.toUpperCase()} ${resolvedUrl}`);

        // Set up fetch options
        const fetchOptions = {
            method: method.toUpperCase(),
            headers: {
                'User-Agent': 'htmz-proxy/1.0.0',
                ...resolvedHeaders
            }
        };

        // Add body for non-GET requests
        if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method) && resolvedBody) {
            fetchOptions.body = typeof resolvedBody === 'string'
                ? resolvedBody
                : JSON.stringify(resolvedBody);

            // Ensure content-type is set for JSON
            if (!fetchOptions.headers['Content-Type'] && typeof resolvedBody === 'object') {
                fetchOptions.headers['Content-Type'] = 'application/json';
            }
        }

        // Make the actual API request
        const response = await fetch(resolvedUrl, fetchOptions);

        // Get response data
        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        // Return response with original status
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
});

// Error handling
app.use((err, req, res, next) => {
    console.error('htmz-proxy: Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        type: 'server_error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available: ['/health', '/htmz-proxy']
    });
});

// CLI argument parsing
const args = process.argv.slice(2);
const devMode = args.includes('--dev') || process.env.NODE_ENV === 'development';

// Load environment variables on startup
loadEnvironmentVariables();

// Watch for .env file changes in dev mode
if (devMode && fs.existsSync(ENV_FILE)) {
    console.log('htmz-proxy: Development mode - watching for .env changes');
    fs.watchFile(ENV_FILE, () => {
        console.log('htmz-proxy: .env file changed, reloading...');
        loadEnvironmentVariables();
    });
}

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 htmz-proxy server started');
    console.log('');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/health`);
    console.log(`   Proxy:   POST http://localhost:${PORT}/htmz-proxy`);
    console.log('');
    console.log('🔐 Environment variables are secure server-side only!');
    console.log('   Frontend will never see your API keys or secrets.');
    console.log('');

    if (Object.keys(envVars).length === 0) {
        console.log('⚠️  No environment variables loaded. Create a .env file with your API keys.');
    }

    console.log('Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 htmz-proxy server stopped');
    process.exit(0);
});