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

    function decorate(oldFn, newFn) {
        const oldFnBound = oldFn.bind(currentState)
        return (...args) => newFn.apply(currentState, args.concat(oldFnBound))
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
        console.log('Cached result:', prevFn.cachedResult)
    }
})

const state = api.getState()

// calls the same function four times in a row to verify the cached value is being used
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)