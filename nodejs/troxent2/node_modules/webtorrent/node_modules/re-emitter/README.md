# re-emitter [![travis](https://img.shields.io/travis/feross/re-emitter.svg)](https://travis-ci.org/feross/re-emitter) [![npm](https://img.shields.io/npm/v/re-emitter.svg)](https://npmjs.org/package/re-emitter) [![downloads](https://img.shields.io/npm/dm/re-emitter.svg)](https://npmjs.org/package/re-emitter)

#### Re emit events from another emitter

![reemit](https://raw.githubusercontent.com/feross/re-emitter/master/img.jpg)

[![browser support](https://ci.testling.com/feross/re-emitter.png)](https://ci.testling.com/feross/re-emitter)

### install

```
npm install re-emitter
```

### usage

```js
var emitter = new EventEmitter()
var other = new EventEmitter()

reemit(emitter, other, ['foo', 'bar'])

other.on('foo', function () {
  t.pass('foo fired')
})

emitter.emit('foo')

other.on('baz', function () {
  t.fail('baz should not fire on other emitter')
})

emitter.emit('baz')

emitter.on('bar', function () {
  t.fail('bar should not fire on original emitter')
})

other.emit('bar')
```

### contributors

- Raynos
- Feross

### license

MIT. Copyright (c) Raynos.
