
window.bap = new Btapp();
bap.connect();

var btapp = bap;

var test_link = 'http://isohunt.com/download/402892101';


var torrentAdding = function(add) {


};

var findFileInTorrents = function(msq) {
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
				})
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
		


	})
	.start(function() {

	});

};

