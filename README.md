# createPlugin

A lightweight plugin system for building extensible JavaScript applications through function composition.

## Core Concept

`createPlugin` enables you to build applications where behavior can be extended without modifying core logic. Each extension wraps previous implementations, creating a composable chain of functionality.

```javascript
const plugin = createPlugin({
    process(data) {
        return data
    }
})

// Extend behavior - previous implementation passed as last argument
plugin.extend({
    process(data, prev) {
        const result = prev(data)
        return result.toUpperCase()
    }
})

plugin.getSnapshot().process('hello') // 'HELLO'
```

## API

### `createPlugin(initialState)`

Creates a new plugin instance with initial behavior and configuration.

**Parameters:**
- `initialState` (Object): Initial methods and properties

**Returns:** Plugin instance with `extend()` and `getSnapshot()` methods

### `plugin.extend(extensions)`

Adds new behavior to the plugin. Functions are composed with previous implementations; properties are updated.

**Parameters:**
- `extensions` (Object): New methods and properties to add

**Function Composition:**
When extending a function, the previous implementation is passed as the last argument:

```javascript
plugin.extend({
    method(arg1, arg2, previousImplementation) {
        // Call previous implementation when needed
        const result = previousImplementation(arg1, arg2)
        return result
    }
})
```

### `plugin.getSnapshot()`

Returns the current state of the plugin with all extended behavior.

**Returns:** Object containing all methods and properties

## Examples

### Authentication Guard

```javascript
const plugin = createPlugin({
    run() {
        console.log('The plugin is up and running!')
    }
})

plugin.extend({
    run(prev) {
        if (this.authenticated)
            return prev()

        console.log('The plugin is not authenticated yet!')
    },
    authenticate(token) {
        this.authenticated = this.secret === token
    },
    secret: 'secret_token'
})

const snapshot = plugin.getSnapshot()
snapshot.run() // 'The plugin is not authenticated yet!'

snapshot.authenticate('secret_token')
snapshot.run() // 'The plugin is up and running!'
```

### HTTP Client with Interceptors

```javascript
const http = createPlugin({
    async request(url, options = {}) {
        const response = await fetch(url, options)
        return response.json()
    }
})

// Add authentication
http.extend({
    async request(url, options, prev) {
        const authenticatedOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`
            }
        }
        return prev(url, authenticatedOptions)
    },
    token: null,
    setToken(token) {
        this.token = token
    }
})

// Add retry logic
http.extend({
    async request(url, options, prev) {
        try {
            return await prev(url, options)
        } catch (error) {
            console.log('Request failed, retrying...')
            return await prev(url, options)
        }
    }
})

// Add response caching
http.extend({
    async request(url, options, prev) {
        const cacheKey = `${url}-${JSON.stringify(options)}`
        
        if (this.cache.has(cacheKey)) {
            console.log('Cache hit!')
            return this.cache.get(cacheKey)
        }
        
        const result = await prev(url, options)
        this.cache.set(cacheKey, result)
        return result
    },
    cache: new Map()
})

const client = http.getSnapshot()
client.setToken('abc123')

await client.request('https://api.example.com/data')
```

### Logger with Contextual Information

```javascript
const logger = createPlugin({
    log(message) {
        console.log(message)
    }
})

// Add timestamp
logger.extend({
    log(message, prev) {
        const timestamp = new Date().toISOString()
        prev(`[${timestamp}] ${message}`)
    }
})

// Add log levels
logger.extend({
    log(message, prev) {
        const level = this.level || 'INFO'
        prev(`[${level}] ${message}`)
    },
    level: 'INFO',
    setLevel(level) {
        this.level = level
    }
})

// Add user context
logger.extend({
    log(message, prev) {
        if (this.userId) {
            prev(`[User:${this.userId}] ${message}`)
        } else {
            prev(message)
        }
    },
    userId: null,
    setUser(userId) {
        this.userId = userId
    }
})

const log = logger.getSnapshot()
log.setLevel('DEBUG')
log.setUser('admin')
log.log('Application started')
// [User:admin] [DEBUG] [2024-02-06T...] Application started
```

### Validation Pipeline

```javascript
const validator = createPlugin({
    validate(data) {
        return { valid: true, errors: [] }
    }
})

// Required fields
validator.extend({
    validate(data, prev) {
        const result = prev(data)
        
        this.requiredFields.forEach(field => {
            if (!data[field]) {
                result.valid = false
                result.errors.push(`${field} is required`)
            }
        })
        
        return result
    },
    requiredFields: ['email', 'password']
})

// Email format
validator.extend({
    validate(data, prev) {
        const result = prev(data)
        
        if (data.email && !this.emailRegex.test(data.email)) {
            result.valid = false
            result.errors.push('Invalid email format')
        }
        
        return result
    },
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
})

// Password strength
validator.extend({
    validate(data, prev) {
        const result = prev(data)
        
        if (data.password && data.password.length < this.minPasswordLength) {
            result.valid = false
            result.errors.push(`Password must be at least ${this.minPasswordLength} characters`)
        }
        
        return result
    },
    minPasswordLength: 8
})

const validate = validator.getSnapshot()

console.log(validate.validate({ email: 'invalid', password: '123' }))
// {
//   valid: false,
//   errors: [
//     'Invalid email format',
//     'Password must be at least 8 characters'
//   ]
// }
```

### Event System with Middleware

```javascript
const events = createPlugin({
    emit(eventName, data) {
        console.log(`Event: ${eventName}`, data)
    }
})

