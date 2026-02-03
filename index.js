const createApi = (state = {}) => {
    let layers = 0

    return {
        getLayers: () => layers,
        getState: () => state,
        updateState(props) {
            for (const key in props) {
                state[key] = typeof props[key] === 'function' && typeof state[key] === 'function' ?
                    (function(prevFn, currFn) {
                        prevFn = prevFn.bind(state)
                        layers++
                        return (...args) => currFn.apply(state, [...args, prevFn])
                    })(state[key], props[key]) : props[key]
            }
        }
    }
}

const api = createApi({
    getId() {
        return 2
    }
})

api.updateState({
    getId(prevFn) {
        const result = prevFn()
        console.log(result)
    }
})

api.updateState({
    getId(prevFn) {
        prevFn()
        console.log('Number of layered calls:', api.getLayers())
    }
})

const state = api.getState()
state.getId()