process.env.DEBUG = '*,-bittorrent-dht';
var EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 0;

var WebTorrent = require('webtorrent');
var querystring = require('querystring');
var util = require('util');


var address = require('network-address');
var events = require('events');
var getServer = require('./lib/tr_server');

var downloads_index = {};
var info_dictionaries_index = {};

var hash_events = new events.EventEmitter();
var server = getServer(downloads_index, hash_events);
server.listen(8888);

var root_href = 'http://' + address() + ':' + server.address().port + '/';

process.on('uncaughtException', function(err) {
	console.log(err, err.stack);
	debugger;
});



var getMagnetTorrent = function(url) {
	url = decodeURI(url);
	var params = querystring.parse(url.replace(/^magnet\:\?/,''));
	var infoHash = params.xt && params.xt.indexOf('urn:btih:') === 0 && params.xt.replace('urn:btih:', '');
	if (infoHash && infoHash.length == 40) {
		var obj = {
			infoHash: infoHash,
			announce: [
				"udp://tracker.openbittorrent.com:80",
				'udp://tracker.ccc.de:80',
				'udp://tracker.istole.it:80',
				"udp://tracker.publicbt.com:80"
			]
		};
		//console.log('build', obj);
		return obj;
	}
};

var getTorrentObj = function(torrent) {
	if (typeof torrent == 'string' && torrent.match(/^magnet\:/)) {
		torrent = getMagnetTorrent(torrent);
	}
	return torrent;
};


var client = new WebTorrent();



var logReady = function(mark, dname, infoHash) {
	console.log(mark + ':', dname, infoHash, (Date.now() - start)/1000 );
};
var load = function(mark, item, dname) {
	var torrent = client.add(item);
	if (torrent.ready) {
		logReady(mark, dname, torrent.parsedTorrent.infoHash);
	}
	torrent.once('ready', function() {
		logReady(mark, dname, torrent.parsedTorrent.infoHash);
		
	});
	return torrent;
};

var prevalidate;
var loaded = Date.now();
console.log('test loaded', new Date());
var start = Date.now();
console.log(start - loaded);

var count = function(obj) {
	var count = 0;
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop) && obj[prop]) {
			count++;
		}
	}
	return count;
};


module.exports = {
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
	parse: getTorrentObj,
	get: function(torrent_link) {
		//console.log(torrent_link);
		var torrent_obj = getTorrentObj(torrent_link);
		var infoHash = torrent_obj.infoHash;
		//console.log("REQUEST", infoHash);

		if (downloads_index[ infoHash ]) {
			return downloads_index[ infoHash ];
		}

		if (info_dictionaries_index[infoHash]) {
			torrent_obj = info_dictionaries_index[infoHash];
		}

		var torrent = load('READY!', torrent_obj, torrent_link);
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

		torrent.once('ready', function(){
			var parsedTorrent = torrent.parsedTorrent;
			if ( !info_dictionaries_index[ parsedTorrent.infoHash ] ) {
				info_dictionaries_index[ parsedTorrent.infoHash ] = parsedTorrent;
				console.log('Cached:', parsedTorrent.infoHash);
			} else {
				console.log('wat1')
			}
			
		});

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
		if (torrent_obj) {
			downloads_index[ infoHash ] = torrent;
			//hash_events.emit( 'hash-' + infoHash, torrent );
			console.log( 'after addition', count( downloads_index ));
		} else {
			console.log( 'no obj', infoHash);
		}
		return torrent;
	}	
};


['magnet:?xt=urn:btih:d74ca7163aa49ecf5c75bf31fbb02ac4d420157f&dn=Volor%20Flex',
'magnet:?xt=urn:btih:ceae1eb9150cbfc94d45f16746c5a57a2589e37c&dn=Various%20Artists%20-%20Origami%20Sound%20-%202%20Years%20%282013%29',
'magnet:?xt=urn:btih:eb3705592f51d053ebb05d29cb26861b5684425e&dn=CURLYROCK%20DISCOGRAPHY%20MP3',
'magnet:?xt=urn:btih:1e2002b90ac86d532b5574585a087f97fb34954a&dn=Volor%20Flex%20-%20Tramp',
'magnet:?xt=urn:btih:0489135be8eecc86d27f072f3e7f731b48781930&dn=Volor%20Flex%20-%20Tramp%20%282011%29',
'magnet:?xt=urn:btih:5bc8bd1955b98e536f6fde9c8b3c293416424ed1&dn=Volor%20Flex'].forEach(function(torrent_link) {
	return;
	module.exports.get(torrent_link);
});




var magnets = [
	['Volor Flex - You In Me', 
		'd74ca7163aa49ecf5c75bf31fbb02ac4d420157f'], // + 42.908 
	['Volor Flex - You In Me', 
		'ceae1eb9150cbfc94d45f16746c5a57a2589e37c'],
	['Volor Flex - You In Me', 
		'eb3705592f51d053ebb05d29cb26861b5684425e'],
	['Volor Flex - You In Me', 
		'1e2002b90ac86d532b5574585a087f97fb34954a'],
	['Volor Flex - You In Me', 
		'0489135be8eecc86d27f072f3e7f731b48781930'], // + 3.007 
	['Volor Flex - You In Me', 
		'5bc8bd1955b98e536f6fde9c8b3c293416424ed1'] // + 44.462 
];

magnets.forEach(function(item) {
	return;
	load('ready', {
		infoHash: item[1],
		announce: [
			"udp://tracker.openbittorrent.com:80",
			'udp://tracker.ccc.de:80',
			'udp://tracker.istole.it:80',
			"udp://tracker.publicbt.com:80"
		]
	}, item[0]);
	
	
});



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//require('./test');
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////