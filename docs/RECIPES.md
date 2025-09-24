# htmz Recipe Book

Copy-paste ready solutions for common web development patterns. All examples use real APIs where possible.

## 📖 Table of Contents

- [🔍 Search & Filtering](#-search--filtering)
- [📋 Forms & Validation](#-forms--validation)
- [🛒 Shopping & E-commerce](#-shopping--e-commerce)
- [💬 Chat & Messaging](#-chat--messaging)
- [📊 Data Visualization](#-data-visualization)
- [🔄 Auto-refresh & Live Data](#-auto-refresh--live-data)
- [🎨 UI Patterns](#-ui-patterns)
- [🔐 Authentication](#-authentication)
- [📱 Mobile Patterns](#-mobile-patterns)

## 🔍 Search & Filtering

### Live Search with Debouncing
Search that updates as you type with smart delays.

```html
<!-- Live GitHub user search -->
<div class="search-container">
    <input type="text"
           placeholder="Search GitHub users..."
           hz-get="https://api.github.com/search/users?q={value}"
           hz-template="#user-search-results"
           hz-target="#search-results"
           hz-trigger="input changed delay:500ms"
           hz-indicator="#search-loading">

    <div id="search-loading" hidden>🔍 Searching...</div>
    <div id="search-results"></div>
</div>

<template id="user-search-results">
    {{?items.length > 0}}
    <div class="search-results">
        <h3>Found {{total_count}} users</h3>
        {{#items}}
        <div class="user-result">
            <img src="{{avatar_url}}" width="40" alt="{{login}}">
            <div>
                <strong>{{login}}</strong>
                {{?name}}<br><em>{{name}}</em>{{/?}}
            </div>
            <a href="{{html_url}}" target="_blank">View →</a>
        </div>
        {{/items}}
    </div>
    {{/?}}

    {{?items.length === 0}}
    <div class="no-results">
        <p>No users found. Try a different search term.</p>
    </div>
    {{/?}}
</template>
```

### Faceted Search with Filters
Multi-filter search interface.

```html
<div class="search-interface">
    <form class="search-filters" hz-get="/api/products/search"
          hz-template="#product-results"
          hz-target="#results"
          hz-trigger="change, submit">

        <input name="q" placeholder="Search products...">

        <select name="category">
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books</option>
            <option value="clothing">Clothing</option>
        </select>

        <select name="sort">
            <option value="relevance">Relevance</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest First</option>
        </select>

        <label>
            <input type="checkbox" name="in_stock" value="true">
            In Stock Only
        </label>

        <button type="submit">Search</button>
    </form>

    <div id="results"></div>
</div>
```

### Autocomplete Dropdown
Smart autocomplete with keyboard navigation.

```html
<div class="autocomplete-container">
    <input type="text"
           id="city-search"
           placeholder="Enter city name..."
           hz-get="/api/cities?q={value}"
           hz-template="#city-suggestions"
           hz-target="#suggestions"
           hz-trigger="input changed delay:200ms"
           autocomplete="off">

    <div id="suggestions" class="suggestions-dropdown"></div>
</div>

<template id="city-suggestions">
    {{?cities.length > 0}}
    <div class="suggestions-list">
        {{#cities}}
        <div class="suggestion-item"
             onclick="document.getElementById('city-search').value='{{name}}'; this.parentElement.parentElement.innerHTML=''">
            <strong>{{name}}</strong>
            <small>{{state}}, {{country}}</small>
        </div>
        {{/cities}}
    </div>
    {{/?}}
</template>
```

## 📋 Forms & Validation

### Real-time Form Validation
Validate fields as user types.

```html
<form class="signup-form" hz-post="/api/register"
      hz-template="#registration-result"
      hz-target="#form-result">

    <div class="field">
        <label>Username</label>
        <input name="username"
               required
               hz-get="/api/check-username?username={value}"
               hz-template="#username-validation"
               hz-target="#username-status"
               hz-trigger="blur changed delay:300ms">
        <div id="username-status"></div>
    </div>

    <div class="field">
        <label>Email</label>
        <input name="email"
               type="email"
               required
               hz-get="/api/check-email?email={value}"
               hz-template="#email-validation"
               hz-target="#email-status"
               hz-trigger="blur changed">
        <div id="email-status"></div>
    </div>

    <div class="field">
        <label>Password</label>
        <input name="password"
               type="password"
               required
               hz-get="/api/check-password-strength"
               hz-template="#password-strength"
               hz-target="#password-status"
               hz-trigger="input delay:100ms">
        <div id="password-status"></div>
    </div>

    <button type="submit">Create Account</button>
    <div id="form-result"></div>
</form>

<template id="username-validation">
    {{?available}}
    <span class="validation-success">✅ Username available</span>
    {{/?}}
    {{?!available}}
    <span class="validation-error">❌ Username already taken</span>
    {{/?}}
</template>

<template id="email-validation">
    {{?valid}}
    <span class="validation-success">✅ Email format valid</span>
    {{/?}}
    {{?!valid}}
    <span class="validation-error">❌ Please enter a valid email</span>
    {{/?}}
</template>

<template id="password-strength">
    <div class="password-strength">
        <div class="strength-bar strength-{{level}}">
            <div class="strength-fill"></div>
        </div>
        <span class="strength-text">{{description}}</span>
    </div>
</template>
```

### Multi-step Form
Wizard-style form with progress tracking.

```html
<div class="multi-step-form">
    <div class="progress-bar">
        <div class="step active" data-step="1">Personal Info</div>
        <div class="step" data-step="2">Address</div>
        <div class="step" data-step="3">Payment</div>
        <div class="step" data-step="4">Confirmation</div>
    </div>

    <form id="checkout-form" hz-post="/api/checkout"
          hz-template="#checkout-result"
          hz-target="#form-container">

        <div class="form-step active" data-step="1">
            <h2>Personal Information</h2>
            <input name="firstName" placeholder="First Name" required>
            <input name="lastName" placeholder="Last Name" required>
            <input name="email" type="email" placeholder="Email" required>
            <button type="button" onclick="showStep(2)">Next →</button>
        </div>

        <div class="form-step" data-step="2">
            <h2>Shipping Address</h2>
            <input name="address" placeholder="Street Address" required>
            <input name="city" placeholder="City" required>
            <input name="zipCode" placeholder="ZIP Code" required>
            <button type="button" onclick="showStep(1)">← Back</button>
            <button type="button" onclick="showStep(3)">Next →</button>
        </div>

        <div class="form-step" data-step="3">
            <h2>Payment Details</h2>
            <input name="cardNumber" placeholder="Card Number" required>
            <input name="expiryDate" placeholder="MM/YY" required>
            <input name="cvv" placeholder="CVV" required>
            <button type="button" onclick="showStep(2)">← Back</button>
            <button type="submit">Complete Order</button>
        </div>
    </form>

    <div id="form-container"></div>
</div>
```

## 🛒 Shopping & E-commerce

### Shopping Cart with Live Updates
Add/remove items with automatic total calculation.

```html
<div class="product-list">
    <!-- Product cards -->
    <div class="product-card" data-id="1">
        <h3>Laptop</h3>
        <p>Price: $999</p>
        <button hz-post="/api/cart/add"
                hz-params='{"productId": 1, "name": "Laptop", "price": 999}'
                hz-template="#cart-update"
                hz-target="#cart-sidebar"
                hz-indicator="this">
            Add to Cart
        </button>
    </div>

    <div class="product-card" data-id="2">
        <h3>Mouse</h3>
        <p>Price: $29</p>
        <button hz-post="/api/cart/add"
                hz-params='{"productId": 2, "name": "Mouse", "price": 29}'
                hz-template="#cart-update"
                hz-target="#cart-sidebar">
            Add to Cart
        </button>
    </div>
</div>

<!-- Cart Sidebar -->
<div id="cart-sidebar" class="cart-sidebar">
    <div hz-get="/api/cart"
         hz-template="#cart-update"
         hz-trigger="load">
    </div>
</div>

<template id="cart-update">
    <div class="cart-content">
        <h3>Shopping Cart ({{items.length}} items)</h3>

        {{?items.length > 0}}
        <div class="cart-items">
            {{#items}}
            <div class="cart-item">
                <div class="item-info">
                    <strong>{{name}}</strong>
                    <span class="price">${{price}}</span>
                </div>

                <div class="quantity-controls">
                    <button hz-patch="/api/cart/items/{{id}}"
                            hz-params='{"quantity": {{quantity - 1}}}'
                            hz-template="#cart-update"
                            hz-target="#cart-sidebar">-</button>

                    <span class="quantity">{{quantity}}</span>

                    <button hz-patch="/api/cart/items/{{id}}"
                            hz-params='{"quantity": {{quantity + 1}}}'
                            hz-template="#cart-update"
                            hz-target="#cart-sidebar">+</button>

                    <button hz-delete="/api/cart/items/{{id}}"
                            hz-template="#cart-update"
                            hz-target="#cart-sidebar"
                            hz-confirm="Remove {{name}} from cart?">🗑️</button>
                </div>
            </div>
            {{/items}}
        </div>

        <div class="cart-total">
            <p><strong>Total: ${{total}}</strong></p>
            <button class="checkout-btn"
                    hz-post="/api/checkout"
                    hz-template="#checkout-form"
                    hz-target="#main-content">
                Proceed to Checkout
            </button>
        </div>
        {{/?}}

        {{?items.length === 0}}
        <div class="empty-cart">
            <p>Your cart is empty</p>
        </div>
        {{/?}}
    </div>
</template>
```

### Wishlist Toggle
Save/unsave items to wishlist.

```html
<div class="product-grid">
    <div class="product-card">
        <img src="product1.jpg" alt="Product 1">
        <h3>Wireless Headphones</h3>
        <p>$199</p>

        <button class="wishlist-toggle"
                hz-post="/api/wishlist/toggle"
                hz-params='{"productId": 123}'
                hz-template="#wishlist-status"
                hz-target="this"
                data-product-id="123">
            <span hz-get="/api/wishlist/status/123"
                  hz-template="#wishlist-status"
                  hz-target="this"
                  hz-trigger="load">❤️</span>
        </button>
    </div>
</div>

<template id="wishlist-status">
    {{?inWishlist}}
    <span class="in-wishlist">💖 Saved</span>
    {{/?}}
    {{?!inWishlist}}
    <span class="not-in-wishlist">🤍 Save</span>
    {{/?}}
</template>
```

## 💬 Chat & Messaging

### Real-time Chat Interface
Live chat with auto-scroll and typing indicators.

```html
<div class="chat-container">
    <div class="chat-header">
        <h3>Support Chat</h3>
        <div id="typing-indicator"></div>
    </div>

    <div id="chat-messages"
         class="chat-messages"
         hz-get="/api/chat/messages"
         hz-template="#chat-history"
         hz-trigger="load">
    </div>

    <form class="chat-input" hz-post="/api/chat/send"
          hz-template="#new-message"
          hz-target="#chat-messages"
          hz-swap="append">

        <input name="message"
               placeholder="Type a message..."
               required
               hz-post="/api/chat/typing"
               hz-trigger="input throttle:1000ms">

        <button type="submit">Send</button>
    </form>
</div>

<!-- Auto-refresh messages -->
<div hz-get="/api/chat/messages/new"
     hz-template="#new-messages"
     hz-target="#chat-messages"
     hz-swap="append"
     hz-trigger="every 2s"
     style="display: none;">
</div>

<template id="chat-history">
    {{#messages}}
    <div class="message {{?isOwnMessage}}own-message{{/?}}">
        <div class="message-content">{{content}}</div>
        <div class="message-time">{{timestamp}}</div>
    </div>
    {{/messages}}
</template>

<template id="new-message">
    <div class="message own-message">
        <div class="message-content">{{content}}</div>
        <div class="message-time">{{timestamp}}</div>
    </div>
</template>
```

### Comment System with Replies
Nested comments with threaded replies.

```html
<div class="comments-section">
    <form class="new-comment-form" hz-post="/api/posts/123/comments"
          hz-template="#comment-item"
          hz-target="#comments-list"
          hz-swap="prepend">

        <textarea name="content" placeholder="Add a comment..." required></textarea>
        <button type="submit">Post Comment</button>
    </form>

    <div id="comments-list"
         hz-get="/api/posts/123/comments"
         hz-template="#comments-list"
         hz-trigger="load">
    </div>
</div>

<template id="comments-list">
    {{#comments}}
    <div class="comment" id="comment-{{id}}">
        <div class="comment-header">
            <img src="{{author.avatar}}" alt="{{author.name}}" class="avatar">
            <span class="author">{{author.name}}</span>
            <span class="timestamp">{{createdAt}}</span>
        </div>

        <div class="comment-content">{{content}}</div>

        <div class="comment-actions">
            <button class="like-btn"
                    hz-post="/api/comments/{{id}}/like"
                    hz-template="#like-update"
                    hz-target="#like-count-{{id}}">
                👍 <span id="like-count-{{id}}">{{likeCount}}</span>
            </button>

            <button class="reply-btn" onclick="toggleReplyForm({{id}})">
                Reply
            </button>
        </div>

        <form class="reply-form" id="reply-form-{{id}}" style="display: none;"
              hz-post="/api/comments/{{id}}/replies"
              hz-template="#comment-item"
              hz-target="#replies-{{id}}"
              hz-swap="append">

            <textarea name="content" placeholder="Write a reply..." required></textarea>
            <button type="submit">Reply</button>
        </form>

        <div class="replies" id="replies-{{id}}">
            {{#replies}}
            <div class="reply">
                <img src="{{author.avatar}}" alt="{{author.name}}" class="avatar small">
                <div class="reply-content">
                    <strong>{{author.name}}</strong>
                    <p>{{content}}</p>
                    <small>{{createdAt}}</small>
                </div>
            </div>
            {{/replies}}
        </div>
    </div>
    {{/comments}}
</template>
```

## 📊 Data Visualization

### Live Dashboard with Charts
Auto-refreshing dashboard with multiple widgets.

```html
<div class="dashboard">
    <h1>Sales Dashboard</h1>

    <div class="dashboard-grid">
        <!-- KPI Cards -->
        <div class="kpi-card"
             hz-get="/api/dashboard/revenue"
             hz-template="#revenue-kpi"
             hz-trigger="load, every 30s">
        </div>

        <div class="kpi-card"
             hz-get="/api/dashboard/orders"
             hz-template="#orders-kpi"
             hz-trigger="load, every 30s">
        </div>

        <!-- Chart Widget -->
        <div class="chart-widget"
             hz-get="/api/dashboard/sales-chart"
             hz-template="#sales-chart"
             hz-trigger="load, every 60s">
        </div>

        <!-- Recent Activity -->
        <div class="activity-widget"
             hz-get="/api/dashboard/activity"
             hz-template="#recent-activity"
             hz-trigger="load, every 15s">
        </div>
    </div>
</div>

<template id="revenue-kpi">
    <div class="kpi-content">
        <h3>Revenue</h3>
        <div class="kpi-value">${{value}}</div>
        <div class="kpi-trend trend-{{trend}}">
            {{?trend === 'up'}}↗️{{/?}}
            {{?trend === 'down'}}↘️{{/?}}
            {{change}}%
        </div>
    </div>
</template>

<template id="orders-kpi">
    <div class="kpi-content">
        <h3>Orders Today</h3>
        <div class="kpi-value">{{count}}</div>
        <div class="kpi-change">{{change}} from yesterday</div>
    </div>
</template>

<template id="sales-chart">
    <div class="chart-container">
        <h3>Sales Trend</h3>
        <div class="simple-chart">
            {{#dataPoints}}
            <div class="chart-bar"
                 style="height: {{percentage}}%"
                 title="{{date}}: ${{value}}">
            </div>
            {{/dataPoints}}
        </div>
    </div>
</template>
```

### Data Table with Sorting and Pagination
Interactive data table with server-side sorting.

```html
<div class="data-table-container">
    <div class="table-controls">
        <input placeholder="Search..."
               hz-get="/api/users"
               hz-params='{"search": "{value}"}'
               hz-template="#users-table"
               hz-target="#table-content"
               hz-trigger="input changed delay:300ms">

        <select hz-get="/api/users"
                hz-params='{"limit": "{value}"}'
                hz-template="#users-table"
                hz-target="#table-content"
                hz-trigger="change">
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
        </select>
    </div>

    <div id="table-content"
         hz-get="/api/users"
         hz-template="#users-table"
         hz-trigger="load">
    </div>
</div>

<template id="users-table">
    <table class="data-table">
        <thead>
            <tr>
                <th>
                    <button class="sort-btn"
                            hz-get="/api/users"
                            hz-params='{"sort": "name", "order": "{{?sortBy === \"name\" && order === \"asc\"}}desc{{/?}}{{?sortBy !== \"name\" || order !== \"asc\"}}asc{{/?}}"}'
                            hz-template="#users-table"
                            hz-target="#table-content">
                        Name {{?sortBy === 'name'}}{{?order === 'asc'}}↑{{/?}}{{?order === 'desc'}}↓{{/?}}{{/?}}
                    </button>
                </th>
                <th>
                    <button class="sort-btn"
                            hz-get="/api/users"
                            hz-params='{"sort": "email", "order": "asc"}'
                            hz-template="#users-table"
                            hz-target="#table-content">
                        Email
                    </button>
                </th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {{#users}}
            <tr>
                <td>{{name}}</td>
                <td>{{email}}</td>
                <td>
                    <span class="status status-{{status}}">{{status}}</span>
                </td>
                <td>
                    <button hz-get="/api/users/{{id}}"
                            hz-template="#user-details-modal"
                            hz-target="#modal-container">View</button>
                    <button hz-delete="/api/users/{{id}}"
                            hz-confirm="Delete {{name}}?"
                            hz-target="closest tr"
                            hz-swap="delete">Delete</button>
                </td>
            </tr>
            {{/users}}
        </tbody>
    </table>

    <!-- Pagination -->
    <div class="pagination">
        {{?hasPrevious}}
        <button hz-get="/api/users"
                hz-params='{"page": {{currentPage - 1}}}'
                hz-template="#users-table"
                hz-target="#table-content">← Previous</button>
        {{/?}}

        <span class="page-info">
            Page {{currentPage}} of {{totalPages}}
        </span>

        {{?hasNext}}
        <button hz-get="/api/users"
                hz-params='{"page": {{currentPage + 1}}}'
                hz-template="#users-table"
                hz-target="#table-content">Next →</button>
        {{/?}}
    </div>
</template>
```

## 🔄 Auto-refresh & Live Data

### Stock Price Ticker
Live updating stock prices with color coding.

```html
<div class="stock-ticker">
    <div class="ticker-header">
        <h2>Live Stock Prices</h2>
        <button hz-get="/api/stocks/refresh"
                hz-template="#stock-list"
                hz-target="#stocks-container">
            🔄 Refresh
        </button>
    </div>

    <div id="stocks-container"
         hz-get="/api/stocks"
         hz-template="#stock-list"
         hz-trigger="load, every 5s">
    </div>
</div>

<template id="stock-list">
    <div class="stock-grid">
        {{#stocks}}
        <div class="stock-card trend-{{trend}}">
            <div class="stock-symbol">{{symbol}}</div>
            <div class="stock-price">${{price}}</div>
            <div class="stock-change">
                {{?change > 0}}+{{/?}}{{change}} ({{changePercent}}%)
            </div>
            <div class="stock-time">{{lastUpdated}}</div>
        </div>
        {{/stocks}}
    </div>
</template>
```

### Server Status Monitor
Monitor multiple services with health checks.

```html
<div class="status-monitor">
    <h1>System Status</h1>

    <div class="status-overview"
         hz-get="/api/status/overview"
         hz-template="#status-overview"
         hz-trigger="load, every 30s">
    </div>

    <div class="services-grid"
         hz-get="/api/status/services"
         hz-template="#services-status"
         hz-trigger="load, every 10s">
    </div>
</div>

<template id="status-overview">
    <div class="overview-card status-{{overallStatus}}">
        <h2>{{?overallStatus === 'healthy'}}✅{{/?}}{{?overallStatus === 'degraded'}}⚠️{{/?}}{{?overallStatus === 'down'}}❌{{/?}} System Status</h2>
        <p>{{servicesUp}} of {{totalServices}} services operational</p>
        <small>Last updated: {{lastCheck}}</small>
    </div>
</template>

<template id="services-status">
    {{#services}}
    <div class="service-card status-{{status}}">
        <h3>{{name}}</h3>
        <div class="service-status">
            {{?status === 'up'}}✅ Operational{{/?}}
            {{?status === 'degraded'}}⚠️ Degraded{{/?}}
            {{?status === 'down'}}❌ Down{{/?}}
        </div>
        <div class="service-metrics">
            <div>Response Time: {{responseTime}}ms</div>
            <div>Uptime: {{uptime}}%</div>
        </div>
        {{?lastIncident}}
        <div class="last-incident">
            Last incident: {{lastIncident.date}}
        </div>
        {{/?}}
    </div>
    {{/services}}
</template>
```

## 🎨 UI Patterns

### Modal Dialogs
Dynamic modal content loading.

```html
<!-- Modal trigger buttons -->
<button hz-get="/api/products/123"
        hz-template="#product-modal"
        hz-target="#modal-container">
    View Product Details
</button>

<button hz-get="/api/forms/contact"
        hz-template="#contact-modal"
        hz-target="#modal-container">
    Contact Us
</button>

<!-- Modal container -->
<div id="modal-container"></div>

<template id="product-modal">
    <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h2>{{name}}</h2>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>

            <div class="modal-body">
                {{?images.0}}
                <img src="{{images.0}}" alt="{{name}}" class="product-image">
                {{/?}}

                <div class="product-details">
                    <p class="price">${{price}}</p>
                    <p class="description">{{description}}</p>

                    {{?features}}
                    <ul class="features">
                        {{#features}}
                        <li>{{.}}</li>
                        {{/features}}
                    </ul>
                    {{/?}}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn-primary"
                        hz-post="/api/cart/add"
                        hz-params='{"productId": {{id}}}'
                        hz-template="#cart-notification"
                        hz-target="#notifications">
                    Add to Cart
                </button>
            </div>
        </div>
    </div>
</template>
```

### Infinite Scroll
Load more content as user scrolls.

```html
<div class="content-feed">
    <div id="posts-container"
         hz-get="/api/posts"
         hz-template="#posts-list"
         hz-trigger="load">
    </div>

    <!-- Load more trigger -->
    <div id="load-more-trigger"
         hz-get="/api/posts"
         hz-params='{"page": 2}'
         hz-template="#posts-list"
         hz-target="#posts-container"
         hz-swap="append"
         hz-trigger="revealed">
        <div class="loading-indicator">Loading more posts...</div>
    </div>
</div>

<template id="posts-list">
    {{#posts}}
    <article class="post">
        <header class="post-header">
            <img src="{{author.avatar}}" alt="{{author.name}}" class="avatar">
            <div>
                <h3>{{author.name}}</h3>
                <time>{{publishedAt}}</time>
            </div>
        </header>

        <div class="post-content">
            <h2>{{title}}</h2>
            <p>{{excerpt}}</p>

            {{?image}}
            <img src="{{image}}" alt="{{title}}" class="post-image">
            {{/?}}
        </div>

        <footer class="post-actions">
            <button hz-post="/api/posts/{{id}}/like"
                    hz-template="#like-count"
                    hz-target="#likes-{{id}}">
                👍 <span id="likes-{{id}}">{{likesCount}}</span>
            </button>

            <button hz-get="/api/posts/{{id}}/comments"
                    hz-template="#comments-modal"
                    hz-target="#modal-container">
                💬 {{commentsCount}} Comments
            </button>
        </footer>
    </article>
    {{/posts}}

    <!-- Update load more trigger for next page -->
    {{?hasNext}}
    <div hz-get="/api/posts"
         hz-params='{"page": {{nextPage}}}'
         hz-template="#posts-list"
         hz-target="#posts-container"
         hz-swap="append"
         hz-trigger="revealed"
         style="display: none;">
    </div>
    {{/?}}
</template>
```

### Drag and Drop File Upload
Visual file upload with progress.

```html
<div class="file-upload-area">
    <form class="upload-form"
          hz-post="/api/upload"
          hz-template="#upload-result"
          hz-target="#upload-results"
          hz-indicator="#upload-progress"
          enctype="multipart/form-data">

        <div class="drop-zone"
             ondrop="dropHandler(event)"
             ondragover="dragOverHandler(event)"
             ondragenter="dragEnterHandler(event)"
             ondragleave="dragLeaveHandler(event)">

            <div class="drop-zone-content">
                <div class="upload-icon">📁</div>
                <p>Drag & drop files here or <button type="button" onclick="document.getElementById('file-input').click()">browse</button></p>

                <input type="file"
                       id="file-input"
                       name="files"
                       multiple
                       style="display: none;"
                       onchange="this.form.submit()">
            </div>
        </div>
    </form>

    <div id="upload-progress" hidden>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <p>Uploading files...</p>
    </div>

    <div id="upload-results"></div>
</div>

<template id="upload-result">
    <div class="upload-results">
        <h3>Upload Complete</h3>
        {{#files}}
        <div class="uploaded-file">
            {{?success}}
            <span class="file-success">✅ {{name}}</span>
            <a href="{{url}}" target="_blank">View File</a>
            {{/?}}
            {{?error}}
            <span class="file-error">❌ {{name}}: {{error}}</span>
            {{/?}}
        </div>
        {{/files}}
    </div>
</template>
```

## 🔐 Authentication

### Login Form with Remember Me
Authentication with session management.

```html
<form class="login-form" hz-post="/api/auth/login"
      hz-template="#login-result"
      hz-target="#auth-container">

    <h2>Sign In</h2>

    <div class="form-field">
        <input name="email"
               type="email"
               placeholder="Email"
               required>
    </div>

    <div class="form-field">
        <input name="password"
               type="password"
               placeholder="Password"
               required>
    </div>

    <div class="form-field">
        <label>
            <input name="remember" type="checkbox">
            Remember me
        </label>
    </div>

    <button type="submit" class="login-btn">Sign In</button>

    <div class="form-links">
        <a href="#" hz-get="/api/auth/forgot-password-form"
                    hz-template="#forgot-password-form"
                    hz-target="#auth-container">
            Forgot password?
        </a>
    </div>
</form>

<template id="login-result">
    {{?success}}
    <div class="login-success">
        <h2>Welcome back, {{user.name}}!</h2>
        <p>Redirecting to dashboard...</p>
        <script>
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        </script>
    </div>
    {{/?}}

    {{?error}}
    <div class="login-error">
        <p class="error-message">{{error}}</p>
        <button hz-get="/api/auth/login-form"
                hz-template="#login-form"
                hz-target="#auth-container">
            Try Again
        </button>
    </div>
    {{/?}}
</template>
```

### Password Reset Flow
Multi-step password reset process.

```html
<!-- Step 1: Request reset -->
<form class="password-reset-form" hz-post="/api/auth/reset-request"
      hz-template="#reset-request-result"
      hz-target="#reset-container">

    <h2>Reset Password</h2>
    <p>Enter your email address and we'll send you a reset link.</p>

    <input name="email"
           type="email"
           placeholder="Your email address"
           required>

    <button type="submit">Send Reset Link</button>
</form>

<template id="reset-request-result">
    {{?success}}
    <div class="reset-success">
        <h3>Reset Link Sent</h3>
        <p>Check your email at {{email}} for the password reset link.</p>
    </div>
    {{/?}}

    {{?error}}
    <div class="reset-error">
        <p class="error">{{error}}</p>
        <button hz-get="/api/auth/reset-form"
                hz-template="#password-reset-form"
                hz-target="#reset-container">
            Try Again
        </button>
    </div>
    {{/?}}
</template>

<!-- Step 2: Reset with token (from email link) -->
<form class="new-password-form" hz-post="/api/auth/reset-password"
      hz-template="#password-reset-result"
      hz-target="#reset-container"
      hz-params='{"token": "{urlParam:token}"}'>

    <h2>Create New Password</h2>

    <input name="password"
           type="password"
           placeholder="New password"
           required
           hz-get="/api/auth/check-password-strength"
           hz-template="#password-strength"
           hz-target="#strength-indicator"
           hz-trigger="input delay:200ms">

    <div id="strength-indicator"></div>

    <input name="confirmPassword"
           type="password"
           placeholder="Confirm new password"
           required>

    <button type="submit">Update Password</button>
</form>
```

## 📱 Mobile Patterns

### Pull to Refresh
Mobile-friendly pull to refresh functionality.

```html
<div class="mobile-feed">
    <div class="pull-refresh-container"
         id="refresh-container"
         ontouchstart="startPull(event)"
         ontouchmove="movePull(event)"
         ontouchend="endPull(event)">

        <div class="pull-refresh-indicator" id="refresh-indicator">
            <span class="refresh-icon">↓</span>
            <span class="refresh-text">Pull to refresh</span>
        </div>

        <div id="feed-content"
             hz-get="/api/feed"
             hz-template="#feed-posts"
             hz-trigger="load">
        </div>
    </div>

    <!-- Hidden refresh trigger -->
    <div id="refresh-trigger"
         hz-get="/api/feed/refresh"
         hz-template="#feed-posts"
         hz-target="#feed-content"
         style="display: none;">
    </div>
</div>

<template id="feed-posts">
    <div class="posts-list">
        {{#posts}}
        <article class="post-card">
            <div class="post-header">
                <img src="{{author.avatar}}" alt="{{author.name}}">
                <div>
                    <strong>{{author.name}}</strong>
                    <time>{{createdAt}}</time>
                </div>
            </div>

            <div class="post-content">
                <p>{{content}}</p>
                {{?image}}
                <img src="{{image}}" alt="Post image" class="post-image">
                {{/?}}
            </div>

            <div class="post-actions">
                <button class="action-btn"
                        hz-post="/api/posts/{{id}}/like"
                        hz-template="#like-update"
                        hz-target="#like-count-{{id}}">
                    ❤️ <span id="like-count-{{id}}">{{likes}}</span>
                </button>
            </div>
        </article>
        {{/posts}}
    </div>
</template>
```

### Swipe Actions
Swipe-to-delete and swipe actions for mobile.

```html
<div class="swipe-list">
    {{#items}}
    <div class="swipe-item"
         ontouchstart="startSwipe(event, {{id}})"
         ontouchmove="moveSwipe(event, {{id}})"
         ontouchend="endSwipe(event, {{id}})">

        <div class="item-actions left-actions">
            <button class="action-btn archive-btn"
                    hz-patch="/api/items/{{id}}"
                    hz-params='{"archived": true}'
                    hz-target="closest .swipe-item"
                    hz-swap="delete">
                📁 Archive
            </button>
        </div>

        <div class="item-content">
            <div class="item-title">{{title}}</div>
            <div class="item-subtitle">{{subtitle}}</div>
        </div>

        <div class="item-actions right-actions">
            <button class="action-btn delete-btn"
                    hz-delete="/api/items/{{id}}"
                    hz-confirm="Delete {{title}}?"
                    hz-target="closest .swipe-item"
                    hz-swap="delete">
                🗑️ Delete
            </button>
        </div>
    </div>
    {{/items}}
</div>
```

---

## 💡 Pro Tips

### Performance Optimization
```html
<!-- Cache templates -->
<template id="reusable-card">{{name}}: {{value}}</template>

<!-- Debounce expensive operations -->
<input hz-get="/api/expensive-search"
       hz-trigger="input changed delay:500ms">

<!-- Use specific targets -->
<button hz-target="#specific-element">Better than document queries</button>
```

### Error Handling
```html
<!-- Always provide error states -->
<template id="user-result">
    {{?error}}
    <div class="error">{{error.message}}</div>
    {{/?}}
    {{?user}}
    <div class="user">{{user.name}}</div>
    {{/?}}
</template>
```

### Accessibility
```html
<!-- Include ARIA labels -->
<button hz-get="/api/data"
        hz-indicator="#loading"
        aria-describedby="loading">
    Load Data
</button>

<div id="loading" hidden role="status" aria-live="polite">
    Loading...
</div>
```

---

**Need more patterns?** Check out the [Troubleshooting Guide](reference/TROUBLESHOOTING.md) or [Performance Tips](reference/PERFORMANCE.md)!