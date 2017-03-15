define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var morph_helpers = require('js/libs/morph_helpers');
var BrowseMap = require('../libs/BrowseMap');

var pvUpdate = pv.update;

var CommonMessagesStore = spv.inh(pv.Eventor, {
	naming: function(constr) {
		return function CommonMessagesStore(app, glob_store, store_name){
			constr(this, app, glob_store, store_name);
		};
	},
	init: function (self, app, glob_store, store_name) {
    self.glob_store = glob_store;
    self.store_name = store_name;
	},
	props: {
		markAsReaded: function(message) {
			var changed = this.glob_store.set(this.store_name, message);
			if (changed){
				this.trigger('read', message);
			}
		},
		getReadedMessages: function() {
			return this.glob_store.get(this.store_name);
		}
	}
});

var GMessagesStore = function(app, set, get) {
	this.app = app;
	this.sset = set;
	this.sget = get;
	this.store = this.sget() || {};
	this.cm_store = {};
};

spv.Class.extendTo(GMessagesStore, {
	set: function(space, message) {
		this.store[space] = this.store[space] || [];
		if ( this.store[space].indexOf(message) == -1 ){
			this.store[space].push(message);
			this.sset(this.store);
			return true;
		}
	},
	get: function(space) {
		return this.store[space] || [];
	},
	getStore: function(name) {
		return this.cm_store[name] || (this.cm_store[name] = new CommonMessagesStore(this.app, this, name));
	}
});

var ImagesPack = spv.inh(pv.Model, {
	init: function(target) {
		target.images_by_source = {};
		target.all_images = [];
	}
}, {
	addImage: function(lfm_arr, source) {
		if (!this.images_by_source[source] && lfm_arr){
			this.images_by_source[source] = lfm_arr;
			this.all_images.push({
				data: lfm_arr,
				source: source
			});
			this.checkImages();
		}
	},
	checkImages: function() {
		var best_data = spv.filter(this.all_images, 'data.lfm_id', function(value) {
			return !!value;
		});
		if (!this.state('best_image')){
			if (best_data.length){
				pvUpdate(this, 'best_image', best_data[0].data);
			}

		}
		if (!this.state('just_image')){
			if (best_data.not.length){
				pvUpdate(this, 'just_image', best_data.not[0].data);
			}

		}
	}
});
var TrackImages  = spv.inh(ImagesPack, {
	init: function(target, opts, data, params) {
		target.artmd = params.artmd;
		target.artist = params.info.artist;
		target.track = params.info.track;

		// results is state
		target.wlch(params.artmd, 'image-to-use', 'artist_image');
	}
}, {
	complex_states: {
		'image-to-use': {
			depends_on: ['best_image', 'just_image', 'artist_image'],
			fn: function(bei, jui, arti){
				return bei || jui || arti;
			}
		}
	}
});

var ArtistImages = spv.inh(ImagesPack, {
	init: function(target, opts, data, params) {
		target.artist_name = params.artist_name;
	}
}, {
	complex_states: {
		'image-to-use': {
			depends_on: ['best_image', 'just_image'],
			fn: function(bei, jui){
				return bei || jui;
			}
		}
	}
});

