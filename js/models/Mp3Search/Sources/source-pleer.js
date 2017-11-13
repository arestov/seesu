define(function (require) {
'use strict';
var spv = require('spv');
var pv = require('pv');
var QueryBase = require('./QueryBase');
var createSource = require('./createSource');
var guessArtist = require('../guessArtist');
var morph_helpers = require('js/libs/morph_helpers');

var redirect = function (link) {
  return link.replace('pleer.com', 'pleer.net');
};

var datamorph_map = new spv.MorphMap({
  is_array: true,
  source: 'tracks',
  props_map: {
    from: ['pleer.net'],
    type: ['mp3'],
    media_type: ['mp3'],

    _id: 'id',
    page_link: [redirect, 'link'],
    artist: [function (artist) {
      return artist && (artist + '');
    }, 'artist'],
    track: 'track',
    link: [redirect, 'file'],
    duration: ['timestamp', 'length']
  }
}, morph_helpers);

function makeList(r, msq) {
  var list = datamorph_map(r);
  var music_list = [];

  for (var i = 0; i < list.length; i++) {
    var item = makeSong(list[i], msq);
    music_list.push(item);
  }

  return music_list;
}


function makeSong(cursor, msq){
  if (!cursor.artist){
    var guess_info = guessArtist(cursor.track, msq && msq.artist);
    if (guess_info.artist){
      cursor.artist = guess_info.artist;
      cursor.track = guess_info.track;
    }
  }

  return cursor;
}

var Query = pv.behavior({
  'nest_req-files': [
    [
      function (r) {
        return makeList(r, this.head.msq);
      }
    ],
    ['#pleer_net', [
      ['msq'],
      function(api, opts, msq) {
        return api.get('search', {
          q: msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || '')),
          limit: 30,
        }, opts);
      }
    ]]
  ],
}, QueryBase);
return pv.behavior({
  "+states": {
    "ready": [
      "compx",
      ['#env.cross_domain_allowed']
    ]
  }
}, createSource(Query, 'http://pleer.net/feedback'));
});
