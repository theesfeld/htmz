# htmz Template Syntax

htmz templates transform JSON data into HTML using a simple, powerful syntax. Templates use double-brace notation `{{}}` for all operations.

## 📖 Table of Contents

- [Basic Variables](#-basic-variables)
- [Object Properties](#-object-properties)
- [Conditionals](#-conditionals)
- [Loops & Arrays](#-loops--arrays)
- [Advanced Features](#-advanced-features)
- [Performance Tips](#-performance-tips)
- [Common Patterns](#-common-patterns)

## 🎯 Basic Variables

### Simple Interpolation
Display JSON properties directly in HTML.

**JSON Data:**
```json
{
  "name": "John Doe",
  "age": 30,
  "active": true,
  "balance": 1234.56
}
```

**Template:**
```html
<template id="user-basic">
    <div class="user">
        <h2>{{name}}</h2>
        <p>Age: {{age}}</p>
        <p>Balance: ${{balance}}</p>
        <p>Status: {{active}}</p>
    </div>
</template>
```

**Result:**
```html
<div class="user">
    <h2>John Doe</h2>
    <p>Age: 30</p>
    <p>Balance: $1234.56</p>
    <p>Status: true</p>
</div>
```

### HTML Escaping
Variables are automatically HTML-escaped for security.

**JSON Data:**
```json
{
  "message": "<script>alert('xss')</script>",
  "html": "<strong>Bold Text</strong>"
}
```

**Template:**
```html
<template id="safe-content">
    <p>Message: {{message}}</p>
    <p>HTML: {{html}}</p>
</template>
```

**Result:**
```html
<p>Message: &lt;script&gt;alert('xss')&lt;/script&gt;</p>
<p>HTML: &lt;strong&gt;Bold Text&lt;/strong&gt;</p>
```

## 🏗 Object Properties

### Nested Objects
Access nested properties using dot notation.

**JSON Data:**
```json
{
  "user": {
    "name": "Alice Smith",
    "profile": {
      "bio": "Web developer",
      "avatar": "https://example.com/alice.jpg",
      "social": {
        "twitter": "@alice",
        "github": "alicedev"
      }
    },
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

**Template:**
```html
<template id="nested-user">
    <div class="profile-card">
        <img src="{{user.profile.avatar}}" alt="{{user.name}}">
        <h2>{{user.name}}</h2>
        <p>{{user.profile.bio}}</p>

        <div class="social">
            <a href="https://twitter.com/{{user.profile.social.twitter}}">
                Twitter: {{user.profile.social.twitter}}
            </a>
            <a href="https://github.com/{{user.profile.social.github}}">
                GitHub: {{user.profile.social.github}}
            </a>
        </div>

        <div class="preferences">
            <p>Theme: {{user.preferences.theme}}</p>
            <p>Notifications: {{user.preferences.notifications}}</p>
        </div>
    </div>
</template>
```

### Array Access by Index
Access array elements using dot notation with indices.

**JSON Data:**
```json
{
  "colors": ["red", "green", "blue"],
  "users": [
    {"name": "John", "role": "admin"},
    {"name": "Jane", "role": "user"}
  ]
}
```

**Template:**
```html
<template id="indexed-access">
    <div>
        <p>First color: {{colors.0}}</p>
        <p>Second color: {{colors.1}}</p>
        <p>Third color: {{colors.2}}</p>

        <p>First user: {{users.0.name}} ({{users.0.role}})</p>
        <p>Second user: {{users.1.name}} ({{users.1.role}})</p>

        <p>Total colors: {{colors.length}}</p>
        <p>Total users: {{users.length}}</p>
    </div>
</template>
```

## ❓ Conditionals

### Basic Conditionals
Show/hide content based on data values.

**Syntax:** `{{?condition}}content{{/?}}`

**JSON Data:**
```json
{
  "user": {
    "name": "John Doe",
    "isPremium": true,
    "isActive": false,
    "role": "admin",
    "credits": 150
  }
}
```

**Template:**
```html
<template id="conditional-user">
    <div class="user-card">
        <h2>{{user.name}}</h2>

        {{?user.isPremium}}
        <span class="badge premium">⭐ Premium User</span>
        {{/?}}

        {{?user.isActive}}
        <span class="status active">🟢 Online</span>
        {{/?}}

        {{?user.role}}
        <p>Role: <strong>{{user.role}}</strong></p>
        {{/?}}

        {{?user.credits}}
        <p>Credits: {{user.credits}}</p>
        {{/?}}
    </div>
</template>
```

### Comparison Conditionals
Use comparison operators in conditions.

**Available Operators:**
- `===` - Strict equality
- `!==` - Strict inequality
- `==` - Loose equality
- `!=` - Loose inequality
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal

**Template:**
```html
<template id="comparison-user">
    <div class="user-status">
        <h2>{{user.name}}</h2>

        {{?user.role === 'admin'}}
        <span class="admin-badge">👑 Administrator</span>
        {{/?}}

        {{?user.credits > 100}}
        <span class="rich-user">💰 High Credits</span>
        {{/?}}

        {{?user.credits < 50}}
        <span class="low-credits">⚠️ Low Credits</span>
        {{/?}}

        {{?user.name !== 'Anonymous'}}
        <p>Welcome, {{user.name}}!</p>
        {{/?}}

        {{?user.loginCount >= 10}}
        <span class="veteran">🎖️ Veteran User</span>
        {{/?}}
    </div>
</template>
```

### String Comparisons
Compare string values and check for substrings.

**JSON Data:**
```json
{
  "status": "active",
  "email": "user@gmail.com",
  "plan": "premium-monthly"
}
```

**Template:**
```html
<template id="string-comparisons">
    <div>
        {{?status === 'active'}}
        <span class="active">✅ Account Active</span>
        {{/?}}

        {{?email.includes('@gmail.com')}}
        <span class="gmail">📧 Gmail User</span>
        {{/?}}

        {{?plan.startsWith('premium')}}
        <span class="premium">⭐ Premium Plan</span>
        {{/?}}
    </div>
</template>
```

## 🔄 Loops & Arrays

### Basic Array Iteration
Loop through arrays using `{{#array}}...{{/array}}` syntax.

**JSON Data:**
```json
{
  "users": [
    {"name": "Alice", "email": "alice@example.com", "active": true},
    {"name": "Bob", "email": "bob@example.com", "active": false},
    {"name": "Carol", "email": "carol@example.com", "active": true}
  ]
}
```

**Template:**
```html
<template id="user-list">
    <div class="users">
        <h2>User List ({{users.length}} total)</h2>

        {{#users}}
        <div class="user-item">
            <h3>{{name}}</h3>
            <p>{{email}}</p>
            {{?active}}
            <span class="active">✅ Active</span>
            {{/?}}
        </div>
        {{/users}}
    </div>
</template>
```

### Nested Loops
Handle complex nested data structures.

**JSON Data:**
```json
{
  "categories": [
    {
      "name": "Electronics",
      "products": [
        {"name": "Laptop", "price": 999},
        {"name": "Phone", "price": 699}
      ]
    },
    {
      "name": "Books",
      "products": [
        {"name": "JavaScript Guide", "price": 29},
        {"name": "Design Patterns", "price": 45}
      ]
    }
  ]
}
```

**Template:**
```html
<template id="nested-catalog">
    <div class="catalog">
        {{#categories}}
        <div class="category">
            <h2>{{name}}</h2>
            <div class="products">
                {{#products}}
                <div class="product">
                    <h3>{{name}}</h3>
                    <p class="price">${{price}}</p>
                </div>
                {{/products}}
            </div>
            <p class="category-summary">
                {{products.length}} products in {{name}}
            </p>
        </div>
        {{/categories}}
    </div>
</template>
```

### Conditionals in Loops
Combine loops with conditionals for filtered display.

**Template:**
```html
<template id="filtered-users">
    <div class="user-grid">
        {{#users}}
        {{?active}}
        <div class="user-card active-user">
            <h3>{{name}}</h3>
            <p>{{email}}</p>

            {{?role === 'admin'}}
            <span class="admin-badge">Admin</span>
            {{/?}}

            {{?lastLogin}}
            <small>Last seen: {{lastLogin}}</small>
            {{/?}}
        </div>
        {{/?}}
        {{/users}}
    </div>
</template>
```

### Empty Array Handling
Handle cases where arrays might be empty.

**Template:**
```html
<template id="safe-user-list">
    <div class="user-section">
        <h2>Users</h2>

        {{?users.length > 0}}
        <div class="user-grid">
            {{#users}}
            <div class="user-card">
                <h3>{{name}}</h3>
                <p>{{email}}</p>
            </div>
            {{/users}}
        </div>
        {{/?}}

        {{?users.length === 0}}
        <div class="empty-state">
            <p>No users found.</p>
        </div>
        {{/?}}
    </div>
</template>
```

## ✨ Advanced Features

### Accessing Array Indices
While not directly supported, you can work around this with server-side data preparation.

**JSON Data (server adds index):**
```json
{
  "items": [
    {"name": "First", "index": 0},
    {"name": "Second", "index": 1},
    {"name": "Third", "index": 2}
  ]
}
```

**Template:**
```html
<template id="indexed-list">
    <ol class="indexed-list">
        {{#items}}
        <li data-index="{{index}}">
            {{index + 1}}. {{name}}
            {{?index === 0}}
            <span class="first-item">🥇 First!</span>
            {{/?}}
        </li>
        {{/items}}
    </ol>
</template>
```

### Complex Data Structures
Handle mixed content types and complex nesting.

**JSON Data:**
```json
{
  "page": {
    "title": "Dashboard",
    "widgets": [
      {
        "type": "chart",
        "title": "Sales",
        "data": {"value": 1234, "trend": "up"}
      },
      {
        "type": "list",
        "title": "Recent Orders",
        "items": ["Order #123", "Order #124", "Order #125"]
      },
      {
        "type": "text",
        "title": "Welcome",
        "content": "Welcome to your dashboard!"
      }
    ]
  }
}
```

**Template:**
```html
<template id="dashboard">
    <div class="dashboard">
        <h1>{{page.title}}</h1>

        <div class="widgets">
            {{#page.widgets}}
            <div class="widget widget-{{type}}">
                <h3>{{title}}</h3>

                {{?type === 'chart'}}
                <div class="chart-widget">
                    <div class="chart-value">{{data.value}}</div>
                    <div class="chart-trend trend-{{data.trend}}">
                        {{?data.trend === 'up'}}📈{{/?}}
                        {{?data.trend === 'down'}}📉{{/?}}
                    </div>
                </div>
                {{/?}}

                {{?type === 'list'}}
                <ul class="list-widget">
                    {{#items}}
                    <li>{{.}}</li>
                    {{/items}}
                </ul>
                {{/?}}

                {{?type === 'text'}}
                <div class="text-widget">
                    <p>{{content}}</p>
                </div>
                {{/?}}
            </div>
            {{/page.widgets}}
        </div>
    </div>
</template>
```

## ⚡ Performance Tips

### Template Caching
Templates are automatically cached after first use. For dynamic templates, consider:

```html
<!-- Good: Static template (cached) -->
<template id="user-card">
    <div class="user">{{name}}</div>
</template>

<!-- Less optimal: Inline template (not cached) -->
<button hz-template="<div>{{name}}</div>">Click</button>
```

### Minimize Template Complexity
Keep templates focused and avoid deeply nested conditionals:

```html
<!-- Good: Simple, focused template -->
<template id="user-simple">
    <div class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
        {{?active}}<span class="active">Active</span>{{/?}}
    </div>
</template>

<!-- Less optimal: Overly complex template -->
<template id="user-complex">
    <!-- Many nested conditions and loops -->
</template>
```

### Efficient Conditionals
Use specific conditions rather than multiple checks:

```html
<!-- Good: Specific condition -->
{{?status === 'premium'}}
<span class="premium">Premium User</span>
{{/?}}

<!-- Less optimal: Multiple conditions -->
{{?status}}
{{?status === 'premium'}}
<span class="premium">Premium User</span>
{{/?}}
{{/?}}
```

## 🎨 Common Patterns

### User Profile Cards
```html
<template id="profile-card">
    <div class="profile-card">
        {{?avatar}}
        <img src="{{avatar}}" alt="{{name}}" class="avatar">
        {{/?}}

        <div class="profile-info">
            <h2>{{name}}</h2>

            {{?title}}
            <p class="title">{{title}}</p>
            {{/?}}

            {{?bio}}
            <p class="bio">{{bio}}</p>
            {{/?}}

            <div class="stats">
                {{?followers}}
                <span>{{followers}} followers</span>
                {{/?}}
                {{?following}}
                <span>{{following}} following</span>
                {{/?}}
            </div>
        </div>
    </div>
</template>
```

### Data Tables
```html
<template id="data-table">
    <table class="data-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {{#users}}
            <tr class="{{?active}}active{{/?}}">
                <td>{{name}}</td>
                <td>{{email}}</td>
                <td>
                    {{?active}}
                    <span class="status-active">Active</span>
                    {{/?}}
                    {{?!active}}
                    <span class="status-inactive">Inactive</span>
                    {{/?}}
                </td>
                <td>
                    <button hz-get="/api/users/{{id}}"
                            hz-template="#user-details">View</button>
                    <button hz-delete="/api/users/{{id}}"
                            hz-confirm="Delete {{name}}?">Delete</button>
                </td>
            </tr>
            {{/users}}
        </tbody>
    </table>
</template>
```

### Card Grids
```html
<template id="product-grid">
    <div class="product-grid">
        {{#products}}
        <div class="product-card">
            {{?images.0}}
            <img src="{{images.0}}" alt="{{name}}" class="product-image">
            {{/?}}

            <div class="product-info">
                <h3>{{name}}</h3>
                <p class="description">{{description}}</p>

                <div class="price-section">
                    {{?salePrice}}
                    <span class="price sale">${{salePrice}}</span>
                    <span class="price original">${{originalPrice}}</span>
                    {{/?}}
                    {{?!salePrice}}
                    <span class="price">${{price}}</span>
                    {{/?}}
                </div>

                {{?inStock}}
                <button class="add-to-cart">Add to Cart</button>
                {{/?}}
                {{?!inStock}}
                <button class="out-of-stock" disabled>Out of Stock</button>
                {{/?}}
            </div>
        </div>
        {{/products}}
    </div>
</template>
```

## 🚫 Limitations & Workarounds

### No Math Operations
Templates don't support math. Prepare data server-side:

```javascript
// Server-side calculation
const data = {
  price: 100,
  tax: 8.5,
  total: 108.5  // Calculate server-side
};
```

### No Custom Functions
Use server-side data transformation:

```javascript
// Server-side formatting
const data = {
  date: "2025-01-15",
  formattedDate: "January 15, 2025"  // Format server-side
};
```

### No Variable Assignment
Use nested object structure instead:

```json
{
  "user": {...},
  "computed": {
    "fullName": "John Doe",
    "isVip": true
  }
}
```

## 🔗 See Also

- [Attributes Reference](ATTRIBUTES.md) - All htmz attributes
- [Getting Started](GETTING_STARTED.md) - Basic tutorial
- [Recipes](RECIPES.md) - Common patterns
- [JavaScript API](API.md) - Programmatic templating

---

**Next:** Explore [JavaScript API](API.md) →