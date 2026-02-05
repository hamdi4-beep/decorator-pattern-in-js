const createApi = (initialState = {}) => {
    let currentState = Object.assign({}, initialState)

    return {
        getState: () => currentState,
        updateState(props) {
            const newState = Object.assign({}, currentState)

            for (const key in props)
                newState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    (function(prevFn, newFn) {
                        return function(...args) {
                            return newFn.apply(currentState, args.concat(prevFn))
                        }
                    })(currentState[key].bind(currentState), props[key]) : props[key]

            currentState = newState
        }
    }
}

const api = createApi({
    generateRandomNumber(seed) {
        return Math.floor(Math.random() * seed)
    }
})

const snapshot1 = api.getState()

api.updateState({
    generateRandomNumber(seed, prevFn) {
        if (!prevFn.cachedResult) prevFn.cachedResult = prevFn(seed)
        console.log(prevFn.cachedResult)
    }
})

const state = api.getState()

state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)
state.generateRandomNumber(9)