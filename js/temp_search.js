
window.bap = new Btapp();
bap.connect();

var btapp = bap;

var test_link = 'http://isohunt.com/download/402892101';


var torrentAdding = function(add) {


};



var TorqueSearch = function() {
	
};
TorqueSearch.prototype = {
	constructor: TorqueSearch,
	findFiles: function(msq) {
		var
			tse				= this,
			deferred 			= $.Deferred(),
			complex_response 	= {
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


		if (typeof msq == 'string'){
			msq = guessArtist(msq);
		}
		var complex_search = new funcsStack();


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
				return
			}

			var torrent_link = array[0].torrent_link;


			var getTorrent = function(){
				var torrent;
				var colln = btapp.get('torrent');
				var array = colln.models;
				torrent = $filter(array, 'attributes.properties.attributes.download_url', torrent_link);
				return torrent[0];
			};

			var getFiles = function(torrent) {
				var files_array = [];
				setTimeout(function(){
					torrent.get('file').each(function(file){
						files_array.push({
							name: file.get('properties').get('name'),
							file: file,
						})
					});

							
					_this.done({
						files: files_array,
						torrent: torrent
					});
				});
			};

			var torrentAdding = function(add) {
				var torrent ;
				torrent = getTorrent();
				if (torrent){

					getFiles(torrent);
					return
				} else {
					add.torrent({
						url: torrent_link,
						callback: function(trt){
							setTimeout(function() {
								torrent = getTorrent();
								if (torrent){
									getFiles(torrent);
								}

								
							},0)
						},
						priority: Btapp.TORRENT.PRIORITY.METADATA_ONLY
					});
				}
				
				
			};

			var add = btapp.get('add');
			if (add){
				torrentAdding(add)
			} else {
				btapp.on('add:add', function(add){
					
					//setTimeout(function(){
						torrentAdding(add);
					//},100)
				});
			}

			
			//get files list
		})
		.next(function(obj) {
			//find 
			console.log(obj.files);
			var target = {
				torrent: obj.obj
			}
			
			for (var i = 0; i < obj.files.length; i++) {
				if (obj.files[i].name.match(/\.mp3$/)){
					target.file = obj.files[i].file;
					target.name = obj.files[i].name;
					break;

				}
				
			};

			if (target.file){
				var array = [];
				array.push({
					models: {},
					getSongFileModel: function(mo, player) {
						return this.models[mo.uid] = this.models[mo.uid] || (new fileInTorrent(this, mo)).setPlayer(player);
					}
				});
			} else {

			}
		})
		.start(function() {

		});






	}
};

var search = function() {

};


var findFileInTorrents = function(msq) {
	
};