// Add event filtering
events.extend({
    emit(eventName, data, prev) {
        if (this.allowedEvents.includes(eventName)) {
            prev(eventName, data)
        } else {
            console.log(`Event ${eventName} is not allowed`)
        }
    },
    allowedEvents: ['user:login', 'user:logout', 'data:update']
})

// Add event logging
events.extend({
    emit(eventName, data, prev) {
        this.eventLog.push({
            event: eventName,
            data,
            timestamp: Date.now()
        })
        prev(eventName, data)
    },
    eventLog: [],
    getLog() {
        return this.eventLog
    }
})

// Add rate limiting
events.extend({
    emit(eventName, data, prev) {
        const now = Date.now()
        const recentEvents = this.recentEvents.filter(
            time => now - time < this.rateLimitWindow
        )
        
        if (recentEvents.length >= this.rateLimitMax) {
            console.log('Rate limit exceeded')
            return
        }
        
        this.recentEvents = [...recentEvents, now]
        prev(eventName, data)
    },
    recentEvents: [],
    rateLimitWindow: 1000, // 1 second
    rateLimitMax: 5
})

const eventEmitter = events.getSnapshot()
eventEmitter.emit('user:login', { userId: 123 })
eventEmitter.emit('invalid:event', {}) // 'Event invalid:event is not allowed'
```

### Command Processor with Error Handling

```javascript
const processor = createPlugin({
    execute(command) {
        console.log(`Executing: ${command}`)
        return { success: true, output: `Executed ${command}` }
    }
})

// Add performance monitoring
processor.extend({
    execute(command, prev) {
        const start = performance.now()
        const result = prev(command)
        const duration = performance.now() - start
        
        console.log(`Performance: ${duration.toFixed(2)}ms`)
        return { ...result, duration }
    }
})

// Add error handling
processor.extend({
    execute(command, prev) {
        try {
            return prev(command)
        } catch (error) {
            console.error(`Error executing ${command}:`, error.message)
            return {
                success: false,
                error: error.message
            }
        }
    }
})

// Add command history
processor.extend({
    execute(command, prev) {
        this.history.push({
            command,
            timestamp: Date.now()
        })
        return prev(command)
    },
    history: [],
    getHistory() {
        return this.history
    }
})

// Add command whitelist
processor.extend({
    execute(command, prev) {
        if (!this.allowedCommands.includes(command)) {
            throw new Error(`Command '${command}' is not allowed`)
        }
        return prev(command)
    },
    allowedCommands: ['start', 'stop', 'restart'],
    addAllowedCommand(command) {
        this.allowedCommands.push(command)
    }
})

const cmd = processor.getSnapshot()
cmd.execute('start')
// Executing: start
// Performance: 0.15ms
// { success: true, output: 'Executed start', duration: 0.15 }
```

## Use Cases

### When to Use

- **Plugin architectures** - Applications that need third-party extensions
- **Middleware systems** - Request/response pipelines with interceptors
- **Cross-cutting concerns** - Adding logging, caching, auth, validation without touching core logic
- **Gradual feature rollout** - Layer new features on top of existing functionality
- **Testing different behaviors** - Swap implementations without modifying core code

### When Not to Use

- **Simple state management** - Use Redux, Zustand, or plain objects
- **Reactive updates** - Use MobX, Signals, or Observable patterns
- **Type-safe environments** - The dynamic composition makes TypeScript inference difficult
- **Performance-critical hot paths** - Function composition adds call stack overhead

## How It Works

Each time you call `extend()`, functions are wrapped in a new closure:

```javascript
// Initial
plugin = { method: fn1 }

// After first extend
plugin = { 
    method: function(...args) {
        return fn2.apply(newState, args.concat(fn1.bind(oldState)))
    }
}

// After second extend  
plugin = {
    method: function(...args) {
        return fn3.apply(newestState, args.concat(fn2Wrapper.bind(previousState)))
    }
}
```

When you call the method, it executes the most recent extension first. That extension decides when (or if) to call the previous implementation.

## Patterns

### Pre-Processing

```javascript
plugin.extend({
    method(data, prev) {
        const sanitized = sanitize(data)
        return prev(sanitized)
    }
})
```

### Post-Processing

```javascript
plugin.extend({
    method(data, prev) {
        const result = prev(data)
        return enhance(result)
    }
})
```

### Conditional Execution

```javascript
plugin.extend({
    method(data, prev) {
        if (shouldExecute(data)) {
            return prev(data)
        }
        return null
    }
})
```

### Wrap with Try-Catch

```javascript
plugin.extend({
    method(data, prev) {
        try {
            return prev(data)
        } catch (error) {
            return handleError(error)
        }
    }
})
```

### Skip Previous Implementation

```javascript
plugin.extend({
    method(data, prev) {
        // Completely override previous behavior
        return newImplementation(data)
    }
})
```

## Advanced: Method Chaining

Make `extend()` chainable by returning the plugin instance:

```javascript
const createPlugin = (initialState = {}) => {
    let currentState = Object.assign({}, initialState)

    const plugin = {
        getSnapshot: () => currentState,
        extend(props) {
            const newState = Object.assign({}, currentState)

            for (const key in props)
                newState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    (function(oldFn, newFn) {
                        return function(...args) {
                            return newFn.apply(newState, args.concat(oldFn))
                        }
                    })(currentState[key].bind(currentState), props[key]) : props[key]

            currentState = newState
            return plugin  // Enable chaining
        }
    }

    return plugin
}

// Now you can chain
createPlugin({ process: x => x })
    .extend({ process: (x, prev) => prev(x).toUpperCase() })
    .extend({ process: (x, prev) => prev(x) + '!' })
    .getSnapshot()
    .process('hello') // 'HELLO!'
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.