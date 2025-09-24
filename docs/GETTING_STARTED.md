# Getting Started with htmz

htmz lets you build modern web applications using only HTML attributes. No JavaScript coding required!

## 🚀 Quick Setup

### Option 1: CDN (Fastest)
```html
<script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>
```

### Option 2: NPM
```bash
npm install @htmz/htmz
```

### Option 3: Download
Download `htmz.js` from [GitHub releases](https://github.com/willtheesfeld/htmz/releases)

## 📚 Core Concepts

htmz works with **four simple concepts**:

1. **Request Attributes** - `hz-get`, `hz-post`, etc. make API calls
2. **Templates** - `hz-template` defines how JSON becomes HTML
3. **Targets** - `hz-target` says where to put the result
4. **Triggers** - `hz-trigger` controls when it happens

## 🎯 Your First htmz App

Let's build a GitHub user viewer in 5 minutes!

### Step 1: Basic HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First htmz App</title>
    <script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>
</head>
<body>
    <h1>GitHub User Lookup</h1>

    <!-- We'll add htmz magic here -->

</body>
</html>
```

### Step 2: Add a Button with htmz
```html
<button hz-get="https://api.github.com/users/octocat"
        hz-template="#user-template"
        hz-target="#result">
    Get GitHub User
</button>

<div id="result"></div>
```

**What this does:**
- `hz-get` - Makes GET request to GitHub API
- `hz-template` - Uses template with ID "user-template"
- `hz-target` - Puts result in element with ID "result"

### Step 3: Create a Template
```html
<template id="user-template">
    <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 8px;">
        <img src="{{avatar_url}}" width="100" style="border-radius: 50%;">
        <h2>{{name}}</h2>
        <p><strong>Username:</strong> {{login}}</p>
        <p><strong>Bio:</strong> {{bio}}</p>
        <p><strong>Followers:</strong> {{followers}} | <strong>Following:</strong> {{following}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <a href="{{html_url}}" target="_blank">View on GitHub</a>
    </div>
</template>
```

**How templates work:**
- `{{property}}` displays JSON properties
- GitHub API returns JSON like `{"login": "octocat", "name": "The Octocat", ...}`
- htmz automatically replaces `{{login}}` with the actual value

### Step 4: Complete Working Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub User Lookup</title>
    <script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>
    <style>
        body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; }
        button { padding: 12px 24px; background: #0969da; color: white; border: none; border-radius: 6px; cursor: pointer; }
        button:hover { background: #0860ca; }
        .user-card { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
        .user-card img { border-radius: 50%; }
    </style>
</head>
<body>
    <h1>GitHub User Lookup</h1>

    <button hz-get="https://api.github.com/users/octocat"
            hz-template="#user-template"
            hz-target="#result">
        Get Octocat
    </button>

    <button hz-get="https://api.github.com/users/torvalds"
            hz-template="#user-template"
            hz-target="#result">
        Get Torvalds
    </button>

    <div id="result"></div>

    <template id="user-template">
        <div class="user-card">
            <img src="{{avatar_url}}" width="100">
            <h2>{{name}}</h2>
            <p><strong>@{{login}}</strong></p>
            <p>{{bio}}</p>
            <p>📍 {{location}} | 👥 {{followers}} followers</p>
            <p>📚 {{public_repos}} repos | Joined {{created_at}}</p>
            <a href="{{html_url}}" target="_blank">View on GitHub →</a>
        </div>
    </template>
</body>
</html>
```

🎉 **Congratulations!** You just built a working web app that calls real APIs without writing any JavaScript!

## 🔄 Adding Interactivity

### Live Search
Let's add a search box that updates as you type:

```html
<input type="text"
       placeholder="Enter GitHub username..."
       hz-get="https://api.github.com/users/{value}"
       hz-template="#user-template"
       hz-target="#result"
       hz-trigger="input changed delay:500ms">
```

**New concepts:**
- `{value}` gets replaced with input value
- `hz-trigger="input changed delay:500ms"` waits 500ms after typing stops
- `changed` ensures it only fires when value actually changes

### Form Submission
Handle form data as JSON:

```html
<form hz-post="https://httpbin.org/post"
      hz-template="#form-result"
      hz-target="#form-output">
    <input name="name" placeholder="Your name" required>
    <input name="email" type="email" placeholder="Email" required>
    <button type="submit">Submit</button>
</form>

<div id="form-output"></div>

<template id="form-result">
    <div style="background: #d4edda; padding: 1rem; border-radius: 4px;">
        <h3>Form submitted!</h3>
        <p><strong>Name:</strong> {{json.name}}</p>
        <p><strong>Email:</strong> {{json.email}}</p>
    </div>
</template>
```

## 📊 Working with Arrays

Many APIs return arrays. Here's how to handle them:

### API Response:
```json
{
  "users": [
    {"name": "John", "email": "john@example.com"},
    {"name": "Jane", "email": "jane@example.com"}
  ]
}
```

### Template:
```html
<template id="users-list">
    <h2>Found {{users.length}} users:</h2>
    {{#users}}
    <div style="border: 1px solid #eee; padding: 0.5rem; margin: 0.5rem 0;">
        <strong>{{name}}</strong> - {{email}}
    </div>
    {{/users}}
</template>
```

**Array syntax:**
- `{{#users}}...{{/users}}` loops through array
- Inside loop, access properties directly: `{{name}}`, `{{email}}`
- `{{users.length}}` shows array length

## ✨ Conditional Content

Show/hide content based on data:

```html
<template id="user-with-conditions">
    <div class="user-card">
        <h2>{{name}}</h2>

        {{?bio}}
        <p><em>{{bio}}</em></p>
        {{/?}}

        {{?public_repos > 10}}
        <span style="background: gold; padding: 2px 8px; border-radius: 12px;">
            🌟 Active Developer
        </span>
        {{/?}}

        {{?followers > 1000}}
        <span style="background: purple; color: white; padding: 2px 8px; border-radius: 12px;">
            🚀 Popular
        </span>
        {{/?}}
    </div>
</template>
```

**Conditional syntax:**
- `{{?property}}...{{/?}}` shows content if property exists and is truthy
- `{{?followers > 1000}}...{{/?}}` shows content if condition is true

## 🎨 Styling and UX

### Loading States
Show spinner during requests:

```html
<button hz-get="https://api.github.com/users/octocat"
        hz-template="#user-template"
        hz-target="#result"
        hz-indicator="#loading">
    Get User
</button>

<div id="loading" hidden>⏳ Loading...</div>
```

### Swap Strategies
Control how content is inserted:

```html
<!-- Replace content (default) -->
<button hz-get="/api/users" hz-swap="innerHTML">Replace</button>

<!-- Add to existing content -->
<button hz-get="/api/users" hz-swap="append">Add to End</button>

<!-- Add to beginning -->
<button hz-get="/api/users" hz-swap="prepend">Add to Start</button>

<!-- Replace entire element -->
<button hz-get="/api/users" hz-swap="outerHTML">Replace Element</button>
```

## 🔧 Common Patterns

### 1. Auto-refresh Dashboard
```html
<div hz-get="/api/stats"
     hz-template="#stats"
     hz-target="this"
     hz-trigger="load, every 30s">
</div>
```

### 2. Infinite Scroll
```html
<div hz-get="/api/posts?page=2"
     hz-template="#posts"
     hz-target="#post-list"
     hz-swap="append"
     hz-trigger="revealed">
    Loading more...
</div>
```

### 3. Confirmation Dialogs
```html
<button hz-delete="/api/users/123"
        hz-confirm="Are you sure you want to delete this user?"
        hz-target="closest .user-row"
        hz-swap="delete">
    Delete User
</button>
```

## 🛠 JavaScript API (Optional)

While htmz works purely with HTML, you can also use JavaScript when needed:

```javascript
// Manual requests
htmz.get('/api/users/123').then(user => console.log(user));

// Render templates programmatically
htmz.render('#user-template', userData, '#target');

// Trigger elements
htmz.trigger('#my-button', 'click');

// Configure globally
htmz.configure({
    defaultSwap: 'innerHTML',
    globalHeaders: {'Authorization': 'Bearer token'}
});
```

## 📝 Next Steps

Now that you understand the basics:

1. **Explore [Attributes Reference](ATTRIBUTES.md)** - Learn all available options
2. **Study [Template Syntax](TEMPLATES.md)** - Master advanced templating
3. **Browse [Recipes](RECIPES.md)** - Common patterns and solutions
4. **Check [Examples](examples/)** - More working examples

## 💡 Key Takeaways

✅ **Zero JavaScript** required for most use cases
✅ **Four core attributes** handle 90% of scenarios
✅ **Real APIs** work out of the box
✅ **Progressive enhancement** - works without JS, better with it
✅ **Declarative** - everything visible in HTML

---

**Ready to build?** Check out the [Recipes](RECIPES.md) for common patterns →