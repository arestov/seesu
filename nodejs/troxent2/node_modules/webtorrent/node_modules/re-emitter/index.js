module.exports = reemit
module.exports.filter = filter

var EventEmitter = require('events').EventEmitter

function reemit (source, target, events, handleDestr) {
  if (!Array.isArray(events)) events = [ events ]
  var result = []

  events.forEach(function (event) {
    var callback = function () {
      var args = [].slice.call(arguments)
      args.unshift(event)
      target.emit.apply(target, args)
    }
    source.on(event, callback)

    var destroyer = function(){
      source.removeListener(event, callback)
    }
    
    result.push(destroyer)

    if (handleDestr) {
      handleDestr(target, destroyer)
    }
  })

  return result;
}

function filter (source, events) {
  var emitter = new EventEmitter()
  emitter._destroyers = reemit(source, emitter, events)
  return emitter
}
