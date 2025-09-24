#!/usr/bin/env node

/*
 * create-htmz-app - Create htmz apps with zero configuration
 * Copyright (C) 2025 William Theesfeld <william@theesfeld.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectName = process.argv[2];

if (!projectName) {
    console.log('');
    console.log('🚀 Create htmz App');
    console.log('');
    console.log('Usage:');
    console.log('  npm create @htmz/htmz-app <project-name>');
    console.log('  npx @htmz/create-htmz-app <project-name>');
    console.log('');
    console.log('Example:');
    console.log('  npm create @htmz/htmz-app my-dashboard');
    console.log('');
    process.exit(1);
}

// Validate project name
const validName = /^[a-zA-Z0-9\-_]+$/.test(projectName);
if (!validName) {
    console.error(`❌ Invalid project name: ${projectName}`);
    console.error('Project name can only contain letters, numbers, hyphens, and underscores');
    process.exit(1);
}

const projectDir = path.resolve(projectName);

// Check if directory already exists
if (fs.existsSync(projectDir)) {
    console.error(`❌ Directory '${projectName}' already exists`);
    process.exit(1);
}

console.log('');
console.log('🚀 Creating htmz app...');
console.log('');

try {
    // Create project directory
    fs.mkdirSync(projectDir, { recursive: true });
    console.log(`📁 Created directory: ${projectName}`);

    // Create package.json
    const packageJson = {
        name: projectName,
        version: '0.1.0',
        description: 'An htmz application',
        scripts: {
            dev: 'htmz dev',
            start: 'htmz serve',
            proxy: 'htmz proxy'
        },
        dependencies: {
            '@htmz/htmz': '^1.0.2'
        }
    };

    fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ Created package.json');

    // Create .env.example
    const envExample = `# htmz Environment Variables
# Copy this file to .env and add your actual API keys

# GitHub API Example
GITHUB_API=https://api.github.com
GITHUB_TOKEN=your_github_personal_access_token_here
DEFAULT_USER=octocat

# General API Configuration
API_BASE=https://your-api.com/api/v1
API_KEY=your_api_key_here
AUTH_TOKEN=your_auth_token_here

# Configuration
NODE_ENV=development
DEBUG=true

# Example usage in HTML:
# <button hz-get="{{env.GITHUB_API}}/users/{{env.DEFAULT_USER}}">Get User</button>
# <form hz-headers='{"Authorization": "Bearer {{env.AUTH_TOKEN}}"}'>
`;

    fs.writeFileSync(path.join(projectDir, '.env.example'), envExample);
    console.log('✅ Created .env.example');

    // Create .gitignore
    const gitignore = `.env
node_modules/
*.log
.DS_Store
dist/
`;

    fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignore);
    console.log('✅ Created .gitignore');

    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} | htmz App</title>
    <script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
            line-height: 1.6;
            color: #333;
        }

        .hero {
            text-align: center;
            margin: 3rem 0;
        }

        .hero h1 {
            font-size: 2.5rem;
            margin: 0 0 0.5rem 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .examples {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }

        .card {
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 1.5rem;
            background: #f8f9fa;
        }

        .card h3 {
            margin: 0 0 1rem 0;
            color: #495057;
        }

        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.2s;
        }

        button:hover {
            background: #0056b3;
        }

        button:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }

        .result {
            margin-top: 1rem;
            padding: 1rem;
            background: white;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            min-height: 2rem;
        }

        .user-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: white;
            border-radius: 6px;
            border: 1px solid #e1e5e9;
        }

        .user-card img {
            border-radius: 50%;
        }

        .user-info h4 {
            margin: 0 0 0.5rem 0;
            color: #333;
        }

        .user-info p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
        }

        code {
            background: #f8f9fa;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            font-size: 0.85rem;
        }

        .status {
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
        }

        .status.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .status.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>🚀 ${projectName}</h1>
        <p>Welcome to your new htmz application!</p>
        <p><strong>JSON APIs → Beautiful HTML</strong> with zero JavaScript coding</p>
    </div>

    <div class="examples">
        <div class="card">
            <h3>📊 Public API Example</h3>
            <p>Fetch data from public APIs without any configuration:</p>

            <button hz-get="https://api.github.com/users/octocat"
                    hz-template="#user-template"
                    hz-target="#public-result">
                Load GitHub User
            </button>

            <div id="public-result" class="result"></div>
        </div>

        <div class="card">
            <h3>🔐 Environment Variables Example</h3>
            <p>Use environment variables for secure API integration:</p>
            <p><small>Requires <code>htmz dev</code> and .env file</small></p>

            <button hz-get="{{env.GITHUB_API}}/users/{{env.DEFAULT_USER}}"
                    hz-headers='{"User-Agent": "${projectName}-app"}'
                    hz-template="#user-template"
                    hz-target="#env-result">
                Load with Environment Variables
            </button>

            <div id="env-result" class="result"></div>
        </div>

        <div class="card">
            <h3>🎯 Interactive Form Example</h3>
            <p>Submit forms and handle responses:</p>

            <form hz-post="https://httpbin.org/post"
                  hz-template="#form-response-template"
                  hz-target="#form-result">
                <input name="username" placeholder="Enter username" required>
                <input name="email" type="email" placeholder="Enter email" required>
                <button type="submit">Submit Form</button>
            </form>

            <div id="form-result" class="result"></div>
        </div>
    </div>

    <!-- Templates -->
    <template id="user-template">
        <div class="user-card">
            <img src="{{avatar_url}}" width="60" alt="{{name}}">
            <div class="user-info">
                <h4>{{name}} (@{{login}})</h4>
                <p>{{bio}}</p>
                <p>📍 {{location}} • 👥 {{followers}} followers • 📦 {{public_repos}} repos</p>
            </div>
        </div>
    </template>

    <template id="form-response-template">
        <div class="status success">
            <h4>✅ Form Submitted Successfully</h4>
            <p><strong>Username:</strong> {{form.username}}</p>
            <p><strong>Email:</strong> {{form.email}}</p>
            <p><small>Response from: {{url}}</small></p>
        </div>
    </template>

    <footer style="text-align: center; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e1e5e9;">
        <p>
            <strong>Next Steps:</strong><br>
            1. Copy <code>.env.example</code> to <code>.env</code> and add your API keys<br>
            2. Run <code>npm run dev</code> to start the development server<br>
            3. Check out the <a href="https://github.com/willtheesfeld/htmz" target="_blank">htmz documentation</a>
        </p>
    </footer>
</body>
</html>`;

    fs.writeFileSync(path.join(projectDir, 'index.html'), indexHtml);
    console.log('✅ Created index.html');

    // Create README.md
    const readme = `# ${projectName}

An [htmz](https://github.com/willtheesfeld/htmz) application.

## Getting Started

### 1. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set up environment variables

\`\`\`bash
cp .env.example .env
# Edit .env and add your API keys
\`\`\`

### 3. Start the development server

\`\`\`bash
npm run dev
\`\`\`

This starts both the web server and the secure proxy server. Open [http://localhost:8000](http://localhost:8000) to view your app.

## Available Scripts

- \`npm run dev\` - Start development server (web + proxy)
- \`npm run start\` - Start web server only
- \`npm run proxy\` - Start proxy server only

## Environment Variables

htmz uses environment variables to securely handle API keys and configuration:

\`\`\`html
<!-- Use {{env.VARIABLE}} in your HTML -->
<button hz-get="{{env.API_BASE}}/users/{{env.DEFAULT_USER}}"
        hz-headers='{"Authorization": "Bearer {{env.API_KEY}}"}'>
    Load Data
</button>
\`\`\`

Environment variables are resolved server-side by the htmz proxy, keeping your API keys secure.

## Learn More

- [htmz Documentation](https://github.com/willtheesfeld/htmz)
- [Security Guide](https://github.com/willtheesfeld/htmz/blob/main/docs/SECURITY.md)
- [Recipe Book](https://github.com/willtheesfeld/htmz/blob/main/docs/RECIPES.md)

## Deployment

### Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify

\`\`\`bash
npm install -g netlify-cli
netlify deploy
\`\`\`

### Docker

\`\`\`bash
docker build -t ${projectName} .
docker run -p 8000:8000 ${projectName}
\`\`\`

See the [deployment guide](https://github.com/willtheesfeld/htmz#deployment) for more options.
`;

    fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
    console.log('✅ Created README.md');

    console.log('');
    console.log('🎉 Success! Created htmz app at ' + projectDir);
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  cp .env.example .env');
    console.log('  npm run dev');
    console.log('');
    console.log('Happy coding! 🚀');
    console.log('');

} catch (error) {
    console.error(`❌ Failed to create project: ${error.message}`);

    // Clean up on failure
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
    }

    process.exit(1);
}