# htmz JavaScript API

While htmz works purely through HTML attributes, it also provides a JavaScript API for programmatic control and advanced use cases.

## 📖 Table of Contents

- [Core Methods](#-core-methods)
- [Template Functions](#-template-functions)
- [DOM Manipulation](#-dom-manipulation)
- [Event System](#-event-system)
- [Configuration](#-configuration)
- [Utilities](#-utilities)

## 🔧 Core Methods

### HTTP Requests

Make HTTP requests programmatically with automatic JSON handling.

```javascript
// GET requests
htmz.get(url, options)
  .then(data => console.log(data))
  .catch(error => console.error(error));

// POST requests
htmz.post(url, data, options)
  .then(response => console.log(response));

// Other HTTP methods
htmz.put(url, data, options);
htmz.patch(url, data, options);
htmz.delete(url, options);

// Generic AJAX method
htmz.ajax(method, url, data, options);
```

**Parameters:**
- `url` (string) - Request URL
- `data` (object) - Data to send (for POST/PUT/PATCH)
- `options` (object) - Request options

**Options object:**
```javascript
{
  headers: {'Authorization': 'Bearer token'},
  timeout: 5000,        // Request timeout in ms
  signal: abortController.signal  // For request cancellation
}
```

**Examples:**
```javascript
// Simple GET request
htmz.get('/api/users/123')
  .then(user => console.log('User:', user));

// POST with data
htmz.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
}).then(result => console.log('Created:', result));

// Request with custom headers
htmz.get('/api/private-data', {
  headers: {
    'Authorization': 'Bearer ' + getToken(),
    'X-API-Version': '2.0'
  }
}).then(data => console.log(data));
```

## 🎨 Template Functions

### htmz.render()

Render templates programmatically.

```javascript
htmz.render(templateSelector, data, targetSelector)
```

**Parameters:**
- `templateSelector` (string) - CSS selector for template element
- `data` (object) - Data to render
- `targetSelector` (string, optional) - Where to render (returns HTML string if omitted)

**Examples:**
```javascript
// Render to specific target
htmz.render('#user-template', userData, '#user-container');

// Get HTML string
const html = htmz.render('#user-template', userData);
console.log(html);

// Render array of data
const users = [{name: 'John'}, {name: 'Jane'}];
htmz.render('#user-list-template', {users}, '#users-container');
```

### htmz.clearCache()

Clear template cache to force re-parsing.

```javascript
// Clear all template cache
htmz.clearCache();

// Templates will be re-parsed on next use
```

## 🎯 DOM Manipulation

### htmz.swap()

Update DOM content with different swap strategies.

```javascript
htmz.swap(targetSelector, html, strategy)
```

**Parameters:**
- `targetSelector` (string) - CSS selector for target element(s)
- `html` (string) - HTML content to insert
- `strategy` (string, optional) - How to insert (default: 'innerHTML')

**Swap strategies:**
- `innerHTML` - Replace target's content
- `outerHTML` - Replace entire target element
- `append` - Add to end of target's content
- `prepend` - Add to beginning of target's content
- `before` - Insert before target element
- `after` - Insert after target element
- `delete` - Remove target element (ignores html parameter)

**Examples:**
```javascript
// Replace content
htmz.swap('#result', '<div>New content</div>');

// Append content
htmz.swap('#list', '<li>New item</li>', 'append');

// Replace entire element
htmz.swap('.old-widget', '<div class="new-widget">Updated</div>', 'outerHTML');

// Remove elements
htmz.swap('.to-remove', null, 'delete');
```

### htmz.find()

Find elements (wrapper around querySelectorAll).

```javascript
const elements = htmz.find(selector);
// Returns NodeList
```

### htmz.closest()

Find closest ancestor element.

```javascript
const ancestor = htmz.closest(element, selector);
```

## ⚡ Event System

### htmz.trigger()

Programmatically trigger htmz elements.

```javascript
// Trigger by selector
htmz.trigger('#my-button');
htmz.trigger('.refresh-buttons', 'click');

// Trigger specific element
const button = document.getElementById('my-button');
htmz.trigger(button, 'click');
```

### htmz.on() / htmz.off()

Global event delegation for dynamic elements.

```javascript
// Add global event listener
htmz.on('click', '.dynamic-button', function(event) {
  console.log('Dynamic button clicked:', this);
});

// Remove event listener
htmz.off('click', '.dynamic-button');

// Custom htmz events
htmz.on('hz:beforeRequest', '.api-elements', function(event) {
  console.log('Request starting:', event.detail);
});

htmz.on('hz:afterRequest', '.api-elements', function(event) {
  console.log('Request completed:', event.detail.response);
});

htmz.on('hz:requestError', '.api-elements', function(event) {
  console.error('Request failed:', event.detail.error);
});
```

### htmz.process()

Process new elements added to DOM.

```javascript
// Process all new elements
htmz.process();

// Process specific elements
htmz.process('#new-content');
htmz.process(document.getElementById('dynamic-section'));
```

## ⚙️ Configuration

### htmz.configure()

Set global configuration options.

```javascript
htmz.configure({
  // Default swap strategy
  defaultSwap: 'innerHTML',

  // Default trigger event
  defaultTrigger: 'click',

  // Global headers for all requests
  globalHeaders: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },

  // Request timeout (ms)
  timeout: 30000,

  // Enable request logging
  logRequests: true,

  // Global error handler
  onError: (error, config, element) => {
    console.error('htmz error:', error);
    // Custom error handling logic
  }
});
```

### htmz.logRequests()

Enable/disable request logging.

```javascript
// Enable logging (useful for debugging)
htmz.logRequests(true);

// Disable logging
htmz.logRequests(false);
```

## 🔧 Utilities

### htmz.defineExtension()

Add custom functionality to htmz.

```javascript
// Add new methods
htmz.defineExtension('customMethod', function(param) {
  console.log('Custom method called with:', param);
  return this; // Allow chaining
});

// Add multiple methods
htmz.defineExtension({
  method1: function() { /* ... */ },
  method2: function() { /* ... */ }
});

// Use extensions
htmz.customMethod('hello world');
```

### htmz.remove()

Remove elements and clean up htmz event handlers.

```javascript
// Remove elements and clean up
htmz.remove('#dynamic-content');
htmz.remove('.temporary-elements');
```

### htmz.version

Get htmz version information.

```javascript
console.log('htmz version:', htmz.version);
// Output: "1.0.0"
```

## 🎯 Advanced Patterns

### Custom Request Interceptors

```javascript
// Modify all requests
htmz.configure({
  onBeforeRequest: (config) => {
    // Add authentication token
    config.headers = config.headers || {};
    config.headers['Authorization'] = 'Bearer ' + getCurrentToken();

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  },

  onAfterRequest: (response, config) => {
    // Log successful requests
    console.log('Request completed:', config.url, response);

    return response;
  }
});
```

### Dynamic Template Creation

```javascript
// Create templates programmatically
function createUserTemplate(user) {
  const template = document.createElement('template');
  template.id = `user-template-${user.id}`;
  template.innerHTML = `
    <div class="user-card">
      <h3>{{name}}</h3>
      <p>{{email}}</p>
      <p>Role: {{role}}</p>
    </div>
  `;
  document.head.appendChild(template);

  return template.id;
}

// Use dynamic template
const templateId = createUserTemplate(currentUser);
htmz.render(`#${templateId}`, userData, '#user-display');
```

### Request Queuing

```javascript
// Queue requests to prevent overwhelming server
class RequestQueue {
  constructor(maxConcurrent = 3) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }

  add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({requestFn, resolve, reject});
      this.process();
    });
  }

  process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const {requestFn, resolve, reject} = this.queue.shift();
    this.running++;

    requestFn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.process();
      });
  }
}

const queue = new RequestQueue(2);

// Use queued requests
htmz.configure({
  requestInterceptor: (config) => {
    return queue.add(() => htmz.ajax(config.method, config.url, config.data, config));
  }
});
```

### Error Recovery

```javascript
// Automatic retry with exponential backoff
async function retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Use with htmz
retryRequest(() => htmz.get('/api/unreliable-endpoint'))
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Failed after retries:', error));
```

## 🔗 See Also

- [Getting Started](GETTING_STARTED.md) - Basic tutorial
- [Attributes Reference](ATTRIBUTES.md) - HTML attributes
- [Template Syntax](TEMPLATES.md) - Template language
- [Recipes](RECIPES.md) - Common patterns

---

**Next:** Explore [Recipe Book](RECIPES.md) for practical examples →