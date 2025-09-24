# htmz Proxy Server

Secure proxy server for htmz environment variables and API keys.

## Features

- **🔐 Secure**: API keys never leave the server
- **🚀 Fast**: Environment variable resolution at runtime
- **🛡️ CORS Protected**: Only localhost allowed by default
- **📁 File Watching**: Auto-reloads .env changes in dev mode

## Quick Start

```bash
# Start the proxy server
npx htmz proxy

# Custom port
npx htmz proxy --port 8080

# Custom .env file
npx htmz proxy --env .env.local

# Development mode with file watching
npx htmz proxy --dev
```

## Environment Variables

Create a `.env` file in your project root:

```bash
# API Configuration
GITHUB_API=https://api.github.com
GITHUB_TOKEN=your_actual_api_key_here
DEFAULT_USER=octocat

# Other APIs
STRIPE_API=https://api.stripe.com/v1
STRIPE_KEY=pk_test_your_publishable_key_here
```

## Usage in HTML

```html
<!-- Environment variables are resolved server-side -->
<button hz-get="{{env.GITHUB_API}}/users/{{env.DEFAULT_USER}}"
        hz-headers='{"Authorization": "Bearer {{env.GITHUB_TOKEN}}"}'
        hz-template="#user-template">
    Get User Data
</button>
```

## Security

- ✅ API keys stored server-side only
- ✅ Environment variables resolved at runtime
- ✅ CORS protection for localhost
- ✅ No secrets exposed to browser
- ✅ Works with any JSON API

## Production Deployment

Deploy the proxy server to:
- **Vercel**: Add as API route
- **Netlify**: Deploy as function
- **AWS Lambda**: Serverless function
- **Docker**: Container deployment
- **Node.js Server**: Direct deployment

See the [Security Guide](../docs/SECURITY.md) for more details.