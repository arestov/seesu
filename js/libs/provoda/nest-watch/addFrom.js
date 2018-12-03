define(function (require) {
'use strict';
var addRootNestWatch = require('./add-remove').addRootNestWatch;
var getStartModel = require('./getStartModel')

return function addFrom(target, lnest_watch) {
  var start_md = getStartModel(target, lnest_watch.nwatch)
  addRootNestWatch(start_md, lnest_watch);
};
});
