define(function(require) {
'use strict';

var spv = require('spv');
var AppModel = require('js/models/AppModelBase');
var prepare = require('js/libs/provoda/structure/prepare');



return function fakeApp(props, init) {
  var initSelf = init || function() {};
  var all = {
    init: function(self) {
      self.app = self;
      initSelf(self);
    },
  };
  var App = spv.inh(AppModel, all, props);
  return prepare(App);
}

});
