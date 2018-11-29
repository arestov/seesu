const waitFlow = require('./waitFlow')


module.exports = app => {
  const step = fn => () => waitFlow(app).then(() => fn())
  const steps = fns => fns.reduce((result, fn) => result.then(step(fn)), waitFlow(app))
  return steps
}
