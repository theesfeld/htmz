/*
 * utils.js - Utility functions for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

function isString(value) {
    return typeof value === 'string';
}

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isArray(value) {
    return Array.isArray(value);
}

function isEmpty(value) {
    if (!value) return true;
    if (isArray(value)) return value.length === 0;
    if (isObject(value)) return Object.keys(value).length === 0;
    if (isString(value)) return value.trim() === '';
    return false;
}

function getNestedProperty(obj, path) {
    if (!path || !obj) return undefined;

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
    }

    return current;
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function parseDelay(delayStr) {
    if (!delayStr) return 0;
    const match = delayStr.match(/(\d+)(ms|s)?/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2] || 'ms';

    return unit === 's' ? value * 1000 : value;
}

function camelToKebab(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}/*
 * parser.js - HTML attribute parsing for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const HZ_ATTRIBUTES = [
    'hz-get', 'hz-post', 'hz-put', 'hz-delete', 'hz-patch',
    'hz-template', 'hz-target', 'hz-swap', 'hz-trigger',
    'hz-params', 'hz-headers', 'hz-include', 'hz-confirm',
    'hz-indicator', 'hz-sync', 'hz-swap-oob', 'hz-push-url',
    'hz-select', 'hz-select-oob', 'hz-preserve',
    'hz-tag', 'hz-batch'
];

function parseAttributes(element) {
    const config = {
        method: null,
        url: null,
        template: null,
        target: null,
        swap: 'innerHTML',
        trigger: 'click',
        params: {},
        headers: {},
        include: null,
        confirm: null,
        indicator: null,
        sync: null,
        swapOob: null,
        pushUrl: null,
        select: null,
        selectOob: null,
        preserve: null,
        tag: null,
        batch: null
    };

    for (const attr of HZ_ATTRIBUTES) {
        const value = element.getAttribute(attr);
        if (value === null) continue;

        const key = attr.substring(3);

        switch (key) {
            case 'get':
            case 'post':
            case 'put':
            case 'delete':
            case 'patch':
                config.method = key.toUpperCase();
                config.url = value;
                break;

            case 'template':
                config.template = parseTemplate(value);
                break;

            case 'target':
                config.target = value;
                break;

            case 'swap':
                config.swap = parseSwapStrategy(value);
                break;

            case 'trigger':
                config.trigger = parseTrigger(value);
                break;

            case 'params':
                config.params = parseParams(value);
                break;

            case 'headers':
                config.headers = parseHeaders(value);
                break;

            case 'swap-oob':
                config.swapOob = value;
                break;

            case 'push-url':
                config.pushUrl = value;
                break;

            case 'select':
                config.select = value;
                break;

            case 'select-oob':
                config.selectOob = value;
                break;

            case 'preserve':
                config.preserve = value;
                break;

            case 'tag':
                config.tag = value;
                break;

            case 'batch':
                config.batch = parseBatch(value);
                break;

            default:
                config[key] = value;
        }
    }

    return config;
}

function parseTemplate(templateStr) {
    if (templateStr.startsWith('#')) {
        return {
            type: 'selector',
            value: templateStr
        };
    }

    return {
        type: 'inline',
        value: templateStr
    };
}

function parseSwapStrategy(swapStr) {
    const parts = swapStr.split(' ');
    const strategy = parts[0] || 'innerHTML';
    const options = {};

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (part.includes(':')) {
            const [key, value] = part.split(':');
            options[key] = value;
        } else {
            options[part] = true;
        }
    }

    return { strategy, options };
}

function parseTrigger(triggerStr) {
    const triggers = [];
    const parts = triggerStr.split(',');

    for (const part of parts) {
        const trigger = parseSingleTrigger(part.trim());
        if (trigger) {
            triggers.push(trigger);
        }
    }

    return triggers.length === 1 ? triggers[0] : triggers;
}

function parseSingleTrigger(triggerStr) {
    const parts = triggerStr.split(' ');
    const event = parts[0];
    const options = {};

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('delay:')) {
            options.delay = parseDelay(part.substring(6));
        } else if (part.startsWith('throttle:')) {
            options.throttle = parseDelay(part.substring(9));
        } else if (part === 'changed') {
            options.changed = true;
        } else if (part === 'once') {
            options.once = true;
        }
    }

    return { event, options };
}

function parseParams(paramsStr) {
    try {
        return JSON.parse(paramsStr);
    } catch (e) {
        return parseSimpleParams(paramsStr);
    }
}

function parseSimpleParams(paramsStr) {
    const params = {};
    const pairs = paramsStr.split('&');

    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
    }

    return params;
}

function parseHeaders(headersStr) {
    try {
        return JSON.parse(headersStr);
    } catch (e) {
        return parseSimpleHeaders(headersStr);
    }
}

function parseSimpleHeaders(headersStr) {
    const headers = {};
    const pairs = headersStr.split(',');

    for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > 0) {
            const key = pair.substring(0, colonIndex).trim();
            const value = pair.substring(colonIndex + 1).trim();
            headers[key] = value;
        }
    }

    return headers;
}

function parseBatch(batchStr) {
    const batchRequests = [];
    const pairs = batchStr.split(',');

    for (const pair of pairs) {
        const trimmedPair = pair.trim();
        const colonIndex = trimmedPair.indexOf(':');

        if (colonIndex > 0) {
            const tag = trimmedPair.substring(0, colonIndex).trim();
            const url = trimmedPair.substring(colonIndex + 1).trim();

            if (tag && url) {
                batchRequests.push({ tag, url });
            }
        }
    }

    return batchRequests.length > 0 ? batchRequests : null;
}


function findElementsWithAttributes() {
    const selector = HZ_ATTRIBUTES.map(attr => `[${attr}]`).join(',');
    return document.querySelectorAll(selector);
}/*
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
            body: data,
            tag: config.tag || null
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

        // Store tagged data if tag is present in metadata
        if (proxyData.metadata && proxyData.metadata.tag && window.htmz && window.htmz.store) {
            window.htmz.store.storeTaggedData(proxyData.metadata.tag, proxyData.data, proxyData.metadata);
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
}/*
 * template.js - High-performance JSON to HTML templating for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const TEMPLATE_CACHE = new Map();
const INTERPOLATION_REGEX = /\{\{([^}]+)\}\}/g;
const BLOCK_REGEX = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
const CONDITIONAL_REGEX = /\{\{\?([^}]+)\}\}([\s\S]*?)\{\{\/\?\}\}/g;

function renderTemplate(templateConfig, data) {
    const template = getTemplate(templateConfig);
    if (!template) return '';

    const result = processTemplate(template, data);

    processOutOfBandSwaps(data);

    return result;
}

function getTemplate(templateConfig) {
    if (templateConfig.type === 'selector') {
        const element = document.querySelector(templateConfig.value);
        if (!element) {
            console.warn(`htmz: Template element ${templateConfig.value} not found`);
            return null;
        }

        const cacheKey = templateConfig.value;
        if (!TEMPLATE_CACHE.has(cacheKey)) {
            const content = element.tagName === 'TEMPLATE'
                ? element.innerHTML
                : element.textContent;
            TEMPLATE_CACHE.set(cacheKey, content);
        }

        return TEMPLATE_CACHE.get(cacheKey);
    }

    return templateConfig.value;
}

function processTemplate(template, data) {
    let result = template;

    result = processConditionals(result, data);
    result = processBlocks(result, data);
    result = processInterpolations(result, data);

    return result;
}

function processInterpolations(template, data) {
    return template.replace(INTERPOLATION_REGEX, (match, expression) => {
        const value = evaluateExpression(expression.trim(), data);
        return escapeHtml(value);
    });
}

function processBlocks(template, data) {
    return template.replace(BLOCK_REGEX, (match, arrayName, blockTemplate) => {
        let array;

        // Check for tagged data first (e.g., "repos" could be a tag)
        if (window.htmz && window.htmz.store && window.htmz.store.hasTaggedData(arrayName)) {
            array = window.htmz.store.getTaggedData(arrayName);
        } else if (arrayName.includes('.')) {
            // Check for tagged nested array (e.g., "user1.repos")
            const firstDot = arrayName.indexOf('.');
            const possibleTag = arrayName.substring(0, firstDot);

            if (window.htmz && window.htmz.store && window.htmz.store.hasTaggedData(possibleTag)) {
                const taggedData = window.htmz.store.getTaggedData(possibleTag);
                if (taggedData) {
                    const property = arrayName.substring(firstDot + 1);
                    array = getNestedProperty(taggedData, property);
                }
            } else {
                // Fall back to current response data
                array = getNestedProperty(data, arrayName);
            }
        } else {
            // Fall back to current response data
            array = getNestedProperty(data, arrayName);
        }

        if (!isArray(array)) {
            return '';
        }

        return array
            .map(item => processTemplate(blockTemplate, item))
            .join('');
    });
}

function processConditionals(template, data) {
    return template.replace(CONDITIONAL_REGEX, (match, condition, content) => {
        const result = evaluateCondition(condition.trim(), data);
        return result ? processTemplate(content, data) : '';
    });
}

function evaluateExpression(expression, data) {
    try {
        // Check for tagged data first (e.g., "user1.name")
        if (expression.includes('.')) {
            const firstDot = expression.indexOf('.');
            const possibleTag = expression.substring(0, firstDot);

            // Check if this looks like a tag reference and we have the store available
            if (window.htmz && window.htmz.store && window.htmz.store.hasTaggedData(possibleTag)) {
                const taggedData = window.htmz.store.getTaggedData(possibleTag);
                if (taggedData) {
                    const property = expression.substring(firstDot + 1);
                    return getNestedProperty(taggedData, property) ?? '';
                }
            }

            // Fall back to current response data (backward compatible)
            return getNestedProperty(data, expression) ?? '';
        }

        return data[expression] ?? '';
    } catch (e) {
        console.warn(`htmz: Error evaluating expression '${expression}':`, e);
        return '';
    }
}

function evaluateCondition(condition, data) {
    try {
        const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];

        for (const op of operators) {
            if (condition.includes(op)) {
                const [left, right] = condition.split(op).map(s => s.trim());
                const leftValue = evaluateExpression(left, data);
                const rightValue = parseValue(right, data);

                switch (op) {
                    case '===': return leftValue === rightValue;
                    case '!==': return leftValue !== rightValue;
                    case '==': return leftValue == rightValue;
                    case '!=': return leftValue != rightValue;
                    case '>=': return leftValue >= rightValue;
                    case '<=': return leftValue <= rightValue;
                    case '>': return leftValue > rightValue;
                    case '<': return leftValue < rightValue;
                }
            }
        }

        const value = evaluateExpression(condition, data);
        return isTruthy(value);
    } catch (e) {
        console.warn(`htmz: Error evaluating condition '${condition}':`, e);
        return false;
    }
}

function parseValue(value, data) {
    value = value.trim();

    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
    }

    if (value.startsWith("'") && value.endsWith("'")) {
        return value.slice(1, -1);
    }

    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value === 'undefined') return undefined;

    const numValue = Number(value);
    if (!isNaN(numValue)) {
        return numValue;
    }

    return evaluateExpression(value, data);
}

function isTruthy(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value !== '';
    if (isArray(value)) return value.length > 0;
    if (isObject(value)) return Object.keys(value).length > 0;
    return !!value;
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function clearTemplateCache() {
    TEMPLATE_CACHE.clear();
}

function precompileTemplate(templateStr) {
    const compiled = {
        interpolations: [],
        blocks: [],
        conditionals: []
    };

    let match;
    while ((match = INTERPOLATION_REGEX.exec(templateStr)) !== null) {
        compiled.interpolations.push({
            expression: match[1].trim(),
            index: match.index,
            length: match[0].length
        });
    }

    INTERPOLATION_REGEX.lastIndex = 0;

    while ((match = BLOCK_REGEX.exec(templateStr)) !== null) {
        compiled.blocks.push({
            arrayName: match[1],
            template: match[2],
            index: match.index,
            length: match[0].length
        });
    }

    BLOCK_REGEX.lastIndex = 0;

    while ((match = CONDITIONAL_REGEX.exec(templateStr)) !== null) {
        compiled.conditionals.push({
            condition: match[1].trim(),
            content: match[2],
            index: match.index,
            length: match[0].length
        });
    }

    CONDITIONAL_REGEX.lastIndex = 0;

    return compiled;
}

function processOutOfBandSwaps(data) {
    if (!data || typeof data !== 'object') return;

    for (const key in data) {
        if (key.startsWith('_oob_') || key.startsWith('_')) {
            const selector = key.startsWith('_oob_') ? key.substring(5) : key.substring(1);
            const content = data[key];

            if (typeof content === 'string') {
                const targets = document.querySelectorAll(selector);
                targets.forEach(target => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    const swapElement = doc.body.firstElementChild;

                    if (swapElement) {
                        const swapStrategy = swapElement.getAttribute('hz-swap-oob') || 'innerHTML';
                        const swapConfig = { strategy: swapStrategy };

                        swapElement.removeAttribute('hz-swap-oob');
                        const html = swapElement.outerHTML;

                        updateDOM(selector, html, swapConfig, document.body);
                    } else {
                        updateDOM(selector, content, { strategy: 'innerHTML' }, document.body);
                    }
                });
            } else if (typeof content === 'object' && content.template) {
                const template = { type: 'selector', value: content.template };
                const html = renderTemplate(template, content.data || content);
                const swapConfig = { strategy: content.swap || 'innerHTML' };

                updateDOM(selector, html, swapConfig, document.body);
            }
        }
    }
}/*
 * dom.js - High-performance DOM manipulation for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const SWAP_STRATEGIES = {
    innerHTML: swapInnerHTML,
    outerHTML: swapOuterHTML,
    beforebegin: swapBefore,
    afterbegin: swapPrepend,
    beforeend: swapAppend,
    afterend: swapAfter,
    append: swapAppend,
    prepend: swapPrepend,
    before: swapBefore,
    after: swapAfter,
    replace: swapReplace,
    delete: swapDelete,
    none: swapNone
};

function updateDOM(targetSelector, html, swapConfig, sourceElement) {
    const targets = findTargets(targetSelector, sourceElement);

    if (targets.length === 0) {
        console.warn(`htmz: Target '${targetSelector}' not found`);
        return null;
    }

    const strategy = swapConfig.strategy || 'innerHTML';
    const swapFn = SWAP_STRATEGIES[strategy];

    if (!swapFn) {
        console.warn(`htmz: Unknown swap strategy '${strategy}'`);
        return null;
    }

    let lastTarget = null;

    targets.forEach(target => {
        const options = swapConfig.options || {};

        if (options.transition) {
            performTransition(target, () => swapFn(target, html, options));
        } else {
            swapFn(target, html, options);
        }

        if (options.focus) {
            focusElement(target, options.focus);
        }

        if (options.scroll) {
            scrollToElement(target, options.scroll);
        }

        lastTarget = target;
    });

    return lastTarget;
}

function findTargets(selector, sourceElement) {
    if (!selector || selector === 'this') {
        return [sourceElement];
    }

    if (selector === 'closest') {
        const closest = sourceElement.closest('[hz-target]');
        return closest ? [closest] : [];
    }

    if (selector === 'next') {
        const next = sourceElement.nextElementSibling;
        return next ? [next] : [];
    }

    if (selector === 'previous') {
        const prev = sourceElement.previousElementSibling;
        return prev ? [prev] : [];
    }

    try {
        return Array.from(document.querySelectorAll(selector));
    } catch (e) {
        console.warn(`htmz: Invalid target selector '${selector}':`, e);
        return [];
    }
}

function swapInnerHTML(target, html, options) {
    if (options.morphing) {
        morphElement(target, html);
    } else {
        target.innerHTML = html;
    }
}

function swapOuterHTML(target, html, options) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    if (tempDiv.children.length === 1) {
        target.replaceWith(tempDiv.firstElementChild);
    } else {
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        target.replaceWith(fragment);
    }
}

function swapAppend(target, html, options) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }

    target.appendChild(fragment);
}

function swapPrepend(target, html, options) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }

    target.insertBefore(fragment, target.firstChild);
}

function swapBefore(target, html, options) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }

    target.parentNode.insertBefore(fragment, target);
}

function swapAfter(target, html, options) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }

    target.parentNode.insertBefore(fragment, target.nextSibling);
}

function swapReplace(target, html, options) {
    swapOuterHTML(target, html, options);
}

function swapDelete(target, html, options) {
    target.remove();
}

function swapNone(target, html, options) {
}

function morphElement(target, newHTML) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHTML;
    const newElement = tempDiv.firstElementChild;

    if (!newElement) {
        target.innerHTML = newHTML;
        return;
    }

    morphNode(target, newElement);
}

function morphNode(oldNode, newNode) {
    if (oldNode.nodeType !== newNode.nodeType) {
        oldNode.replaceWith(newNode.cloneNode(true));
        return;
    }

    if (oldNode.nodeType === Node.TEXT_NODE) {
        if (oldNode.textContent !== newNode.textContent) {
            oldNode.textContent = newNode.textContent;
        }
        return;
    }

    if (oldNode.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    if (oldNode.tagName !== newNode.tagName) {
        oldNode.replaceWith(newNode.cloneNode(true));
        return;
    }

    morphAttributes(oldNode, newNode);
    morphChildren(oldNode, newNode);
}

function morphAttributes(oldElement, newElement) {
    const oldAttrs = oldElement.attributes;
    const newAttrs = newElement.attributes;

    for (let i = oldAttrs.length - 1; i >= 0; i--) {
        const attr = oldAttrs[i];
        if (!newElement.hasAttribute(attr.name)) {
            oldElement.removeAttribute(attr.name);
        }
    }

    for (const attr of newAttrs) {
        if (oldElement.getAttribute(attr.name) !== attr.value) {
            oldElement.setAttribute(attr.name, attr.value);
        }
    }
}

function morphChildren(oldElement, newElement) {
    const oldChildren = Array.from(oldElement.childNodes);
    const newChildren = Array.from(newElement.childNodes);

    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];

        if (!oldChild && newChild) {
            oldElement.appendChild(newChild.cloneNode(true));
        } else if (oldChild && !newChild) {
            oldChild.remove();
        } else if (oldChild && newChild) {
            morphNode(oldChild, newChild);
        }
    }
}

function performTransition(element, updateFn) {
    element.style.opacity = '0';
    element.style.transition = 'opacity 150ms ease-in-out';

    setTimeout(() => {
        updateFn();
        element.style.opacity = '1';

        setTimeout(() => {
            element.style.removeProperty('opacity');
            element.style.removeProperty('transition');
        }, 150);
    }, 10);
}

function focusElement(container, focusSelector) {
    let target = container;

    if (focusSelector !== 'true' && focusSelector !== true) {
        const focusTarget = container.querySelector(focusSelector);
        if (focusTarget) {
            target = focusTarget;
        }
    }

    if (target.focus) {
        setTimeout(() => target.focus(), 10);
    }
}

function scrollToElement(container, scrollSelector) {
    let target = container;

    if (scrollSelector !== 'true' && scrollSelector !== true) {
        const scrollTarget = container.querySelector(scrollSelector);
        if (scrollTarget) {
            target = scrollTarget;
        }
    }

    setTimeout(() => {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }, 10);
}/*
 * event.js - High-performance event handling for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const EVENT_HANDLERS = new WeakMap();
const GLOBAL_LISTENERS = new Map();

function attachEventHandlers(element, config) {
    if (EVENT_HANDLERS.has(element)) {
        removeEventHandlers(element);
    }

    const handlers = [];
    const triggers = Array.isArray(config.trigger) ? config.trigger : [config.trigger];

    for (const trigger of triggers) {
        const handler = createEventHandler(element, config, trigger);
        if (handler) {
            handlers.push(handler);
            attachSingleHandler(element, trigger, handler);
        }
    }

    EVENT_HANDLERS.set(element, handlers);
}

function createEventHandler(element, config, trigger) {
    const eventName = trigger.event || 'click';
    const options = trigger.options || {};

    let handler = (event) => {
        if (shouldIgnoreEvent(event, element, options)) {
            return;
        }

        if (event && options.preventDefault !== false) {
            event.preventDefault();
        }

        if (event && options.stopPropagation) {
            event.stopPropagation();
        }

        executeRequest(element, config, event);
    };

    if (options.delay) {
        handler = debounce(handler, options.delay);
    } else if (options.throttle) {
        handler = throttle(handler, options.throttle);
    }

    if (options.changed && (eventName === 'input' || eventName === 'change')) {
        handler = wrapWithChangeDetection(handler, element);
    }

    if (options.once) {
        const originalHandler = handler;
        handler = (event) => {
            originalHandler(event);
            removeEventHandlers(element);
        };
    }

    return { eventName, handler, options };
}

function attachSingleHandler(element, trigger, handlerInfo) {
    const { eventName, handler, options } = handlerInfo;

    if (eventName === 'load') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', handler, { once: true });
        } else {
            setTimeout(handler, 0);
        }
        return;
    }

    if (eventName === 'revealed') {
        attachIntersectionObserver(element, handler);
        return;
    }

    if (eventName === 'intersect') {
        const threshold = options.threshold ? parseFloat(options.threshold) : 0;
        attachIntersectionObserver(element, handler, threshold);
        return;
    }

    element.addEventListener(eventName, handler, {
        passive: false,
        capture: options.capture === true
    });
}

function shouldIgnoreEvent(event, element, options) {
    if (options.changed && event.type === 'input') {
        const currentValue = element.value;
        const lastValue = element.getAttribute('data-hz-last-value') || '';
        if (currentValue === lastValue) {
            return true;
        }
        element.setAttribute('data-hz-last-value', currentValue);
    }

    if (options.from && !event.target.matches(options.from)) {
        return true;
    }

    if (options.target && !event.target.matches(options.target)) {
        return true;
    }

    if (isRequestInFlight(element)) {
        return true;
    }

    return false;
}

function wrapWithChangeDetection(handler, element) {
    let lastValue = element.value || '';

    return (event) => {
        const currentValue = element.value || '';
        if (currentValue !== lastValue) {
            lastValue = currentValue;
            handler(event);
        }
    };
}

function attachIntersectionObserver(element, handler, threshold = 0) {
    if (!window.IntersectionObserver) {
        setTimeout(handler, 0);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                handler();
                observer.unobserve(element);
            }
        });
    }, { threshold });

    observer.observe(element);
}

function removeEventHandlers(element) {
    const handlers = EVENT_HANDLERS.get(element);
    if (!handlers) return;

    for (const handlerInfo of handlers) {
        if (handlerInfo.eventName !== 'load' && handlerInfo.eventName !== 'revealed') {
            element.removeEventListener(handlerInfo.eventName, handlerInfo.handler);
        }
    }

    EVENT_HANDLERS.delete(element);
}

function executeRequest(element, config, triggerEvent) {
    if (config.confirm) {
        if (!confirm(config.confirm)) {
            return;
        }
    }

    // Handle batch requests
    if (config.batch && Array.isArray(config.batch)) {
        return executeBatchRequest(element, config, triggerEvent);
    }

    showIndicator(element, config);
    addRequestClass(element);

    const controller = createAbortController();
    markRequestStart(element, controller);

    const data = serializeElement(element, config);

    // SECURITY: Resolve environment variables at runtime, not in DOM
    const resolvedUrl = typeof resolveEnvVars === 'function'
        ? resolveEnvVars(config.url)
        : config.url;
    const resolvedHeaders = config.headers && typeof resolveEnvVars === 'function'
        ? resolveObjectEnvVars(config.headers)
        : config.headers;

    const url = config.method === 'GET' ? buildUrl(resolvedUrl, data) : resolvedUrl;
    const requestData = config.method === 'GET' ? null : data;

    makeRequest(config.method, url, requestData, {
        headers: resolvedHeaders,
        signal: controller.signal,
        tag: config.tag
    })
        .then(response => {
            markRequestEnd(element);
            hideIndicator(element, config);
            removeRequestClass(element);

            triggerCustomEvent(element, 'hz:beforeSwap', {
                response,
                config,
                triggerEvent
            });

            if (config.template) {
                const html = renderTemplate(config.template, response);
                const target = config.target || 'this';
                const swappedElement = updateDOM(target, html, config.swap, element);

                triggerCustomEvent(element, 'hz:afterSwap', {
                    response,
                    config,
                    triggerEvent,
                    target: swappedElement
                });

                triggerCustomEvent(swappedElement || element, 'hz:load', {
                    response,
                    config,
                    triggerEvent
                });
            }

            triggerCustomEvent(element, 'hz:afterRequest', {
                response,
                config,
                triggerEvent
            });
        })
        .catch(error => {
            markRequestEnd(element);
            hideIndicator(element, config);
            removeRequestClass(element);

            const isNetworkError = error instanceof TypeError || error.name === 'NetworkError';
            const eventName = isNetworkError ? 'hz:sendError' : 'hz:requestError';

            triggerCustomEvent(element, eventName, {
                error,
                config,
                triggerEvent
            });

            if (!config.ignoreErrors) {
                console.error('htmz: Request failed:', error);
            }
        });

    triggerCustomEvent(element, 'hz:beforeRequest', {
        config,
        triggerEvent
    });
}

function showIndicator(element, config) {
    if (!config.indicator) return;

    const indicators = document.querySelectorAll(config.indicator);
    indicators.forEach(indicator => {
        indicator.style.display = '';
        indicator.removeAttribute('hidden');
        indicator.classList.add('hz-indicator-loading');
    });
}

function hideIndicator(element, config) {
    if (!config.indicator) return;

    const indicators = document.querySelectorAll(config.indicator);
    indicators.forEach(indicator => {
        indicator.style.display = 'none';
        indicator.setAttribute('hidden', '');
        indicator.classList.remove('hz-indicator-loading');
    });
}

function triggerCustomEvent(element, eventName, detail) {
    const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true
    });

    element.dispatchEvent(event);
}

function addGlobalEventListener(eventName, selector, handler) {
    const key = `${eventName}:${selector}`;

    if (GLOBAL_LISTENERS.has(key)) {
        document.removeEventListener(eventName, GLOBAL_LISTENERS.get(key));
    }

    const globalHandler = (event) => {
        if (event.target.matches(selector)) {
            handler(event);
        }
    };

    document.addEventListener(eventName, globalHandler);
    GLOBAL_LISTENERS.set(key, globalHandler);
}

function removeGlobalEventListener(eventName, selector) {
    const key = `${eventName}:${selector}`;
    const handler = GLOBAL_LISTENERS.get(key);

    if (handler) {
        document.removeEventListener(eventName, handler);
        GLOBAL_LISTENERS.delete(key);
    }
}

function addRequestClass(element) {
    if (typeof htmz !== 'undefined' && htmz.config.requestClass) {
        element.classList.add(htmz.config.requestClass);
    }
}

function removeRequestClass(element) {
    if (typeof htmz !== 'undefined' && htmz.config.requestClass) {
        element.classList.remove(htmz.config.requestClass);
    }
}

function addSwappingClass(element) {
    if (typeof htmz !== 'undefined' && htmz.config.swappingClass) {
        element.classList.add(htmz.config.swappingClass);
    }
}

function removeSwappingClass(element) {
    if (typeof htmz !== 'undefined' && htmz.config.swappingClass) {
        element.classList.remove(htmz.config.swappingClass);
    }
}

function addSettlingClass(element) {
    if (typeof htmz !== 'undefined' && htmz.config.settlingClass) {
        element.classList.add(htmz.config.settlingClass);
        setTimeout(() => {
            element.classList.remove(htmz.config.settlingClass);
        }, htmz.config.defaultSettleDelay || 20);
    }
}

async function executeBatchRequest(element, config, triggerEvent) {
    showIndicator(element, config);
    addRequestClass(element);

    const controller = createAbortController();
    markRequestStart(element, controller);

    const data = serializeElement(element, config);

    try {
        const batchPromises = config.batch.map(async (batchItem) => {
            const { tag, url } = batchItem;

            // SECURITY: Resolve environment variables at runtime, not in DOM
            const resolvedUrl = typeof resolveEnvVars === 'function'
                ? resolveEnvVars(url)
                : url;
            const resolvedHeaders = config.headers && typeof resolveEnvVars === 'function'
                ? resolveObjectEnvVars(config.headers)
                : config.headers;

            const finalUrl = config.method === 'GET' ? buildUrl(resolvedUrl, data) : resolvedUrl;
            const requestData = config.method === 'GET' ? null : data;

            return makeRequest(config.method || 'GET', finalUrl, requestData, {
                headers: resolvedHeaders,
                signal: controller.signal,
                tag: tag
            }).then(response => ({ tag, response }));
        });

        const batchResults = await Promise.all(batchPromises);

        markRequestEnd(element);
        hideIndicator(element, config);
        removeRequestClass(element);

        triggerCustomEvent(element, 'hz:beforeSwap', {
            responses: batchResults.map(r => r.response),
            config,
            triggerEvent
        });

        if (config.template) {
            // For batch requests, we pass the last response as the main data for backward compatibility
            const lastResponse = batchResults.length > 0 ? batchResults[batchResults.length - 1].response : {};

            const html = renderTemplate(config.template, lastResponse);
            const target = config.target || 'this';
            const swappedElement = updateDOM(target, html, config.swap, element);

            triggerCustomEvent(element, 'hz:afterSwap', {
                responses: batchResults.map(r => r.response),
                config,
                triggerEvent,
                swappedElement
            });
        }

        triggerCustomEvent(element, 'hz:requestComplete', {
            responses: batchResults.map(r => r.response),
            config,
            triggerEvent
        });
    } catch (error) {
        markRequestEnd(element);
        hideIndicator(element, config);
        removeRequestClass(element);

        triggerCustomEvent(element, 'hz:requestError', {
            error,
            config,
            triggerEvent
        });

        if (htmz.config.logRequests) {
            console.error('htmz: Batch request failed:', error);
        }
    }
}/*
 * env.js - Environment variable placeholder detection for htmz
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

function hasEnvPlaceholders(str) {
    if (typeof str !== 'string') return false;
    return /\{\{env\.[^}]+\}\}/.test(str);
}

function extractEnvVarNames(str) {
    if (typeof str !== 'string') return [];

    const matches = str.match(/\{\{env\.([^}]+)\}\}/g);
    if (!matches) return [];

    return matches.map(match => {
        const key = match.replace(/\{\{env\.([^}]+)\}\}/, '$1');
        return key.trim();
    });
}

function hasEnvPlaceholdersInObject(obj) {
    if (!obj || typeof obj !== 'object') return false;

    return Object.values(obj).some(value => {
        if (typeof value === 'string') {
            return hasEnvPlaceholders(value);
        } else if (typeof value === 'object') {
            return hasEnvPlaceholdersInObject(value);
        }
        return false;
    });
}

function showProxyRequiredMessage(element) {
    console.warn('htmz: Environment variables detected in HTML attributes');
    console.warn('htmz: Start the proxy server to resolve them securely:');
    console.warn('htmz: npx htmz proxy');

    // Show user-friendly message in the browser
    if (element) {
        element.innerHTML = `
            <div style="
                border: 2px solid #f39c12;
                background: #fef9e7;
                padding: 1rem;
                border-radius: 8px;
                font-family: system-ui, sans-serif;
                color: #856404;
                margin: 1rem 0;
            ">
                <h3 style="margin: 0 0 0.5rem 0; color: #b8860b;">🔐 htmz Proxy Required</h3>
                <p style="margin: 0 0 0.5rem 0;">
                    This element uses environment variables that require the htmz proxy server.
                </p>
                <p style="margin: 0; font-family: monospace; font-size: 0.9em;">
                    <strong>Start the proxy:</strong> <code>npx htmz proxy</code>
                </p>
            </div>
        `;
    }
}

// For backwards compatibility with existing code
function processElementEnvVars(element) {
    // This function now does nothing - the proxy handles everything
    // But we keep it to avoid breaking existing code
}

// Dummy functions for backwards compatibility
function setEnvVar() {
    console.warn('htmz: Client-side environment variables are no longer supported');
    console.warn('htmz: Use the proxy server instead: npx htmz proxy');
    return false;
}

function getEnvVar() {
    console.warn('htmz: Client-side environment variables are no longer supported');
    console.warn('htmz: Environment variables are resolved server-side by the proxy');
    return undefined;
}

function removeEnvVar() {
    console.warn('htmz: Client-side environment variables are no longer supported');
    return false;
}

function listEnvVars() {
    console.warn('htmz: Client-side environment variables are no longer supported');
    return [];
}

function clearEnvVars() {
    console.warn('htmz: Client-side environment variables are no longer supported');
}

function configureEnvVars() {
    console.warn('htmz: Client-side environment variables are no longer supported');
    console.warn('htmz: Use the proxy server configuration instead: npx htmz proxy');
}/*
 * store.js - Tagged data store for htmz
 *
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

(function() {
    'use strict';

    const dataStore = {};
    const metadata = {};

    function storeTaggedData(tag, data, responseMetadata) {
        if (!tag || typeof tag !== 'string') return false;

        dataStore[tag] = data;
        metadata[tag] = {
            timestamp: Date.now(),
            ...responseMetadata
        };

        dataStore['_lastResponse'] = data;
        metadata['_lastResponse'] = metadata[tag];

        return true;
    }

    function getTaggedData(tag) {
        if (!tag || typeof tag !== 'string') return undefined;
        return dataStore[tag];
    }

    function getTaggedMetadata(tag) {
        if (!tag || typeof tag !== 'string') return undefined;
        return metadata[tag];
    }

    function hasTaggedData(tag) {
        if (!tag || typeof tag !== 'string') return false;
        return dataStore.hasOwnProperty(tag);
    }

    function clearTaggedData(tag) {
        if (!tag) {
            Object.keys(dataStore).forEach(key => delete dataStore[key]);
            Object.keys(metadata).forEach(key => delete metadata[key]);
            return true;
        }

        if (typeof tag === 'string' && dataStore.hasOwnProperty(tag)) {
            delete dataStore[tag];
            delete metadata[tag];
            return true;
        }

        return false;
    }

    function getAllTags() {
        return Object.keys(dataStore).filter(key => key !== '_lastResponse');
    }

    function getStoreStats() {
        const tags = getAllTags();
        return {
            totalTags: tags.length,
            tags: tags,
            memoryUsage: JSON.stringify(dataStore).length
        };
    }

    if (typeof window !== 'undefined') {
        window.htmz = window.htmz || {};
        window.htmz.store = {
            storeTaggedData,
            getTaggedData,
            getTaggedMetadata,
            hasTaggedData,
            clearTaggedData,
            getAllTags,
            getStoreStats
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            storeTaggedData,
            getTaggedData,
            getTaggedMetadata,
            hasTaggedData,
            clearTaggedData,
            getAllTags,
            getStoreStats
        };
    }
})();/*
 * htmz.js - High-performance JSON-powered HTML library
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

(function(global) {

    const HTMZ_VERSION = '1.2.0';
    const INITIALIZED_ATTR = 'data-hz-init';

    const htmz = {
        version: HTMZ_VERSION,
        config: {
            defaultSwap: 'innerHTML',
            defaultTrigger: 'click',
            attributePrefix: 'hz-',
            logRequests: false,
            globalHeaders: {},
            timeout: 30000,
            historyEnabled: false,
            requestClass: 'hz-request',
            settlingClass: 'hz-settling',
            swappingClass: 'hz-swapping',
            indicatorClass: 'hz-indicator',
            allowEval: true,
            withCredentials: false,
            defaultSwapDelay: 0,
            defaultSettleDelay: 20,
            scrollBehavior: 'instant',
            includeIndicatorStyles: true
        }
    };

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeElements);
        } else {
            initializeElements();
        }

        setupMutationObserver();
        setupGlobalErrorHandler();
        setupBeforeUnloadHandler();

        // Ensure store is available for tagged data
        if (typeof window !== 'undefined' && !window.htmz) {
            window.htmz = {};
        }
        if (typeof window !== 'undefined' && !window.htmz.store && typeof storeTaggedData === 'function') {
            window.htmz.store = {
                storeTaggedData,
                getTaggedData,
                getTaggedMetadata,
                hasTaggedData,
                clearTaggedData,
                getAllTags,
                getStoreStats
            };
        }
    }

    function initializeElements() {
        const elements = findElementsWithAttributes();

        for (const element of elements) {
            if (element.hasAttribute(INITIALIZED_ATTR)) {
                continue;
            }

            try {
                // Process environment variables in attributes
                processElementEnvVars(element);

                const config = parseAttributes(element);
                if (config.method) {
                    attachEventHandlers(element, config);
                    element.setAttribute(INITIALIZED_ATTR, 'true');
                }
            } catch (error) {
                console.error('htmz: Error initializing element:', error, element);
            }
        }
    }

    function setupMutationObserver() {
        if (!window.MutationObserver || !document.body) return;

        const observer = new MutationObserver((mutations) => {
            let needsInit = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (hasHzAttributes(node) || node.querySelector('[' + HZ_ATTRIBUTES.join('], [') + ']')) {
                                needsInit = true;
                                break;
                            }
                        }
                    }
                }

                if (needsInit) break;
            }

            if (needsInit) {
                setTimeout(initializeElements, 0);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function hasHzAttributes(element) {
        return HZ_ATTRIBUTES.some(attr => element.hasAttribute(attr));
    }

    function setupGlobalErrorHandler() {
        document.addEventListener('hz:requestError', (event) => {
            if (htmz.config.logRequests) {
                console.error('htmz: Global request error:', event.detail);
            }

            const customHandler = htmz.config.onError;
            if (customHandler && typeof customHandler === 'function') {
                customHandler(event.detail.error, event.detail.config, event.target);
            }
        });
    }

    function setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            const elements = document.querySelectorAll(`[${INITIALIZED_ATTR}]`);
            for (const element of elements) {
                abortRequest(element);
            }
        });
    }

    htmz.process = function(element) {
        if (typeof element === 'string') {
            const elements = document.querySelectorAll(element);
            elements.forEach(el => htmz.process(el));
            return;
        }

        if (element && element.nodeType === Node.ELEMENT_NODE) {
            element.removeAttribute(INITIALIZED_ATTR);
            const config = parseAttributes(element);
            if (config.method) {
                attachEventHandlers(element, config);
                element.setAttribute(INITIALIZED_ATTR, 'true');
            }
        }
    };

    htmz.trigger = function(element, eventName = 'click') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            const event = new Event(eventName, { bubbles: true });
            element.dispatchEvent(event);
        }
    };

    htmz.ajax = function(method, url, data, options = {}) {
        const config = {
            headers: { ...htmz.config.globalHeaders, ...options.headers }
        };

        return makeRequest(method, url, data, config);
    };

    htmz.get = function(url, options) {
        return htmz.ajax('GET', url, null, options);
    };

    htmz.post = function(url, data, options) {
        return htmz.ajax('POST', url, data, options);
    };

    htmz.put = function(url, data, options) {
        return htmz.ajax('PUT', url, data, options);
    };

    htmz.delete = function(url, options) {
        return htmz.ajax('DELETE', url, null, options);
    };

    htmz.render = function(templateSelector, data, targetSelector) {
        const template = { type: 'selector', value: templateSelector };
        const html = renderTemplate(template, data);

        if (targetSelector) {
            const target = document.querySelector(targetSelector);
            if (target) {
                target.innerHTML = html;
            }
            return target;
        }

        return html;
    };

    htmz.swap = function(targetSelector, html, strategy = 'innerHTML') {
        const swapConfig = { strategy };
        return updateDOM(targetSelector, html, swapConfig, document.body);
    };

    htmz.remove = function(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            removeEventHandlers(element);
            element.remove();
        });
    };

    htmz.find = function(selector) {
        return document.querySelectorAll(selector);
    };

    htmz.closest = function(element, selector) {
        return element.closest(selector);
    };

    htmz.on = function(eventName, selector, handler) {
        addGlobalEventListener(eventName, selector, handler);
    };

    htmz.off = function(eventName, selector) {
        removeGlobalEventListener(eventName, selector);
    };

    htmz.clearCache = function() {
        clearTemplateCache();
    };

    htmz.logRequests = function(enabled = true) {
        htmz.config.logRequests = enabled;
    };

    htmz.configure = function(options) {
        Object.assign(htmz.config, options);

        // Handle environment variables configuration
        if (options.env) {
            configureEnvVars(options.env);
        }
    };

    // Proxy configuration API
    htmz.proxy = {
        configure: configureProxy,
        getConfig: getProxyConfig
    };

    // Environment variables API (deprecated - use proxy instead)
    htmz.env = {
        set: setEnvVar,
        get: getEnvVar,
        remove: removeEnvVar,
        list: listEnvVars,
        clear: clearEnvVars,
        configure: configureEnvVars
    };

    htmz.defineExtension = function(name, extension) {
        if (typeof extension === 'function') {
            htmz[name] = extension;
        } else if (typeof extension === 'object') {
            Object.assign(htmz, extension);
        }
    };

    htmz.logger = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = htmz;
    } else if (typeof define === 'function' && define.amd) {
        define(() => htmz);
    } else {
        global.htmz = htmz;
    }

    if (typeof global !== 'undefined' && global.document) {
        init();
    }

})(typeof globalThis !== 'undefined' ? globalThis :
   typeof window !== 'undefined' ? window :
   typeof global !== 'undefined' ? global : this);