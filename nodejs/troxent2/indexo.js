(function() {
"use strict";
process.env.DEBUG = '*,-bittorrent-dht';



var EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 0;

var WebTorrent = require('webtorrent');
//var DHT = require('./torrent-stream/node_modules/bittorrent-dht');


var downloads_index = {};
var info_dictionaries_index = {};

var querystring = require('querystring');
var util = require('util');


var address = require('network-address');
var events = require('events');
var getServer = require('./lib/tr_server');


var hash_events = new events.EventEmitter();
var server = getServer(downloads_index, hash_events);
server.listen(8888);

var root_href = 'http://' + address() + ':' + server.address().port + '/';






var getMagnetTorrent = function(url) {
	url = decodeURI(url);
	var params = querystring.parse(url.replace(/^magnet\:\?/,''));
	var infoHash = params.xt && params.xt.indexOf('urn:btih:') === 0 && params.xt.replace('urn:btih:', '');
	if (infoHash && infoHash.length == 40) {
		var obj = {
			announce: [
				"udp://tracker.openbittorrent.com:80",
				'udp://tracker.ccc.de:80',
				'udp://tracker.istole.it:80',
				//'udp://tracker.istole.it:6969',
				"udp://tracker.publicbt.com:80"
			],
			infoHash: infoHash
		};
		console.log('build', obj);
		return obj;
	}
};

var getTorrentObj = function(torrent) {
	if (typeof torrent == 'string' && torrent.match(/^magnet\:/)) {
		torrent = getMagnetTorrent(torrent);

		/*
		var torrent_with_dict = info_dictionaries_index[ torrent.infoHash ];
		if ( torrent_with_dict ) {
			torrent = util._extend(torrent, torrent_with_dict);
		}
		*/
	}
	return torrent;
};
/*

var bindInfoUpdates = function(core) {
	return setInterval(function() {
		var active = function(wire) {return !wire.peerChoking;};
		var swarm = core.swarm;
		var BUFFERING_SIZE = 10 * 1024 * 1024;

		var upload_speed = swarm.uploadSpeed(); // upload speed
		var final_upload_speed = '0 B/s';
		if(!isNaN(upload_speed) && upload_speed !== 0){
			var converted_speed = Math.floor( Math.log(upload_speed) / Math.log(1024) );
			final_upload_speed = ( upload_speed / Math.pow(1024, converted_speed) ).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_speed]+'/s';
		}

		var download_speed = swarm.downloadSpeed(); // download speed
		var final_download_speed = '0 B/s';
		if(!isNaN(download_speed) && download_speed !== 0){
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
			percent: Math.min(100, swarm.downloaded / ( BUFFERING_SIZE / 100 ) ).toFixed(2)
		};
		core.progress_info = progress_info;
		core.emit('progress_info-change', progress_info);
	}, 1000);
};
*/
var client = new WebTorrent();
//var dht;
var count = function(obj) {
	var count = 0;
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop) && obj[prop]) {
			count++;
		}
	}
	return count;
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
require('./test');
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////




var getCore = function(torrent_link, opts, prevalidate) {
	
	var torrent_obj = getTorrentObj(torrent_link);
	var infoHash = torrent_obj.infoHash;
	console.log("REQUEST", infoHash);
	//if (downloads_index[ infoHash ]) {
	//	return downloads_index[ infoHash ];
	//}

	//if (!opts) {opts = {};}


	/*
	if (!dht) {
		dht = DHT();
	}
	opts.dht = dht;
	*/


	var torrent = client.add(torrent_obj);

	if (torrent.ready) {
		console.log('already ready!');
	}

	torrent.once('ready', function(){
		var parsedTorrent = torrent.parsedTorrent;
		if ( !info_dictionaries_index[ parsedTorrent.infoHash ] ) {
			info_dictionaries_index[ parsedTorrent.infoHash ] = parsedTorrent;
			console.log('Cached:', parsedTorrent.infoHash);
		} else {
			console.log('wat1')
		}
		
	});

	//var core = engine(torrent_obj || torrent, opts);
	//var update_interval = bindInfoUpdates(core);



	

	torrent.once('destroy', function() {
		//core._destroyed = true;
		if (torrent_obj) {
			if (downloads_index[ infoHash ] == torrent) {
				downloads_index[ infoHash ] = null;
			}
		} else {
			console.log('cant destr')
		}
		//clearInterval(update_interval);
		
	});


	/*

	core.on('ready', function() {
		if ( !info_dictionaries_index[ core.reusable_torrent.infoHash ] ) {
			info_dictionaries_index[ core.reusable_torrent.infoHash ] = core.reusable_torrent;
			console.log('Cached:', core.reusable_torrent.infoHash);
		}

	});

	*/

	torrent.once('ready', function() {
		var error = prevalidate && prevalidate(torrent.parsedTorrent);
		if (error) {
			torrent.emit('prevalidation-error', error);
			console.log(error, infoHash);
		} else {
			console.log('files', infoHash);
			var array = torrent.parsedTorrent.files.map(function(src_file, i){
				var file = util._extend({}, src_file);
				file.link = root_href + 'torrents/' + torrent.infoHash + '/' + i;
				return file;

			});
			process.nextTick(function() {
				torrent.emit('served-files-list', array);
			});
		}

	});
	if (torrent_obj) {
		downloads_index[ infoHash ] = torrent;
		//hash_events.emit( 'hash-' + infoHash, torrent );
		console.log( 'after addition', count( downloads_index ));
	} else {
		console.log( 'no obj', infoHash);
	}
	return torrent;
	
};
module.exports = {
	get: getCore,
	remove: function(torrent_link, torrent) {
		var torrent_obj = getTorrentObj(torrent_link);
		if (torrent_obj) {

			//var torrent = client.get(torrent_obj);
			var infoHash = torrent_obj.infoHash;
			
			if (downloads_index[ infoHash ] == torrent) {
				console.log("REMOVE", infoHash);
				downloads_index[ infoHash ] = null;
				client.remove(torrent_obj);
				console.log( 'after removing', count( downloads_index ) );
			}
			
		}
	},
	parse: getTorrentObj
};

})();