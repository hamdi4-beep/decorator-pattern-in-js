const createApi = (initialState = {}) => {
    let currentState = {
        ...initialState
    }

    return {
        getState: () => currentState,
        updateState(props) {
            const newState = {
                ...currentState
            }

            for (const key in props) {
                newState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    wrap(currentState[key], props[key]) : props[key]
            }

            currentState = newState
        }
    }

    function wrap(oldFn, newFn) {
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