define(function(require) {
'use strict'
// var spv = require('spv');
var app_serv = require('app_serv');
var app_env = app_serv.app_env;
var subscribeLfmAuthAction = require('./subscribeLfmAuthAction')

return {
  api: {
    "window": function() {
      return window;
    },
    "app_env": function() {
      return app_env
    }
  },
  produce: {
    "lfm_auth_subscribe": {
      api: ["self", "window", "app_env"],
      trigger: ["lfm_auth$exists"],
      require: "lfm_auth$exists",
      fn: function(self, win, app_env) {
        subscribeLfmAuthAction(self, win, app_env)
      }
    },
  }
}

})
