define(function (require) {
'use strict';

var initDeclaredNestings = require('../initDeclaredNestings');

return function addNestWatch(target, lnest_watch, skip) {
  var start_md = lnest_watch.start_point ? initDeclaredNestings.get(target.app, target, lnest_watch.start_point) : target;
  start_md.addNestWatch(lnest_watch, skip);
};
});
