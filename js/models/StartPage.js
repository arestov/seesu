define(['js/libs/BrowseMap', './ArtCard', './TagPage', './UserCard', './MusicConductor', 'app_serv'],
function(BrowseMap, ArtCard, TagPage, UserCard, MusicConductor, app_serv) {
"use strict";
var StartPage = function() {};
var app_env = app_serv.app_env;
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

		this.updateNesting('pstuff', this.getSPI('users/me').initOnce());
		this.updateNesting('muco', this.getSPI('conductor').initOnce());


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
	sub_pages_routes: {
		'catalog': function(name) {
			var full_name = 'catalog/' + name;
			var instance = new ArtCard();
			instance.init_opts = [{
				app: this.app,
				map_parent: this,
				nav_opts: {
					url_part: '/' + full_name
				}
			}, {
				urp_name: name,
				artist: name
			}];
			return instance;
		},
		'tags': function(name) {

			var full_name = 'tags/' + name;

			var instance = new TagPage();
			instance.init_opts = [{
				app: this.app,
				map_parent: this,
				nav_opts: {
					url_part: '/' + full_name
				}
			}, {
				urp_name: name,
				tag_name: name
			}];
			return instance;


		},
		'users': function(name) {
			var full_name = 'users/' + name;
			var instance;
			if (name == 'me'){
				instance = new UserCard();
				instance.init_opts = [{
					app: this.app,
					map_parent: this,
					nav_opts: {
						url_part: '/' + full_name
					}
				}, {urp_name: name}];
				return instance;
			} else if (name.indexOf('lfm:') === 0){
				instance = new UserCard.LfmUserCard();
				instance.init_opts = [{
					app: this.app,
					map_parent: this,
					nav_opts: {
						url_part: '/' + full_name
					}
				}, {urp_name: name}];
				return instance;
			}


		}
	},
	sub_pa: {
		'conductor': {
			title: 'Music Conductor',
			constr: MusicConductor
		}
	},
	subPager: function(path_string) {
		var parts = path_string.split('/');
		var first_part = parts[0];
		var full_name = parts[0];
		if (parts[1]){
			full_name += '/' + parts[1];
		}
		if (this.sub_pages[full_name]){
			return this.sub_pages[full_name];
		} else {
			if (!parts[1]){
				return;
			}
			var instance = this.sub_pages_routes[first_part] &&  this.sub_pages_routes[first_part].call(this, parts[1]);
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