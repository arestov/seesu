define(['js/libs/BrowseMap', './ArtCard', './SongCard', './TagPage', './UserCard', './MusicConductor', 'app_serv', './Cloudcasts', './SeesuUser', 'pv'],
function(BrowseMap, ArtCard, SongCard, TagsList, UserCard, MusicConductor, app_serv, Cloudcasts, SeesuUser, pv) {
"use strict";
var app_env = app_serv.app_env;
var localize = app_serv.localize;
var complexEach = app_serv.complexEach;

var pvUpdate = pv.update;
var lang = app_env.lang;

var converNews = function(list) {
	var result = new Array(list.length);
	for (var i = 0; i < list.length; i++) {
		var cur = list[i][lang] || list[i]["original"];
		result[i] = {
			date: cur[5],
			header: cur[1],
			body: cur[2],
			link: cur[3],
			link_text: cur[4] || "details"
		};

	}
	return result;
};

var AppNews = BrowseMap.Model.extendTo(function AppNews() {}, {
	model_name: 'app_news',
	init: function() {
		this._super.apply(this, arguments);


		this.initStates();
		//pv.update(this, 'news_list', converNews(news_data));

		//var mixcloud
		return this;
	}
});
AppNews.converNews = converNews;




var subPageInitWrap = function(Constr, full_name, data) {
	//var instance = new Constr();
	if (!data) {
		data = {};
	}
	data['url_part'] = '/' + full_name;
	return [Constr, data];

};

var StartPage = spv.inh(BrowseMap.Model, {
	init: function(target, opts) {
		target.su = opts.app;
		pvUpdate(target, 'needs_search_from', true);
		pvUpdate(target, 'nav_title', 'Seesu start page');
		pvUpdate(target, 'nice_artist_hint', target.app.popular_artists[(Math.random()*10).toFixed(0)]);

		target.app.s.susd.ligs.regCallback('start-page', function(resp){
			if (!resp) {return;}
			var result = complexEach([resp[1], resp[2]], function(result, girl, boy) {
				if (girl) {
					result.push(girl);
				}
				if (boy) {
					result.push(boy);
				}

				return result;
			});

			pvUpdate(target, 'users_listenings', result);
			pvUpdate(target, 'users_listenings_loading', false);
		}, function() {
			pvUpdate(target, 'users_listenings_loading', true);
		});

		target.closed_messages = app_serv.store('closed-messages') || {};
		return target;
	}
}, {
	model_name: 'start_page',
	zero_map_level: true,
	showPlaylists: function(){
		this.app.search(':playlists');
	},
	refreshListeners: function() {
		this.app.s.susd.ligs.getData();
	},
	'nest-pstuff': ['users/me'],
	'nest-muco': ['conductor'],
	'nest-tags': ['tags'],
	'nest-news': ['news'],
	rpc_legacy: {
		requestSearchHint: function() {
			var artist = this.state('nice_artist_hint');
			this.app.search(artist);
			pvUpdate(this, 'nice_artist_hint', this.app.popular_artists[(Math.random()*10).toFixed(0)]);
			this.app.trackEvent('Navigation', 'hint artist');
		},
		changeSearchHint: function() {
			pvUpdate(this, 'nice_artist_hint', this.app.popular_artists[(Math.random()*10).toFixed(0)]);
		}
	},
	sub_pages_routes: {
		'catalog': function(name) {
			return [ArtCard, {
				head: {
					artist_name: name
				}
			}];
			// return subPageInitWrap(ArtCard, full_name, {
			// 	artist: name
			// });
		},
		'tracks': function(complex_string, raw_str) {
			var full_name = 'tracks/' + raw_str;
			var parts = this.app.getCommaParts(raw_str);
			if (!parts[1] || !parts[0]){
				return;
			} else {
				return [SongCard, {
					states: {
						url_part: '/' + full_name
					},
					head: {
						artist_name: parts[0],
						track_name: parts[1]
					}
				}];
				// return subPageInitWrap(SongCard, full_name, {

				// });
			}

		},
		'users': function(name) {
			var full_name = 'users/' + name;
			if (name == 'me'){
				return [UserCard, {
					states: {
						nav_title: localize('your-pmus-f-aq'),
						url_part: '/' + full_name
					},
					head: {
						for_current_user: true
					}
				}];
				// return subPageInitWrap(UserCard, full_name);
			} else {
				var name_spaced = name.split(':');
				var namespace = name_spaced[0];
				if (namespace == 'lfm') {
					return [UserCard.LfmUserCard, {
						states: {
							url_part: '/' + full_name
						},
						head: {
							lfm_userid: name_spaced[1]
						}
					}];
					// return subPageInitWrap(UserCard.LfmUserCard, full_name, {userid: name_spaced[1]});
				} else if (namespace == 'vk') {
					return [UserCard.VkUserCard, {
						states: {
							url_part: '/' + full_name
						},
						head: {
							vk_userid: name_spaced[1]
						}
					}];
					// return subPageInitWrap(UserCard.VkUserCard, full_name, {userid: name_spaced[1]});
				} else if (namespace == 'su') {
					return [SeesuUser, {
						states: {
							url_part: '/' + full_name
						},
						head: {
							vk_userid: name_spaced[1]
						}
					}];
				}
			}
		},
		// 'blogs': function(blog_url) {
		// 	var full_name = 'blogs/' +  this.app.encodeURLPart(blog_url);
		// 	return subPageInitWrap(MusicBlog, full_name, {
		// 		blog_url: blog_url
		// 	});
		// },
		'cloudcasts': function(mixcloud_urlpiece) {
			var full_name = 'cloudcasts/' +  this.app.encodeURLPart(mixcloud_urlpiece);
			return subPageInitWrap(Cloudcasts, full_name, {
				key: mixcloud_urlpiece
			});
		}
	},
	sub_pa: {
		'tags': {
			title: localize('Pop-tags'),
			constr: TagsList
		},
		'conductor': {
			title: localize('music-cond'),
			constr: MusicConductor
		},
		'news': {
			title: localize('News'),
			constr: AppNews
		}
	},
	getSPC: function(parsed_str, path_string) {
		var parts = path_string.split('/');
		var first_part = parts[0];
		//var full_name = first_part;

		var handler = this.sub_pages_routes[first_part];
		return handler && handler.call(this, decodeURIComponent(parts[1]), parts[1]);
	},
	subPager: function(parsed_str, path_string) {
		var parts = path_string.split('/');
		var first_part = parts[0];

		var full_name = first_part;
		if (parts[1]){
			full_name += '/' + parts[1];
		}
		if (!this.sub_pages[full_name]){
			if (!parts[1]){
				return;
			}

			var instance_data = this.getSPC(parsed_str, path_string);
			var instance;
			if (instance_data) {
				if (Array.isArray(instance_data)) {
					instance = new instance_data[0]();

				} else {
					instance = instance_data;
				}
			}
			if (instance){
				this.sub_pages[full_name] = instance;
			}

			instance_data.splice( 0, 1, instance );
			return instance_data;
		}
		return this.sub_pages[full_name];
	},
	short_title: 'Seesu',
	getTitle: function() {
		return this.short_title;
	},
	messages: {
		"rating-help": function(state){
			if (this.app.app_pages[app_env.app_type]){
				if (state){
					pvUpdate(this, 'ask-rating-help', this.app.app_pages[app_env.app_type]);
				} else {
					pvUpdate(this, 'ask-rating-help', false);
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
StartPage.AppNews = AppNews;
return StartPage;
});
