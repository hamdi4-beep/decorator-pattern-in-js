function createState(state) {
    return props => {
        for (const key in props)
            state[key] = typeof state[key] === 'function' && key in state ?
                (function(currFn, prevFn) {
                    prevFn = prevFn.bind(state)

                    return function(...args) {
                        if (currFn.length > 1) args[currFn.length - 1] = prevFn
                        return currFn.apply(state, args.length === 0 ? [prevFn] : args)
                    }
                })(props[key], state[key]) : props[key]

        return state
    }
}

const updateState = createState({
    getId() {
        return this.id
    }
})

const state = updateState({
    id: 1,
    getId(a, prevFn, b) {
        console.log(a, prevFn, b)
    }
})

state.getId(1, 2)