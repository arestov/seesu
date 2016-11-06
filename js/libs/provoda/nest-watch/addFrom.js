define(function (require) {
'use strict';
var initDeclaredNestings = require('../initDeclaredNestings');
var addNestWatch = require('./add-remove').addNestWatch;

return function addFrom(target, lnest_watch, skip) {
  var start_md = lnest_watch.nwatch.start_point
    ? initDeclaredNestings.getSPByPathTemplate(target.app, target, lnest_watch.nwatch.start_point)
    : target;
  addNestWatch(start_md, lnest_watch, skip);
};
});