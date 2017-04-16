define(function (require) {
'use strict';
var pv = require('pv');
var QueryBase = require('./QueryBase');
var createSource = require('./createSource');
var getQMSongIndex = require('../QMI').getQMSongIndex;
var guessArtist = require('../guessArtist');

var Query = pv.behavior({
  'nest_req-files': [
    [
      function (r, _1, _2, api) {
        if (!r || !r.length) {return;}
        var msq = this.head.msq;
        var result = [];
        for (var i = 0; i < r.length; i++) {
          if (!r[i]) {continue;}
          var file = parseTrack(r[i], msq, api.client_id);
          if (!file) {continue;}

          var qmi = getQMSongIndex(msq, file);
          if (qmi == -1) {continue;}

          result.push(file);
        }

        return result;
      }
    ],
    ['#fanburst_api', [
      ['msq'],
      function(api, opts, msq) {
    		return api.get('tracks/search', {
          query: msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || '')),
          per_page: 30,
          offset: 0,
        }, opts);
      }
    ]]
  ],
}, QueryBase);

function parseTrack(item, msq, client_id) {
  var guess_info = guessArtist(item.title, msq && msq.artist);

  if (!guess_info.artist || !guess_info.track) {return;}

  return {
    from: 'fanburst',
    type: 'mp3',
    media_type: 'mp3',

    _id: item.id,
    page_link: item.url,
    artist: guess_info.artist,
    track: guess_info.track,
    link: item.stream_url + "?client_id=" + client_id,
    duration: item.duration * 1000,
  };
}

return pv.behavior({
  'compx-ready': [[], function () {
    return true;
  }],
}, createSource(Query, 'http://soundcloud.com/pages/dmca_policy'));
});
