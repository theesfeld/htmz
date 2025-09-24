# Migration Guide to htmz

Moving from other libraries to htmz? This guide shows you exactly how to convert your existing code.

## 📖 Table of Contents

- [From jQuery](#-from-jquery)
- [From Alpine.js](#-from-alpinejs)
- [From Vanilla JavaScript](#-from-vanilla-javascript)
- [From React](#-from-react)
- [From Vue.js](#-from-vuejs)
- [Common Patterns](#-common-patterns)

## 🔄 From jQuery

### Basic AJAX Calls

**jQuery (Before):**
```javascript
// jQuery AJAX
$('#load-users').click(function() {
    $.ajax({
        url: '/api/users',
        method: 'GET',
        success: function(data) {
            var html = '';
            data.users.forEach(function(user) {
                html += '<div class="user">' +
                       '<h3>' + user.name + '</h3>' +
                       '<p>' + user.email + '</p>' +
                       '</div>';
            });
            $('#user-list').html(html);
        },
        error: function() {
            $('#user-list').html('<p>Error loading users</p>');
        }
    });
});
```

**htmz (After):**
```html
<!-- Zero JavaScript required! -->
<button id="load-users"
        hz-get="/api/users"
        hz-template="#user-template"
        hz-target="#user-list">
    Load Users
</button>

<div id="user-list"></div>

<template id="user-template">
    {{#users}}
    <div class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
    </div>
    {{/users}}
</template>
```

### Form Submission

**jQuery (Before):**
```javascript
$('#contact-form').submit(function(e) {
    e.preventDefault();

    var formData = {
        name: $('#name').val(),
        email: $('#email').val(),
        message: $('#message').val()
    };

    $.post('/api/contact', formData)
        .done(function(response) {
            if (response.success) {
                $('#form-result').html('<p class="success">Message sent!</p>');
                $('#contact-form')[0].reset();
            }
        })
        .fail(function() {
            $('#form-result').html('<p class="error">Send failed</p>');
        });
});
```

**htmz (After):**
```html
<form id="contact-form"
      hz-post="/api/contact"
      hz-template="#form-result"
      hz-target="#form-result">
    <input id="name" name="name" required>
    <input id="email" name="email" type="email" required>
    <textarea name="message" required></textarea>
    <button type="submit">Send Message</button>
</form>

<div id="form-result"></div>

<template id="form-result">
    {{?success}}
    <p class="success">Message sent!</p>
    {{/?}}
    {{?error}}
    <p class="error">{{error}}</p>
    {{/?}}
</template>
```

### Live Search

**jQuery (Before):**
```javascript
var searchTimeout;
$('#search-input').on('input', function() {
    var query = $(this).val();

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function() {
        if (query.length > 2) {
            $.get('/api/search?q=' + query)
                .done(function(data) {
                    var html = '';
                    data.results.forEach(function(item) {
                        html += '<div class="result">' + item.title + '</div>';
                    });
                    $('#search-results').html(html);
                });
        }
    }, 300);
});
```

**htmz (After):**
```html
<input id="search-input"
       placeholder="Search..."
       hz-get="/api/search?q={value}"
       hz-template="#search-template"
       hz-target="#search-results"
       hz-trigger="input changed delay:300ms">

<div id="search-results"></div>

<template id="search-template">
    {{#results}}
    <div class="result">{{title}}</div>
    {{/results}}
</template>
```

## ⚡ From Alpine.js

### Component State

**Alpine.js (Before):**
```html
<div x-data="{ users: [], loading: false }">
    <button @click="
        loading = true;
        fetch('/api/users')
            .then(r => r.json())
            .then(data => {
                users = data.users;
                loading = false;
            });
    ">
        Load Users
    </button>

    <div x-show="loading">Loading...</div>

    <template x-for="user in users">
        <div class="user">
            <h3 x-text="user.name"></h3>
            <p x-text="user.email"></p>
        </div>
    </template>
</div>
```

**htmz (After):**
```html
<button hz-get="/api/users"
        hz-template="#user-list"
        hz-target="#user-container"
        hz-indicator="#loading">
    Load Users
</button>

<div id="loading" hidden>Loading...</div>

<div id="user-container"></div>

<template id="user-list">
    {{#users}}
    <div class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
    </div>
    {{/users}}
</template>
```

### Form Handling

**Alpine.js (Before):**
```html
<div x-data="{
    formData: {name: '', email: ''},
    message: '',
    submit() {
        fetch('/api/contact', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(this.formData)
        })
        .then(r => r.json())
        .then(data => {
            this.message = data.success ? 'Sent!' : 'Error';
            this.formData = {name: '', email: ''};
        });
    }
}">
    <form @submit.prevent="submit">
        <input x-model="formData.name" placeholder="Name">
        <input x-model="formData.email" placeholder="Email">
        <button type="submit">Submit</button>
    </form>
    <div x-text="message"></div>
</div>
```

**htmz (After):**
```html
<form hz-post="/api/contact"
      hz-template="#contact-result"
      hz-target="#message">
    <input name="name" placeholder="Name">
    <input name="email" placeholder="Email">
    <button type="submit">Submit</button>
</form>

<div id="message"></div>

<template id="contact-result">
    {{?success}}Sent!{{/?}}
    {{?error}}Error{{/?}}
</template>
```

## 🔧 From Vanilla JavaScript

### Event Handling

**Vanilla JS (Before):**
```javascript
document.getElementById('refresh-btn').addEventListener('click', function() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            const statusEl = document.getElementById('status');
            statusEl.innerHTML = `
                <div class="status-${data.status}">
                    <h3>System Status: ${data.status}</h3>
                    <p>Last updated: ${data.lastUpdated}</p>
                </div>
            `;
        })
        .catch(error => {
            console.error('Status update failed:', error);
        });
});
```

**htmz (After):**
```html
<button id="refresh-btn"
        hz-get="/api/status"
        hz-template="#status-template"
        hz-target="#status">
    Refresh Status
</button>

<div id="status"></div>

<template id="status-template">
    <div class="status-{{status}}">
        <h3>System Status: {{status}}</h3>
        <p>Last updated: {{lastUpdated}}</p>
    </div>
</template>
```

### Dynamic Content Loading

**Vanilla JS (Before):**
```javascript
function loadUserDetails(userId) {
    const container = document.getElementById('user-details');
    container.innerHTML = '<div class="loading">Loading...</div>';

    fetch(`/api/users/${userId}`)
        .then(response => response.json())
        .then(user => {
            container.innerHTML = `
                <div class="user-detail">
                    <img src="${user.avatar}" alt="${user.name}">
                    <h2>${user.name}</h2>
                    <p>${user.bio}</p>
                    <div class="stats">
                        <span>Posts: ${user.postCount}</span>
                        <span>Followers: ${user.followers}</span>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            container.innerHTML = '<div class="error">Failed to load user</div>';
        });
}

// Attach to buttons
document.querySelectorAll('.user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        loadUserDetails(e.target.dataset.userId);
    });
});
```

**htmz (After):**
```html
<div class="user-buttons">
    <button class="user-btn"
            hz-get="/api/users/123"
            hz-template="#user-detail"
            hz-target="#user-details"
            hz-indicator=".loading">
        User 123
    </button>
    <!-- More user buttons... -->
