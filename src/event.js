/*
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
        signal: controller.signal
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