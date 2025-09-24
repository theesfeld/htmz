# htmz Performance Guide

Optimize your htmz applications for maximum speed and efficiency. htmz is already fast, but these tips will make it blazing.

## 📖 Table of Contents

- [🚀 Template Optimization](#-template-optimization)
- [🌐 Request Optimization](#-request-optimization)
- [🎯 DOM Optimization](#-dom-optimization)
- [📊 Monitoring & Debugging](#-monitoring--debugging)
- [⚡ Advanced Techniques](#-advanced-techniques)

## 🚀 Template Optimization

### Use Template Caching

Templates are cached automatically after first use. Prefer template elements over inline templates for better caching.

```html
<!-- ✅ Good: Cached template -->
<template id="user-card">
    <div class="user">{{name}}</div>
</template>

<button hz-get="/api/user/1" hz-template="#user-card">User 1</button>
<button hz-get="/api/user/2" hz-template="#user-card">User 2</button>

<!-- ❌ Less optimal: Inline template (not cached) -->
<button hz-get="/api/user/1"
        hz-template="<div class='user'>{{name}}</div>">User 1</button>
<button hz-get="/api/user/2"
        hz-template="<div class='user'>{{name}}</div>">User 2</button>
```

### Minimize Template Complexity

Keep templates simple and focused. Complex templates with many conditionals slow down rendering.

```html
<!-- ✅ Good: Simple, focused template -->
<template id="simple-user">
    <div class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
        {{?active}}<span class="active">●</span>{{/?}}
    </div>
</template>

<!-- ❌ Avoid: Overly complex template -->
<template id="complex-user">
    <div class="user">
        {{?avatar}}
            <img src="{{avatar}}" alt="{{name}}"
                 {{?verified}}class="verified"{{/?}}
                 {{?!verified}}class="unverified"{{/?}}>
        {{/?}}
        {{?!avatar}}
            <div class="default-avatar">{{name.0}}</div>
        {{/?}}

        <div class="info">
            {{?name}}
                <h3 class="{{?role === 'admin'}}admin{{/?}}{{?role === 'user'}}user{{/?}}">
                    {{name}}
                    {{?badges}}
                        {{#badges}}
                            <span class="badge-{{type}}">{{text}}</span>
                        {{/badges}}
                    {{/?}}
                </h3>
            {{/?}}
            <!-- Many more nested conditions... -->
        </div>
    </div>
</template>
```

### Optimize Large Lists

For large datasets, use pagination or virtual scrolling instead of rendering everything at once.

```html
<!-- ✅ Good: Paginated results -->
<template id="user-list">
    <div class="pagination-info">
        Showing {{startIndex}}-{{endIndex}} of {{totalCount}}
    </div>

    {{#users}}
    <div class="user-item">{{name}}</div>
    {{/users}}

    {{?hasMore}}
    <button hz-get="/api/users?page={{nextPage}}"
            hz-template="#user-list"
            hz-target="#user-container"
            hz-swap="append">Load More</button>
    {{/?}}
</template>

<!-- ❌ Avoid: Rendering thousands of items at once -->
<template id="all-users">
    {{#users}} <!-- Could be 10,000+ items -->
    <div class="user-complex-item">
        <!-- Complex template for each item -->
    </div>
    {{/users}}
</template>
```

## 🌐 Request Optimization

### Use Appropriate Debouncing

Add delays to prevent excessive API calls, especially for search and input fields.

```html
<!-- ✅ Good: Debounced search -->
<input placeholder="Search users..."
       hz-get="/api/search"
       hz-trigger="input changed delay:300ms">

<!-- ✅ Good: Longer delay for expensive operations -->
<input placeholder="Complex search..."
       hz-get="/api/expensive-search"
       hz-trigger="input changed delay:800ms">

<!-- ❌ Too aggressive: Fires on every keystroke -->
<input placeholder="Search users..."
       hz-get="/api/search"
       hz-trigger="input">

<!-- ❌ Too slow: Poor user experience -->
<input placeholder="Simple search..."
       hz-get="/api/fast-search"
       hz-trigger="input changed delay:2000ms">
```

### Request Deduplication

Use the `hz-sync` attribute to prevent duplicate concurrent requests.

```html
<!-- ✅ Good: Prevents double-clicks -->
<button hz-post="/api/purchase"
        hz-sync="purchase-group"
        hz-confirm="Complete purchase?">
    Buy Now ($99)
</button>

<!-- ✅ Good: Cancel previous search requests -->
<input hz-get="/api/search"
       hz-sync="search-requests"
       hz-trigger="input changed delay:300ms">
```

### Optimize Payload Size

Request only the data you need. Use server-side filtering and pagination.

```javascript
// ✅ Good: Request specific fields
GET /api/users?fields=id,name,email&limit=20&page=1

// ❌ Wasteful: Request everything
GET /api/users  // Returns all fields for all users
```

```html
<!-- ✅ Good: Specific parameters -->
<button hz-get="/api/products"
        hz-params='{"fields": "id,name,price", "limit": 12}'>
    Get Products
</button>

<!-- ❌ Inefficient: No limits or filtering -->
<button hz-get="/api/products">Get All Products</button>
```

### HTTP Caching

Configure proper HTTP caching headers on your API.

```javascript
// Server-side example (Express.js)
app.get('/api/users', (req, res) => {
    res.set({
        'Cache-Control': 'public, max-age=300',  // Cache for 5 minutes
        'ETag': generateETag(users)              // Enable conditional requests
    });
    res.json(users);
});
```

```html
<!-- htmz will respect cache headers -->
<button hz-get="/api/static-data">Cached Data</button>
```

## 🎯 DOM Optimization

### Choose Efficient Swap Strategies

Different swap strategies have different performance characteristics.

```html
<!-- ✅ Fast: Replace content only -->
<div id="content" hz-get="/api/data" hz-swap="innerHTML">
    <!-- Content gets replaced -->
</div>

<!-- ✅ Faster for append operations -->
<div id="list">
    <button hz-get="/api/new-items"
            hz-swap="append"
            hz-target="#list">Add Items</button>
</div>

<!-- ❌ Slower: DOM morphing (though more intelligent) -->
<div hz-get="/api/data" hz-swap="innerHTML morphing">
    <!-- htmz tries to preserve existing DOM state -->
</div>
```

### Use Specific Targets

Avoid targeting large DOM sections when updating small parts.

```html
<!-- ✅ Good: Specific target -->
<div class="user-card">
    <h3>John Doe</h3>
    <span id="user-status">Offline</span>
    <button hz-get="/api/users/123/status"
            hz-template="{{status}}"
            hz-target="#user-status">Refresh Status</button>
</div>

<!-- ❌ Inefficient: Updates entire card -->
<div id="user-card" class="user-card">
    <h3>John Doe</h3>
    <span>Offline</span>
    <button hz-get="/api/users/123"
            hz-template="#user-card-template"
            hz-target="#user-card">Refresh Status</button>
</div>
```

### Batch DOM Updates

Group related updates to minimize reflows.

```html
<!-- ✅ Good: Single update with all data -->
<div hz-get="/api/dashboard"
     hz-template="#dashboard-template">
    <!-- Updates multiple sections at once -->
</div>

<template id="dashboard-template">
    <div class="stats">{{stats.users}} users</div>
    <div class="revenue">${{stats.revenue}}</div>
    <div class="growth">{{stats.growth}}%</div>
</template>

<!-- ❌ Inefficient: Multiple separate updates -->
<div class="stats">
    <div hz-get="/api/stats/users" hz-template="{{count}} users"></div>
    <div hz-get="/api/stats/revenue" hz-template="${{amount}}"></div>
    <div hz-get="/api/stats/growth" hz-template="{{percentage}}%"></div>
</div>
```

## 📊 Monitoring & Debugging

### Enable Performance Logging

Monitor request timing and identify bottlenecks.

```javascript
// Enable detailed logging
htmz.configure({
    logRequests: true,
    onBeforeRequest: (config) => {
        console.time(`htmz-request-${config.url}`);
        return config;
    },
    onAfterRequest: (response, config) => {
        console.timeEnd(`htmz-request-${config.url}`);
        return response;
    }
});
```

### Measure Template Rendering

Time template operations to identify slow templates.

```javascript
// Custom template timing
const originalRender = htmz.render;
htmz.render = function(template, data, target) {
    const start = performance.now();
    const result = originalRender.call(this, template, data, target);
    const end = performance.now();

    if (end - start > 10) {  // Log slow renders (>10ms)
        console.warn(`Slow template render: ${template} took ${end - start}ms`);
    }

    return result;
};
```

### Network Monitoring

Use browser DevTools to monitor network performance:

1. **Open DevTools → Network tab**
2. **Filter by XHR/Fetch**
3. **Look for:**
   - Request/response sizes
   - Response times
   - Concurrent request limits
   - Failed requests

### Performance Budgets

Set performance targets for your application:

```javascript
// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requestTime: [],
            templateTime: [],
            domUpdateTime: []
        };
    }

    trackRequest(url, duration) {
        this.metrics.requestTime.push(duration);
        if (duration > 1000) {  // Warn if request takes >1s
            console.warn(`Slow request: ${url} took ${duration}ms`);
        }
    }

    getAverageRequestTime() {
        const times = this.metrics.requestTime;
        return times.reduce((a, b) => a + b, 0) / times.length;
    }
}

const monitor = new PerformanceMonitor();

htmz.configure({
    onAfterRequest: (response, config, duration) => {
        monitor.trackRequest(config.url, duration);
    }
});
```

## ⚡ Advanced Techniques

### Request Prioritization

Handle critical requests first and defer non-essential ones.

```javascript
// Priority request queue
class PriorityQueue {
    constructor() {
        this.high = [];
        this.normal = [];
        this.low = [];
        this.running = 0;
        this.maxConcurrent = 3;
    }

    add(requestFn, priority = 'normal') {
        const promise = new Promise((resolve, reject) => {
            this[priority].push({requestFn, resolve, reject});
            this.process();
        });
        return promise;
    }

    process() {
        if (this.running >= this.maxConcurrent) return;

        const next = this.high.shift() ||
                    this.normal.shift() ||
                    this.low.shift();

        if (!next) return;

        this.running++;
        next.requestFn()
            .then(next.resolve)
            .catch(next.reject)
            .finally(() => {
                this.running--;
                this.process();
            });
    }
}

const queue = new PriorityQueue();

// High priority requests
htmz.get('/api/critical-data', {priority: 'high'});

// Normal priority
htmz.get('/api/user-data', {priority: 'normal'});

// Low priority (analytics, etc.)
htmz.get('/api/tracking', {priority: 'low'});
```

### Preload Critical Data

Load important data before user interaction.

```html
<!-- Preload critical data -->
<div hz-get="/api/user/profile"
     hz-template="#user-profile"
     hz-trigger="load"
     style="display: none;">
</div>

<!-- Preload search suggestions -->
<div hz-get="/api/search/suggestions"
     hz-template="#suggestions-cache"
     hz-trigger="load"
     style="display: none;">
</div>

<!-- User sees data immediately when they click -->
<button hz-template="#user-profile" hz-target="#profile-display">
    Show Profile (Instant!)
</button>
```

### Intersection Observer Optimization

Use intersection observers for smart loading.

```html
<!-- Load content when 50% visible -->
<div class="lazy-section"
     hz-get="/api/section-data"
     hz-trigger="intersect"
     data-threshold="0.5">
    <div class="loading-placeholder">Loading when visible...</div>
</div>

<!-- Load more content for infinite scroll -->
<div class="load-trigger"
     hz-get="/api/posts?page=2"
     hz-trigger="revealed"
     hz-target="#posts-container"
     hz-swap="append">
</div>
```

### Service Worker Caching

Cache API responses using service workers.

```javascript
// sw.js - Service Worker
const CACHE_NAME = 'htmz-api-cache-v1';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            caches.open(CACHE_NAME)
                .then(cache => cache.match(event.request))
                .then(response => {
                    if (response) {
                        const age = Date.now() - new Date(response.headers.get('date')).getTime();
                        if (age < API_CACHE_DURATION) {
                            return response;
                        }
                    }

                    return fetch(event.request)
                        .then(response => {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                })
        );
    }
});
```

### Memory Management

Clean up unused templates and event listeners.

```javascript
// Periodic cleanup
setInterval(() => {
    // Clear template cache if getting large
    if (Object.keys(htmz._templateCache).length > 100) {
        htmz.clearCache();
    }

    // Remove elements that are no longer visible
    htmz.find('[data-dynamic]').forEach(element => {
        if (!document.contains(element)) {
            htmz.remove(element);
        }
    });
}, 60000); // Every minute
```

## 📏 Performance Benchmarks

### Typical Performance Targets

- **API Request**: < 500ms
- **Template Rendering**: < 10ms for simple templates
- **DOM Update**: < 5ms for typical swaps
- **Initial Page Load**: < 3s including htmz
- **Interaction Response**: < 100ms

### Measuring Your App

```javascript
// Simple performance measurement
function measurePerformance() {
    const metrics = {
        requestCount: 0,
        totalRequestTime: 0,
        templateRenderTime: 0,
        domUpdateTime: 0
    };

    htmz.configure({
        onBeforeRequest: () => {
            metrics.requestCount++;
            return performance.now();
        },

        onAfterRequest: (response, config, startTime) => {
            metrics.totalRequestTime += performance.now() - startTime;
        }
    });

    // Report metrics every 10 seconds
    setInterval(() => {
        if (metrics.requestCount > 0) {
            console.log('htmz Performance Metrics:', {
                averageRequestTime: metrics.totalRequestTime / metrics.requestCount,
                requestsPerSecond: metrics.requestCount / 10,
                ...metrics
            });

            // Reset counters
            Object.keys(metrics).forEach(key => metrics[key] = 0);
        }
    }, 10000);
}

measurePerformance();
```

## 🎯 Performance Checklist

### Before Going Live

- [ ] **Templates are cached** (prefer template elements over inline)
- [ ] **Request debouncing** is appropriate for user interactions
- [ ] **Large lists are paginated** or use virtual scrolling
- [ ] **Critical data is preloaded** where beneficial
- [ ] **API responses are optimized** (only necessary fields)
- [ ] **HTTP caching headers** are configured
- [ ] **Error handling** doesn't impact performance
- [ ] **Memory leaks** are prevented with proper cleanup

### Regular Monitoring

- [ ] **Network requests** are within performance budget
- [ ] **Template rendering** times are reasonable
- [ ] **DOM update frequency** doesn't cause jank
- [ ] **Memory usage** is stable over time
- [ ] **User interactions** respond within 100ms

---

**Need help optimizing?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or [Recipe Book](../RECIPES.md) for specific solutions.