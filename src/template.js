/*
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

    return processTemplate(template, data);
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
        const array = getNestedProperty(data, arrayName);

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
        if (expression.includes('.')) {
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