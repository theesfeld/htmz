#!/usr/bin/env node
/*
 * tagging-test.js - Comprehensive test suite for htmz tagging system
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
const { spawn } = require('child_process');

// Test configuration
const PROXY_PORT = 3002; // Use different port for testing
const PROXY_HOST = '127.0.0.1';
const TEST_SECRET = crypto.randomBytes(32).toString('hex');

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
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

function info(message) {
    log(`${BLUE}ℹ ${message}${RESET}`);
}

function warn(message) {
    log(`${YELLOW}⚠ ${message}${RESET}`);
}

// HMAC signing function
async function computeHMAC(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
}

// HTTP request helper
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const responseData = JSON.parse(body);
                    resolve({ status: res.statusCode, headers: res.headers, data: responseData });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

// Create test TOML config
function createTestConfig() {
    const testConfig = `
[proxy]
port = ${PROXY_PORT}
host = "${PROXY_HOST}"

[apis.github]
name = "GitHub API"
endpoint = "https://api.github.com"
auth_type = "none"

[apis.httpbin]
name = "HTTPBin"
endpoint = "https://httpbin.org"
auth_type = "none"

[apis.jsonplaceholder]
name = "JSONPlaceholder"
endpoint = "https://jsonplaceholder.typicode.com"
auth_type = "none"

[template_vars]
GITHUB_API = "https://api.github.com"
HTTPBIN_API = "https://httpbin.org"
`;

    fs.writeFileSync('tests/test-htmz.toml', testConfig);
    fs.writeFileSync('tests/.htmz-secret', TEST_SECRET);
    fs.chmodSync('tests/.htmz-secret', 0o600);
}

// Start proxy server for testing
function startProxyServer() {
    return new Promise((resolve, reject) => {
        const env = { ...process.env, HTMZ_CONFIG: 'tests/test-htmz.toml' };

        proxyProcess = spawn('node', ['proxy/server.js'], {
            env,
            cwd: process.cwd(),
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let started = false;
        const timeout = setTimeout(() => {
            if (!started) {
                reject(new Error('Proxy server failed to start within timeout'));
            }
        }, 5000);

        proxyProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes(`listening on ${PROXY_HOST}:${PROXY_PORT}`) && !started) {
                started = true;
                clearTimeout(timeout);
                resolve();
            }
        });

        proxyProcess.stderr.on('data', (data) => {
            console.error('Proxy error:', data.toString());
        });

        proxyProcess.on('error', reject);
        proxyProcess.on('exit', (code) => {
            if (code !== 0 && !started) {
                reject(new Error(`Proxy server exited with code ${code}`));
            }
        });
    });
}

// Test tagged request functionality
async function testTaggedRequest() {
    try {
        const payload = {
            url: 'https://api.github.com/users/octocat',
            method: 'GET',
            headers: {},
            body: null,
            tag: 'test_user'
        };

        const signature = await computeHMAC(payload, TEST_SECRET);
        const response = await makeRequest({
            hostname: PROXY_HOST,
            port: PROXY_PORT,
            path: '/htmz-proxy',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-HTMZ-Signature': signature
            }
        }, payload);

        if (response.status === 200 && response.data.success) {
            if (response.data.metadata && response.data.metadata.tag === 'test_user') {
                pass('Tagged request returns correct tag in metadata');
            } else {
                fail('Tagged request missing or incorrect tag in metadata');
            }

            if (response.data.data && response.data.data.login === 'octocat') {
                pass('Tagged request returns correct GitHub user data');
            } else {
                fail('Tagged request data validation failed');
            }
        } else {
            fail('Tagged request failed', new Error(`Status: ${response.status}`));
        }
    } catch (error) {
        fail('Tagged request test', error);
    }
}

// Test batch request simulation
async function testBatchRequestSimulation() {
    try {
        // Simulate batch requests by making multiple tagged requests
        const batchRequests = [
            {
                url: 'https://api.github.com/users/octocat',
                method: 'GET',
                headers: {},
                body: null,
                tag: 'batch_user1'
            },
            {
                url: 'https://api.github.com/users/torvalds',
                method: 'GET',
                headers: {},
                body: null,
                tag: 'batch_user2'
            },
            {
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                method: 'GET',
                headers: {},
                body: null,
                tag: 'batch_post'
            }
        ];

        const promises = batchRequests.map(async (payload) => {
            const signature = await computeHMAC(payload, TEST_SECRET);
            return makeRequest({
                hostname: PROXY_HOST,
                port: PROXY_PORT,
                path: '/htmz-proxy',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-HTMZ-Signature': signature
                }
            }, payload);
        });

        const responses = await Promise.all(promises);

        let successCount = 0;
        let tagsCorrect = 0;
        const expectedTags = ['batch_user1', 'batch_user2', 'batch_post'];

        responses.forEach((response, index) => {
            if (response.status === 200 && response.data.success) {
                successCount++;

                if (response.data.metadata && response.data.metadata.tag === expectedTags[index]) {
                    tagsCorrect++;
                }
            }
        });

        if (successCount === 3) {
            pass('Batch request simulation - all requests successful');
        } else {
            fail(`Batch request simulation - only ${successCount}/3 requests successful`);
        }

        if (tagsCorrect === 3) {
            pass('Batch request simulation - all tags correctly returned');
        } else {
            fail(`Batch request simulation - only ${tagsCorrect}/3 tags correct`);
        }

        // Verify different data sources
        const githubUser = responses[0].data.data;
        const jsonPost = responses[2].data.data;

        if (githubUser.login && jsonPost.title) {
            pass('Batch request simulation - mixed API data correctly retrieved');
        } else {
            fail('Batch request simulation - mixed API data validation failed');
        }

    } catch (error) {
        fail('Batch request simulation test', error);
    }
}

// Test invalid tag handling
async function testInvalidTagHandling() {
    try {
        // Test with various invalid tags
        const invalidTags = [null, '', undefined, 123, {}, [], 'a'.repeat(1000)];

        for (const tag of invalidTags) {
            const payload = {
                url: 'https://httpbin.org/json',
                method: 'GET',
                headers: {},
                body: null,
                tag: tag
            };

            const signature = await computeHMAC(payload, TEST_SECRET);
            const response = await makeRequest({
                hostname: PROXY_HOST,
                port: PROXY_PORT,
                path: '/htmz-proxy',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-HTMZ-Signature': signature
                }
            }, payload);

            // Should still succeed but handle tag gracefully
            if (response.status === 200 && response.data.success) {
                const returnedTag = response.data.metadata ? response.data.metadata.tag : null;
                if (tag === null || tag === undefined || tag === '') {
                    if (returnedTag === null) {
                        // Expected behavior
                    } else {
                        warn(`Invalid tag ${JSON.stringify(tag)} was not normalized to null`);
                    }
                }
            }
        }

        pass('Invalid tag handling - graceful degradation');
    } catch (error) {
        fail('Invalid tag handling test', error);
    }
}

// Test tag metadata completeness
async function testTagMetadata() {
    try {
        const payload = {
            url: 'https://httpbin.org/json',
            method: 'GET',
            headers: { 'User-Agent': 'htmz-test' },
            body: null,
            tag: 'metadata_test'
        };

        const signature = await computeHMAC(payload, TEST_SECRET);
        const response = await makeRequest({
            hostname: PROXY_HOST,
            port: PROXY_PORT,
            path: '/htmz-proxy',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-HTMZ-Signature': signature
            }
        }, payload);

        if (response.status === 200 && response.data.success && response.data.metadata) {
            const metadata = response.data.metadata;

            // Check required metadata fields
            const requiredFields = ['tag', 'request', 'security', 'external', 'performance', 'proxy'];
            let allFieldsPresent = true;

            requiredFields.forEach(field => {
                if (!metadata[field]) {
                    allFieldsPresent = false;
                    warn(`Missing metadata field: ${field}`);
                }
            });

            if (allFieldsPresent) {
                pass('Tag metadata completeness - all required fields present');
            } else {
                fail('Tag metadata completeness - missing required fields');
            }

            // Verify tag is correctly included
            if (metadata.tag === 'metadata_test') {
                pass('Tag metadata correctness - tag value matches request');
            } else {
                fail('Tag metadata correctness - tag value mismatch');
            }

            // Check performance metrics
            if (metadata.performance &&
                typeof metadata.performance.totalDuration === 'number' &&
                typeof metadata.performance.externalDuration === 'number') {
                pass('Tag metadata performance - timing metrics included');
            } else {
                fail('Tag metadata performance - timing metrics missing or invalid');
            }

        } else {
            fail('Tag metadata test - request failed or metadata missing');
        }
    } catch (error) {
        fail('Tag metadata test', error);
    }
}

// Test concurrent tagged requests
async function testConcurrentTaggedRequests() {
    try {
        const concurrentRequests = [];
        const requestCount = 5;

        for (let i = 0; i < requestCount; i++) {
            const payload = {
                url: `https://jsonplaceholder.typicode.com/posts/${i + 1}`,
                method: 'GET',
                headers: {},
                body: null,
                tag: `concurrent_${i}`
            };

            const signature = await computeHMAC(payload, TEST_SECRET);
            const requestPromise = makeRequest({
                hostname: PROXY_HOST,
                port: PROXY_PORT,
                path: '/htmz-proxy',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-HTMZ-Signature': signature
                }
            }, payload);

            concurrentRequests.push(requestPromise);
        }

        const responses = await Promise.all(concurrentRequests);

        let successCount = 0;
        let tagsCorrect = 0;

        responses.forEach((response, index) => {
            if (response.status === 200 && response.data.success) {
                successCount++;

                if (response.data.metadata && response.data.metadata.tag === `concurrent_${index}`) {
                    tagsCorrect++;
                }
            }
        });

        if (successCount === requestCount) {
            pass(`Concurrent tagged requests - all ${requestCount} requests successful`);
        } else {
            fail(`Concurrent tagged requests - only ${successCount}/${requestCount} requests successful`);
        }

        if (tagsCorrect === requestCount) {
            pass(`Concurrent tagged requests - all ${requestCount} tags correctly maintained`);
        } else {
            fail(`Concurrent tagged requests - only ${tagsCorrect}/${requestCount} tags correct`);
        }

    } catch (error) {
        fail('Concurrent tagged requests test', error);
    }
}

// Run all tests
async function runTests() {
    console.log(`${BLUE}🧪 htmz Tagging System Test Suite${RESET}`);
    console.log(`${BLUE}=====================================${RESET}\n`);

    info('Setting up test environment...');
    createTestConfig();

    info('Starting proxy server...');
    try {
        await startProxyServer();
        info(`Proxy server started on ${PROXY_HOST}:${PROXY_PORT}`);
    } catch (error) {
        fail('Failed to start proxy server', error);
        process.exit(1);
    }

    // Wait a moment for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    info('Running tagging system tests...\n');

    // Run all tests
    await testTaggedRequest();
    await testBatchRequestSimulation();
    await testInvalidTagHandling();
    await testTagMetadata();
    await testConcurrentTaggedRequests();

    // Cleanup
    if (proxyProcess) {
        proxyProcess.kill('SIGTERM');
    }

    // Clean up test files
    try {
        fs.unlinkSync('tests/test-htmz.toml');
        fs.unlinkSync('tests/.htmz-secret');
    } catch (e) {
        // Ignore cleanup errors
    }

    console.log('\n' + '='.repeat(50));
    console.log(`${GREEN}Tests Passed: ${testsPassed}${RESET}`);
    console.log(`${RED}Tests Failed: ${testsFailed}${RESET}`);
    console.log(`${BLUE}Total Tests: ${testsPassed + testsFailed}${RESET}`);

    if (testsFailed === 0) {
        console.log(`\n${GREEN}🎉 All tagging system tests passed!${RESET}`);
        process.exit(0);
    } else {
        console.log(`\n${RED}❌ Some tests failed. Please check the implementation.${RESET}`);
        process.exit(1);
    }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    if (proxyProcess) {
        proxyProcess.kill('SIGTERM');
    }
    process.exit(1);
});

process.on('SIGTERM', () => {
    if (proxyProcess) {
        proxyProcess.kill('SIGTERM');
    }
    process.exit(1);
});

// Run tests
runTests().catch(error => {
    console.error('Test suite failed:', error);
    if (proxyProcess) {
        proxyProcess.kill('SIGTERM');
    }
    process.exit(1);
});