# Layered State Methods (Function Override Pattern)

This repo demonstrates a simple pattern for overriding object methods while retaining access to their previous implementations using closures.

Instead of replacing functions directly, each override wraps the previous one, allowing behavior to be extended safely — similar to decorators or middleware systems.

---

## 📦 Usage

### 1. Create the initial state

```js
const updateState = createState({
  getId() {
    return this.id
  }
})
```

### 2. Override while keeping access to the previous implementation

If the new method accepts more than one parameter, the previous implementation is automatically injected as the last argument.

```js
const state = updateState({
  id: Math.random() * 9,
  getId(prevFn) {
    const result = Math.floor(prevFn())
    console.log(result)
  }
})
```

### 3. Call the method normally

```js
state.getId()
```

### Pattern

Each override layers on top of the previous implementation:

```nginx
newMethod → oldMethod → olderMethod → ...
```

This enables:

- Behavior composition

- Safe method extension

- Function chaining

- Plugin/middleware-style logic
