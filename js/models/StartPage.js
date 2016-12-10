define(function(require) {
"use strict";
var BrowseMap = require('js/libs/BrowseMap');
var ArtCard = require('./ArtCard');
var SongCard = require('./SongCard');
var TagsList = require('./TagPage');
var UserCard = require('./UserCard');
var MusicConductor = require('./MusicConductor');
var app_serv = require('app_serv');
var Cloudcasts = require('./Cloudcasts');
var SeesuUser = require('./SeesuUser');
var pv = require('pv');
var spv = require('spv');
var route = require('../modules/route');
var invstg = require('../models/invstg');
var filesSearchers = require('../file_searchers');
var Mp3Search = require('./Mp3Search/index');

var app_env = app_serv.app_env;
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

var AppNews = spv.inh(BrowseMap.Model, {}, {
	model_name: 'app_news',
});
AppNews.converNews = converNews;

var StartPage = spv.inh(BrowseMap.Model, {
	init: function(target, opts) {
		target.su = opts.app;
		pvUpdate(target, 'needs_search_from', true);
		pvUpdate(target, 'nav_title', 'Seesu start page');
		pvUpdate(target, 'nice_artist_hint', target.app.popular_artists[(Math.random()*10).toFixed(0)]);


		// filesSearchers/
		var mp3_search = BrowseMap.routePathByModels(target, 'mp3_search');
		filesSearchers(target.app, mp3_search, app_env, target.app.cache_ajax, target.app.resortQueueFn, target.app.addQueueFn);
		target.mp3_search = mp3_search;

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
	'chi-invstg': invstg.SearchPage,
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
	sub_pager: {
		by_type: {
			artist: [
				ArtCard, null, {
					artist_name: 'by_slash.0'
				}
				/*
				url_part: [['artist_name'], function(artist_name) {
					return artist_name && '/catalog/' + route.encodeURLPart(artist_name);
				}],
				*/
			],
			track: [
				SongCard, null, {
					artist_name: 'by_comma.0',
					track_name: 'by_comma.1',
				}
			],
			user_current: [
				UserCard, [['#locales.your-pmus-f-aq']], {
					for_current_user: [true]
				}
			],
			user_su: [
				SeesuUser, [['vk_userid']], {
					vk_userid: 'name_spaced'
				}
			],
			user_lfm: [
				UserCard.LfmUserCard, null, {
					lfm_userid: 'name_spaced'
				}
			],
			user_vk: [
				UserCard.VkUserCard, null, {
					vk_userid: 'name_spaced'
				}
			],
			cloudcast: [
				Cloudcasts, [['key'], function(key) {
					return 'Cloudcast ' + key;
				}], {
					key: 'simple_name'
				}
			]
		},
		type: {
			catalog: 'artist',
			tracks: function(name) {
				var parts = route.getCommaParts(name);
				if (!parts[1] || !parts[0]){
					return;
				}
				return 'track';
			},
			cloudcasts: 'cloudcast',
			users: (function(){
				var spaces = spv.makeIndexByField(['lfm', 'vk', 'su']);
				return function(name) {
					if (name == 'me') {
						return 'user_current';
					}

					var name_spaced = name.split(':');
					var namespace = name_spaced[0];
					if (spaces[namespace]) {
						return 'user_' + namespace;
					}
				};
			})()
		}
	},
	sub_page: {
		'mp3_search': {
			constr: Mp3Search,
			title: [[]],
		},
		'tags': {
			constr: TagsList,
			title: [['#locales.Pop-tags']],

		},
		'conductor': {
			constr: MusicConductor,
			title: [['#locales.music-cond']]

		},
		'news': {
			constr: AppNews,
			title: [['#locales.News']]
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
