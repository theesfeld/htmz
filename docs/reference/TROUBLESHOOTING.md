# htmz Troubleshooting Guide

Common issues and solutions when working with htmz. Most problems have simple fixes!

## 📖 Table of Contents

- [🚀 Getting Started Issues](#-getting-started-issues)
- [🔧 Attribute Problems](#-attribute-problems)
- [📄 Template Issues](#-template-issues)
- [🌐 Network & API Problems](#-network--api-problems)
- [🎯 DOM & Targeting Issues](#-dom--targeting-issues)
- [⚡ Performance Problems](#-performance-problems)
- [🔍 Debugging Tips](#-debugging-tips)

## 🚀 Getting Started Issues

### htmz is not defined

**Problem:** `Uncaught ReferenceError: htmz is not defined`

**Cause:** htmz script not loaded or loaded incorrectly.

**Solutions:**

1. **Check script tag placement:**
```html
<!-- ✅ Correct: Load htmz before using -->
<script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>
<script>
  // Now htmz is available
  htmz.configure({...});
</script>

<!-- ❌ Wrong: Using htmz before it's loaded -->
<script>
  htmz.configure({...}); // Error: htmz is not defined
</script>
<script src="htmz.js"></script>
```

2. **Verify script URL:**
```html
<!-- Check network tab in DevTools -->
<script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>
```

3. **Local installation:**
```bash
# NPM installation
npm install @htmz/htmz

# Or download and serve locally
wget https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js
```

### Attributes not working

**Problem:** Clicking elements with `hz-*` attributes does nothing.

**Cause:** htmz not initializing or elements added after page load.

**Solutions:**

1. **Check initialization:**
```html
<script src="htmz.js"></script>
<script>
  // Wait for DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('htmz version:', htmz.version);
    // Should log version number
  });
</script>
```

2. **Re-process dynamic elements:**
```html
<!-- After adding elements dynamically -->
<script>
  // Tell htmz to scan for new elements
  htmz.process('.newly-added-elements');
</script>
```

3. **Check console for errors:**
```javascript
// Enable request logging
htmz.configure({ logRequests: true });
```

## 🔧 Attribute Problems

### Request not triggering

**Problem:** Clicking button doesn't make request.

**Debugging steps:**

1. **Check attribute syntax:**
```html
<!-- ✅ Correct -->
<button hz-get="/api/users">Get Users</button>

<!-- ❌ Wrong: Missing value -->
<button hz-get="">Get Users</button>

<!-- ❌ Wrong: Typo in attribute -->
<button hx-get="/api/users">Get Users</button>
```

2. **Verify URL format:**
```html
<!-- ✅ Correct: Absolute URLs -->
<button hz-get="https://api.example.com/users">External API</button>

<!-- ✅ Correct: Relative URLs -->
<button hz-get="/api/users">Internal API</button>

<!-- ❌ Wrong: Invalid URL -->
<button hz-get="not-a-url">Invalid</button>
```

3. **Check event triggers:**
```html
<!-- Default trigger is 'click' -->
<button hz-get="/api/data">Default Click</button>

<!-- Explicit trigger -->
<input hz-get="/api/search" hz-trigger="input changed">

<!-- Multiple triggers -->
<div hz-get="/api/data" hz-trigger="click, focus">Multiple</div>
```

### Wrong HTTP method

**Problem:** Using GET for data that should be POST/PUT/DELETE.

**Solutions:**

```html
<!-- ✅ Correct: Use appropriate methods -->
<button hz-get="/api/users">Fetch users (safe)</button>
<button hz-post="/api/users">Create user (changes data)</button>
<button hz-put="/api/users/123">Update user</button>
<button hz-delete="/api/users/123">Delete user</button>

<!-- ❌ Wrong: Using GET for data modification -->
<button hz-get="/api/users/delete/123">Don't do this</button>
```

### Form data not being sent

**Problem:** POST request not including form data.

**Cause:** Form elements not properly named or structured.

**Solutions:**

1. **Check form structure:**
```html
<!-- ✅ Correct: Named inputs -->
<form hz-post="/api/contact">
  <input name="email" required>
  <input name="message" required>
  <button type="submit">Send</button>
</form>

<!-- ❌ Wrong: Missing name attributes -->
<form hz-post="/api/contact">
  <input placeholder="Email"> <!-- No name! -->
  <button type="submit">Send</button>
</form>
```

2. **Include additional data:**
```html
<!-- Add extra parameters -->
<form hz-post="/api/contact"
      hz-params='{"source": "website"}'>
  <input name="email" required>
  <button type="submit">Send</button>
</form>
```

3. **Include other form fields:**
```html
<input name="category" value="support">
<input name="message"
       hz-post="/api/messages"
       hz-include="input[name=category]"
       hz-trigger="enter">
```

## 📄 Template Issues

### Template not found

**Problem:** `htmz: Template element '#my-template' not found`

**Cause:** Template element doesn't exist or has wrong ID.

**Solutions:**

1. **Check template element:**
```html
<!-- ✅ Correct: Template exists with matching ID -->
<template id="user-card">
  <div>{{name}}</div>
</template>

<button hz-get="/api/user" hz-template="#user-card">Get User</button>

<!-- ❌ Wrong: Mismatched ID -->
<template id="user-template">
  <div>{{name}}</div>
</template>

<button hz-get="/api/user" hz-template="#user-card">Wrong ID</button>
```

2. **Use inline templates:**
```html
<!-- Alternative: Inline template -->
<button hz-get="/api/user"
        hz-template="<div>{{name}}</div>">
  Inline Template
</button>
```

3. **Check template placement:**
```html
<!-- Templates can be anywhere in the document -->
<head>
  <template id="head-template">...</template>
</head>
<body>
  <template id="body-template">...</template>
  <div hz-get="/api/data" hz-template="#head-template">Works</div>
</body>
```

### Variables not displaying

**Problem:** Template shows `{{variable}}` literally instead of data.

**Causes & Solutions:**

1. **Check JSON structure:**
```javascript
// ✅ Correct: API returns expected structure
{
  "name": "John Doe",
  "email": "john@example.com"
}

// Template: {{name}} displays "John Doe"
```

```html
<!-- ❌ Wrong: Variable doesn't exist in JSON -->
<template id="user-template">
  {{username}} <!-- But JSON has "name", not "username" -->
</template>
```

2. **Check nested properties:**
```javascript
// API returns:
{
  "user": {
    "profile": {
      "name": "John"
    }
  }
}
```

```html
<!-- ✅ Correct: Full path -->
<template>{{user.profile.name}}</template>

<!-- ❌ Wrong: Incomplete path -->
<template>{{name}}</template>
```

3. **Handle missing data:**
```html
<!-- ✅ Good: Conditional display -->
<template>
  {{?name}}
    <h1>{{name}}</h1>
  {{/?}}
  {{?!name}}
    <h1>Unknown User</h1>
  {{/?}}
</template>
```

### Array loops not working

**Problem:** `{{#array}}` not displaying items.

**Debugging:**

1. **Check JSON structure:**
```javascript
// ✅ Correct: Array in JSON
{
  "users": [
    {"name": "John"},
    {"name": "Jane"}
  ]
}
```

```html
<!-- ✅ Correct: Loop syntax -->
<template>
  {{#users}}
    <div>{{name}}</div>
  {{/users}}
</template>
```

2. **Common mistakes:**
```html
<!-- ❌ Wrong: Mismatched tags -->
{{#users}}
  <div>{{name}}</div>
{{/items}} <!-- Should be {{/users}} -->

<!-- ❌ Wrong: Not an array -->
{{#user}} <!-- 'user' is object, not array -->
  <div>{{name}}</div>
{{/user}}
```

3. **Handle empty arrays:**
```html
<template>
  {{?users.length > 0}}
    {{#users}}
      <div>{{name}}</div>
    {{/users}}
  {{/?}}
  {{?users.length === 0}}
    <p>No users found</p>
  {{/?}}
</template>
```

### Conditionals not working

**Problem:** `{{?condition}}` not showing/hiding content.

**Solutions:**

1. **Check condition syntax:**
```html
<!-- ✅ Correct: Simple existence check -->
{{?name}}
  <p>Name: {{name}}</p>
{{/?}}

<!-- ✅ Correct: Comparison -->
{{?status === 'active'}}
  <span class="active">Active</span>
{{/?}}

<!-- ❌ Wrong: Invalid syntax -->
{{?name == "John"}} <!-- Use === for strict comparison -->
```

2. **Understand truthy/falsy:**
```javascript
// These are falsy (won't show content):
{
  "name": "",           // Empty string
  "count": 0,          // Zero
  "active": false,     // Boolean false
  "data": null,        // Null
  "items": []          // Empty array
}

// These are truthy (will show content):
{
  "name": "John",      // Non-empty string
  "count": 1,          // Non-zero number
  "active": true,      // Boolean true
  "items": ["item"]    // Non-empty array
}
```

3. **Explicit comparisons:**
```html
<!-- More explicit conditions -->
{{?status !== null}}
  <p>Status: {{status}}</p>
{{/?}}

{{?items.length > 0}}
  <p>Found {{items.length}} items</p>
{{/?}}
```

## 🌐 Network & API Problems

### CORS errors

**Problem:** `Access to fetch at '...' has been blocked by CORS policy`

**Cause:** API doesn't allow requests from your domain.

**Solutions:**

1. **Server-side fix (preferred):**
```javascript
// Express.js example
app.use(cors({
  origin: 'https://yoursite.com',
  credentials: true
}));
```

2. **Use proxy during development:**
```javascript
// Webpack dev server
module.exports = {
  devServer: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
};
```

3. **Use public APIs:**
```html
<!-- These APIs allow CORS -->
<button hz-get="https://jsonplaceholder.typicode.com/users">Public API</button>
<button hz-get="https://api.github.com/users/octocat">GitHub API</button>
```

### API returning HTML instead of JSON

**Problem:** Template receives HTML string instead of JSON object.

**Cause:** Server returning wrong Content-Type.

**Debugging:**
```javascript
// Check network tab in DevTools
// Response should have: Content-Type: application/json

// If server returns HTML, you'll see:
"<html><body>Error...</body></html>"

// Instead of:
{"error": "Error message"}
```

**Solutions:**

1. **Fix server response:**
```javascript
// Express.js
res.json({error: "Message"}); // ✅ Correct
res.send("<html>..."); // ❌ Wrong for htmz
```

2. **Check API endpoints:**
```bash
# Test with curl
curl -H "Accept: application/json" https://api.example.com/users
```

### Authentication issues

**Problem:** API requests return 401 Unauthorized.

**Solutions:**

1. **Add authentication headers:**
```html
<button hz-get="/api/private-data"
        hz-headers='{"Authorization": "Bearer your-token"}'>
  Private Data
</button>
```

2. **Global headers:**
```javascript
htmz.configure({
  globalHeaders: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});
```

3. **Handle expired tokens:**
```html
<template id="auth-error">
  {{?error.status === 401}}
    <div class="auth-error">
      <p>Session expired. Please log in again.</p>
      <button onclick="redirectToLogin()">Login</button>
    </div>
  {{/?}}
</template>
```

## 🎯 DOM & Targeting Issues

### Target not found

**Problem:** `htmz: Target '#result' not found`

**Cause:** Target element doesn't exist when request completes.

**Solutions:**

1. **Verify target exists:**
```html
<!-- ✅ Correct: Target exists -->
<button hz-get="/api/data" hz-target="#result">Get Data</button>
<div id="result"></div>

<!-- ❌ Wrong: Typo in target -->
<button hz-get="/api/data" hz-target="#results">Get Data</button>
<div id="result"></div> <!-- ID doesn't match -->
```

2. **Use relative targets:**
```html
<!-- Target current element -->
<button hz-get="/api/status"
        hz-target="this"
        hz-template="<span>{{status}}</span>">
  Check Status
</button>

<!-- Target next sibling -->
<button hz-get="/api/data" hz-target="next">Get Data</button>
<div>Results appear here</div>

<!-- Target parent -->
<div class="container">
  <button hz-get="/api/data" hz-target="closest .container">Get Data</button>
</div>
```

3. **Create target dynamically:**
```html
<button hz-get="/api/data"
        hz-template="<div id='result'>{{data}}</div>"
        hz-target="#container">
  Create & Fill Target
</button>
<div id="container"></div>
```

### Content not updating

**Problem:** Request succeeds but DOM doesn't change.

**Debugging steps:**

1. **Check swap strategy:**
```html
<!-- ✅ Default: Replace content -->
<button hz-get="/api/data" hz-target="#result">Replace</button>

<!-- ✅ Explicit: Append content -->
<button hz-get="/api/data" hz-target="#result" hz-swap="append">Add</button>

<!-- ❌ Wrong: 'none' doesn't update DOM -->
<button hz-get="/api/data" hz-target="#result" hz-swap="none">No Update</button>
```

2. **Inspect network and template:**
```javascript
// Enable logging to see what's happening
htmz.configure({ logRequests: true });

// Check browser DevTools:
// 1. Network tab: Is request successful?
// 2. Console: Any errors?
// 3. Elements: Does target element exist?
```

3. **Test with simple template:**
```html
<!-- Simple test template -->
<template id="debug-template">
  <div style="background: red; color: white;">
    Template is working! Data: {{JSON.stringify(this)}}
  </div>
</template>

<button hz-get="/api/data" hz-template="#debug-template">Test</button>
```

### Multiple elements matching target

**Problem:** Unexpected elements being updated.

**Cause:** CSS selector matches multiple elements.

**Solutions:**

1. **Use specific selectors:**
```html
<!-- ❌ Vague: Updates all divs with class -->
<button hz-get="/api/data" hz-target=".result">Update</button>
<div class="result">Result 1</div>
<div class="result">Result 2</div>

<!-- ✅ Specific: Updates only one element -->
<button hz-get="/api/data" hz-target="#specific-result">Update</button>
<div id="specific-result" class="result">Only this one</div>
```

2. **Use unique IDs:**
```html
<!-- Generate unique IDs for dynamic content -->
<div class="user-list">
  <div id="user-123">
    <button hz-get="/api/users/123"
            hz-target="#user-123"
            hz-template="#user-details">Update This User</button>
  </div>
</div>
```

## ⚡ Performance Problems

### Slow template rendering

**Problem:** Page freezes when rendering large datasets.

**Solutions:**

1. **Limit data on server:**
```javascript
// ✅ Server-side pagination
app.get('/api/users', (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 20; // Don't return thousands
  // ... return limited results
});
```

2. **Use pagination in templates:**
```html
<template id="user-list">
  <div class="pagination-info">
    Showing {{users.length}} of {{totalCount}} users
  </div>

  {{#users}}
    <div class="user-card">{{name}}</div>
  {{/users}}

  {{?hasNext}}
    <button hz-get="/api/users?page={{nextPage}}"
            hz-template="#user-list"
            hz-target="#user-container"
            hz-swap="append">Load More</button>
  {{/?}}
</template>
```

3. **Simplify templates:**
```html
<!-- ✅ Simple template -->
<template id="simple-user">
  <div>{{name}} - {{email}}</div>
</template>

<!-- ❌ Complex template (avoid for large lists) -->
<template id="complex-user">
  <div class="user-card">
    {{?avatar}}<img src="{{avatar}}">{{/?}}
    <div class="user-info">
      {{?name}}<h3>{{name}}</h3>{{/?}}
      {{?bio}}<p>{{bio}}</p>{{/?}}
      {{?social}}
        {{#social}}
          <a href="{{url}}">{{platform}}</a>
        {{/social}}
      {{/?}}
    </div>
  </div>
</template>
```

### Too many requests

**Problem:** App making excessive API calls.

**Solutions:**

1. **Add appropriate delays:**
```html
<!-- ✅ Debounced search -->
<input hz-get="/api/search"
       hz-trigger="input changed delay:500ms">

<!-- ❌ Too aggressive -->
<input hz-get="/api/search"
       hz-trigger="input"> <!-- Fires on every keystroke -->
```

2. **Use throttling:**
```html
<!-- Limit to one request per second -->
<button hz-get="/api/data"
        hz-trigger="click throttle:1000ms">
  Limited Requests
</button>
```

3. **Cancel previous requests:**
```html
<!-- Automatic request cancellation -->
<input hz-get="/api/search"
       hz-sync="search-requests"
       hz-trigger="input changed delay:300ms">
```

## 🔍 Debugging Tips

### Enable debug logging

```javascript
// See all htmz activity
htmz.configure({
  logRequests: true
});

// Custom error handling
htmz.configure({
  onError: (error, config, element) => {
    console.error('htmz error:', error);
    console.log('Config:', config);
    console.log('Element:', element);
  }
});
```

### Inspect network requests

1. **Open DevTools → Network tab**
2. **Filter by XHR/Fetch**
3. **Check request/response:**
   - URL correct?
   - Method correct (GET/POST/etc)?
   - Headers included?
   - Response is JSON?
   - Status code 200?

### Test templates in isolation

```html
<!-- Create test data -->
<script>
const testData = {
  name: "Test User",
  email: "test@example.com",
  items: [
    {title: "Item 1"},
    {title: "Item 2"}
  ]
};

// Test template rendering
const html = htmz.render('#my-template', testData);
console.log('Rendered HTML:', html);
</script>
```

### Common console errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `htmz is not defined` | Script not loaded | Add script tag |
| `Template not found` | Wrong template ID | Check template exists |
| `Target not found` | Wrong target selector | Verify element exists |
| `JSON parse error` | Server returning HTML | Fix server response |
| `CORS blocked` | Cross-origin restriction | Configure server CORS |
| `401 Unauthorized` | Missing auth | Add auth headers |

### Browser compatibility

| Feature | Support | Fallback |
|---------|---------|----------|
| `fetch()` | Modern browsers | Add polyfill |
| `IntersectionObserver` | IE11+ | Graceful degradation |
| `CustomEvent` | IE9+ | Polyfill available |
| Template elements | IE with polyfill | Use hidden divs |

---

**Still having issues?**

1. Check the [GitHub Issues](https://github.com/willtheesfeld/htmz/issues)
2. Create a minimal reproduction case
3. Enable debug logging and include output
4. Specify browser version and environment

**Next:** Check out [Performance Optimization](PERFORMANCE.md) tips →