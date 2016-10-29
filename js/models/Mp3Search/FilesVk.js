define(function (require) {
'use strict';
var spv = require('spv');
var pv = require('pv');

return spv.inh(pv.Model, {}, {
  // 'nest_rqc-files': '^from-vk/[id]',
  // 'nest_req-files': [
  //   [
  //     function () {
  //       return {
  //         artist	: htmlencoding.decode(cursor.artist ? cursor.artist : cursor.audio.artist),
  //         duration	: parseFloat(typeof cursor.duration == 'number' ? cursor.duration : cursor.audio.duration) * 1000,
  //         link		: cursor.url ? cursor.url : cursor.audio.url,
  //         track		: htmlencoding.decode(cursor.title ? cursor.title : cursor.audio.title),
  //         from		: 'vk',
  //         downloadable: false,
  //         _id			: cursor.owner_id + '_' + cursor.id,
  //         type: 'mp3',
  //         media_type: 'mp3'
  //       }
  //     }
  //   ]
  //   // [{
  //   //   is_array: true,
  //   //   source: 'response.items',
  //   //   props_map: {
  //   //
  //   //     artist_name: 'name',
  //   //     artist: 'name',
  //   //     lfm_img: ['lfm_image', 'image']
  //   //   }
  //   // }],
  //   // declr_parsers.lfm.getArtists('similarartists', true),
  //   ['vk', 'audio.search', function(opts) {
  //     return ['artist.getSimilar', this.getRqData(opts.paging)];
  //   }]
  // ],
  // // 'compx-'
});

});
