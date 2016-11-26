define(function (require) {
'use strict';
var spv = require('spv');
var pv = require('pv');
var SongFileModel = require('../SongFileModel');

var MusicFile = spv.inh(pv.Model, {
	naming: function(fn) {
		return function MusicFile(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	}
}, {
  sub_pager: {
    item: [
      SongFileModel,
      [[]],
      {
        customer: 'decoded_name'
      }
    ]
  }
});

return MusicFile;
});
