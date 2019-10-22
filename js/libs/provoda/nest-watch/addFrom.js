define(function (require) {
'use strict';
var addRemove = require('./add-remove');
var addRootNestWatch = addRemove.addRootNestWatch;
var getStartModel = require('./getStartModel')

return function addFrom(target, lnest_watch) {
  var start_md = getStartModel(target, lnest_watch.nwatch)
  addRootNestWatch(start_md, lnest_watch);
};
});
