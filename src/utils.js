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
}