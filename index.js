const createApi = state => {
    let currentState = state || {}

    return {
        getState: () => currentState,
        updateState(props) {
            for (const key in props) {
                currentState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    decorate(currentState[key], props[key]) : props[key]
            }
        }
    }

    function decorate(wrapped, fn) {
        const bound = wrapped.bind(currentState)
        return (...args) => fn.apply(currentState, args.concat(bound))
    }
}

const api = createApi({
    generateRandomNumber(seed) {
        return Math.floor(Math.random() * seed)
    }
})

api.updateState({
    generateRandomNumber(seed, prevFn) {
        // ensures the same "random" value is returned for testing purposes
        if (!prevFn.cachedResult) prevFn.cachedResult = prevFn(seed)
        console.log(prevFn.cachedResult)
    }
})

const state = api.getState()

// calls the same function four times in a row to verify the cached value is being used
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)