var LastFMArtistImagesSelector = spv.inh(pv.Model, {
	init: function(target) {
		target.art_models = {};
		target.track_models = {};
		target.unknown_methods = {};
	}
}, {
	convertEventName: function(event_name) {
		return event_name.toLowerCase().replace(/^\s+|\s+$/, '');
	},
	getImageRewrap: function(obj) {
		if (!obj.array && !obj.item){
			return;
		}
		return this.getImageWrap(obj.array || obj.item);
	},
	getImageWrap: morph_helpers.lfm_image,
	setArtistImage: function(artist_name, lfm_arr, source) {
		this.getArtistImagesModel(artist_name).addImage(this.getImageWrap(lfm_arr), source);
	},
	setTrackImage: function(info, lfm_arr, source) {

		this.getTrackImagesModel(info).addImage(this.getImageWrap(lfm_arr), source);
	},
	setImage: function(info, source) {
		if (!info.artist){
			throw new Error('give me artist name');
		}
		if (!source){
			throw new Error('give me source');
		}
	},
	getTrackImagesModel: function(info) {
		if (!info.artist || !info.track){
			throw new Error ('give me full track info');
		}
		info = spv.cloneObj({}, info);

		info.artist = this.convertEventName(info.artist);
		info.track = this.convertEventName(info.track);

		var model_id = info.artist + ' - ' + info.track;
		if (!this.track_models[model_id]) {
			var md = this.initChi('track', false, {
				artmd: this.getArtistImagesModel(info.artist),
				info: info
			});

			this.track_models[model_id] = md;
		}
		return this.track_models[model_id];
	},
	'chi-track': TrackImages,
	'chi-artist': ArtistImages,
	getArtistImagesModel: function(artist_name) {
		if (!artist_name){
			throw new Error('give me artist name');
		}
		artist_name = this.convertEventName(artist_name);

		if (!this.art_models[artist_name]){
			var md = this.initChi('artist', false, {
				artist_name: artist_name
			});
			this.art_models[artist_name] = md;
		}
		return this.art_models[artist_name];
	},
	checkLfmData: function(method, r, parsed) {
		if (this.resp_handlers[method]){
			this.resp_handlers[method].call(this, r, method, parsed);
		} else {
			this.unknown_methods[method] = true;
		}
	},
	resp_handlers: {
		'artist.getInfo': function(r, method) {
			var artist_name = spv.getTargetField(r, 'artist.name');
			if (artist_name){
				var images = spv.getTargetField(r, 'artist.image');
				this.setArtistImage(artist_name, images, method);
			}
			var artists = spv.toRealArray(spv.getTargetField(r, 'artist.similar.artist'));
			for (var i = 0; i < artists.length; i++) {
				var cur = artists[i];
				if (!cur.image) {continue;}
				this.setArtistImage(cur.name, cur.image, method + '.similar');
			}


		},
		'artist.getSimilar': function(r, method) {
			var artists = spv.toRealArray(spv.getTargetField(r, 'similarartists.artist'));
			for (var i = 0; i < artists.length; i++) {
				var cur = artists[i];
				if (!cur.image) {continue;}
				this.setArtistImage(cur.name, cur.image, method);
			}
		},
		'geo.getMetroUniqueTrackChart': function(r, method) {
			var tracks = spv.toRealArray(spv.getTargetField(r, 'toptracks.track'));
			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				this.setTrackImage({
					artist: cur.artist.name,
					track: cur.name
				}, cur.image, method);

			}
		},
		'album.getInfo': function(r, method) {
			var image = spv.getTargetField(r, 'album.image');
			var tracks = spv.toRealArray(spv.getTargetField(r, 'album.track'));
			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				this.setTrackImage({
					artist: cur.artist.name,
					track: cur.name
				}, image, method);

			}
		},
		'playlist.fetch': function(r, method) {
			var tracks = spv.toRealArray(spv.getTargetField(r, 'playlist.trackList.track'));
			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				this.setTrackImage({
					artist: cur.creator,
					track: cur.title
				}, cur.image, method);
			}

		},
		'user.getLovedTracks': function(r, method) {
			var tracks = spv.toRealArray(spv.getTargetField(r, 'lovedtracks.track'));

			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				this.setTrackImage({
					artist: cur.artist.name,
					track: cur.name
				}, cur.image, method);

			}

		},
		'user.getRecommendedArtists': function(r, method) {
			var artists = spv.toRealArray(spv.getTargetField(r, 'recommendations.artist'));

			for (var i = 0; i < artists.length; i++) {
				var cur = artists[i];
				if (!cur.image) {continue;}
				this.setArtistImage(cur.name, cur.image, method);
			}

		},
		'track.search': function(r, method) {
			var tracks = spv.toRealArray(spv.getTargetField(r, 'results.trackmatches.track'));

			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				this.setTrackImage({
					artist: cur.artist,
					track: cur.name
				}, cur.image, method);

			}

		},
		'artist.search': function(r, method) {
			var artists = spv.toRealArray(spv.getTargetField(r, 'results.artistmatches.artist'));
			for (var i = 0; i < artists.length; i++) {
				var cur = artists[i];
				if (!cur.image) {continue;}
				this.setArtistImage(cur.name, cur.image, method);
			}
		},
		'artist.getTopTracks': function(r, method, tracks) {
			tracks = tracks || spv.toRealArray(spv.getTargetField(r, 'toptracks.track'));
			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				this.setTrackImage({
					artist: cur.artist.name,
					track: cur.name
				}, cur.image, method);

			}
		},
		'tag.getTopArtists': function(r, method, artists) {
			artists = artists || spv.toRealArray(spv.getTargetField(r, 'topartists.artist'));
			for (var i = 0; i < artists.length; i++) {
				var cur = artists[i];
				if (!cur.image) {continue;}
				this.setArtistImage(cur.name, cur.image, method);
			}

		},
		'tag.getWeeklyArtistChart': function(r, method, artists) {
			artists = artists || spv.toRealArray(spv.getTargetField(r, 'weeklyartistchart.artist'));
			for (var i = 0; i < artists.length; i++) {
				var cur = artists[i];
				if (!cur.image) {continue;}
				this.setArtistImage(cur.name, cur.image, method);
			}
		}
	}
});

