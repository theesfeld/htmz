#!/usr/bin/env node
/*
 * security-test.js - Comprehensive security test suite for htmz Unix socket proxy
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Test configuration
const SOCKET_PATH = '/tmp/htmz-test-proxy.sock';

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let testsPassed = 0;
let testsFailed = 0;
let proxyProcess;

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function pass(test) {
    testsPassed++;
    log(`${GREEN}✓ ${test}${RESET}`);
}

function fail(test, error) {
    testsFailed++;
    log(`${RED}✗ ${test}${RESET}`);
    if (error) {
        log(`  Error: ${error.message || error}`);
    }
}

function warn(message) {
    log(`${YELLOW}⚠ ${message}${RESET}`);
}

async function makeRequest(path, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            socketPath: SOCKET_PATH,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body,
                    data: body ? JSON.parse(body) : null
                });
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function computeHMAC(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
}

async function testHMACSecret() {
    try {
        // Try GET request to /htmz-secret endpoint
        const response = await new Promise((resolve, reject) => {
            const req = http.request({
                socketPath: SOCKET_PATH,
                path: '/htmz-secret',
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        data: body ? JSON.parse(body) : null
                    });
                });
            });

            req.on('error', reject);
            req.end();
        });

        if (response.statusCode === 200 && response.data && response.data.secret) {
            pass('HMAC secret endpoint returns valid secret');
            return response.data.secret;
        } else {
            fail('HMAC secret endpoint', `Status: ${response.statusCode}, Body: ${response.body}`);
            return null;
        }
    } catch (error) {
        fail('HMAC secret endpoint', error);
        return null;
    }
}

async function testValidSignedRequest(secret) {
    try {
        const payload = {
            url: 'https://api.github.com/users/octocat',
            method: 'GET',
            headers: {},
            body: null
        };

        const signature = await computeHMAC(payload, secret);
        const response = await makeRequest('/htmz-proxy', JSON.stringify(payload), {
            'X-HTMZ-Signature': signature
        });

        if (response.statusCode === 200) {
            pass('Valid HMAC signed request accepted');
        } else {
            fail('Valid HMAC signed request', `Status: ${response.statusCode}, Body: ${response.body}`);
        }
    } catch (error) {
        fail('Valid HMAC signed request', error);
    }
}

async function testInvalidSignature(secret) {
    try {
        const payload = {
            url: 'https://api.github.com/users/octocat',
            method: 'GET',
            headers: {},
            body: null
        };

        const invalidSignature = 'invalid-signature-123';
        const response = await makeRequest('/htmz-proxy', JSON.stringify(payload), {
            'X-HTMZ-Signature': invalidSignature
        });

        if (response.statusCode === 401) {
            pass('Invalid HMAC signature rejected');
        } else {
            fail('Invalid HMAC signature rejection', `Status: ${response.statusCode}`);
        }
    } catch (error) {
        fail('Invalid HMAC signature rejection', error);
    }
}

async function testMissingSignature() {
    try {
        const payload = {
            url: 'https://api.github.com/users/octocat',
            method: 'GET',
            headers: {},
            body: null
        };

        const response = await makeRequest('/htmz-proxy', JSON.stringify(payload));

        if (response.statusCode === 401) {
            pass('Missing HMAC signature rejected');
        } else {
            fail('Missing HMAC signature rejection', `Status: ${response.statusCode}`);
        }
    } catch (error) {
        fail('Missing HMAC signature rejection', error);
    }
}

async function testEndpointWhitelisting(secret) {
    try {
        // Test whitelisted endpoint
        const whitelistedPayload = {
            url: 'https://api.github.com/users/octocat',
            method: 'GET',
            headers: {},
            body: null
        };

        const whitelistedSignature = await computeHMAC(whitelistedPayload, secret);
        const whitelistedResponse = await makeRequest('/htmz-proxy', JSON.stringify(whitelistedPayload), {
            'X-HTMZ-Signature': whitelistedSignature
        });

        if (whitelistedResponse.statusCode === 200) {
            pass('Whitelisted endpoint allowed');
        } else {
            fail('Whitelisted endpoint access', `Status: ${whitelistedResponse.statusCode}`);
        }

        // Test non-whitelisted endpoint
        const blockedPayload = {
            url: 'https://evil.com/api/steal-data',
            method: 'GET',
            headers: {},
            body: null
        };

        const blockedSignature = await computeHMAC(blockedPayload, secret);
        const blockedResponse = await makeRequest('/htmz-proxy', JSON.stringify(blockedPayload), {
            'X-HTMZ-Signature': blockedSignature
        });

        if (blockedResponse.statusCode === 403) {
            pass('Non-whitelisted endpoint blocked');
        } else {
            fail('Non-whitelisted endpoint blocking', `Status: ${blockedResponse.statusCode}`);
        }
    } catch (error) {
        fail('Endpoint whitelisting', error);
    }
}

async function testRequestSizeLimit(secret) {
    try {
        // Test with a payload close to but under the limit
        const normalPayload = {
            url: 'https://api.github.com/users/octocat',
            method: 'POST',
            headers: {},
            body: 'x'.repeat(1000) // Small payload
        };

        const normalSignature = await computeHMAC(normalPayload, secret);
        const normalResponse = await makeRequest('/htmz-proxy', JSON.stringify(normalPayload), {
            'X-HTMZ-Signature': normalSignature
        });

        if (normalResponse.statusCode === 200) {
            pass('Normal payload size accepted');
        } else {
            warn(`Normal payload returned: ${normalResponse.statusCode}`);
        }

        // Test with oversized payload (>1MB)
        const largeBody = 'x'.repeat(1024 * 1024 + 1000); // >1MB
        const largePayload = {
            url: 'https://api.github.com/users/octocat',
            method: 'POST',
            headers: {},
            body: largeBody
        };

        const largeSignature = await computeHMAC(largePayload, secret);
        const largeResponse = await makeRequest('/htmz-proxy', JSON.stringify(largePayload), {
            'X-HTMZ-Signature': largeSignature
        });

        if (largeResponse.statusCode === 400) {
            pass('Large payload rejected (1MB size limit enforced)');
        } else {
            warn(`Large payload returned: ${largeResponse.statusCode}`);
        }

    } catch (error) {
        if (error.code === 'ECONNRESET' || error.message.includes('too large')) {
            pass('Large payload rejected (connection reset or size error)');
        } else {
            fail('Request size limit test', error);
        }
    }
}


async function testUnixSocketOnly() {
    try {
        // Verify the socket file exists and has proper type
        if (!fs.existsSync(SOCKET_PATH)) {
            fail('Unix socket verification', 'Socket file does not exist');
            return;
        }

        const stats = fs.statSync(SOCKET_PATH);
        if (stats.isSocket()) {
            pass('Unix domain socket properly created');
        } else {
            fail('Unix socket verification', 'Socket path exists but is not a socket');
        }
    } catch (error) {
        fail('Unix socket verification', error);
    }
}

async function testSocketPermissions() {
    try {
        if (!fs.existsSync(SOCKET_PATH)) {
            fail('Socket permissions test', 'Socket file does not exist');
            return;
        }

        const stats = fs.statSync(SOCKET_PATH);
        const permissions = (stats.mode & parseInt('777', 8)).toString(8);

        if (permissions === '600') {
            pass('Socket permissions correctly set to 600');
        } else {
            fail('Socket permissions', `Expected 600, got ${permissions}`);
        }
    } catch (error) {
        fail('Socket permissions test', error);
    }
}

async function testNoNetworkExposure() {
    try {
        // Try to connect via TCP - this should fail since we're Unix socket only
        const tcpAttempt = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: '/health',
                method: 'GET'
            }, (res) => {
                resolve({ success: true, statusCode: res.statusCode });
            });

            req.on('error', (error) => {
                resolve({ success: false, error: error.code });
            });

            req.setTimeout(1000, () => {
                req.destroy();
                resolve({ success: false, error: 'TIMEOUT' });
            });

            req.end();
        });

        if (!tcpAttempt.success && (tcpAttempt.error === 'ECONNREFUSED' || tcpAttempt.error === 'TIMEOUT')) {
            pass('No TCP network exposure - Unix socket only');
        } else {
            fail('Network exposure test', 'TCP connection succeeded - security breach!');
        }
    } catch (error) {
        fail('Network exposure test', error);
    }
}

async function startProxyServer() {
    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');

        // Create test .env file
        const testEnv = `
GITHUB_API=https://api.github.com
DEFAULT_USER=octocat
ALLOWED_ENDPOINTS=https://api.github.com
        `;
        fs.writeFileSync('/tmp/htmz-test.env', testEnv);

        proxyProcess = spawn('node', [
            path.join(__dirname, '..', 'proxy', 'server.js'),
            '--dev'
        ], {
            env: {
                ...process.env,
                HTMZ_ENV: '/tmp/htmz-test.env',
                HTMZ_SOCKET: SOCKET_PATH
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        proxyProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('htmz-secure-proxy started')) {
                log('Unix socket proxy server started for testing');
                resolve();
            }
        });

        proxyProcess.stderr.on('data', (data) => {
            console.error('Proxy error:', data.toString());
        });

        proxyProcess.on('error', reject);

        // Timeout after 10 seconds
        setTimeout(() => {
            reject(new Error('Proxy server failed to start within timeout'));
        }, 10000);
    });
}

function stopProxyServer() {
    if (proxyProcess) {
        proxyProcess.kill('SIGINT');
        proxyProcess = null;
    }

    // Clean up test files
    try {
        if (fs.existsSync('/tmp/htmz-test.env')) {
            fs.unlinkSync('/tmp/htmz-test.env');
        }
        if (fs.existsSync(SOCKET_PATH)) {
            fs.unlinkSync(SOCKET_PATH);
        }
    } catch (e) {
        // Ignore cleanup errors
    }
}

async function runTests() {
    log('Starting htmz Unix socket proxy security test suite');

    try {
        await startProxyServer();

        // Wait a moment for server to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        log('Running Unix socket security tests...');

        // Test 1: Socket permissions
        await testSocketPermissions();

        // Test 2: No network exposure
        await testNoNetworkExposure();

        // Test 3: HMAC Secret endpoint
        const secret = await testHMACSecret();
        if (!secret) {
            log('Cannot continue tests without HMAC secret');
            return;
        }

        // Test 4: Valid signed request
        await testValidSignedRequest(secret);

        // Test 5: Invalid signature
        await testInvalidSignature(secret);

        // Test 6: Missing signature
        await testMissingSignature();

        // Test 7: Endpoint whitelisting
        await testEndpointWhitelisting(secret);

        // Test 8: Request size limits
        await testRequestSizeLimit(secret);

        // Test 10: Unix socket verification
        await testUnixSocketOnly();

    } catch (error) {
        log(`Test setup error: ${error.message}`);
    } finally {
        stopProxyServer();
    }

    // Results
    log('\n' + '='.repeat(50));
    log('Security Test Results:');
    log(`${GREEN}✓ Tests Passed: ${testsPassed}${RESET}`);
    log(`${RED}✗ Tests Failed: ${testsFailed}${RESET}`);

    if (testsFailed === 0) {
        log(`${GREEN}All security tests passed!${RESET}`);
        process.exit(0);
    } else {
        log(`${RED}Some security tests failed!${RESET}`);
        process.exit(1);
    }
}

// Handle cleanup on exit
process.on('SIGINT', stopProxyServer);
process.on('SIGTERM', stopProxyServer);
process.on('exit', stopProxyServer);

// Run tests
runTests().catch(error => {
    log(`Fatal error: ${error.message}`);
    stopProxyServer();
    process.exit(1);
});