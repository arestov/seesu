define(function (require) {
'use strict';
var pv = require('pv');
var QueryBase = require('./QueryBase');
var createSource = require('./createSource');
var parseVkTrack = require('js/modules/declr_parsers').vk.parseTrack;

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


function makeMusicList(r) {
  var music_list = [];
  for (var i=0, l = r.length; i < l; i++) {
    var entity = parseVkTrack(r[i]);
    if (!entity) {
      continue;
    }
    if (!entity.link.match(/audio\/.mp3$/)){
      music_list.push(entity);
    }
  }
  return music_list;
}

return pv.behavior({
  "+states": {
    "ready": [
      "compx",
      ['#vk_search_ready']
    ]
  }
}, createSource(Query, 'https://vk.com/dmca'));

});