var PartsSwitcher = spv.inh(pv.Model, {
	init: function(target) {
		// this._super.apply(this, arguments);
		target.context_parts = {};
		target.active_part = null;
	}
}, {
	hideAll: function() {
		if (this.active_part){
			pvUpdate(this, 'active_part', false);
			this.active_part.deacivate();
			this.active_part = null;
		}
	},
	hide: function(name){
		ensurePart(this, name);
		var target = this.context_parts[name] || BrowseMap.routePathByModels(this, name);
		if (target === this.active_part){
			this.hideAll();
		}
	},
	addPart: function(model) {
		if (!this.context_parts[model.model_name]){
			this.context_parts[model.model_name] = model;

			var array = this.getNesting('context_parts') || [];
			array.push(model);
			pv.updateNesting(this, 'context_parts', array);

		}
	},
	getAllParts: function(){
		return this.context_parts;
	},
	switchPart: function(name) {
		ensurePart(this, name);
		var target = this.context_parts[name] || BrowseMap.routePathByModels(this, name);
		if (target && target != this.active_part){
			if (this.active_part){
				this.active_part.deacivate();
			}
			this.active_part = target;
			pvUpdate(this, 'active_part', name);
			this.active_part.acivate();


		} else {
			this.hideAll();
		}
	}
});

function ensurePart(self, name) {
	if (self.context_parts[name]) {
		return;
	}

	var part = self.context_parts[name] || BrowseMap.routePathByModels(self, name);
	var array = self.getNesting('context_parts') || [];
	if (array.indexOf(part) != -1) {
		return;
	}
	array.push(part);

	self.updateNesting('context_parts', array);

}


var BaseCRow = spv.inh(pv.Model, {
	init: function(target) {
		target.actionsrow = target.actionsrow;
		if (target.actionsrow_src && !target.actionsrow) {
			var count = target.actionsrow_src.length;
			var cur = count && target;
			while (count) {
				cur = cur.map_parent;
				count--;
			}

			target.actionsrow = cur;
		}
	}
}, {

	switchView: function(){
		this.actionsrow.switchPart(this.model_name);
	},
	hide: function(){
		this.actionsrow.hide(this.model_name);
	},
	deacivate: function(){
		pvUpdate(this, "active_view", false);
	},
	acivate: function(){
		pvUpdate(this, "active_view", true);
	}
});


var VkLoginB = spv.inh(pv.Model, {
	init: function(target) {
		target.auth = target.app.auths.vk;
		target.updateNesting('auth', target.auth);

		var target_bits;

		var config = target.config;

		var open_opts = config && config.open_opts;
		if (open_opts){
			target.open_opts = open_opts;
			if (target.open_opts.settings_bits){
				target_bits = target.open_opts.settings_bits;
			}
		}

		var notf_args = config && config.getNotf && config.getNotf(target);

		if (notf_args) {
			target.notf = notf_args.notf;
			target.notf.on('read', function(value) {
				if (value == 'vk_audio_auth '){
					pvUpdate(target, 'notify_readed', true);
				}

			});

			if (notf_args.readed){
				pvUpdate(target, 'notify_readed', true);
			}

			pvUpdate(target, 'has_notify_closer', true);
		}

		if (target.auth.deep_sanbdox){
			pvUpdate(target, 'deep_sandbox', true);
		}

		pvUpdate(target, 'target_bits', target_bits);

		if (target.auth && target.auth.data_wait){
			target.waitData();
		} else {
			target.auth.on('data_wait', function(){
				target.waitData();
			});
		}

	}
}, {
	model_name: 'auth_block_vk',
	access_desc: null,
	'compx-has_session': [
		['@one:has_token:auth', 'target_bits', '@one:settings_bits:auth'],
		function(has_token, target_bits, settings_bits) {
			if (has_token) {return true;}
			if (typeof target_bits != 'undefined' && settings_bits != 'undefined') {
				return (settings_bits & target_bits) * 1;
			}
		}
	],
	removeNotifyMark: function() {
		this.notf.markAsReaded('vk_audio_auth ');
	},
	bindAuthReady: function(exlusive_space, callback) {
		this.auth.bindAuthReady(exlusive_space, callback, this.open_opts && this.open_opts.settings_bits);
	},
	// triggerSession: function() {
	// 	pvUpdate(this, 'has_session', true);
	// },
	waitData: function() {
		pvUpdate(this, 'data_wait', true);
	},
	notWaitData: function() {
		pvUpdate(this, 'data_wait', false);
	},
	'compx-request_description': [
		['access_desc', '#locales.vk-auth-invitation'],
		function(desc, vk_inv) {
			return desc ? (desc + ' ' + vk_inv): '';
		}
	],
	useCode: function(auth_code){
		if (this.bindAuthCallback){
			this.bindAuthCallback();
		}
		this.auth.setToken(auth_code);

	},
	requestAuth: function(opts) {
		if (this.beforeRequest){
			this.beforeRequest();
		}
		this.auth.requestAuth(opts || this.open_opts);
	},
	switchView: function(){
		pvUpdate(this, 'active', !this.state('active'));
	}
});



return {
	GMessagesStore:GMessagesStore,
	LastFMArtistImagesSelector:LastFMArtistImagesSelector,
	PartsSwitcher:PartsSwitcher,
	BaseCRow:BaseCRow,
	VkLoginB: VkLoginB
};
});
