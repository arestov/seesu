define(function (require) {
'use strict';
var pv = require('pv');
var SourceVk = require('./source-vk');
var SourceSoundcloud = require('./source-soundcloud');
var SourceFanburst = require('./source-fanburst');
var SourcePleer = require('./source-pleer');

var search_name_head = {
  search_name: 'by_slash.0'
}

return pv.behavior({
  sub_page: {
    // 'vk': {
    //   constr: SourceVk,
    //   title: [[]],
    // },
    'soundcloud': {
      constr: SourceSoundcloud,
      title: [[]],
      head: search_name_head,
    },
    'pleer.net': {
      constr: SourcePleer,
      title: [[]],
      head: search_name_head,
    },
    'fanburst': {
      constr: SourceFanburst,
      title: [[]],
      head: search_name_head,
    }
  }
});



});
