var EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 0;
var WebTorrent = require('webtorrent');


var magnets = [
	['Volor Flex - You In Me', 
		'd74ca7163aa49ecf5c75bf31fbb02ac4d420157f'],
		//"magnet:?xt=urn:btih:d74ca7163aa49ecf5c75bf31fbb02ac4d420157f&dn=Burial-Rival%20Dealer%20%282013%29"
	['Volor Flex - You In Me', 
		'ceae1eb9150cbfc94d45f16746c5a57a2589e37c'],
	['Volor Flex - You In Me', 
		'eb3705592f51d053ebb05d29cb26861b5684425e'],
	['Volor Flex - You In Me', 
		'1e2002b90ac86d532b5574585a087f97fb34954a'],
	['Volor Flex - You In Me', 
		'0489135be8eecc86d27f072f3e7f731b48781930'],
	['Volor Flex - You In Me', 
		'5bc8bd1955b98e536f6fde9c8b3c293416424ed1']
];

var client = new WebTorrent();

var loaded = Date.now();
console.log('test loaded', new Date());

setTimeout(function() {
	var start = Date.now();
	console.log(start - loaded);
	magnets.forEach(function(item) {
		var torrent = client.add({
			infoHash: item[1],
			announce: [
				"udp://tracker.openbittorrent.com:80",
				'udp://tracker.ccc.de:80',
				'udp://tracker.istole.it:80',
				//'udp://tracker.istole.it:6969',
				"udp://tracker.publicbt.com:80"
			]
		});
		torrent.once('ready', function() {
			console.log('ready:', item[0], torrent.parsedTorrent.infoHash, (Date.now() - start)/1000 );
		});
	});
}, 30000);
