/*
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
})();