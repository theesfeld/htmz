/*
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
}