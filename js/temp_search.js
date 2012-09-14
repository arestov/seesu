
window.bap = new Btapp();
bap.connect();

var btapp = bap;

var test_link = 'http://isohunt.com/download/402892101';

btapp.on('add:add', function(add){
	//setTimeout(function(){
		add.torrent({
			url: test_link,
			callback: function(trt){
				var colln = btapp.get('torrent');
				var array = colln.models;
			//	array.length
			//	.models[]
				var torrent = array[array.length - 1];//.models
				setTimeout(function(){
					btapp.get('torrent').each(function(t){
						t.get('file').each(function(file){
							console.log(file.get('properties').get('name'));
						})
					})
				});
			},
			priority: Btapp.TORRENT.PRIORITY.METADATA_ONLY
		});
	//},100)
	
});


var findFileInTorrents = function(msq) {
	var complex_search = new funcsStack();


	complex_search
	.next(function() {
		var _this = this;


		torrent_search
		.findAudio(msq)
			.done(function(r) {
				_this.done(r);
				console.log(r)
			})
			.fail(function() {

			});
		//_this.done();
		//find torrents
	})
	.next(function() {
		//get files list
	})
	.next(function() {
		//find 
	})
	.start(function() {

	});

};

