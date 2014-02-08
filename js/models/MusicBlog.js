define(['spv', 'js/libs/BrowseMap', './SongsList', './LoadableList'],
function(spv, BrowseMap, SongsList, LoadableList) {
"use strict";
var MusicBlogSongs = function() {};
SongsList.extendTo(MusicBlogSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates(params);
	},
	datamorph_map: new spv.MorphMap({
		source: 'songs',
		props_map: {
			artist: 'artist',
			track: 'title'
		}
	}),
	getRqData: function(paging_opts) {
		return {
			results: paging_opts.page_limit,
			start: paging_opts.next_page
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		var _this = this;

		request_info.request = this.app.exfm.get(
			'site/' + encodeURIComponent(this.state('url')) + '/songs',
			this.getRqData(paging_opts)
		)
			.done(function(r){
				var list = _this.datamorph_map.execute(r);
				_this.putRequestedData(request_info.request, list, r.error);
			});
	}
});


var MusicBlog = function() {};
BrowseMap.Model.extendTo(MusicBlog, {
	model_name: 'music_blog',
	init: function(opts, params) {
		this._super(opts);

		this.initStates(params);
		this.sub_pa_params = {url: params.blog_url};

		this.initListedModels(['songs']);
	},
	sub_pa: {
		songs: {
			title: 'Song of the blog',
			constr: MusicBlogSongs
		}
	},
	addRawData: function(data) {
		this.updateState('nav_title', data.nav_title);
	}
});

var BlogsList = function() {};
LoadableList.extendTo(BlogsList, {
	model_name: 'blogs_list',
	init: function(opts) {
		this._super(opts);
		this.initStates();
	},
	makeDataItem: function(data) {
		var item = this.app.start_page.getSPI('blogs/' + this.app.encodeURLPart(data.url.replace('http://', '')), true);
		item.addRawData(data);
		return item;
	},
	//subitemConstr: MusicBlog,
	datamorph_map: new spv.MorphMap({
		source: 'sites',
		props_map: {
			nav_title: 'title',
			url: 'url'
		}
	}),
	getRqData: function(paging_opts) {
		return {
			results: paging_opts.page_limit,
			start: paging_opts.next_page
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		var _this = this;

		request_info.request = this.app.exfm.get(this.api_url_part, this.getRqData(paging_opts))
			.done(function(r){
				var list = _this.datamorph_map.execute(r);
				_this.putRequestedData(request_info.request, list, r.error);
			});
	}
});

var FeaturedBlogs = function() {};
BlogsList.extendTo(FeaturedBlogs, {
	api_url_part: 'site/featured'
});

var TrendedBlogs = function() {};
BlogsList.extendTo(TrendedBlogs, {
	api_url_part: 'sotd'
});


var BlogsConductor = function() {};
BrowseMap.Model.extendTo(BlogsConductor, {
	model_name: 'blogs_conductor',
	init: function(opts) {
		this._super.apply(this, arguments);
		this.initStates();
		this.initListedModels(['blogs-of-the-day'/*, 'featured'*/]);
		
	},
	sub_pa: {
		'blogs-of-the-day': {
			title: 'Blogs of the day',
			constr: TrendedBlogs
		},
		featured: {
			constr: FeaturedBlogs,
			title: 'Featured'
		}
	}
});



//http://ex.fm/api/v3/sotd
//http://ex.fm/api/v3/site/featured

//http://ex.fm/api/v3/site/awesometapes.com
//http://ex.fm/api/v3/site/awesometapes.com/songs
MusicBlog.BlogsConductor = BlogsConductor;

return MusicBlog;

});