define(function (require) {
'use strict';
var spv = require('spv');
var pv = require('pv');
var createSource = require('./createSource');
var LoadableList = require('../../LoadableList');
var guessArtist = require('../guessArtist');
var morph_helpers = require('js/libs/morph_helpers');

var datamorph_map = new spv.MorphMap({
	is_array: true,
	source: 'tracks',
	props_map: {
		from: ['pleer.net'],
		type: ['mp3'],
		media_type: ['mp3'],

		_id: 'id',
		page_link: 'link',
		artist: [function (artist) {
			return artist && (artist + '');
		}, 'artist'],
		track: 'track',
		link: [function (link) {
      return link.replace('pleer.com/', 'pleer.net/');
		}, 'file'],
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
        return makeList(r, this.head.msq);
      }
    ],
    ['pleer_net', [
      ['msq'],
      function(api, opts, msq) {
    		return api.get('search', {
          q: msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || '')),
          limit: 30,
        }, opts);
      }
    ]]
  ],
}, LoadableList);

return createSource(Query);
});
