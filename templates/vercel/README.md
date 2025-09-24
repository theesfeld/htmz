# Deploy htmz to Vercel

Deploy your htmz application to Vercel with secure environment variable support.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwilltheesfeld%2Fhtmz)

## Manual Setup

### 1. Copy deployment files

Copy these files to your htmz project root:

```bash
cp templates/vercel/vercel.json ./
cp -r templates/vercel/api ./
```

### 2. Install Vercel CLI

```bash
npm install -g vercel
```

### 3. Configure environment variables

In the Vercel dashboard or CLI, add your environment variables:

```bash
vercel env add GITHUB_API
vercel env add GITHUB_TOKEN
vercel env add API_KEY
# Add all your environment variables
```

### 4. Deploy

```bash
vercel
```

## Environment Variables

Your `.env` variables need to be configured in Vercel:

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from your `.env` file:
   - `GITHUB_API=https://api.github.com`
   - `GITHUB_TOKEN=your_token_here`
   - `API_KEY=your_api_key_here`

## How it works

- Your static HTML files are served by Vercel's CDN
- API requests with `{{env.VARIABLE}}` are routed to `/api/htmz-proxy.js`
- The serverless function resolves environment variables server-side
- Your API keys never reach the browser

## Frontend Configuration

Update your htmz configuration for production:

```javascript
// Automatically detects Vercel environment
htmz.proxy.configure({
    url: '/htmz-proxy',  // Routes to Vercel function
    enabled: true
});
```

## Custom Domain

Add your custom domain in the Vercel dashboard, then update CORS settings in `api/htmz-proxy.js` if needed.

## Monitoring

View logs in the Vercel dashboard under **Functions** tab to monitor API requests and debug issues.