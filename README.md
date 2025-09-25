# htmz 🚀

> **Transform any JSON API into dynamic HTML with zero JavaScript coding**

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://github.com/willtheesfeld/htmz/releases)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-blue.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-unix%20socket%20%2B%20hmac-green.svg)](#-ultra-secure-by-design)

**htmz** is a revolutionary JavaScript library that brings JSON API integration directly to HTML using simple declarative attributes. Build modern, data-driven web applications without writing a single line of JavaScript.

## ✨ What Makes htmz Special

- **🎯 Zero JavaScript Required** - Everything happens through HTML attributes
- **🔐 Ultra-Secure** - Localhost-only + HMAC signing protects your API keys
- **🔥 JSON-First** - Built for modern REST APIs, not HTML fragments
- **⚡ Blazing Fast** - Smart caching and optimized DOM updates
- **🪶 Zero Dependencies** - Pure Node.js, no external packages
- **📱 Works Everywhere** - Any browser, any API, any framework

## 🚀 60-Second Setup

### 1. Install
```bash
npm install @htmz/htmz
```

### 2. Initialize
```bash
npx htmz init
```

### 3. Add your API keys to `.env`
```bash
# .env (never committed to git, server-side only)
GITHUB_API=https://api.github.com
GITHUB_TOKEN=your_actual_token_here
WEATHER_API=https://api.openweathermap.org
WEATHER_KEY=your_weather_key_here
```

### 4. Start developing
```bash
npm run dev
# 🚀 Web server: http://localhost:8000
# 🔐 Secure proxy: http://127.0.0.1:3002 (localhost-only)
```

### 5. Build your app with HTML
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>
</head>
<body>
    <!-- Secure API call using environment variables -->
    <button hz-get="{{env.GITHUB_API}}/users/{{env.DEFAULT_USER}}"
            hz-headers='{"Authorization": "Bearer {{env.GITHUB_TOKEN}}"}'
            hz-template="#user-template"
            hz-target="#result">
        Load My GitHub Profile
    </button>

    <div id="result"></div>

    <template id="user-template">
        <div class="profile-card">
            <img src="{{avatar_url}}" width="80">
            <h2>{{name}}</h2>
            <p>{{bio}}</p>
            <p>📍 {{location}} • 👥 {{followers}} followers</p>
        </div>
    </template>
</body>
</html>
```

**🎉 That's it!** Your API keys stay secure server-side, and your HTML becomes dynamic with zero JavaScript.

## 🔐 Ultra-Secure By Design

**Your API keys are NEVER exposed to browsers or networks:**

- **Localhost-Only Binding** - Proxy only accepts connections from 127.0.0.1
- **HMAC-SHA256 Signing** - Every request cryptographically verified
- **Endpoint Whitelisting** - Only pre-approved APIs allowed
- **Server-Side Only** - `.env` files never leave your server
- **No External Access** - Cannot be reached from other machines

```bash
# This is impossible - your keys are safe
curl http://localhost:3001/.env     # ❌ 404 Not Found
curl http://your-site.com/.env      # ❌ 404 Not Found
curl http://192.168.1.100:3001/     # ❌ Connection refused
```

**🛡️ Zero attack surface. Maximum security.**

## 📖 Core Attributes

### HTTP Methods
```html
<button hz-get="/api/users">Get Users</button>
<form hz-post="/api/users">Create User</form>
<button hz-put="/api/users/1">Update User</button>
<button hz-delete="/api/users/1">Delete User</button>
```

### Templating & Rendering
```html
<div hz-get="/api/user"
     hz-template="#user-card"
     hz-target="#content"
     hz-swap="innerHTML">
</div>
```

### Event Triggers
```html
<!-- On click (default) -->
<button hz-get="/api/data">Click me</button>

<!-- On page load -->
<div hz-get="/api/stats" hz-trigger="load"></div>

<!-- On input with delay -->
<input hz-get="/api/search"
       hz-trigger="input changed delay:300ms"
       hz-target="#results">
```

## 🎨 Template Magic

### Simple Variables
```html
<template id="user">
    <h1>{{name}}</h1>
    <p>Email: {{email}}</p>
    <p>City: {{address.city}}</p>
</template>
```

### Conditionals
```html
<template id="status">
    {{?active}}
        <span class="online">User is online</span>
    {{/?}}

    {{?role === 'admin'}}
        <button>Admin Panel</button>
    {{/?}}
