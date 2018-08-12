define(function(require) {
'use strict';

// var initWatchList = require('../../nest-watch/index').initList;
var Runner = require('./runner')

// var prsStCon = require('../../prsStCon');

return function (self) {
  if (!self._nest_by_type_listed || !self._nest_by_type_listed.compx) {
    return;
  }

  var compx_list = self._nest_by_type_listed.compx

  for (var i = 0; i < compx_list.length; i++) {
    var cur = compx_list[i]
    // debugger
    new Runner(self, cur);


    // prsStCon.connect.parent(self, cur);
    // prsStCon.connect.root(self, cur);
    // prsStCon.connect.nesting(self, cur);
    // debugger
    // initWatchList(self, cur.compx_nest_matches)

  }
}
})
