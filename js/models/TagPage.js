var SongsLists = function() {};
mapLevelModel.extendTo(SongsLists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateState('nav-title', 'Songs');
		this.updateState('url-part', '/songs');
	},
	model_name: 'tag_songs'
});



var TagTopArtists = function() {};
ArtistsList.extendTo(TagTopArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;

		this.updateState('nav-title', 'Top');
		this.updateState('url-part', '/_');
	},
	sendMoreDataRequest: function(paging_opts){

		var tag_name = this.tag_name;

		var request_info = {};
		request_info.request = lfm.get('tag.getTopArtists', {
			tag: tag_name,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		})
			.done(function(r){
				var artists = toRealArray(getTargetField(r, 'topartists.artist'));
				var track_list = [];

				if (artists && artists.length) {

					var l = Math.min(artists.length, paging_opts.page_limit);
					for (var i=0; i < l; i++) {
						track_list.push({
							artist: artists[i].name,
							lfm_image: {
								array: artists[i].image
							}
						});
					}

				}
				pl_r.putRequestedData(request_info.request, track_list, r.error);
				
			})
			.fail(function() {
				pl_r.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	}
});

var ArtistsLists = function() {};
mapLevelModel.extendTo(ArtistsLists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateState('nav-title', 'Artists');
		this.updateState('url-part', '/artists');

		var lists_list = [];

		var top_artists = new TagTopArtists();
		top_artists.init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		this.setChild('top_artists', top_artists);

		lists_list.push(top_artists);

		this.setChild('lists_list', lists_list);

	},
	model_name: 'tag_artists'
});


var TagPage = function() {};
mapLevelModel.extendTo(TagPage, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.updateState('nav-title', 'Tag ' + this.tag_name);
		this.updateState('url-part', '/tags/' + this.tag_name);
		this.updateState('tag-name', this.tag_name);


		var artists_lists = new ArtistsLists();
		artists_lists.init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		this.setChild('artists_lists', artists_lists);

		var songs_list = new SongsLists();
		songs_list.init({app:this.app, map_parent:this}, {tag_name:this.tag_name});
		this.setChild('songs_list', songs_list);
	},
	model_name: 'tag_page'

});