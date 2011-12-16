(function(){
	var songsListView = function(c){
		this.setC(c);
		this.init();
	};
	songsListView.prototype = new songsListViewBase();
	cloneObj(songsListView.prototype, {
		constructor: songsListView
	});

	songsListView.prototype.state_change = cloneObj({}, songsListView.prototype.state_change);
	cloneObj(songsListView.prototype.state_change, {
		error: function(error){
			if (this.error_b && this.error_b.v !== error){
				this.error_b.n.remove();
			}
			if (error){
				if (error == 'vk_auth'){
					this.error_b = {
						v: error,
						n: $('<li></li>').append(su.ui.samples.vk_login.clone()).prependTo(this.c)
					};
				} else {
					this.error_b = {
						v: error,
						n: $('<li>' + localize('nothing-found','Nothing found') + '</li>').appendTo(this.c)
					};
				}
			}
		}
	});
	

	songsList = function(playlist_title, playlist_type, info, first_song, findMp3, player){
		this.init();
		this.info = info || {};
		if (playlist_title){
			this.playlist_title = playlist_title;
		}
		if (playlist_type){
			this.playlist_type = playlist_type;
		}
		this.player = player;
		this.findMp3 = findMp3;
		this.findSongOwnPosition(first_song);
		this.changed();
		
	};
	songsList.prototype = new songsListModel();
	cloneObj(songsList.prototype, {
		constructor: songsList,
		getUrl: function(){
			var url ='';
			if (this.playlist_type == 'artist'){
				url += '/_';
			} else if (this.playlist_type == 'album'){
				url += '/' + this.info.album;
			} else if (this.playlist_type == 'similar artists'){
				url += '/+similar';
			} else if (this.playlist_type == 'artists by tag'){
				url += '/tags/' + this.info.tag;
			} else if (this.playlist_type == 'tracks'){
				url += '/ds';
			} else if (this.playlist_type == 'artists by recommendations'){
				url += '/recommendations';
			} else if (this.playlist_type == 'artists by loved'){
				url += '/loved';
			} else if (this.playlist_type == 'cplaylist'){
				url += '/playlist/' + this.info.name;
			} else if (this.playlist_type == 'chart'){
				url += '/chart/' +  this.info.country + '/' + this.info.metro;
			}
			return url;
		},
		extendSong: function(omo, player, mp3_search){
			if (!(omo instanceof song)){
				return new song(omo, player, mp3_search);
			} else{
				return omo;
			}
		},
		setC: function(c){
			var oldc = this.getC();

			if (c != oldc){
				if (oldc){
					this.removeView(this.getView().die());
				}
				this.addView((new songsListView(c)).setModel(this).setStates(this.states));

			}
		},

	});

	
})();