const createApi = (initialState = {}) => {
    let currentState = Object.assign({}, initialState)

    return {
        getSnapshot: () => currentState,
        extend(props) {
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
    id: 1,
    method() {
        console.log(this.id)
    }
})

api.extend({
    id: 2,
    method(prev) {
        prev()
        console.log(this.id)
    }
})

api.extend({
    id: 3,
    method(prev) {
        prev()
        console.log(this.id)
    }
})

const snapshot = api.getSnapshot()
snapshot.method()