const createApi = state => {
    let currentState = state || {}

    return {
        getState: () => currentState,
        updateState(props) {
            for (const key in props) {
                currentState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    (function(prevFn, currFn) {
                        return (...args) => currFn.apply(state, args.concat(prevFn))
                    })(currentState[key], props[key]) : props[key]
            }
        }
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

// call the same function four times in a row to verify the same value is being used
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)