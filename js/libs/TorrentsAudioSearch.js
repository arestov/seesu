define(['jquery', 'js/libs/FuncsStack', 'spv', 'pv', 'js/libs/Mp3Search'], function($, FuncsStack, spv, pv, Mp3Search) {
"use strict";
var trackers = ["udp://tracker.openbittorrent.com:80",
					'udp://tracker.ccc.de:80',
					'udp://tracker.istole.it:80',
					//'udp://tracker.istole.it:6969',
					"udp://tracker.publicbt.com:80"];
var torrents_manager = require('./nodejs/troxent2');
var engine_opts = {
	connections: 23,
	trackers: trackers,
	prevalidate: function(info) {
		if (info.files && info.files.length > 420) {
			return 'too much files in torrent';
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
			pv.update(md, 'title', this.title);
			md.wlch(torrent_api, 'progress_info');

			md.on('state_change-load_file', function(e) {
				torrent_api.setStateDependence('file_data-for-song_file', md, e.value);
			});
			return md;
		}
	};
};

var Torrent = function() {};
pv.Model.extendTo(Torrent, {
	init: function(opts, data) {
		this._super();
		this.queue = opts.queue;
		this.remove_timeout = null;
		this.troxent = null;
		this.updateManyStates(data);

		var _this = this;
		this.hndList = function(list) {
			//console.log(list);
			pv.update(_this, 'list_loaded', !!list && true);

			var result = list && list.map(function(el) {
				return getTorrentFile(el, _this.troxent.parsedTorrent, _this);
			});

			pv.update(_this, 'files_list', result);

		};
		this.validateError = function(){
			var link = this.state('url');
			disallowed_links[link] = true;
			pv.update(this, 'invalid', true);
		};
		this.onProgress = function(data) {
			pv.update(_this, 'progress_info', data);
		};
	},
	'compx-torrent_required': [
		['file_data-for-song_file', 'list_loaded', 'files_list-for-search', 'invalid'],
		function(file_data, list_loaded, files_list, invalid) {
			if (invalid) {return false;}
			return this.utils.isDepend(file_data) || (!list_loaded && this.utils.isDepend(files_list));
		}
	],
	'stch-torrent_required': function(state) {
		var _this = this;
		if (state ) {
			clearTimeout(this.remove_timeout);
			this.remove_timeout = null;
			if (!this.troxent && !this.queued) {
				//var deferred = $.Deferred();
				//this.troxent_promise = deferred;
				this.queued = this.queue.add(function() {
					_this.troxent = torrents_manager.get(_this.state('url'), engine_opts);
					_this.troxent.on('prevalidation-error', _this.validateError);
					_this.troxent.on('numPeers', function(num) {
						pv.update(_this, 'total_peers', num);
					});


					if (!_this.state('list_loaded')) {
						_this.troxent.on('served-files-list', _this.hndList);
					}
					
					_this.troxent.on('progress_info-change', _this.onProgress);
					_this.queued = null;
				});


				
			}
		} else {
			if (this.troxent && !this.remove_timeout) {
				this.remove_timeout = setTimeout(function() {
					_this.destroyPeerflix();
				}, 7000);
			}
		}
	},
	destroyPeerflix: function() {
		if (this.queued) {
			this.queued.abort();
			this.queued = null;
		}
		if (!this.troxent) {
			return;
		}
		this.troxent.removeListener('served-files-list', this.hndList);
		this.troxent.removeListener('prevalidation-error', this.validateError);
		this.troxent.removeListener('progress_info-change', this.onProgress);
		torrents_manager.remove(this.state('url'), this.troxent);
		//this.troxent.destroy();
		this.troxent = null;
	}
});

var TorqueSearch = function(opts) {
	var _this = this;
	this.queue = opts.queue;
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
					torrent.init({
						queue: core.queue
					}, {
						url: el.torrent_link
					});


					opts.bindRelation(function(e) {
						torrent.setStateDependence('files_list-for-search', e.target, !!e.value);
						//pv.update(torrent, 'must_load_list', e.value);
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
				});

				if (!links_list.length) {
					getRFunc();
				}
			}
		]);






		return complex_response;
	}
};

return TorqueSearch;
});
