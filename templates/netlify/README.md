# Deploy htmz to Netlify

Deploy your htmz application to Netlify with secure environment variable support using Netlify Functions.

## Quick Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/willtheesfeld/htmz)

## Manual Setup

### 1. Copy deployment files

Copy these files to your htmz project root:

```bash
cp templates/netlify/netlify.toml ./
cp -r templates/netlify/netlify ./
```

### 2. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 3. Login and link site

```bash
netlify login
netlify init
```

### 4. Configure environment variables

Add your environment variables:

```bash
netlify env:set GITHUB_API "https://api.github.com"
netlify env:set GITHUB_TOKEN "your_token_here"
netlify env:set API_KEY "your_api_key_here"
# Add all your environment variables
```

### 5. Deploy

```bash
netlify deploy --prod
```

## Environment Variables

Your `.env` variables need to be configured in Netlify:

**Via CLI:**
```bash
netlify env:set VARIABLE_NAME "value"
```

**Via Dashboard:**
1. Go to your site dashboard on Netlify
2. Navigate to **Site settings** → **Environment variables**
3. Add each variable from your `.env` file

## How it works

- Your static HTML files are served by Netlify's CDN
- API requests with `{{env.VARIABLE}}` are routed to `/.netlify/functions/htmz-proxy`
- The Netlify Function resolves environment variables server-side
- Your API keys never reach the browser

## Frontend Configuration

Update your htmz configuration for production:

```javascript
// Automatically detects Netlify environment
htmz.proxy.configure({
    url: '/htmz-proxy',  // Routes to Netlify function
    enabled: true
});
```

## Local Development with Functions

Test Netlify Functions locally:

```bash
netlify dev
```

This starts both your static site and functions locally.

## Custom Headers & Security

The `netlify.toml` includes security headers:
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

## Custom Domain

Add your custom domain in the Netlify dashboard under **Domain management**.

## Monitoring

View function logs in the Netlify dashboard under **Functions** tab to monitor API requests and debug issues.

## Build Settings

No build step is required for htmz. The `netlify.toml` publishes your root directory directly.