</div>

<div class="loading" hidden>Loading...</div>
<div id="user-details"></div>

<template id="user-detail">
    <div class="user-detail">
        <img src="{{avatar}}" alt="{{name}}">
        <h2>{{name}}</h2>
        <p>{{bio}}</p>
        <div class="stats">
            <span>Posts: {{postCount}}</span>
            <span>Followers: {{followers}}</span>
        </div>
    </div>
</template>
```

## ⚛️ From React

### Component with API Call

**React (Before):**
```jsx
import React, { useState, useEffect } from 'react';

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data.users);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={loadUsers}>Load Users</button>
            {loading && <div>Loading...</div>}
            <div className="user-list">
                {users.map(user => (
                    <div key={user.id} className="user">
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

**htmz (After):**
```html
<button hz-get="/api/users"
        hz-template="#user-list"
        hz-target=".user-list"
        hz-indicator=".loading">
    Load Users
</button>

<div class="loading" hidden>Loading...</div>

<div class="user-list"></div>

<template id="user-list">
    {{#users}}
    <div class="user">
        <h3>{{name}}</h3>
        <p>{{email}}</p>
    </div>
    {{/users}}
</template>
```

### Form with State

**React (Before):**
```jsx
function ContactForm() {
    const [formData, setFormData] = useState({name: '', email: ''});
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            setMessage(result.success ? 'Message sent!' : 'Error occurred');
            setFormData({name: '', email: ''});
        } catch (error) {
            setMessage('Network error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Name"
            />
            <input
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="Email"
            />
            <button type="submit">Submit</button>
            {message && <div className="message">{message}</div>}
        </form>
    );
}
```

**htmz (After):**
```html
<form hz-post="/api/contact"
      hz-template="#form-message"
      hz-target=".message">
    <input name="name" placeholder="Name">
    <input name="email" placeholder="Email">
    <button type="submit">Submit</button>
    <div class="message"></div>
</form>

<template id="form-message">
    {{?success}}Message sent!{{/?}}
    {{?error}}{{error}}{{/?}}
</template>
```

## 🖖 From Vue.js

### Component with Data Binding

**Vue.js (Before):**
```vue
<template>
  <div>
    <button @click="loadPosts">Load Posts</button>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-for="post in posts" :key="post.id" class="post">
      <h3>{{ post.title }}</h3>
      <p>{{ post.excerpt }}</p>
      <div class="meta">
        <span>By {{ post.author }}</span>
        <span>{{ formatDate(post.date) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      posts: [],
      loading: false
    };
  },
  methods: {
    async loadPosts() {
      this.loading = true;
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        this.posts = data.posts;
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    }
  }
};
</script>
```

**htmz (After):**
```html
<button hz-get="/api/posts"
        hz-template="#posts-list"
        hz-target=".posts-container"
        hz-indicator=".loading">
    Load Posts
</button>

<div class="loading" hidden>Loading...</div>

<div class="posts-container"></div>

<template id="posts-list">
    {{#posts}}
    <div class="post">
        <h3>{{title}}</h3>
        <p>{{excerpt}}</p>
        <div class="meta">
            <span>By {{author}}</span>
            <span>{{date}}</span> <!-- Format date server-side -->
        </div>
    </div>
    {{/posts}}
</template>
```

## 🔄 Common Patterns

### Migration Checklist

When migrating to htmz:

1. **✅ Identify AJAX calls** - Convert to `hz-get/post/etc`
2. **✅ Convert DOM manipulation** - Use templates instead
3. **✅ Replace event listeners** - Use `hz-trigger` attributes
4. **✅ Simplify state management** - Let server handle state
5. **✅ Remove build steps** - htmz works directly in browser
6. **✅ Update error handling** - Use template conditionals

### Before/After Summary

| Task | jQuery/React/Vue | htmz |
|------|------------------|------|
| **AJAX calls** | JavaScript functions | HTML attributes |
| **DOM updates** | Manual string building | Templates |
| **Event handling** | Event listeners | `hz-trigger` |
| **State management** | Client-side variables | Server responses |
| **Error handling** | try/catch blocks | Template conditionals |
| **Loading states** | Manual show/hide | `hz-indicator` |

### Performance Impact

**Before (jQuery example):**
- jQuery library: ~87KB
- Custom JavaScript: ~50-100KB
- Total: **~150KB+**

**After (htmz):**
- htmz library: 15KB
- Custom JavaScript: 0KB (for most cases)
- Total: **15KB** (90% reduction!)

### Development Time

**Typical migration results:**
- **jQuery**: 300 lines → 30 HTML attributes
- **React**: 5 components → 5 templates
- **Vue**: Complex SFC → Simple HTML
- **Time saved**: 70-90% less code to write and maintain

## 🚀 Migration Strategy

### Phase 1: Preparation
1. **Audit existing API calls** - List all AJAX requests
2. **Identify reusable patterns** - Common templates you'll need
3. **Plan data structure** - Ensure APIs return appropriate JSON

### Phase 2: Replace Piece by Piece
1. **Start with simple GET requests** - Low risk, high impact
2. **Convert forms next** - POST/PUT requests
3. **Handle complex interactions** - Search, filtering, etc.
4. **Add error states** - Template-based error handling

### Phase 3: Cleanup
1. **Remove unused JavaScript** - Delete old event handlers
2. **Optimize templates** - Consolidate similar patterns
3. **Add progressive enhancement** - Ensure degradation without JS

## 💡 Pro Tips

### Keep What Works
```javascript
// You can still use JavaScript when needed
document.addEventListener('DOMContentLoaded', function() {
    // Initialize htmz with your API keys
    htmz.configure({
        globalHeaders: {
            'Authorization': 'Bearer ' + getApiToken()
        }
    });

    // Custom business logic that doesn't involve DOM/AJAX
    setupAnalytics();
    initializeTheme();
});
```

### Gradual Migration
```html
<!-- Mix old and new approaches during migration -->
<div class="dashboard">
    <!-- New htmz-powered section -->
    <div hz-get="/api/stats" hz-template="#stats">Stats</div>

    <!-- Existing jQuery section (migrate later) -->
    <div id="legacy-chart">Chart placeholder</div>
</div>

<script>
    // Keep existing code working while you migrate
    $('#legacy-chart').loadChart();
</script>
```

### Server-Side Considerations
```javascript
// Optimize your API responses for htmz templates
// Before: Separate endpoints
GET /api/users      → {users: [...]}
GET /api/user-count → {count: 123}

// After: Combined data
GET /api/users → {
  users: [...],
  totalCount: 123,
  hasMore: true
}
```

---

**Ready to migrate?** Start with the [Getting Started Guide](../GETTING_STARTED.md) and use these patterns as reference!