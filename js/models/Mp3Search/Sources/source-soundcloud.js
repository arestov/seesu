define(function (require) {
'use strict';
var htmlencoding = require('js/common-libs/htmlencoding');
var pv = require('pv');
var createSource = require('./createSource');
var LoadableList = require('../../LoadableList');
var guessArtist = require('../guessArtist');

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
      function (r, _1, _2, api) {
        if (!r || !r.length) {return;}
        var result = [];
        for (var i = 0; i < r.length; i++) {
          if (!r[i]) {continue;}

          result.push(makeSong(r[i], this.head.msq, api.key));
        }

        return result;
      }
    ],
    ['sc_api', [
      ['msq'],
      function(api, opts, msq) {
    		return api.get('tracks', {
          filter:'streamable,downloadable',
          q: msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || '')),
          limit: 30,
          offset: 0,
        }, opts);
      }
    ]]
  ],
}, LoadableList);

function makeSong(cursor, msq, sc_api_key){
	var search_string = cursor.title;
	if (!search_string) {return;}

	var guess_info = guessArtist(search_string, msq && msq.artist);

	return {
		artist		: htmlencoding.decode(guess_info.artist || cursor.user.permalink || ""),
		track		: htmlencoding.decode(guess_info.track || search_string),
		duration	: cursor.duration,
		link		: (cursor.download_url || cursor.stream_url) + '?consumer_key=' + sc_api_key,
		from		: 'soundcloud',
		real_title	: cursor.title,
		page_link	: cursor.permalink_url.replace(/^http\:/, 'https:'),
		description : htmlencoding.decode(cursor.description) || false,
		downloadable: cursor.downloadable,
		_id			: cursor.id,
		type: 'mp3',
		media_type: 'mp3',
	};
}

return createSource(Query);

});
