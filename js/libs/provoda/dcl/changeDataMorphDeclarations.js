define(function(require){
'use strict';
var StateReqMap = require('./effects/legacy/state_req/dcl')
var buildStateReqs = require('./effects/legacy/state_req/rebuild')

return function(self, props) {
  if (props.hasOwnProperty('req_map')) {
    var list = new Array(props.req_map.length);
    for (var i = 0; i < props.req_map.length; i++) {
      list[i] = new StateReqMap(props.req_map[i], i);
    }

    buildStateReqs(self, list)
  }
};


});
