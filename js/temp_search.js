var FileInTorque = function() {};

songFileModel.extendTo(FileInTorque, {
	init: function(opts) {
		this.file_in_torrent = opts.file_in_torrent;
		this.file_name = opts.name;
		this.torrent = opts.torrent;
		this.link = opts.link;
		this.getFileInTorrent = opts.getFileInTorrent;
		//this.file_in_torrent.get('properties').get('streaming_url');
		return this._super(opts);
	},
	getTitle: function() {
		return this.file_name;
	},
	unloadOutBox: function() {

	},
	load: function(){
		var _this = this;
		if (this.player){
			if (this.loadOutBox){
				this.loadOutBox();
			}
			this._createSound();
			this.player.load(this);
		}
	},
	play: function(){
		if (this.player){
			this.load();

			this.player.play(this);
		}
	},
	loadOutBox: function() {
		var _this = this;

		var complect = this.getFileInTorrent(this.file_in_torrent);

		var file_in_torrent = complect && complect.file;
		if (!file_in_torrent){
			console.log('torrents api dishronization');
			return;
		}
		var download_started = file_in_torrent.get('properties').get('downloaded');

		if (!download_started){
			complect.torrent.get('file').each(function(file) {
				if (file != file_in_torrent){
					//file.get('properties').save({priority: 0});
				}

			});
			file_in_torrent.get('properties').save({priority: 15});
			if (!download_started){
				file_in_torrent.stream();
			}

			complect.torrent.set_priority(Btapp.TORRENT.PRIORITY.MEDIUM);
			complect.torrent.start();
		} else {
			file_in_torrent.get('properties').save({priority: 15});
		}

		
		
		
		
		
	//	this.forceStream();
		
		//this.forceStream();
	},
	forceStream: function() {
		this.file_in_torrent.stream();
	//	this.file_in_torrent.force_stream();
		//this.torrent.stream();
	//	this.torrent.force_stream();
	}
});

window.bap = new Btapp();
bap.connect({
	//mime_type: 'application/x-bittorrent-torquechrome'
});

var btapp = bap;

var test_link = 'http://isohunt.com/download/402892101';


var torrentAdding = function(add) {


};



var TorqueSearch = function(opts) {
	var _this = this;
	this.mp3_search = opts.mp3_search;
	this.search = function() {
		return _this.findAudio.apply(_this, arguments);
	};
};
TorqueSearch.prototype = {
	name: "torq-torrents",
	s: {
		name:"Torque torrents",
		key:0,
		type: "mp3"
	},
	constructor: TorqueSearch,
	findAudio: function(msq) {
		var
			tse					= this,
			deferred			= $.Deferred(),
			complex_response	= {
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

		if (typeof msq == 'string'){
			msq = guessArtist(msq);
		}
		var complex_search = new funcsStack();

		var getTorrent = function(torrent_link){
			var torrent;
			var colln = btapp.get('torrent');
			var array = colln && colln.models;
			torrent = array && $filter(array, 'attributes.properties.attributes.download_url', torrent_link);
			return torrent && torrent[0];
		};

		var getFileInTorrent = function(opts) {
			var torrent = getTorrent(opts.torrent_link);
			if (torrent){
				var target_file;
				torrent.get('file').each(function(file){
					if (file.get('properties').get('name') == opts.file_path){
						target_file = file;
					}
				});
				return {
					file: target_file,
					torrent: torrent
				};
			}
		};

		complex_search
		.next(function() {
			var _this = this;
			torrent_search
			.findAudio(msq)
				.done(function(r) {
					_this.done(r);
				})
				.fail(function() {
					deferred.reject();
				});
			//find torrents
		})
		.next(function(array) {

			//get torrent files list
			var _this = this;
			console.log(array);
			if (!array.length){
				return;
			}

			var torrent_link = array[0].torrent_link;


			

			var getFiles = function(torrent, just_added) {
				var files_array = [];
				setTimeout(function(){
					torrent.get('file').each(function(file){
						file.get('properties').save({priority: 0});

						files_array.push({
							name: file.get('properties').get('name'),
							file: file
						});
					});

							
					_this.done({
						files: files_array,
						torrent: torrent,
						torrent_link: torrent_link
					});
				});
			};

			var torrentAdding = function(add) {
				var torrent ;
				torrent = getTorrent(torrent_link);
				if (torrent){

					getFiles(torrent);
					return;
				} else {
					add.torrent({
						url: torrent_link,
						callback: function(trt){
							setTimeout(function() {
								torrent = getTorrent(torrent_link);
								if (torrent){
									getFiles(torrent, true);
								}

								
							},0);
						},
						priority: Btapp.TORRENT.PRIORITY.METADATA_ONLY
					});
				}
				
				
			};

			var add = btapp.get('add');
			if (add){
				torrentAdding(add);
			} else {
				btapp.on('add:add', spv.once(function(add){
					
					//setTimeout(function(){
						torrentAdding(add);
					//},100)
				}));
			}

			
			//get files list
		})
		.next(function(obj) {
			//find
			console.log(obj.files);

			var targets = [];

			var makeSongFile = function(cur){
				var file = {
					file: cur.file,
					name: cur.name,
				//	query_match_index: new FileNameSQMatchIndex(cur.name, msq) * 1,
					torrent: obj.torrent,
					link: cur.file.get('properties').get('streaming_url'),
					from: 'torq-torrents',
					media_type: 'mp3',
					models: {},
					QMIConstr: FileNameSQMatchIndex,
					getSongFileModel: function(mo, player) {
						return this.models[mo.uid] = this.models[mo.uid] || (new FileInTorque()).init({
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
				tse.mp3_search.setFileQMI(file, msq, FileNameSQMatchIndex);
				return file;
			};

			for (var i = 0; i < obj.files.length; i++) {
				var cur = obj.files[i];
				if (cur.name.match(/\.mp3$/)){
					var file = makeSongFile(cur);
					targets.push(file);
				}
			}
			var possible_files = [];
			for (var i = 0; i < targets.length; i++) {
				var cur = targets[i];
				var qmi = tse.mp3_search.getFileQMI(cur, msq);
				if (qmi !== -1){
					possible_files.push(cur);
				}
				
			}

			//var possible = $filter(targets, 'query_match_index', -1).not;
			//sortMusicFilesArray(possible_files);

			deferred.resolve(possible_files, 'mp3');
			/*
			var target = possible[0];


			if (target.file){
				var array = [];


				var pusher = {};
				cloneObj(pusher, msq);
				cloneObj(pusher, {
					
				});
				array.push(pusher);
				
			} else {
				deferred.reject();
			}
			*/
			tse.mp3_search.pushSomeResults(targets);
		})
		.start(function() {

		});





		return complex_response;
	}
};
suReady(function() {
	setTimeout(function(){
		(function() {
			//removing other search sources!
			var list = su.mp3_search.se_list;
			for (var i = 0; i < list.length; i++) {
				su.mp3_search.remove(list[i]);
				
			}

		})();


		su.mp3_search.add(new TorqueSearch({
			mp3_search: su.mp3_search
		}));

	},200);
});
