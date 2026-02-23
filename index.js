const createApi = () => {
    let currentState = {}

    return {
        getSnapshot: () => currentState,
        compose(props) {
            const newState = {...currentState}

            for (const key in props) {
                newState[key] = typeof currentState[key] === 'function' && typeof props[key] === 'function' ?
                    (function(oldFn, newFn) {
                        return function(...args) {
                            return newFn.apply(newState, args.concat(oldFn))
                        }
                    })(currentState[key].bind(currentState), props[key]) : props[key]
            }

            currentState = newState
        }
    }
}

const api = createApi()

api.compose({
    version: 1,
    method() {
        console.log(this.version)
    }
})

api.compose({
    version: 2,
    method(prev) {
        prev()
        console.log(this.version)
    }
})

const snapshot = api.getSnapshot()
snapshot.method()
