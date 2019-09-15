module.exports = function () {
  return {
    source_name: 'fake',
    errors_fields: [],
    get() {
      const p = Promise.resolve({ bio: 'was born' })
      p.abort = function () {}

      return p
    },
  }
}
