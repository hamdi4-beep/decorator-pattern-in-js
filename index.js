const createPlugin = (initialState = {}) => {
    let currentState = Object.assign({}, initialState)

    const plugin = {
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

            return plugin
        }
    }

    return plugin
}

const plugin = createPlugin({
    run() {
        console.log('The plugin is up and running!')
    }
})

plugin.extend({
    run(prev) {
        if (this.authenticated) return prev()
        console.log('The plugin is not authenticated yet!')
    },
    authenticate(token) {
        this.authenticated = this.secret === token
    },
    secret: 'secret_token'
})

const snapshot = plugin.getSnapshot()

snapshot.run() // won't run because the plugin is not yet authenticated (simulated)
snapshot.authenticate('secret_token')
snapshot.run()