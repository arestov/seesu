define(function(require) {
'use strict';

var spv = require('spv');
var AppModel = require('pv/AppModel');
var prepare = require('js/libs/provoda/structure/prepare');



return function fakeApp(props, init) {
  var initSelf = init || function() {};
  var all = {
    init: function(self) {
      self.app = self;
      initSelf(self);
    },
  };
  var model_name = props.model_name || 'app_model'
  var App = spv.inh(AppModel, all, {...props, model_name});
  return prepare(App);
}

});
