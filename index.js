const createStore = (defaultState = {}) => ({
    getState: () => defaultState,
    updateState: createState(defaultState)
})

const createState = state =>
    props => {
        for (const key in props) {
            state[key] = typeof props[key] === 'function' && typeof state[key] === 'function' ?
                (function(prevFn, currFn) {
                    prevFn = prevFn.bind(state)

                    return function(...args) {
                        if (currFn.length > args.length) args[currFn.length - 1] = prevFn
                        return currFn.apply(state, args)
                    }
                })(state[key], props[key]) : props[key]
        }

        return state
    }

const store = createStore({
    generateRandomNumber() {
        return Math.floor(Math.random() * 9)
    }
})

store.updateState({
    generateRandomNumber(prevFn) {
        if (!prevFn.cached) prevFn.cached = {}
        if (!prevFn.cached['result']) prevFn.cached['result'] = prevFn()
        console.log(prevFn.cached['result'])
    }
})

const state = store.getState()

state.generateRandomNumber()
state.generateRandomNumber()
state.generateRandomNumber()
state.generateRandomNumber()