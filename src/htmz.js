/*
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

    const HTMZ_VERSION = '1.0.0';
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