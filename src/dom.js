/*
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
}