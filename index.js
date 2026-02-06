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