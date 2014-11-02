var events = require('events');
var dht = require('bittorrent-dht');
var tracker = require('bittorrent-tracker');

var DEFAULT_PORT = 6881;

module.exports = function(torrent, opts) {


	if (typeof opts !== 'object') {
		opts = torrent;
		torrent = null;
	}

	var destroingStack = [];

	var port = opts.port || DEFAULT_PORT;

	var discovery = new events.EventEmitter();

	discovery.dht = null;
	discovery.tracker = null;

	var onpeer = function(addr, peerInfoHash) {
		if (torrent.infoHash == peerInfoHash) {
			discovery.emit('peer', addr);
		}
		
	};

	var destroyDHT = function(){};

	var createDHT = function(infoHash) {
		if (opts.dht === false) return;

		var table;
		if (opts.dht && typeof opts.dht == 'object') {
			table = opts.dht;
		} else {
			table = dht();
			destroingStack.push(function(){
				if (discovery.dht) {
					discovery.dht.destroy();
					discovery.dht = null;
					table = null;
				}
			});
		}



		table.on('peer', onpeer);
		destroingStack.push(function(){
			table.removeListener('peer', onpeer);
		});

		var tableReady = function() {
			table.lookup(infoHash);
			process.nextTick(function(){
				if (table.peersCache && table.peersCache[infoHash]) {
					table.peersCache[infoHash].list.forEach(function(item) {
						process.nextTick(function(){
							onpeer(item, infoHash);
						});
					});
				}
			});
		};
		if (table.ready) {
			tableReady();
		} else {
			table.on('ready', tableReady);
			destroingStack.push(function(){
				table.removeListener('ready', tableReady);
			});
		}
		
		destroyDHT = function(){
			while (destroingStack.length) {
				var cur = destroingStack.pop();
				cur();
			}
		};

		return table;
	};

	var createTracker = function(torrent) {
		if (opts.trackers) {
			torrent = Object.create(torrent);
			var trackers = (opts.tracker !== false) && torrent.announce ? torrent.announce : [];
			torrent.announce = trackers.concat(opts.trackers);
		} else if (opts.tracker === false) {
			return;
		}

		if (!torrent.announce || !torrent.announce.length) return;

		var tr = new tracker.Client(new Buffer(opts.id), port, torrent);

		tr.on('peer', onpeer);
		tr.on('error', function() { /* noop */ });

		tr.start();
		return tr;
	};

	discovery.setTorrent = function(t) {
		torrent = t;

		if (discovery.tracker) {
			// If we have tracker then it had probably been created before we got infoDictionary.
			// So client do not know torrent length and can not report right information about uploads
			discovery.tracker.torrentLength = torrent.length;
		} else {
			process.nextTick(function() {
				if (!discovery.dht) discovery.dht = createDHT(torrent.infoHash);
				if (!discovery.tracker) discovery.tracker = createTracker(torrent);
			});
		}
	};

	discovery.updatePort = function(p) {
		if (port === p) return;
		port = p;
		if (discovery.tracker) discovery.tracker.stop();
		if (torrent) discovery.tracker = createTracker(torrent);
	};

	discovery.stop = function() {
		if (discovery.tracker) discovery.tracker.stop();
		destroyDHT();
	};

	if (torrent) discovery.setTorrent(torrent);

	return discovery;
};
