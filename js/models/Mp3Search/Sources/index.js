define(function (require) {
'use strict';
var pv = require('pv');
var SourceVk = require('./source-vk');
var SourceSoundcloud = require('./source-soundcloud');
var SourceFanburst = require('./source-fanburst');
var SourcePleer = require('./source-pleer');

return pv.behavior({
  sub_page: {
    // 'vk': {
    //   constr: SourceVk,
    //   title: [[]],
    // },
    'soundcloud': {
      constr: SourceSoundcloud,
      title: [[]],
    },
    'pleer.net': {
      constr: SourcePleer,
      title: [[]],
    },
    'fanburst': {
      constr: SourceFanburst,
      title: [[]],
    }
  }
});



});
