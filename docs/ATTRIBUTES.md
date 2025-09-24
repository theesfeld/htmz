# htmz Attributes Reference

Complete reference for all htmz HTML attributes. All attributes are prefixed with `hz-`.

## 📖 Table of Contents

- [HTTP Methods](#-http-methods)
- [Templating & Rendering](#-templating--rendering)
- [Event Handling](#-event-handling)
- [Request Configuration](#-request-configuration)
- [User Experience](#-user-experience)
- [Attribute Interactions](#-attribute-interactions)

## 🌐 HTTP Methods

### `hz-get`
Makes HTTP GET request to specified URL.

**Syntax:** `hz-get="url"`

**Examples:**
```html
<!-- Basic GET request -->
<button hz-get="/api/users">Get Users</button>

<!-- With URL parameters -->
<input hz-get="/api/search?q={value}"
       hz-trigger="input changed delay:300ms">

<!-- Real API -->
<button hz-get="https://api.github.com/users/octocat">GitHub User</button>
```

**Notes:**
- Default trigger: `click`
- Query parameters can be added via `hz-params` or URL
- `{value}` placeholder gets replaced with element's value

---

### `hz-post`
Makes HTTP POST request with JSON payload.

**Syntax:** `hz-post="url"`

**Examples:**
```html
<!-- Form submission -->
<form hz-post="/api/users">
    <input name="name" required>
    <input name="email" required>
    <button type="submit">Create User</button>
</form>

<!-- Button with custom data -->
<button hz-post="/api/likes"
        hz-params='{"postId": 123}'>Like Post</button>

<!-- File upload -->
<form hz-post="/api/upload" enctype="multipart/form-data">
    <input type="file" name="avatar">
    <button type="submit">Upload</button>
</form>
```

**Notes:**
- Form data automatically serialized to JSON
- `Content-Type: application/json` header added automatically
- Files uploaded as `multipart/form-data` when `enctype` specified

---

### `hz-put`
Makes HTTP PUT request for resource updates.

**Syntax:** `hz-put="url"`

**Examples:**
```html
<!-- Update user -->
<form hz-put="/api/users/123">
    <input name="name" value="John Doe">
    <input name="email" value="john@example.com">
    <button type="submit">Update User</button>
</form>

<!-- Toggle status -->
<button hz-put="/api/posts/123"
        hz-params='{"published": true}'>Publish Post</button>
```

---

### `hz-patch`
Makes HTTP PATCH request for partial updates.

**Syntax:** `hz-patch="url"`

**Examples:**
```html
<!-- Partial user update -->
<input hz-patch="/api/users/123"
       hz-params='{"field": "email"}'
       hz-trigger="blur">

<!-- Toggle boolean -->
<input type="checkbox"
       hz-patch="/api/tasks/123"
       hz-params='{"completed": true}'
       hz-trigger="change">
```

---

### `hz-delete`
Makes HTTP DELETE request.

**Syntax:** `hz-delete="url"`

**Examples:**
```html
<!-- Delete with confirmation -->
<button hz-delete="/api/users/123"
        hz-confirm="Delete this user?"
        hz-target="closest .user-row"
        hz-swap="delete">Delete</button>

<!-- Soft delete -->
<button hz-delete="/api/posts/123"
        hz-template="#deleted-message">Archive Post</button>
```

## 🎨 Templating & Rendering

### `hz-template`
Specifies template for rendering JSON responses.

**Syntax:**
- `hz-template="#selector"` - CSS selector for template element
- `hz-template="<inline>{{name}}</inline>"` - Inline template string

**Examples:**
```html
<!-- Template element -->
<button hz-get="/api/user" hz-template="#user-card">Get User</button>

<template id="user-card">
    <div class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
    </div>
</template>

<!-- Inline template -->
<button hz-get="/api/count"
        hz-template="<span>Count: {{value}}</span>">Get Count</button>

<!-- Multiple templates -->
<button hz-get="/api/user"
        hz-template="{{?type === 'admin'}}#admin-template{{/?}}{{?type === 'user'}}#user-template{{/?}}">
    Get User
</button>
```

**Template Caching:**
- Templates are cached after first use
- Clear cache with `htmz.clearCache()`

---

### `hz-target`
Specifies where to render template output.

**Syntax:** `hz-target="selector"`

**Selectors:**
- `"#id"` - Element by ID
- `".class"` - First element with class
- `"tag"` - First element of type
- `"this"` - Current element (default)
- `"closest .class"` - Closest ancestor with class
- `"next"` - Next sibling element
- `"previous"` - Previous sibling element

**Examples:**
```html
<!-- Specific target -->
<button hz-get="/api/user" hz-target="#user-display">Get User</button>
<div id="user-display"></div>

<!-- Replace button itself -->
<button hz-get="/api/status"
        hz-target="this"
        hz-template="<span>{{status}}</span>">Check Status</button>

<!-- Target parent -->
<div class="card">
    <button hz-get="/api/data"
            hz-target="closest .card"
            hz-swap="innerHTML">Refresh Card</button>
</div>

<!-- Multiple targets -->
<button hz-get="/api/data"
        hz-target="#main-content, #sidebar"
        hz-template="#update-template">Update Both</button>
```

---

### `hz-swap`
Controls how content is inserted into target.

**Syntax:** `hz-swap="strategy [options]"`

**Strategies:**
- `innerHTML` (default) - Replace target's content
- `outerHTML` - Replace entire target element
- `append` - Add to end of target's content
- `prepend` - Add to beginning of target's content
- `before` - Insert before target element
- `after` - Insert after target element
- `delete` - Remove target element
- `none` - Don't insert (use for side effects)

**Options:**
- `transition` - Apply fade transition
- `focus:selector` - Focus element after swap
- `scroll:selector` - Scroll to element after swap

**Examples:**
```html
<!-- Basic strategies -->
<button hz-get="/api/posts" hz-swap="innerHTML">Replace</button>
<button hz-get="/api/posts" hz-swap="append">Add to End</button>
<button hz-get="/api/posts" hz-swap="prepend">Add to Start</button>

<!-- With transitions -->
<button hz-get="/api/data"
        hz-swap="innerHTML transition">Smooth Replace</button>

<!-- With focus -->
<button hz-get="/api/form"
        hz-swap="innerHTML focus:input[name=username]">Load Form</button>

<!-- With scroll -->
<button hz-get="/api/content"
        hz-swap="append scroll:bottom">Load More & Scroll</button>

<!-- Delete element -->
<button hz-delete="/api/users/123"
        hz-target="closest .user-row"
        hz-swap="delete">Delete User</button>
```

## ⚡ Event Handling

### `hz-trigger`
Specifies events that trigger the request.

**Syntax:** `hz-trigger="event [modifiers] [, event [modifiers]]"`

**Events:**
- `click` (default) - Mouse click
- `submit` - Form submission
- `change` - Form field change
- `input` - Form field input
- `focus` - Element gains focus
- `blur` - Element loses focus
- `load` - Page/element loads
- `revealed` - Element scrolls into view
- `intersect` - Intersection observer trigger

**Modifiers:**
- `delay:Nms` - Wait N milliseconds after event
- `throttle:Nms` - Maximum one trigger per N milliseconds
- `changed` - Only trigger if value actually changed
- `once` - Remove listener after first trigger
- `from:selector` - Only trigger if event comes from matching element
- `target:selector` - Only trigger if event target matches

**Examples:**
```html
<!-- Basic events -->
<button hz-get="/api/data" hz-trigger="click">Click Me</button>
<input hz-get="/api/search" hz-trigger="input">Live Search</input>
<select hz-get="/api/filter" hz-trigger="change">Filter</select>

<!-- With delays -->
<input hz-get="/api/search"
       hz-trigger="input changed delay:300ms">Debounced Search</input>

<!-- Multiple triggers -->
<div hz-get="/api/data"
     hz-trigger="click, focus, load">Multi-trigger</div>

<!-- Advanced modifiers -->
<input hz-get="/api/validate"
       hz-trigger="blur changed once">Validate Once</input>

<!-- Intersection observer -->
<div hz-get="/api/page/2"
     hz-trigger="revealed"
     hz-swap="append">Infinite Scroll</div>

<!-- Event delegation -->
<div hz-delete="/api/items/{id}"
     hz-trigger="click from:.delete-btn"
     hz-target="closest .item"
     hz-swap="delete">
    <button class="delete-btn" data-id="1">Delete 1</button>
    <button class="delete-btn" data-id="2">Delete 2</button>
</div>
```

**Special Triggers:**
```html
<!-- Load immediately -->
<div hz-get="/api/stats" hz-trigger="load">Auto-load</div>

<!-- Periodic refresh -->
<div hz-get="/api/status" hz-trigger="every 30s">Auto-refresh</div>

<!-- Intersection observer with threshold -->
<div hz-get="/api/data"
     hz-trigger="intersect"
     data-threshold="0.5">50% Visible</div>
```

## ⚙️ Request Configuration

### `hz-params`
Additional parameters to include in request.

**Syntax:** `hz-params='{"key": "value"}'`

**Examples:**
```html
<!-- Static parameters -->
<button hz-get="/api/search"
        hz-params='{"type": "user", "limit": 10}'>Search Users</button>

<!-- Dynamic parameters -->
<button hz-post="/api/posts"
        hz-params='{"category": "{data-category}"}'
        data-category="tech">Create Post</button>

<!-- Form with extra params -->
<form hz-post="/api/contact"
      hz-params='{"source": "website"}'>
    <input name="email">
    <button type="submit">Send</button>
</form>
```

---

### `hz-headers`
Custom HTTP headers for request.

**Syntax:** `hz-headers='{"Header": "value"}'`

**Examples:**
```html
<!-- API key -->
<button hz-get="/api/private"
        hz-headers='{"X-API-Key": "secret123"}'>Private Data</button>

<!-- Authorization -->
<button hz-post="/api/secure"
        hz-headers='{"Authorization": "Bearer token123"}'>Secure Request</button>

<!-- Custom headers -->
<form hz-post="/api/upload"
      hz-headers='{"X-Upload-Type": "avatar", "X-User-ID": "123"}'>
    <input type="file" name="file">
    <button type="submit">Upload</button>
</form>
```

---

### `hz-include`
Include values from other elements in request.

**Syntax:** `hz-include="selector"`

**Examples:**
```html
<!-- Include other form fields -->
<input name="query"
       hz-get="/api/search"
       hz-include="input[name=category], select[name=sort]">

<input name="category" value="tech">
<select name="sort">
    <option value="date">Date</option>
    <option value="popularity">Popularity</option>
</select>

<!-- Include from anywhere -->
<button hz-post="/api/action"
        hz-include="#user-id, .csrf-token">Submit</button>

<input id="user-id" type="hidden" value="123">
<input class="csrf-token" type="hidden" value="abc123">
```

## 👤 User Experience

### `hz-confirm`
Show confirmation dialog before request.

**Syntax:** `hz-confirm="message"`

**Examples:**
```html
<!-- Simple confirmation -->
<button hz-delete="/api/users/123"
        hz-confirm="Are you sure?">Delete User</button>

<!-- Dynamic message -->
<button hz-delete="/api/posts/{id}"
        hz-confirm="Delete post '{title}'?"
        data-title="My Blog Post">Delete Post</button>

<!-- No confirmation on GET -->
<button hz-get="/api/data"
        hz-confirm="This will reload data">Refresh</button>
```

---

### `hz-indicator`
Show/hide loading indicator during request.

**Syntax:** `hz-indicator="selector"`

**Examples:**
```html
<!-- Simple spinner -->
<button hz-get="/api/slow" hz-indicator="#loading">Slow Request</button>
<div id="loading" hidden>⏳ Loading...</div>

<!-- Multiple indicators -->
<button hz-post="/api/upload"
        hz-indicator="#spinner, #progress">Upload File</button>

<div id="spinner" hidden>🔄 Uploading...</div>
<div id="progress" hidden>
    <progress value="0" max="100"></progress>
</div>

<!-- Button state -->
<button hz-get="/api/data"
        hz-indicator="this">
    <span class="text">Load Data</span>
    <span class="spinner" hidden>⏳</span>
</button>
```

**CSS for Indicators:**
```css
.hz-indicator-loading {
    opacity: 0.6;
    pointer-events: none;
}

.hz-indicator-loading .text { display: none; }
.hz-indicator-loading .spinner { display: inline; }
```

---

### `hz-sync`
Synchronize requests (prevent concurrent requests).

**Syntax:** `hz-sync="group-name"`

**Examples:**
```html
<!-- Prevent double-clicks -->
<button hz-post="/api/purchase"
        hz-sync="purchase-group">Buy Now</button>

<!-- Synchronized form -->
<form hz-post="/api/users" hz-sync="user-form">
    <input name="name">
    <button type="submit" hz-sync="user-form">Create User</button>
</form>

<!-- Cancel previous requests -->
<input hz-get="/api/search"
       hz-sync="search"
       hz-trigger="input delay:300ms">
```

## 🔄 Attribute Interactions

### Combining Attributes
```html
<!-- Complete example -->
<form hz-post="/api/users"
      hz-template="#user-created"
      hz-target="#user-list"
      hz-swap="prepend"
      hz-headers='{"X-Source": "form"}'
      hz-params='{"notify": true}'
      hz-confirm="Create new user?"
      hz-indicator="#form-loading">

    <input name="name" required>
    <input name="email" required>
    <button type="submit">Create User</button>
</form>
```

### Conditional Logic
```html
<!-- Different templates based on response -->
<button hz-get="/api/user/status"
        hz-template="{{?active}}#active-template{{/?}}{{?inactive}}#inactive-template{{/?}}">
    Check Status
</button>

<!-- Different targets based on data -->
<button hz-post="/api/message"
        hz-target="{{?success}}#success-area{{/?}}{{?error}}#error-area{{/?}}">
    Send Message
</button>
```

### Chaining Requests
```html
<!-- Load user, then their posts -->
<button hz-get="/api/users/123"
        hz-template="#user-info"
        hz-target="#user-display"
        data-hz-loaded="hz-get:/api/users/123/posts;hz-template:#user-posts;hz-target:#posts-display">
    Load User & Posts
</button>
```

## 📚 Best Practices

### ✅ Do's
- Use semantic HTML elements
- Provide fallback for non-JavaScript users
- Include loading states for slow requests
- Use confirmation dialogs for destructive actions
- Cache templates for repeated use
- Use descriptive template IDs

### ❌ Don'ts
- Don't nest htmz attributes unnecessarily
- Don't use htmz for non-user-initiated actions
- Don't forget to handle error states
- Don't use complex logic in templates
- Don't ignore accessibility requirements

## 🔗 See Also

- [Template Syntax](TEMPLATES.md) - Template language reference
- [Getting Started](GETTING_STARTED.md) - Basic tutorial
- [Recipes](RECIPES.md) - Common patterns
- [Troubleshooting](reference/TROUBLESHOOTING.md) - Common issues

---

**Next:** Learn about [Template Syntax](TEMPLATES.md) →