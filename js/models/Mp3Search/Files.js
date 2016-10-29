define(function (require) {
'use strict';
var spv = require('spv');
var pv = require('pv');
var FilesVk = require('./FilesVk');

var SFileBase = spv.inh(pv.Model, {}, {});

return spv.inh(pv.Model, {}, {
  sub_pager: {
    type: {
      'from-vk': 'vk',
      'query-vk': 'vk-query',
    },
    by_type: {
      vk: [
        SFileBase, null, {
          search_name: 'simple_name'
        }
      ],
      'vk-query': [
        FilesVk, null, {
          search_name: 'simple_name'
        }
      ],
    }
  },
});

});
