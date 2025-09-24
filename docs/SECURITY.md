# htmz Security Guide

## ⚠️ CRITICAL: Client-Side Environment Variables Are Not Secure

**TL;DR:** API keys and secrets should NEVER be stored client-side. Use server-side proxies instead.

## The Problem

Client-side JavaScript applications cannot securely store secrets because:

- **Browser Dev Tools**: F12 → Application → Local Storage shows all stored data
- **View Source**: HTML source code is fully visible to users
- **DOM Inspector**: Resolved attribute values are visible in DOM
- **Network Tab**: All requests with headers are logged
- **JavaScript Access**: Any script can read localStorage, sessionStorage, etc.

## Security Warnings in htmz

htmz automatically detects and warns about sensitive keys:

```javascript
htmz.env.set('API_KEY', 'secret123');
// 🚨 SECURITY WARNING: Setting sensitive key 'API_KEY' in client-side storage!
// 🚨 API keys, secrets, and tokens should NEVER be stored client-side.
```

**Sensitive patterns detected:**
- `*_KEY`, `*_SECRET`, `*_TOKEN`, `*_PASSWORD`
- `*_AUTH`, `*_PRIVATE`, `*_CREDENTIAL`
- `*_JWT`, `*_BEARER`, `*_OAUTH`

## Safe Patterns

### ✅ Pattern 1: Server-Side Proxy

**Backend handles API keys, frontend makes requests to your backend:**

```html
<!-- Frontend: No API keys needed -->
<button hz-get="/api/proxy/github/users/octocat"
        hz-template="#user-template"
        hz-target="#result">
    Get User Data
</button>
```

```javascript
// Backend (Node.js example)
app.get('/api/proxy/github/*', (req, res) => {
    const githubPath = req.params[0];
    fetch(`https://api.github.com/${githubPath}`, {
        headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` // Server-side secret
        }
    })
    .then(response => response.json())
    .then(data => res.json(data));
});
```

### ✅ Pattern 2: OAuth/JWT Tokens

**Use temporary, scoped tokens instead of permanent API keys:**

```html
<!-- Temporary token from OAuth flow -->
<button hz-get="https://api.example.com/data"
        hz-headers='{"Authorization": "Bearer {{env.TEMP_TOKEN}}"}'
        hz-template="#data-template"
        hz-target="#result">
    Get Data
</button>
```

```javascript
// Get temporary token through OAuth
function authenticateUser() {
    // OAuth flow returns temporary token
    const tempToken = await oauthFlow();
    htmz.env.set('TEMP_TOKEN', tempToken); // Short-lived, limited scope
}
```

### ✅ Pattern 3: Public APIs Only

**Only use public APIs that don't require authentication:**

```html
<button hz-get="https://jsonplaceholder.typicode.com/users/1"
        hz-template="#user-template"
        hz-target="#result">
    Get Public Data
</button>
```

### ✅ Pattern 4: Build-Time Injection

**Inject URLs at build time, not API keys:**

```html
<!-- Build system replaces {{BUILD.API_URL}} -->
<button hz-get="{{env.API_BASE}}/public/data"
        hz-template="#data-template"
        hz-target="#result">
    Get Data
</button>
```

```javascript
// Build process
const config = {
    API_BASE: process.env.NODE_ENV === 'production'
        ? 'https://api.mysite.com'
        : 'http://localhost:3000'
};

// Safe to expose - just URLs, no secrets
htmz.env.set('API_BASE', config.API_BASE);
```

## ❌ Dangerous Patterns to Avoid

### Never Store API Keys Client-Side

```html
<!-- ❌ DANGEROUS: API key visible in HTML -->
<meta name="htmz-env-API_KEY" content="secret123">

<!-- ❌ DANGEROUS: API key in localStorage -->
<script>htmz.env.set('API_KEY', 'secret123');</script>

<!-- ❌ DANGEROUS: Hardcoded in JavaScript -->
<button hz-headers='{"Authorization": "Bearer secret123"}'>
```

### Never Load .env Files Publicly

```bash
# ❌ DANGEROUS: .env accessible via HTTP
https://yoursite.com/.env

# ❌ DANGEROUS: Contains actual secrets
API_KEY=secret123
DATABASE_PASSWORD=super_secret
```

## Production Mode Protection

htmz refuses to store sensitive keys in production:

```javascript
// Development: Shows warning but proceeds
htmz.env.set('API_KEY', 'secret'); // Warns but works

// Production (not localhost): Blocks operation
htmz.env.set('API_KEY', 'secret'); // Returns false, doesn't store
```

## Safe Environment Variables

These are safe to store client-side:

```javascript
// ✅ Safe: Public configuration
htmz.env.set('API_BASE', 'https://api.github.com');
htmz.env.set('DEFAULT_USER', 'octocat');
htmz.env.set('THEME', 'dark');
htmz.env.set('TIMEOUT', '30000');
htmz.env.set('DEBUG', 'true');

// ✅ Safe: Public feature flags
htmz.env.set('ENABLE_BETA_FEATURES', 'false');
htmz.env.set('ANALYTICS_ID', 'UA-XXXXX-X'); // Public tracking ID
```

## Development vs Production

### Development (.env)
```bash
# Safe for local development only
API_BASE=http://localhost:3000
DEFAULT_USER=testuser
DEBUG=true

# ⚠️ Never commit real secrets to Git
API_KEY=development_key_only
```

### Production
```bash
# Server-side only - never exposed to client
API_KEY=prod_secret_key
DATABASE_URL=postgresql://...

# Client-side safe config
API_BASE=https://api.mysite.com
DEBUG=false
```

## Security Checklist

Before deploying:

- [ ] No API keys stored client-side
- [ ] All sensitive operations use server-side proxy
- [ ] .env files not served by web server
- [ ] Only public configuration exposed to client
- [ ] OAuth/JWT used instead of permanent tokens
- [ ] Production mode blocks sensitive key storage

## Getting Help

If you need to integrate with APIs requiring authentication:

1. **Read the API docs** for OAuth/public access options
2. **Create a backend proxy** to handle authentication
3. **Use temporary tokens** with limited scope
4. **Never expose permanent secrets** to browsers

Remember: **If it's in the browser, it's public.**