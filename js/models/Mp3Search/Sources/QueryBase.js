define(function (require) {
'use strict';
var pv = require('pv');
var LoadableList = require('../../LoadableList');

return pv.behavior({
  "+states": {
    "nav_title": ["compx", []],

    "search_complete": [
      "compx",
      ['files$error', 'files$has_any'],
      function (has_error, has_any) {
        return has_error || has_any;
      }
    ],

    "has_request": [
      "compx",
      ['files$loading']
    ],

    "search_fail": ["compx", ['files$error']],

    "search_progress": [
      "compx",
      ['files$waiting_queue', 'files$loading'],
      function (waiting, loading) {
        return loading && !waiting;
      }
    ]
  },

  requestFiles: function () {
    if (this.getNesting('files')) {return;}

    var declr = this[ 'nest_req-files' ];
    return this.requestNesting( declr, 'files' );
  },

  'nest_rqc-files': '^files/[:_id]'
}, LoadableList);
});
