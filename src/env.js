/*
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
}