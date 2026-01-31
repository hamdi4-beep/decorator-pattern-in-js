function decorator(wrapper, prevFn, state) {
    return function(...args) {
        prevFn = prevFn.bind(state)
        return wrapper.apply(state, [...args, prevFn])
    }
}

const createStore = (defaultState = {}) => ({
    getState: () => defaultState,
    updateState: initializeState(defaultState)
})

function initializeState(state) {
    return props => {
        for (const key in props)
            state[key] = typeof state[key] === 'function' && key in state ?
                decorator(props[key], state[key], state) : props[key]

        return state
    }
}

const store = createStore({
    createList() {
        const list = []
        for (let i = 0; i < 5000; i++) list.push(list[i])
    }
})

store.updateState({
    createList(prevFn) {
        console.time('timing')
        prevFn()
        console.timeEnd('timing')
    }
})

const state = store.getState()
state.createList()