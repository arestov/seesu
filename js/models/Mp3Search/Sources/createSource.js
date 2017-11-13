define(function (require) {
'use strict';
var pv = require('pv');
var MusicFile = require('../MusicFile');

var BlankQuery = pv.behavior({
  // 'api-eng': function () {
  //   return null;
  // },
  requestFiles: function () {
    console.log('BlankQuery requesting');
  },
});

return function (Query, dmca_url, File) {
  return pv.behavior({
    "+states": {
      "dmca_url": [
        "compx",
        [],
        function () {
          return dmca_url;
        }
      ]
    },

    head_by_urlname: {
      search_name: 'by_slash.0'
    },

    sub_pager: {
      type: {
        queries: 'query',
        files: 'file'
      },
      by_type: {
        file: [
          File || MusicFile, null, {
            id: 'by_slash.0'
          }
        ],
        query: [
          Query || BlankQuery, null, {
            artist_name: 'by_comma.0',
            track_title: 'by_comma.1',
            'msq.artist': 'by_comma.0',
            'msq.track': 'by_comma.1',
          }
        ],
      }
    }
  });
};
});
