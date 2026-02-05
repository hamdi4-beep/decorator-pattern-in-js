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
    method() {
        console.log(this.id)
    }
})

// verifies the 'getState' method returns a snapshot of the state at the time it was defined.

const oldState = api.getState()
console.log(oldState)

api.updateState({
    id: 2,
    method(prevFn) {
        prevFn()
        console.log(this.id)
    }
})

// verifies the getState method has access to the most current snapshot.

const newState = api.getState()
console.log(newState)

// calls the method which has access to the previous implementation that holds a reference to the original state object.

newState.method()