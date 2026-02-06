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
    version: 1,
    method() {
        console.log(this.version)
    }
})

api.updateState({
    version: 2,
    method(prevFn) {
        prevFn()
        console.log(this.version)
    }
})

api.updateState({
    version: 3,
    method(prevFn) {
        prevFn()
        console.log(this.version)
    }
})

const state = api.getState()
state.method()