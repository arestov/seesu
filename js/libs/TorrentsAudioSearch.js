define(['jquery', 'js/libs/FuncsStack', 'spv', 'provoda', 'js/libs/Mp3Search'], function($, FuncsStack, spv, provoda, Mp3Search) {

var trackers = ["udp://tracker.openbittorrent.com:80",
					'udp://tracker.ccc.de:80',
					'udp://tracker.istole.it:80',
					//'udp://tracker.istole.it:6969',
					"udp://tracker.publicbt.com:80"];
var getTroxent = require('./nodejs/troxent/troxent');
var engine_opts = {
	connections: 23,
	trackers: trackers,
	prevalidate: function(info) {
		if (info.files && info.files.length > 420) {
			return new Error('too much files in torrent');
		}
	}
};

var disallowed_links = {};

var FileNameSQMatchIndex = function(file, query) {
	this.trim_index = null;
	//this.filename = file.filename;

	this.under_consideration = {
		filename: file.filename,
		filepath: file.torrent_path,
		torrent_name: file.torrent_name
	};
	//filename.split(/\//);
	this.query = query;
	this.query_string = this.toQueryString(this.query);
	this.match_order = [this.matchers.bestMatch, this.matchers.anyGood];
	this.match();
};
Mp3Search.QueryMatchIndex.extendTo(FileNameSQMatchIndex, {
	init: function(file, query) {
		
		return this;
	},
	matchers: {
		bestMatch: function(file, query) {

		},
		almostMatch: function(file, query) {
			//если имя артиста в названиях папоп, а имя композиции совпадает с именем файла без порядкового номера
		},
		/*
		anyGood: function(filename, query) {
			if (filename.indexOf(query.artist) != -1 && filename.indexOf(query.track) != -1){
				return 0;
			}
		}
		*/
		anyGood: function(file, query) {
			var artist_match = file.filepath.indexOf(query.artist) != -1 || file.torrent_name.indexOf(query.artist) != -1;
			if (artist_match) {
				if ( file.filename.indexOf(query.track) != -1) {
					return 0;
				} else {
					var query_track = this.hardTrim(query.track, 3);
					if (this.hardTrim(file.filename, 3).indexOf(query_track) != -1) {
						return 5;
					}
				}
			} else {
				var query_artist = this.hardTrim(query.artist, 3);
				var artist_match = this.hardTrim(file.filepath, 3).indexOf(query_artist) != -1 || this.hardTrim(file.torrent_name, 3).indexOf(query_artist) != -1;
				var query_track = this.hardTrim(query.track, 3);
				if (artist_match && this.hardTrim(file.filename, 3).indexOf(query_track) != -1) {
					return 5;
				} else {
					if (file.filename.indexOf(query.track) != -1) {
						console.log(file);
					}
				}

				
			}
		}
	}
});


/*
var makeSongFile = function(cur){
	var file = {
		file: cur.file,
		name: cur.name,
	//	query_match_index: new FileNameSQMatchIndex(cur.name, msq) * 1,
		torrent: obj.torrent,
		link: cur.file.get('properties').get('streaming_url'),
		from: 'torq-torrents',
		media_type: 'mp3',
		getSongFileModel: function(mo, player) {
			return (new FileInTorque()).init({
				mo: mo,
				link: this.link,
				file_in_torrent: {
					torrent_link: obj.torrent_link,
					file_path: this.name
				},
				getFileInTorrent: function() {
					return getFileInTorrent.apply(this, arguments);
				},
				name: this.name,
				torrent_link: obj.torrent_link
			}).setPlayer(player);
		}
	};
	core.mp3_search.setFileQMI(file, msq, FileNameSQMatchIndex);
	return file;
};

var wrap = function() {
	{
			torrent_link: magnet_link,
			title: node.text(),
			
			query: query,
			media_type: 'torrent',
			models: {},
			getSongFileModel: function(mo, player) {
				return (new SongFileModel.FileInTorrent(this, mo)).setPlayer(player);
			}
		}
};*/


var getTorrentFile = function(raw, torrent, torrent_api) {
	return {
		from: 'btdigg',
		title: raw.name,
		filename: raw.name,
		torrent_name: torrent.name,
		torrent_path: raw.path,
		description: [torrent.name, torrent.infoHash, raw.path].join(', '),
		page_link: 'http://btdigg.org/search?info_hash=' + torrent.infoHash,
		media_type: 'mp3',
		link: raw.link,
		models: {},
		api: raw,
		getSongFileModel: function() {
			var md = Mp3Search.getSongFileModel.apply(this, arguments);
			md.updateState('title', this.title);
			md.wlch(torrent_api, 'progress_info');

			md.on('state_change-load_file', function(e) {
				torrent_api.setStateDependence('file_data-for-song_file', md, e.value);
			});
			return md;
		}
	};
};

var Torrent = function() {};
provoda.Model.extendTo(Torrent, {
	init: function(opts, data) {
		this._super();
		this.remove_timeout = null;
		this.troxent = null;
		this.updateManyStates(data);

		var _this = this;
		this.hndList = function(list) {
			//console.log(list);

			_this.updateState('list_loaded', !!list && true);


			var result = list && list.map(function(el) {
				return getTorrentFile(el, _this.troxent.torrent, _this);
			});

			_this.updateState('files_list', result);

		};
	},
	'compx-torrent_required': [
	// 
		['file_data-for-song_file', 'list_loaded', 'files_list-for-search'],
		function(file_data, list_loaded, files_list) {
			return this.utils.isDepend(file_data) || (!list_loaded && this.utils.isDepend(files_list));
		}
	],
	'stch-torrent_required': function(state) {
		var _this = this;
		if (state ) {
			clearTimeout(this.remove_timeout);
			if (!this.troxent) {
				this.troxent = getTroxent(this.state('url'), engine_opts);
				var link = this.state('url');
				this.troxent.on('prevalidation-error', function() {
					disallowed_links[link] = true;
				});

				if (!this.state('list_loaded')) {
					this.troxent.on('served-files-list', this.hndList);
				}
				var troxent = this.troxent;
				
				this.troxent.on('progress_info-change', function(data) {
					_this.updateState('progress_info', data);
				});
					


				/*if (!this.troxent.reffs) {
					this.troxent.reffs = [];
				}
				this.troxent.reffs.push(this);*/

				troxent.on('destroy', function() {
					if (_this.troxent == troxent) {
						_this.destroyPeerflix();
					}
				});

			}
			
			//troxent
		} else {
			if (this.troxent) {
				this.remove_timeout = setTimeout(function() {
					_this.destroyPeerflix();
				}, 7000);
			}
		}
	},
	destroyPeerflix: function() {
		if (!this.troxent) {
			return;
		}
		this.troxent.removeListener('served-files-list', this.hndList);
		this.troxent.destroy();
		this.troxent = null;
	}
});

var TorqueSearch = function(opts) {
	var _this = this;
	this.mp3_search = opts.mp3_search;
	this.torrent_search = opts.torrent_search;
	this.search = function() {
		return _this.findAudio.apply(_this, arguments);
	};
};
TorqueSearch.prototype = {
	name: "btdigg-torrents",
	s: {
		name:"Torque torrents",
		key:0,
		type: "mp3"
	},
	constructor: TorqueSearch,
	findAudio: function(msq, opts) {
		var
			core = this,
			deferred = $.Deferred(),
			complex_response = {
				abort: function(){
					//this.aborted = true;
					deferred.reject('abort');
					//if (this.queued){
					//	this.queued.abort();
				//	}
				//	if (this.xhr){
				//		this.xhr.abort();
				//	}
				}
			};
		deferred.promise(complex_response);

		//запросить troxent 

		var push = Array.prototype.push;
		FuncsStack.chain([
			function() {
				var chain_link = this;
				core.torrent_search
				.findAudio(msq)
					.done(function(r) {
						chain_link.completePart(r);
					})
					.fail(function() {
						deferred.reject();
					});
				//find torrents
			},
			function(links_list) {


				


				var done;
				var setResult = function() {};
				var getRFunc = function() {
					if (!done) {
						done = true;
						deferred.resolve(function(setArray) {
							setResult = setArray;
						});
					}
				};
				var timeout = setTimeout(function() {
					getRFunc();
				}, 40000);
				

				var arrays = [];
				var checkItems = function() {
					var result = [];
					for (var i = 0; i < arrays.length; i++) {
						if (arrays[i].items) {
							push.apply(result, arrays[i].items);
						}
					}
					var filtered = [];

					for (var i = 0; i < result.length; i++) {

						var qmi = core.mp3_search.getFileQMI(result[i], msq);
						if (qmi != -1 && result[i].filename.match(/\.mp3$/)) {
							filtered.push( result[i] );
						}
					}
					


					if (filtered.length) {
						setResult(filtered);
					}
					
				};

				links_list.slice(0, 6).forEach(function(el) {
					if (disallowed_links[el.torrent_link]) {
						return;
					}
					var obj = {
						items: null
					};
					arrays.push(obj);

					var torrent = new Torrent();
					torrent.init(false, {
						url: el.torrent_link
					});


					opts.bindRelation(function(e) {
						torrent.setStateDependence('files_list-for-search', e.target, !!e.value);
						//torrent.updateState('must_load_list', e.value);
					});


					torrent.on('state_change-files_list', function(e) {
						if (!e.value) {
							return;
						}
						obj.items = e.value;

						for (var i = 0; i < obj.items.length; i++) {
							core.mp3_search.setFileQMI(obj.items[i], msq, FileNameSQMatchIndex);
						}

						getRFunc();
						clearTimeout(timeout);


						checkItems();
					});
					//console.log(el);

				});
				if (!links_list.length) {
					getRFunc();
				}
				
				//deferred.resolve();
			}
		]);






		return complex_response;
	}
};

return TorqueSearch;
});
