define(function(require) {
'use strict'
var pv = require('pv');
var pvUpdate = require('pv/update');
var spv = require('spv');
var pvUpdate = require('pv/update');

var NotifyCounter = spv.inh(pv.Model, {
  naming: function(fn) {
    return function NotifyCounter(opts, data, params) {
      fn(this, opts, data, params);
    };
  },
  init: function(self, opts, data, params) {
    self.messages = {};
    self.banned_messages = (params && params.banned_messages) || [];
  }
}, {
  addMessage: function(m) {
    if (!this.messages[m] && this.banned_messages.indexOf(m) == -1){
      this.messages[m] = true;
      this.recount();
    }
  },
  banMessage: function(m) {
    this.removeMessage(m);
    this.banned_messages.push(m);
  },
  removeMessage: function(m) {
    if (this.messages[m]){
      delete this.messages[m];
      this.recount();
    }
  },
  recount: function() {
    var counter = 0;
    for (var a in this.messages){
      ++counter;
    }
    pvUpdate(this, 'counter', counter);
  }
});

return NotifyCounter
})
