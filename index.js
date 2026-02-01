const createStore = (defaultState = {}) => ({
    getState: () => defaultState,
    updateState: initializeState(defaultState)
})

function initializeState(state) {
    return props => {
        for (const key in props)
            state[key] = typeof state[key] === 'function' && key in state ?
                ((prevFn, currFn) => {
                    return function(...args) {
                        prevFn = prevFn.bind(state)
                        return currFn.apply(state, args.concat(prevFn))
                    }
                })(state[key], props[key]) : props[key]

        return state
    }
}

const store = createStore({
    createList(n) {
        const list = []
        for (let i = 0; i < n; i++) list.push(list[i])
    }
})

store.updateState({
    createList(n, prevFn) {
        console.time('timing')
        prevFn(n)
        console.timeEnd('timing')
    }
})

const state = store.getState()
state.createList(10000)