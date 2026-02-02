# Method Composition API

A proof-of-concept API that allows method overriding while preserving access to previous implementations.

## How It Works

The API detects when you're replacing a function property with another function. When this happens, it automatically wraps both functions so the new implementation can access the previous one as its last parameter.

**Key mechanism:** 
- Previous function is bound to the API's internal state
- Injected as the last argument only if the new function expects more parameters than provided
- Creates a composition chain where each override can call its predecessor

## Usage

```javascript
// Create an API with initial methods
const api = createApi({
    methodName() {
        // original implementation
    }
})

// Override methods while accessing previous implementation
api.updateState({
    methodName(prevFn) {
        // your decorator logic here
        const result = prevFn() // call original
        // additional logic
        return result
    }
})

// Access the API and call methods
const state = api.getState()
state.methodName()
```

## Examples

### Caching Results

```javascript
const api = createApi({
    generateRandomNumber() {
        return Math.floor(Math.random() * 9)
    }
})

api.updateState({
    generateRandomNumber(prevFn) {
        if (!prevFn.cachedResult) prevFn.cachedResult = prevFn()
        return prevFn.cachedResult
    }
})

const state = api.getState()
console.log(state.generateRandomNumber()) // Always returns same number
```

### Performance Monitoring

```javascript
const api = createApi({
    processData(data) {
        return data.map(x => x * 2).filter(x => x > 10)
    }
})

api.updateState({
    processData(data, prevFn) {
        const start = performance.now()
        const result = prevFn(data)
        const duration = performance.now() - start
        console.log(`processData took ${duration}ms`)
        return result
    }
})
```

### Error Handling and Retry Logic

```javascript
const api = createApi({
    fetchUserData(userId) {
        // simulate API call that might fail
        if (Math.random() > 0.7) throw new Error('Network error')
        return { id: userId, name: 'User' }
    }
})

api.updateState({
    fetchUserData(userId, prevFn) {
        let attempts = 0
        const maxRetries = 3
        
        while (attempts < maxRetries) {
            try {
                return prevFn(userId)
            } catch (error) {
                attempts++
                console.log(`Attempt ${attempts} failed`)
                if (attempts === maxRetries) throw error
            }
        }
    }
})
```

### Request Throttling

```javascript
const api = createApi({
    saveData(data) {
        console.log('Saving:', data)
        return { saved: true }
    }
})

api.updateState({
    saveData(data, prevFn) {
        const now = Date.now()
        if (!prevFn.lastCall || now - prevFn.lastCall > 1000) {
            prevFn.lastCall = now
            return prevFn(data)
        }
        console.log('Request throttled')
        return { saved: false }
    }
})
```

### Input Validation

```javascript
const api = createApi({
    createUser(userData) {
        return { id: Date.now(), ...userData }
    }
})

api.updateState({
    createUser(userData, prevFn) {
        if (!userData.email || !userData.name) {
            throw new Error('Email and name are required')
        }
        if (!userData.email.includes('@')) {
            throw new Error('Invalid email format')
        }
        return prevFn(userData)
    }
})
```

## Benefits

The decorator pattern separates concerns:
- Original methods focus on core logic
- Decorators add cross-cutting concerns (logging, caching, validation)
- No need to modify original implementations
- Stack multiple decorators by calling `updateState` multiple times
