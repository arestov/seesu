define(function (require) {
'use strict';
var pv = require('pv');
var htmlencoding = require('js/common-libs/htmlencoding');
var QueryBase = require('./QueryBase');
var createSource = require('./createSource');

var Query = pv.behavior({
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
}, QueryBase);


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

return createSource(Query, 'https://vk.com/dmca');
});
