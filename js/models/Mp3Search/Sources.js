define(function (require) {
'use strict';
var pv = require('pv');
var MusicFile = require('./MusicFile');

var Source = pv.behavior({
  sub_pager: {
    type: {
      files: 'file'
    },
    by_type: {
      file: [
        MusicFile, null, {
          id: 'by_slash.0'
        }
      ],
    }
  }
});


return pv.behavior({
  sub_pager: {
    item: [
      Source,
      [[]],
      {
        search_name: 'decoded_name'
      }
    ]
  },
});



});
