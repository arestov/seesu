(function() {
"use strict";

var engine = require('./torrent-stream');

var address = require('network-address');
var events = require('events');
var querystring = require('querystring');
var util = require('util');


var downloads_index = {};
var hash_events = new events.EventEmitter();
var info_dictionaries_index = {};

var getServer = require('./tr_server');
var server = getServer(downloads_index, hash_events);
server.listen(8888);

var root_href = 'http://' + address() + ':' + server.address().port + '/';

var getMagnetTorrent = function(url) {
	url = decodeURI(url);
	var params = querystring.parse(url.replace(/^magnet\:\?/,''));
	var infoHash = params.xt && params.xt.indexOf('urn:btih:') === 0 && params.xt.replace('urn:btih:', '');
	if (infoHash && infoHash.length == 40) {
		return {
			infoHash: infoHash
		};
	}
};

var getTorrentObj = function(torrent) {
	if (typeof torrent == 'string' && torrent.match(/^magnet\:/)) {
		torrent = getMagnetTorrent(torrent);
		var torrent_with_dict = info_dictionaries_index[ torrent.infoHash ];
		if ( torrent_with_dict ) {
			torrent = util._extend(torrent, torrent_with_dict);
		}
	}
	return torrent;
};


var getCore = function(torrent, opts) {
	var torrent_obj = getTorrentObj(torrent);
	if (downloads_index[ torrent_obj.infoHash ]) {
		return downloads_index[ torrent_obj.infoHash ];
	}
	if (!opts) {opts = {};}

	var core = engine(torrent_obj || torrent, opts);
	core.once('destroy', function() {
		//core._destroyed = true;
		if (torrent_obj) {
			if (downloads_index[ torrent_obj.infoHash ] == core) {
				downloads_index[ torrent_obj.infoHash ] = null;
			}
		}
		
		
	});
	core.on('ready', function() {
		if ( !info_dictionaries_index[ core.reusable_torrent.infoHash ] ) {
			info_dictionaries_index[ core.reusable_torrent.infoHash ] = core.reusable_torrent;
		}

	});

	core.on('ready', function() {

		if (core.files && core.files.length) {
			core.files.forEach(function(file, i) {
				file.link = root_href + 'torrents/' + core.torrent.infoHash + '/' + i;
			});
			process.nextTick(function() {
				core.emit('served-files-list', core.files);
			});
			
		}
	});
	if (torrent_obj) {
		downloads_index[ torrent_obj.infoHash ] = core;
		hash_events.emit( 'hash-' + torrent_obj.infoHash, core );
	}
	return core;
	
};
module.exports = getCore;
})();