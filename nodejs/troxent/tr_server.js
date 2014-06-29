(function() {
"use strict";
var http = require('http');
var rangeParser = require('range-parser');
var url = require('url');
var mime = require('mime');
var pump = require('pump');

var serveFileRequest = function(req, res, file) {
	var range = req.headers.range;
	range = range && rangeParser(file.length, range)[0];
	res.setHeader('Cache-Control', 'public');
	
	res.setHeader('Accept-Ranges', 'bytes');
	res.setHeader('Content-Type', mime.lookup(file.name));

	if (!range) {
		res.setHeader('Content-Length', file.length);
		if (req.method === 'HEAD') {return res.end();}
		pump(file.createReadStream(), res);
		return;
	}

	res.statusCode = 206;
	res.setHeader('Content-Length', range.end - range.start + 1);
	res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);

	if (req.method === 'HEAD') {return res.end();}

	pump(file.createReadStream(range), res);
};

var waitFile = function(downloads_index, hash_events, infoHash, num, req, res) {
	var done = false;
	var fail_timeout;
	

	var handleCore = function(core) {
		if (done) {return;}
		var handleFiles = function() {
			core.removeListener('files-list', handleFiles);
			clearTimeout(fail_timeout);
			if (done) {return;}
			done = true;
			if ( core.files[ num ] ) {
				serveFileRequest(req, res, core.files[num]);
			} else {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.end('none');
			}

		};
		core.on('files-list', handleFiles);
	};


	
	fail_timeout = setTimeout(function() {
		if (done) {return;}
		done = true;
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end('none');
	}, 20000);

	var core = downloads_index[ infoHash ];
	if (core) {
		handleCore(core);
	} else {
		hash_events.once( 'hash-' + infoHash, function( core ) {
			handleCore(core);
		});
	}
};


var createServer = function(downloads_index, hash_events) {
	var server = http.createServer();
	
	server.on('request', function(req, res) {
		var req_url = url.parse(req.url);
		var path_parts = req_url.pathname.split('/');

		if (path_parts.length == 4 && path_parts[1] == 'torrents' && path_parts[2].length == 40) {
			var infoHash = path_parts[2];
			var num = Number(path_parts[3]);
			
			if ( !isNaN(num) ) {
				var core = downloads_index[ infoHash ];
				if (core && core.files && core.files.length) {
					if ( core.files[ num ] ) {
						serveFileRequest(req, res, core.files[num]);
					} else {
						res.writeHead(404, {'Content-Type': 'text/plain'});
						res.end('none');
					}
					
				} else {
					waitFile( downloads_index, hash_events, infoHash, num, req, res );
				}

				
				
			} else {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.end('none');
			}

		} else {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end('none');
		}
		
	});

	return server;
};

module.exports = createServer;


})();