</template>
```

### Arrays & Loops
```html
<template id="user-list">
    <h2>{{users.length}} Users</h2>
    {{#users}}
        <div class="user">
            <strong>{{name}}</strong> - {{email}}
        </div>
    {{/users}}
</template>
```

## 🔥 Real-World Examples

### Live Search
```html
<input placeholder="Search GitHub users..."
       hz-get="{{env.GITHUB_API}}/search/users"
       hz-template="#search-results"
       hz-target="#results"
       hz-trigger="input changed delay:300ms">

<template id="search-results">
    {{#items}}
        <div class="result">
            <img src="{{avatar_url}}" width="40">
            <strong>{{login}}</strong>
        </div>
    {{/items}}
</template>
```

### Dashboard Stats
```html
<!-- Auto-loads on page load -->
<div hz-get="{{env.API_BASE}}/dashboard/stats"
     hz-headers='{"Authorization": "Bearer {{env.API_TOKEN}}"}'
     hz-template="#stats-template"
     hz-trigger="load"
     class="dashboard">
</div>

<template id="stats-template">
    <div class="stats-grid">
        <div class="stat">
            <h3>{{users.total}}</h3>
            <p>Total Users</p>
        </div>
        <div class="stat">
            <h3>${{revenue.total}}</h3>
            <p>Revenue</p>
        </div>
        <div class="stat">
            <h3>{{growth.percentage}}%</h3>
            <p>Growth</p>
        </div>
    </div>
</template>
```

### Todo App
```html
<form hz-post="{{env.API_BASE}}/todos"
      hz-headers='{"Authorization": "Bearer {{env.API_TOKEN}}"}'
      hz-template="#todo-item"
      hz-target="#todo-list"
      hz-swap="prepend">
    <input name="text" placeholder="What needs to be done?" required>
    <button type="submit">Add Todo</button>
</form>

<div id="todo-list"></div>

<template id="todo-item">
    <div class="todo {{?completed}}completed{{/?}}" data-id="{{id}}">
        <span>{{text}}</span>
        <button hz-delete="{{env.API_BASE}}/todos/{{id}}"
                hz-target="closest .todo"
                hz-swap="delete"
                class="delete-btn">×</button>
    </div>
</template>
```

## 🛠 JavaScript API (Optional)

```javascript
// Manual requests
htmz.get('/api/users').then(data => console.log(data));
htmz.post('/api/users', {name: 'John', email: 'john@example.com'});

// Template rendering
htmz.render('#user-template', userData, '#target');

// DOM updates
htmz.swap('#target', '<div>New content</div>', 'innerHTML');

// Global configuration
htmz.configure({
    defaultSwap: 'innerHTML',
    globalHeaders: {'X-Requested-With': 'htmz'}
});
```

## ⚡ Advanced Features

### Environment Variables
```html
<!-- Secure server-side variable replacement -->
<div hz-get="{{env.API_BASE}}/user/{{env.USER_ID}}"
     hz-headers='{"Authorization": "Bearer {{env.API_TOKEN}}"}'>
</div>
```

### Multiple Swap Strategies
```html
<button hz-get="/api/notification"
        hz-target="#notifications"
        hz-swap="prepend">New Notification</button>

<button hz-get="/api/user"
        hz-target="#profile"
        hz-swap="outerHTML">Reload Profile</button>
```

### Request Indicators
```html
<button hz-get="/api/slow-endpoint"
        hz-indicator="#loading">
    Fetch Data
</button>

<div id="loading" style="display: none;">
    Loading...
</div>
```

## 🚀 Command Line Interface

```bash
# Start development servers
htmz dev                 # Web server + secure proxy

# Start components individually
htmz proxy              # Unix socket proxy only
htmz serve              # Web server only

# Project setup
htmz init               # Initialize htmz in existing project
htmz help               # Show help
```

## 🔧 Environment Variables

htmz automatically whitelists API endpoints from your `.env` file:

```bash
# .env
GITHUB_API=https://api.github.com          # ✅ Whitelisted
STRIPE_API=https://api.stripe.com         # ✅ Whitelisted
WEATHER_API=https://api.openweathermap.org # ✅ Whitelisted

# Explicit whitelist (optional)
ALLOWED_ENDPOINTS=https://api.github.com,https://api.stripe.com

# Your secrets (never exposed)
GITHUB_TOKEN=ghp_your_token_here
STRIPE_KEY=sk_test_your_key_here
```

**🔐 Security guarantee:** These variables are processed server-side only and never sent to browsers.

## 🛡️ Security Best Practices

### ✅ Do This
```html
<!-- ✅ Secure: Uses proxy server -->
<div hz-get="{{env.API_BASE}}/user"
     hz-headers='{"Authorization": "Bearer {{env.API_TOKEN}}"}'>
</div>
```

### ❌ Never Do This
```html
<!-- ❌ DANGER: Exposes API key to browser -->
<div hz-get="https://api.service.com/user"
     hz-headers='{"Authorization": "Bearer sk_live_secret_key"}'>
</div>
```

### 🔐 Why htmz is Secure

1. **Localhost-Only** - Proxy only binds to 127.0.0.1, no external access
2. **HMAC Signing** - Every request cryptographically verified
3. **Endpoint Whitelisting** - Only approved APIs allowed
4. **Server-Side Processing** - Environment variables never leave server
5. **Zero Dependencies** - No external packages, minimal attack surface

## 🆚 Comparison

| Feature | htmz | htmx | Alpine.js | React |
|---------|------|------|-----------|-------|
| **JSON APIs** | ✅ Native | ❌ HTML only | ⚠️ Manual | ⚠️ Manual |
| **Security** | ✅ Localhost + HMAC | ❌ HTTP only | ❌ Client-side | ❌ Client-side |
| **Setup** | ✅ 60 seconds | ⚠️ Moderate | ⚠️ Moderate | ❌ Complex |
| **API Keys** | ✅ Server-side only | ❌ Client-side | ❌ Client-side | ❌ Client-side |
| **Dependencies** | ✅ Zero | ⚠️ Some | ⚠️ Some | ❌ Many |
| **Learning Curve** | ✅ HTML only | ✅ HTML only | ⚠️ JS required | ❌ Complex |

## 📄 License

**GPL v3+** - Free and open source forever.

## 🐛 Issues & Support

- **Issues:** [GitHub Issues](https://github.com/willtheesfeld/htmz/issues)
- **Security:** Report security issues to william@theesfeld.net
- **Discussions:** [GitHub Discussions](https://github.com/willtheesfeld/htmz/discussions)

---

<div align="center">

**⭐ Star us on GitHub if htmz helps you build amazing apps!**

### htmz: Because web development should be simple, secure, and fast.

*Transform JSON APIs into beautiful UIs with zero JavaScript coding.*

</div>