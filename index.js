const createApi = (defaultState = {}) => {
    const initializeState = state =>
        props => {
            for (const key in props) {
                state[key] = typeof props[key] === 'function' && typeof state[key] === 'function' ?
                    (function(prevFn, currFn) {
                        prevFn = prevFn.bind(state)

                        return function(...args) {
                            if (currFn.length > args.length) args[currFn.length - 1] = prevFn
                            return currFn.apply(state, args)
                        }
                    })(state[key], props[key]) : props[key]
            }
        }

    return {
        getState: () => defaultState,
        updateState: initializeState(defaultState)
    }
}

const api = createApi({
    // using an example that generates a random number so I can verify the function returns the same cached result
    generateRandomNumber() {
        return Math.floor(Math.random() * 9)
    }
})

api.updateState({
    // overrides the method with a different implementation that has access to the older method
    // here we can extend behavior with things like monitoring or caching without bloating the original method
    generateRandomNumber(prevFn) {
        if (!prevFn.cachedResult) prevFn.cachedResult = prevFn()
        console.log(prevFn.cachedResult)
    }
})

const state = api.getState()

state.generateRandomNumber()
state.generateRandomNumber()
state.generateRandomNumber()
state.generateRandomNumber()