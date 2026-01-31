const createStore = (defaultState = {}) => ({
    getState: () => defaultState,
    updateState: initializeState(defaultState)
})

function initializeState(state) {
    return props => {
        for (const key in props)
            state[key] = typeof state[key] === 'function' && key in state ?
                (function(prevFn, currFn) {
                    prevFn = prevFn.bind(state)

                    return function(...args) {
                        if (currFn.length > args.length) {
                            const lastArgIndex = args.length
                            args[lastArgIndex] = prevFn
                        }

                        return currFn.apply(state, args.length === 0 ? [prevFn] : args)
                    }
                })(state[key], props[key]) : props[key]

        return state
    }
}

const store = createStore({
    method() {
        const list = []
        for (let i = 0; i < 5000; i++) list.push(list[i])
    }
})

store.updateState({
    method(prevFn) {
        console.time()
        prevFn()
        console.timeEnd()
    }
})

const state = store.getState()
state.method()