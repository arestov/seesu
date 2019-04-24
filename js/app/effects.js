define(function(require) {
'use strict'
// var spv = require('spv');
var subscribeLfmAuthAction = require('./subscribeLfmAuthAction')

return {
  api: {
    "window": function() {
      return window;
    }
  },
  produce: {
    "lfm_auth_subscribe": {
      api: ["self", "window"],
      trigger: ["lfm_auth$exists", "env"],
      require: "lfm_auth$exists",
      fn: function(self, win, _, env) {
        subscribeLfmAuthAction(self, win, env)
      }
    },
  }
}

})
