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
    enabled: true
};

function makeRequest(method, url, data, config = {}) {
    // Always route through proxy for security
    if (PROXY_CONFIG.enabled) {
        return makeProxyRequest(method, url, data, config);
    }

    // Fallback to direct request (for testing or when proxy disabled)
    return makeDirectRequest(method, url, data, config);
}

function makeProxyRequest(method, url, data, config = {}) {
    const proxyPayload = {
        url: url,
        method: method.toUpperCase(),
        headers: config.headers || {},
        body: data
    };

    const options = {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS },
        credentials: 'same-origin',
        body: JSON.stringify(proxyPayload)
    };

    if (config.signal) {
        options.signal = config.signal;
    }

    return fetch(PROXY_CONFIG.url, options)
        .then(response => handleProxyResponse(response))
        .catch(error => handleProxyError(error, url, method));
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
            throw new Error(proxyData.error || 'Proxy request failed');
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
    if (!params || Object.keys(params).length === 0) {
        return url;
    }

    const urlObj = new URL(url, window.location.href);

    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            urlObj.searchParams.set(key, value);
        }
    }

    return urlObj.toString();
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