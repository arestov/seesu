define(function (require) {
'use strict';
var pv = require('pv');
var createSource = require('./createSource');

return pv.behavior({
  sub_pager: {
    item: [
      createSource(),
      [[]],
      {
        search_name: 'decoded_name'
      }
    ]
  },
});



});
