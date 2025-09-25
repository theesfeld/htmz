# htmz 🚀

> **Transform any JSON API into dynamic HTML with zero JavaScript coding**

[![Version](https://img.shields.io/badge/version-1.1.7-blue.svg)](https://www.npmjs.com/package/@htmz/htmz)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-blue.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-localhost%20%2B%20hmac-green.svg)](#-ultra-secure-by-design)

**htmz** is a revolutionary JavaScript library that brings JSON API integration directly to HTML using simple declarative attributes. Build modern, data-driven web applications without writing a single line of JavaScript.

## ✨ What Makes htmz Special

- **🎯 Zero JavaScript Required** - Everything happens through HTML attributes
- **🔐 Ultra-Secure** - Localhost-only + HMAC signing protects your API keys
- **🔥 JSON-First** - Built for modern REST APIs, not HTML fragments
- **⚡ Blazing Fast** - Smart caching and optimized DOM updates
- **🪶 Zero Dependencies** - Pure Node.js, no external packages
- **📱 Works Everywhere** - Any browser, any API, any framework
- **🔧 TOML Configuration** - Structured API endpoint and authentication management

## 🚀 Quick Start

### Option 1: Create New Project (Recommended)
```bash
npm create @htmz/htmz-app my-app
cd my-app
npm run dev
```

### Option 2: Add to Existing Project
```bash
npm install @htmz/htmz
npx htmz init
```

### 3. Configure Your APIs
Edit `proxy/htmz.toml` to add your API endpoints:
```toml
[apis.github]
name = "GitHub API"
endpoint = "https://api.github.com"
auth_type = "bearer"
token = "your_github_token_here"

[apis.weather]
name = "Weather API"
endpoint = "https://api.openweathermap.org"
auth_type = "api_key"
key_param = "appid"
key = "your_weather_key_here"
```

### 4. Start Building
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@htmz/htmz@1.1.7/dist/htmz.min.js"></script>
</head>
<body>
    <!-- Secure API call - credentials handled by TOML config -->
    <button hz-get="{{GITHUB_API}}/users/octocat"
            hz-template="#user-template"
            hz-target="#result">
        Load GitHub Profile
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

**🎉 That's it!** Your API keys stay secure in the TOML config, never exposed to browsers.

## 🔐 Ultra-Secure By Design

**Your API keys are NEVER exposed to browsers:**

- **Localhost-Only Binding** - Proxy only accepts connections from 127.0.0.1
- **HMAC-SHA256 Signing** - Every request cryptographically verified
- **TOML-Based Configuration** - Structured endpoint whitelisting
- **Per-Endpoint Authentication** - Bearer tokens, API keys, Basic auth
- **Server-Side Only** - Credentials never leave your machine
- **Zero Network Exposure** - Cannot be reached from external networks

```bash
# This is impossible - your keys are safe
curl http://localhost:3001/htmz.toml     # ❌ 404 Not Found
curl http://your-site.com/.env           # ❌ 404 Not Found
curl http://192.168.1.100:3001/          # ❌ Connection refused
```

**🛡️ Zero attack surface. Maximum security.**

## 📖 Core Attributes

Transform any element into a dynamic API client:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `hz-get` | GET request | `hz-get="{{API_BASE}}/users"` |
| `hz-post` | POST request | `hz-post="{{API_BASE}}/users"` |
| `hz-put` | PUT request | `hz-put="{{API_BASE}}/users/123"` |
| `hz-delete` | DELETE request | `hz-delete="{{API_BASE}}/users/123"` |
| `hz-headers` | HTTP headers | `hz-headers='{"Content-Type": "application/json"}'` |
| `hz-body` | Request body | `hz-body='{"name": "John"}'` |
| `hz-template` | Template selector | `hz-template="#user-template"` |
| `hz-target` | Result destination | `hz-target="#results"` |
| `hz-trigger` | Event trigger | `hz-trigger="click,change"` |

## 🔧 TOML Configuration

Configure all your APIs in one place with `proxy/htmz.toml`:

### Basic Structure
```toml
[proxy]
port = 3001
host = "127.0.0.1"

[apis.myapi]
name = "My API"
endpoint = "https://api.example.com"
auth_type = "bearer"
token = "your_token_here"

[template_vars]
API_BASE = "https://api.example.com"
DEFAULT_USER = "demo"
```

### Authentication Types

**No Authentication:**
```toml
[apis.public]
name = "Public API"
endpoint = "https://jsonplaceholder.typicode.com"
auth_type = "none"
```

**Bearer Token:**
```toml
[apis.github]
name = "GitHub API"
endpoint = "https://api.github.com"
auth_type = "bearer"
token = "ghp_your_token_here"
```

**API Key (URL Parameter):**
```toml
[apis.weather]
name = "Weather API"
endpoint = "https://api.openweathermap.org"
auth_type = "api_key"
key_param = "appid"
key = "your_api_key_here"
```

**API Key (Header):**
```toml
[apis.news]
name = "News API"
endpoint = "https://newsapi.org"
auth_type = "api_header"
header_name = "X-API-Key"
key = "your_news_api_key"
```

**Basic Auth:**
```toml
[apis.private]
name = "Private API"
endpoint = "https://private-api.com"
auth_type = "basic"
username = "admin"
password = "secret"
```

## 🚀 Development Commands

### Main Library
```bash
npm install @htmz/htmz     # Install library
htmz dev                   # Start dev server (web + proxy)
htmz proxy                 # Start proxy server only
htmz serve                 # Start web server only
htmz init                  # Initialize existing project
```

### Project Scaffolding
```bash
npm create @htmz/htmz-app my-app    # Create new project
# or
npx @htmz/create-htmz-app my-app    # Alternative syntax
```

### Building
```bash
make build                 # Build dist files
make clean                 # Clean build artifacts
make dev                   # Build and start dev server
make watch                 # Auto-rebuild on changes
make test                  # Run security tests
```

## 📦 Template System

Powerful templating with variables, conditionals, and loops:

### Variables
```html
<template id="user-template">
    <h1>{{name}}</h1>
    <p>{{email}}</p>
    <p>Joined: {{created_at}}</p>
</template>
```

### Conditionals
```html
<template id="user-template">
    {{?is_premium}}
        <span class="badge">Premium User</span>
    {{/?}}
    {{?!is_active}}
        <span class="warning">Account Inactive</span>
    {{/?}}
</template>
```

### Loops
```html
<template id="users-template">
    {{#users}}
        <div class="user">
            <h3>{{name}}</h3>
            <p>{{email}}</p>
        </div>
    {{/users}}
</template>
```

### Template Variables
Use TOML-defined variables in your HTML:
```html
<button hz-get="{{API_BASE}}/users/{{DEFAULT_USER}}">
    Load Default User
</button>
```

## 🔄 Event Handling

Control when requests trigger:

```html
<!-- Click (default) -->
<button hz-get="/api/data">Click Me</button>

<!-- Input with delay -->
<input hz-get="/api/search"
       hz-trigger="input changed delay:500ms"
       hz-target="#results">

<!-- Multiple triggers -->
<div hz-get="/api/status"
     hz-trigger="load,focus,every 30s"
     hz-target="#status">
```

## 🎯 Advanced Examples

### Real-time Dashboard
```html
<div hz-get="{{API_BASE}}/stats"
     hz-trigger="load,every 5s"
     hz-template="#stats-template"
     hz-target="#dashboard">
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
    </div>
</template>
```

### Search with Live Results
```html
<input type="text"
       placeholder="Search users..."
       hz-get="{{API_BASE}}/search/users"
       hz-trigger="input changed delay:300ms"
       hz-template="#search-results"
       hz-target="#results">

<div id="results"></div>

<template id="search-results">
    {{#users}}
        <div class="user-card">
            <img src="{{avatar_url}}" width="40">
            <div>
                <strong>{{name}}</strong>
                <p>{{email}}</p>
            </div>
        </div>
    {{/users}}
</template>
```

### Form Submission
```html
<form hz-post="{{API_BASE}}/users"
      hz-body-from="form"
      hz-template="#success-template"
      hz-target="#result">
    <input name="name" placeholder="Name">
    <input name="email" placeholder="Email">
    <button type="submit">Create User</button>
</form>
```

## 🏗️ Architecture

### Client-Side (Browser)
- **htmz.js** - Core library for attribute processing
- **HMAC signing** - Signs all requests for security
- **Template engine** - Processes response data
- **DOM morphing** - Efficient UI updates

### Server-Side (Development)
- **TOML proxy server** - Handles authentication and secrets
- **Endpoint whitelisting** - Only configured APIs accessible
- **Request forwarding** - Proxies to real APIs with credentials
- **Zero dependencies** - Pure Node.js implementation

## 🚀 Deployment

### Development
```bash
htmz dev                   # Local development (ports 8000 + 3001)
```

### Production
Deploy your HTML files anywhere. The proxy server is only needed for development when using authenticated APIs.

For production with server-side APIs:
1. Deploy proxy server to secure environment
2. Configure firewall to allow only your application
3. Use environment variables for credentials

## 🔒 Security Features

- **HMAC-SHA256** request signing prevents tampering
- **Localhost binding** eliminates external network access
- **Endpoint whitelisting** via TOML configuration
- **Credential isolation** - API keys never touch browsers
- **Request size limits** prevent DoS attacks
- **File permissions** protect configuration files

## 📚 API Reference

### HTML Attributes

**HTTP Methods:**
- `hz-get="url"` - GET request
- `hz-post="url"` - POST request
- `hz-put="url"` - PUT request
- `hz-delete="url"` - DELETE request
- `hz-patch="url"` - PATCH request

**Request Configuration:**
- `hz-headers="json"` - HTTP headers
- `hz-body="json"` - Request body
- `hz-body-from="selector"` - Extract body from form/element

**Response Handling:**
- `hz-template="selector"` - Template to render
- `hz-target="selector"` - Where to insert result
- `hz-trigger="events"` - When to make request

**Advanced:**
- `hz-cache="duration"` - Cache response for duration
- `hz-retry="count"` - Retry failed requests
- `hz-timeout="ms"` - Request timeout

### Template Variables

Template variables from TOML `[template_vars]` section:
```html
<button hz-get="{{API_BASE}}/users/{{DEFAULT_USER}}">
```

Response data variables:
```html
<template>
    <h1>{{user.name}}</h1>
    <p>{{user.email}}</p>
</template>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following GNU coding standards
4. Run tests: `make test`
5. Commit with GPL headers: `git commit -m "Add feature"`
6. Push and create a Pull Request

## 📄 License

htmz is licensed under GPL v3+ - see [LICENSE](LICENSE) for details.

This ensures the freedom to use, modify, and distribute while keeping derivatives open source.

## 🔗 Links

- **Documentation**: [Full docs and examples](docs/)
- **npm Package**: [@htmz/htmz](https://www.npmjs.com/package/@htmz/htmz)
- **Scaffolding**: [@htmz/create-htmz-app](https://www.npmjs.com/package/@htmz/create-htmz-app)
- **GitHub**: [Source code and issues](https://github.com/theesfeld/htmz)
- **npm Releases**: [@htmz/htmz versions](https://www.npmjs.com/package/@htmz/htmz?activeTab=versions)

---

**🚀 Build the future of web development - one HTML attribute at a time!**