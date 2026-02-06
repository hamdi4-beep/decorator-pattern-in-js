# Composable State API

A lightweight API pattern that enables function composition with state snapshots, inspired by linked list data structures.

## Core Concept

This API allows you to redefine methods while maintaining access to their previous implementations. Each redefined method receives a reference to the previous version and operates with a snapshot of the state at the time it was defined.

**Key Benefits:**
- Compose new behavior without affecting original implementations
- Each method layer maintains its own state snapshot
- Clean interface - no decorators or explicit wrappers needed
- Traverse backwards through implementation history automatically

## How It Works

The API uses closures to create a chain of function references, similar to a linked list:

1. When you call `updateState()` with a new method, it creates a wrapper function
2. The wrapper captures the current state object in its closure
3. The previous method implementation is bound to its state snapshot and passed as an argument
4. Each method can call `prevFn()` to delegate to the previous implementation

```javascript
const api = createApi({
    version: 1,
    method() {
        console.log(this.version)
    }
})

api.updateState({
    version: 2,
    method(prevFn) {
        prevFn()  // Calls previous implementation with version: 1
        console.log(this.version)  // Sees version: 2
    }
})

api.getState().method()  // Logs: 1, 2
```

## Implementation

```javascript
const createApi = (initialState = {}) => {
    let currentState = Object.assign({}, initialState)

    return {
        getState: () => currentState,
        updateState(props) {
            const newState = Object.assign({}, currentState)

            for (const key in props)
                newState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    (function(oldFn, newFn) {
                        return function(...args) {
                            return newFn.apply(newState, args.concat(oldFn))
                        }
                    })(currentState[key].bind(currentState), props[key]) : props[key]

            currentState = newState
        }
    }
}
```

## Use Cases

### 1. Retry Logic

Add retry functionality to any method without modifying its original implementation:

```javascript
const api = createApi({
    retries: 0,
    fetchUser(id) {
        console.log(`Fetching user ${id}...`)
        if (Math.random() > 0.7) {
            return { id, name: 'John Doe' }
        }
        throw new Error('Network error')
    }
})

api.updateState({
    retries: 3,
    fetchUser(id, prevFn) {
        let attempts = 0
        while (attempts < this.retries) {
            try {
                console.log(`Attempt ${attempts + 1}/${this.retries}`)
                return prevFn(id)
            } catch (error) {
                attempts++
                if (attempts >= this.retries) throw error
                console.log('Retrying...')
            }
        }
    }
})

const user = api.getState().fetchUser(123)
```

### 2. Performance Monitoring + Caching

Layer multiple concerns on top of each other - each layer adds its own behavior:

```javascript
const api = createApi({
    expensiveComputation(n) {
        console.log(`Computing fibonacci(${n})...`)
        if (n <= 1) return n
        return this.expensiveComputation(n - 1) + this.expensiveComputation(n - 2)
    }
})

// Layer 1: Performance monitoring
api.updateState({
    expensiveComputation(n, prevFn) {
        const start = performance.now()
        const result = prevFn(n)
        const duration = performance.now() - start
        console.log(`⏱️  Took ${duration.toFixed(2)}ms`)
        return result
    }
})

// Layer 2: Caching
api.updateState({
    cache: {},
    expensiveComputation(n, prevFn) {
        const cacheKey = `fib-${n}`
        
        if (this.cache[cacheKey]) {
            console.log(`💾 Cache hit for ${n}`)
            return this.cache[cacheKey]
        }
        
        console.log(`🔍 Cache miss for ${n}`)
        const result = prevFn(n)
        this.cache[cacheKey] = result
        return result
    }
})

const state = api.getState()
state.expensiveComputation(10)  // Computes and times
state.expensiveComputation(10)  // Returns from cache
```

### 3. Feature Flags / A/B Testing

Conditionally enable new behavior while maintaining the ability to fall back:

```javascript
const api = createApi({
    enabled: false,
    calculateDiscount(price) {
        return price * 0.1  // 10% discount
    }
})

api.updateState({
    enabled: true,
    calculateDiscount(price, prevFn) {
        if (!this.enabled) {
            console.log('Feature disabled, using old logic')
            return prevFn(price)
        }
        
        console.log('Feature enabled, using new logic')
        return price * 0.2  // 20% discount
    }
})

api.updateState({
    isPremium: false,
    calculateDiscount(price, prevFn) {
        if (this.isPremium) {
            console.log('Premium user - extra 5%')
            return prevFn(price) + (price * 0.05)
        }
        return prevFn(price)
    }
})

const state = api.getState()
state.calculateDiscount(100)  // Applies both layers
```

### 4. Validation & Audit Logging Pipeline

Build processing pipelines where each layer adds validation, logging, or transformation:

```javascript
const api = createApi({
    createUser(userData) {
        return { ...userData, id: Math.random() }
    }
})

// Layer 1: Validation
api.updateState({
    createUser(userData, prevFn) {
        console.log('🔍 Validating input...')
        
        if (!userData.email || !userData.email.includes('@')) {
            throw new Error('Invalid email')
        }
        
        if (!userData.name || userData.name.length < 2) {
            throw new Error('Invalid name')
        }
        
        console.log('✅ Validation passed')
        return prevFn(userData)
    }
})

// Layer 2: Audit logging
api.updateState({
    auditLog: [],
    createUser(userData, prevFn) {
        const timestamp = new Date().toISOString()
        console.log(`📝 Logging user creation at ${timestamp}`)
        
        const result = prevFn(userData)
        
        this.auditLog.push({
            action: 'createUser',
            timestamp,
            userId: result.id
        })
        
        return result
    }
})

const state = api.getState()
const user = state.createUser({ email: 'test@example.com', name: 'Jane' })
console.log('Audit log:', state.auditLog)
```

### 5. Rate Limiting

Control method invocation frequency without changing core logic:

```javascript
const api = createApi({
    sendEmail(to, message) {
        console.log(`📧 Sending email to ${to}: "${message}"`)
        return { sent: true, to }
    }
})

api.updateState({
    lastCallTime: 0,
    minInterval: 2000,  // 2 seconds between calls
    sendEmail(to, message, prevFn) {
        const now = Date.now()
        const timeSinceLastCall = now - this.lastCallTime
        
        if (timeSinceLastCall < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastCall
            console.log(`⏸️  Rate limit: wait ${waitTime}ms`)
            throw new Error(`Rate limited. Try again in ${waitTime}ms`)
        }
        
        this.lastCallTime = now
        return prevFn(to, message)
    }
})

const state = api.getState()
state.sendEmail('user@example.com', 'Hello!')
state.sendEmail('user@example.com', 'Another one!')  // Rate limited
```

## Technical Details

**State Management:**
- Each `updateState()` call creates a new state object
- Method wrappers close over their state object at creation time
- Previous methods are bound to their respective state snapshots
- This creates immutable history while allowing forward evolution

**Function Chaining:**
- Works like a linked list: each node (method) references the previous one
- Traversal happens automatically when you call the latest method
- Each layer can choose whether to call `prevFn()` and when

**Performance Considerations:**
- Each layer adds one function call to the chain
- State objects are shallow copied on each update
- Long chains may impact performance for frequently-called methods

## Limitations

- Currently synchronous - async method chaining would require modifications
- Deep chains could impact performance
- State snapshots are shallow copies (nested objects share references)