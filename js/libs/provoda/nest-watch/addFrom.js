define(function (require) {
'use strict';
var initDeclaredNestings = require('../initDeclaredNestings');
var addRootNestWatch = require('./add-remove').addRootNestWatch;

return function addFrom(target, lnest_watch) {
  var start_point  = lnest_watch.nwatch && lnest_watch.nwatch.start_point
  var start_md = start_point
    ? initDeclaredNestings.getSPByPathTemplate(target.app, target, start_point)
    : target;
  addRootNestWatch(start_md, lnest_watch);
};
});
