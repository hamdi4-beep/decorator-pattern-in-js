const createApi = (initialState = {}) => {
    let newState

    return {
        getState: () => newState,
        updateState(props) {
            for (const key in props) {
                if (typeof initialState[key] === 'function' && typeof props[key] === 'function')
                    newState = {
                        ...initialState,
                        [key]: wrap(initialState[key], props[key])
                    }
            }
        }
    }

    function wrap(oldFn, newFn) {
        const oldFnBound = oldFn.bind(initialState)
        return (...args) => newFn.apply(initialState, args.concat(oldFnBound))
    }
}

const api = createApi({
    generateRandomNumber(seed) {
        return Math.floor(Math.random() * seed)
    }
})

api.updateState({
    // ensures the original method returns the same cached result
    generateRandomNumber(seed, prevFn) {
        if (!prevFn.cachedResult) prevFn.cachedResult = prevFn(seed)
        console.log(prevFn.cachedResult)
    }
})

const state = api.getState()

// calls the method multiple times to verify that the cached result is being used
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)