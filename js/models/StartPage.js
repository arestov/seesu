define(['js/libs/BrowseMap', './ArtCard', './SongCard', './TagPage', './UserCard', './MusicConductor', 'app_serv', './MusicBlog'],
function(BrowseMap, ArtCard, SongCard, TagPage, UserCard, MusicConductor, app_serv, MusicBlog) {
"use strict";
var StartPage = function() {};
var app_env = app_serv.app_env;
var localize = app_serv.localize;
BrowseMap.Model.extendTo(StartPage, {
	model_name: 'start_page',
	page_name: 'start page',
	zero_map_level: true,
	showPlaylists: function(){
		su.search(':playlists');
	},
	init: function(opts){
		this._super(opts);
		this.su = opts.app;
		this.updateState('needs_search_from', true);
		this.updateState('nav_title', 'Seesu start page');
		this.updateState('nice_artist_hint', this.app.popular_artists[(Math.random()*10).toFixed(0)]);

		this.updateNesting('pstuff', this.getSPI('users/me', true));
		this.updateNesting('muco', this.getSPI('conductor', true));


		this.closed_messages = app_serv.store('closed-messages') || {};
		return this;
	},
	rpc_legacy: {
		requestSearchHint: function() {
			var artist = this.state('nice_artist_hint');
			this.app.search(artist);
			this.updateState('nice_artist_hint', this.app.popular_artists[(Math.random()*10).toFixed(0)]);
			su.trackEvent('Navigation', 'hint artist');
		}
	},
	subPageInitWrap: function(Constr, full_name, params) {
		var instance = new Constr();
			instance.init_opts = [{
				app: this.app,
				map_parent: this,
				nav_opts: {
					url_part: '/' + full_name
				}
			}, params];
		return instance;
	},
	sub_pages_routes: {
		'catalog': function(name) {
			var full_name = 'catalog/' + name;
			return this.subPageInitWrap(ArtCard, full_name, {
				urp_name: name,
				artist: name
			});
		},
		'tracks': function(complex_string, raw_str) {
			var full_name = 'tracks/' + raw_str;
			var parts = this.app.getCommaParts(raw_str);
			if (!parts[1] || !parts[0]){
				return;
			} else {
				return this.subPageInitWrap(SongCard, full_name, {
					artist_name: parts[0],
					track_name: parts[1]
				});
			}
		
		},
		'tags': function(name) {
			var full_name = 'tags/' + name;
			return this.subPageInitWrap(TagPage, full_name, {
				urp_name: name,
				tag_name: name
			});
		},
		'users': function(name) {
			var full_name = 'users/' + name;
			if (name == 'me'){
				return this.subPageInitWrap(UserCard, full_name, {urp_name: name});
			} else if (name.indexOf('lfm:') === 0){
				return this.subPageInitWrap(UserCard.LfmUserCard, full_name, {urp_name: name});
			} else if (name.indexOf('vk:') === 0){
				return this.subPageInitWrap(UserCard.VkUserCard, full_name, {urp_name: name});
			}
		},
		'blogs': function(blog_url) {
			var full_name = 'blogs/' +  this.app.encodeURLPart(blog_url);
			return this.subPageInitWrap(MusicBlog, full_name, {
				urp_name: blog_url,
				blog_url: blog_url
			});
		},
		'cloudcasts': function(mixcloud_urlpiece) {
			var full_name = 'blogs/' +  this.app.encodeURLPart(mixcloud_urlpiece);
			return this.subPageInitWrap(MusicBlog, full_name, {
				urp_name: mixcloud_urlpiece,
				urlpiece: mixcloud_urlpiece
			});
		}
	},
	sub_pa: {
		'conductor': {
			title: localize('music-cond'),
			constr: MusicConductor
		}
	},
	subPager: function(parsed_str, path_string) {
		var parts = path_string.split('/');
		var first_part = parts[0];
		var full_name;

		if (parts[1]){
			full_name += '/' + parts[1];
		}
		if (this.sub_pages[full_name]){
			return this.sub_pages[full_name];
		} else {
			if (!parts[1]){
				return;
			}
			var handler = this.sub_pages_routes[first_part];
			var instance = handler && handler.call(this, decodeURIComponent(parts[1]), parts[1]);
			if (instance){
				this.sub_pages[full_name] = instance;
			}
			return instance;
		}
	},
	short_title: 'Seesu',
	getTitle: function() {
		return this.short_title;
	},
	messages: {
		"rating-help": function(state){
			if (this.app.app_pages[app_env.app_type]){
				if (state){
					this.updateState('ask-rating-help', this.app.app_pages[app_env.app_type]);
				} else {
					this.updateState('ask-rating-help', false);
				}

			}
		}
	},
	closeMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.closed_messages[message_name] = true;
			app_serv.store('closed-messages', this.closed_messages, true);
			this.messages[message_name].call(this, false);
		}
	},
	showMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.messages[message_name].call(this, true);
		}
	}
});
return StartPage;
});