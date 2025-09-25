/*
 * request.js - Fast AJAX request handling for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
};

// Global proxy configuration
let PROXY_CONFIG = {
    url: 'http://localhost:3001/htmz-proxy',
    enabled: true,
    secret: null,
    secretExpiry: null
};

async function fetchHMACSecret() {
    if (PROXY_CONFIG.secret && PROXY_CONFIG.secretExpiry && Date.now() < PROXY_CONFIG.secretExpiry) {
        return PROXY_CONFIG.secret;
    }

    try {
        const secretUrl = PROXY_CONFIG.url.replace('/htmz-proxy', '/htmz-secret');
        const response = await fetch(secretUrl, {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch HMAC secret: ${response.status}`);
        }

        const data = await response.json();
        PROXY_CONFIG.secret = data.secret;
        PROXY_CONFIG.secretExpiry = Date.now() + (data.ttl * 1000);
        return PROXY_CONFIG.secret;
    } catch (error) {
        console.error('htmz: Failed to fetch HMAC secret:', error);
        throw new Error('Unable to establish secure connection to proxy');
    }
}

async function computeHMAC(payload, secret) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(secret);
    const data = encoder.encode(JSON.stringify(payload));

    const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    return Array.from(new Uint8Array(signature))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

async function makeRequest(method, url, data, config = {}) {
    // Always route through proxy for security
    if (PROXY_CONFIG.enabled) {
        return await makeProxyRequest(method, url, data, config);
    }

    // Fallback to direct request (for testing or when proxy disabled)
    return makeDirectRequest(method, url, data, config);
}

async function makeProxyRequest(method, url, data, config = {}) {
    try {
        const secret = await fetchHMACSecret();

        const proxyPayload = {
            url: url,
            method: method.toUpperCase(),
            headers: config.headers || {},
            body: data
        };

        const signature = await computeHMAC(proxyPayload, secret);

        const options = {
            method: 'POST',
            headers: {
                ...DEFAULT_HEADERS,
                'X-HTMZ-Signature': signature
            },
            credentials: 'same-origin',
            body: JSON.stringify(proxyPayload)
        };

        if (config.signal) {
            options.signal = config.signal;
        }

        const response = await fetch(PROXY_CONFIG.url, options);
        return handleProxyResponse(response);
    } catch (error) {
        return handleProxyError(error, url, method);
    }
}

function makeDirectRequest(method, url, data, config = {}) {
    const options = {
        method: method.toUpperCase(),
        headers: { ...DEFAULT_HEADERS, ...config.headers },
        credentials: 'same-origin'
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
        options.body = isObject(data) ? JSON.stringify(data) : data;
    }

    if (config.signal) {
        options.signal = config.signal;
    }

    return fetch(url, options)
        .then(response => handleResponse(response))
        .catch(error => handleError(error, url, method));
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
}

function handleProxyResponse(response) {
    if (!response.ok) {
        throw new Error(`Proxy Error ${response.status}: ${response.statusText}`);
    }

    return response.json().then(proxyData => {
        if (!proxyData.success) {
            const error = new Error(proxyData.error || 'Proxy request failed');
            error.metadata = proxyData.metadata;
            error.type = proxyData.type;
            throw error;
        }

        // Log metadata for debugging if enabled
        if (window.htmz && window.htmz.config && window.htmz.config.logRequests) {
            console.log('htmz: Proxy metadata:', proxyData.metadata);
        }

        return proxyData.data;
    });
}

function handleError(error, url, method) {
    console.error(`htmz: ${method} request to ${url} failed:`, error);
    throw error;
}

function handleProxyError(error, url, method) {
    // Check if proxy server is not running
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const proxyUrl = new URL(PROXY_CONFIG.url);
        console.error(`htmz: Proxy server not available at ${proxyUrl.origin}`);
        console.error('htmz: Start the proxy server with: npx htmz proxy');
        console.error('htmz: Or disable proxy mode with: htmz.configure({ proxy: false })');
    } else {
        console.error(`htmz: Proxy request to ${url} failed:`, error);
    }
    throw error;
}

function serializeForm(form) {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    return data;
}

function serializeElement(element, config) {
    const data = { ...config.params };

    if (element.tagName === 'FORM') {
        const formData = serializeForm(element);
        return { ...data, ...formData };
    }

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        const name = element.name || element.id || 'value';
        data[name] = element.value;
    }

    if (config.include) {
        const includeElements = document.querySelectorAll(config.include);
        for (const el of includeElements) {
            if (el.name && el.value !== undefined) {
                data[el.name] = el.value;
            }
        }
    }

    return data;
}

function buildUrl(url, params) {
    // CRITICAL: Unified URL template processor - handles ALL placeholder types
    try {
        return processUrlTemplate(url, params || {});
    } catch (error) {
        console.error('htmz: CRITICAL URL processing failed:', error);
        console.error('htmz: URL:', url);
        console.error('htmz: Params:', params);
        throw new Error(`URL template processing failed: ${error.message}`);
    }
}

function processUrlTemplate(url, params) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    let processedUrl = url;
    const consumedParams = new Set();

    // Step 1: Replace {fieldName} placeholders with actual values
    // Use regex to find all {fieldName} patterns, but EXCLUDE {{env.VAR}} patterns
    const fieldPlaceholderRegex = /(?<!\{)\{([^}]+)\}(?!\})/g;
    let match;

    // Reset regex state
    fieldPlaceholderRegex.lastIndex = 0;

    while ((match = fieldPlaceholderRegex.exec(url)) !== null) {
        const fieldName = match[1];
        const placeholder = match[0]; // Full match like {value}

        // Skip environment variables - they're processed server-side
        if (fieldName.startsWith('env.')) {
            continue;
        }

        if (params.hasOwnProperty(fieldName)) {
            const value = params[fieldName];
            if (value !== null && value !== undefined) {
                // Replace ALL instances of this placeholder
                processedUrl = processedUrl.replace(new RegExp(`(?<!\\{)\\{${escapeRegExp(fieldName)}\\}(?!\\})`, 'g'),
                    encodeURIComponent(String(value)));
                consumedParams.add(fieldName);
            } else {
                console.warn(`htmz: Field placeholder {${fieldName}} found but value is null/undefined`);
            }
        } else {
            console.warn(`htmz: Field placeholder {${fieldName}} found but no matching parameter provided`);
        }
    }

    // Step 2: Handle remaining query parameters
    const remainingParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (!consumedParams.has(key) && value !== null && value !== undefined) {
            remainingParams[key] = value;
        }
    }

    // Step 3: Add remaining parameters as query string
    const remainingEntries = Object.entries(remainingParams);
    if (remainingEntries.length === 0) {
        return processedUrl;
    }

    // Determine if URL already has query parameters
    const separator = processedUrl.includes('?') ? '&' : '?';
    const queryString = remainingEntries
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

    return `${processedUrl}${separator}${queryString}`;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createAbortController() {
    return new AbortController();
}

function isRequestInFlight(element) {
    return element.hasAttribute('data-hz-request');
}

function markRequestStart(element, controller) {
    element.setAttribute('data-hz-request', 'true');
    element._hzController = controller;
}

function markRequestEnd(element) {
    element.removeAttribute('data-hz-request');
    delete element._hzController;
}

function abortRequest(element) {
    if (element._hzController) {
        element._hzController.abort();
        markRequestEnd(element);
    }
}

function configureProxy(config) {
    if (config.hasOwnProperty('enabled')) {
        PROXY_CONFIG.enabled = config.enabled;
    }

    if (config.url) {
        PROXY_CONFIG.url = config.url;
    }

    return PROXY_CONFIG;
}

function getProxyConfig() {
    return { ...PROXY_CONFIG };
}