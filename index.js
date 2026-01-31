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
    id: Math.random() * 9,
    getId(prevFn) {
        const result = Math.floor(prevFn())
        console.log(result)
    }
})

state.getId()