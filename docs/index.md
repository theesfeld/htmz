# htmz Documentation

htmz is a high-performance, JSON-powered HTML library that brings modern web interactions to HTML using simple declarative attributes.

## 📖 Table of Contents

### Getting Started
- **[Quick Start Guide](GETTING_STARTED.md)** - Zero to hero in 5 minutes
- **[Installation](../README.md#installation)** - CDN, NPM, and build options

### Core References
- **[Attributes Reference](ATTRIBUTES.md)** - Complete hz-* attributes guide
- **[Template Syntax](TEMPLATES.md)** - Variables, loops, conditionals
- **[JavaScript API](API.md)** - Programmatic interface

### Cookbook
- **[Recipes & Patterns](RECIPES.md)** - Common use cases and solutions
- **[Examples](examples/)** - Working code examples

### Guides
- **[Performance](reference/PERFORMANCE.md)** - Optimization tips
- **[Troubleshooting](reference/TROUBLESHOOTING.md)** - Common issues & fixes
- **[Migration](reference/MIGRATION.md)** - Moving from other libraries
- **[Browser Support](reference/BROWSER_SUPPORT.md)** - Compatibility matrix

## 🚀 Quick Example

```html
<!-- Add htmz to your page -->
<script src="https://unpkg.com/@htmz/htmz@latest/dist/htmz.min.js"></script>

<!-- Make API calls with zero JavaScript -->
<button hz-get="https://api.github.com/users/octocat"
        hz-template="#user-template"
        hz-target="#result">
    Get GitHub User
</button>

<div id="result"></div>

<template id="user-template">
    <div class="user-card">
        <img src="{{avatar_url}}" width="100">
        <h2>{{name}}</h2>
        <p>{{bio}}</p>
        <p>📍 {{location}} • Followers: {{followers}}</p>
    </div>
</template>
```

That's it! No JavaScript coding required.

## 💡 Why htmz?

- **Zero JavaScript Coding** - Pure HTML attributes
- **JSON First** - Built for modern REST APIs
- **High Performance** - Smart caching and DOM morphing
- **Tiny Bundle** - ~15KB minified, zero dependencies
- **Real APIs** - Works with any JSON endpoint

## 🆘 Need Help?

- Check the [Troubleshooting Guide](reference/TROUBLESHOOTING.md)
- Browse [Common Recipes](RECIPES.md)
- Read the [Attributes Reference](ATTRIBUTES.md)

## 📚 Documentation Format

Each documentation page includes:
- ✅ Working examples you can copy-paste
- ✅ Real-world use cases
- ✅ Performance considerations
- ✅ Cross-references to related topics

---

**Next:** Start with the [Getting Started Guide](GETTING_STARTED.md) →