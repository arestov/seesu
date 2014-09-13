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


var bindInfoUpdates = function(core) {
	return setInterval(function() {
		var active = function(wire) {return !wire.peerChoking;};
		var swarm = core.swarm;
		var BUFFERING_SIZE = 10 * 1024 * 1024;

		var upload_speed = swarm.uploadSpeed(); // upload speed
		var final_upload_speed = '0 B/s';
		if(!isNaN(upload_speed) && upload_speed != 0){
			var converted_speed = Math.floor( Math.log(upload_speed) / Math.log(1024) );
			final_upload_speed = ( upload_speed / Math.pow(1024, converted_speed) ).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_speed]+'/s';
		}

		var download_speed = swarm.downloadSpeed(); // download speed
		var final_download_speed = '0 B/s';
		if(!isNaN(download_speed) && download_speed != 0){
			var converted_speed = Math.floor( Math.log(download_speed) / Math.log(1024) );
			final_download_speed = ( download_speed / Math.pow(1024, converted_speed) ).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_speed]+'/s';
		}



		swarm.downloaded = (swarm.downloaded) ? swarm.downloaded : 0;

		var progress_info = {
			downloaded: swarm.downloaded,
			active_peers: swarm.wires.filter(active).length,
			total_peers: swarm.wires.length,
			uploadSpeed: final_upload_speed,
			downloadSpeed: final_download_speed,
			percent: Math.min(100, swarm.downloaded / ( BUFFERING_SIZE / 100 ) )
		};
		core.progress_info = progress_info;
		core.emit('progress_info-change', progress_info);
	}, 1000);
};


var getCore = function(torrent, opts) {
	var torrent_obj = getTorrentObj(torrent);
	if (downloads_index[ torrent_obj.infoHash ]) {
		return downloads_index[ torrent_obj.infoHash ];
	}
	if (!opts) {opts = {};}

	var core = engine(torrent_obj || torrent, opts);

	var update_interval = bindInfoUpdates(core);

	core.once('destroy', function() {
		//core._destroyed = true;
		if (torrent_obj) {
			if (downloads_index[ torrent_obj.infoHash ] == core) {
				downloads_index[ torrent_obj.infoHash ] = null;
			}
		}
		clearInterval(update_interval);
		
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