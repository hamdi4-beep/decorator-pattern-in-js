const createApi = (initialState = {}) => {
    let currentState = {...initialState}

    return {
        getState: () => currentState,
        updateState(props) {
            const newState = {...currentState}

            for (const key in props)
                newState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    wrap(currentState[key], props[key]) : props[key]

            currentState = newState
        }
    }

    function wrap(oldFn, newFn) {
        const oldFnBound = oldFn.bind(currentState)
        return (...args) => newFn.apply(currentState, args.concat(oldFnBound))
    }
}

const api = createApi({
    id: 1,
    method(msg) {
        console.log(msg, this.id)
    }
})

api.updateState({
    id: 2,
    method(msg, prevFn) {
        prevFn('Invoked from the current method:')
        console.log(msg, this.id)
    }
})

const state = api.getState()
state.method('Invoked after the method was redefined:')