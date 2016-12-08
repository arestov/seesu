define(function (require) {
'use strict';
var htmlencoding = require('js/common-libs/htmlencoding');
var pv = require('pv');
var createSource = require('./createSource');
var LoadableList = require('../../LoadableList');


var Query = pv.behavior({
  'compx-nav_title': [['']],
  requestFiles: function () {
    if (this.getNesting('files')) {return;}
    
    var declr = this[ 'nest_req-files' ];
    return this.requestNesting( declr, 'files' );
  },
  'nest_rqc-files': '^files/[:_id]',
  'nest_req-files': [
    [
      function (r) {
        return makeMusicList(r.response.items);
      }
    ],
    ['vk_api', [
      ['msq'],
      function(api, opts, msq) {
        return api.get('audio.search', {
          q: msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || '')),
          count: 30,
          sort: 2,
        }, opts);
      }
    ]]
  ],
}, LoadableList);


function makeSong(cursor){
  if (!cursor || !cursor.url) {
    return;
  }
  return {
    artist	: htmlencoding.decode(cursor.artist ? cursor.artist : cursor.audio.artist),
    duration	: parseFloat(typeof cursor.duration == 'number' ? cursor.duration : cursor.audio.duration) * 1000,
    link		: cursor.url ? cursor.url : cursor.audio.url,
    track		: htmlencoding.decode(cursor.title ? cursor.title : cursor.audio.title),
    from		: 'vk',
    downloadable: false,
    _id			: cursor.owner_id + '_' + cursor.id,
    type: 'mp3',
    media_type: 'mp3'
  };
}

function makeMusicList(r, msq) {
  var music_list = [];
  for (var i=0, l = r.length; i < l; i++) {
    var entity = makeSong(r[i], msq);
    if (!entity) {
      continue;
    }
    if (!entity.link.match(/audio\/.mp3$/)){
      music_list.push(entity);
    }
  }
  return music_list;
}

return createSource(Query);
});
