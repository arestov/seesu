define(['provoda', 'spv', 'app_serv' ,'cache_ajax', 'js/modules/aReq', 'js/libs/Mp3Search', 'jquery', './comd', './YoutubeVideo'],
function(provoda, spv, app_serv, cache_ajax, aReq, Mp3Search, $, comd, YoutubeVideo) {
"use strict";
var localize = app_serv.localize;
var get_youtube = function(q, callback){
	var cache_used = cache_ajax.get('youtube', q, callback);
	if (!cache_used){
		var data = {
			q: q,
			v: 2,
			alt: 'json-in-script'
			
		};
		
		aReq({
			url: 'http://gdata.youtube.com/feeds/api/videos',
			dataType: 'jsonp',
			data: data,
			resourceCachingAvailable: true,
			afterChange: function(opts) {
				if (opts.dataType == 'json'){
					data.alt = 'json';
					opts.headers = null;
				}

			},
			thisOriginAllowed: true
		}).done(function(r){
			if (callback) {callback(r);}
			cache_ajax.set('youtube', q, r);
		});
		
	}
};


var NotifyCounter = function(name, banned_messages) {
	this.init();
	this.messages = {};
	this.banned_messages = banned_messages || [];
	this.name = name;
};

provoda.Model.extendTo(NotifyCounter, {
	addMessage: function(m) {
		if (!this.messages[m] && this.banned_messages.indexOf(m) == -1){
			this.messages[m] = true;
			this.recount();
		}
	},
	banMessage: function(m) {
		this.removeMessage(m);
		this.banned_messages.push(m);
	},
	removeMessage: function(m) {
		if (this.messages[m]){
			delete this.messages[m];
			this.recount();
		}
	},
	recount: function() {
		var counter = 0;
		for (var a in this.messages){
			++counter;
		}
		this.updateState('counter', counter);
	}
});



var MfComplect = function(opts, params) {
	this.init();
	this.start_file = params.file;
	this.mo = opts.mo;
	this.mf_cor = opts.mf_cor;
	this.moplas_list = [];
	this.source_name = params.source_name;

	var _this = this;
	this.selectMf = function() {
		_this.mf_cor.playSelectedByUser(this);
	};



	var sf;
	if (this.start_file){
		sf = this.start_file
			.getSongFileModel(this.mo, this.mo.player)
				.on('want-to-play-sf', this.selectMf);
		this.moplas_list.push(sf);
		this.updateNesting('moplas_list', this.moplas_list);
	} else {
		this.search_source = params.search_source;
		this.wch(this.search_source, 'files-list', this.hndFilesListCh);

	}

	this.updateState('complect_name', this.source_name);
	
};

provoda.Model.extendTo(MfComplect, {
	flchwp_opts: {
		exlusive: true
	},
	hndFilesListCh: function(e) {
		var files_list = e.value;
		if (!files_list){
			return;
		}
		var moplas_list = [];
		this.updateState('overstock', files_list.length > this.overstock_limit);
		var sf;
		for (var i = 0; i < files_list.length; i++) {
		
			sf =
				files_list[i]
					.getSongFileModel(this.mo, this.mo.player)
						.on('want-to-play-sf.mfcomp', this.selectMf, this.flchwp_opts);
			sf.updateState('overstock', i + 1 > this.overstock_limit);
			moplas_list.push(sf);
			this.updateNesting('moplas_list', moplas_list);
		}
		this.moplas_list = moplas_list;

	},
	toggleOverstocked: function() {
		this.updateState('show_overstocked', !this.state('show_overstocked'));
	},
	overstock_limit: 5,
	hasManyFiles: function() {
		return this.sem_part && this.sem_part.t && this.sem_part.t.length > 1;
	},
	getFiles: function(type) {
		return this.search_source.getFiles(type);
	}
});



var MfCor = function() {};
provoda.Model.extendTo(MfCor, {
	hndMoImportant: function(e) {
			
		if (e.value && e.value){
			var _this = this;
			setTimeout(function() {
				_this.loadVideos();
			}, 100);
		}
	},
	hndTrackNameCh: function(e) {
		if (e.value){
			this.files_investg = this.mo.mp3_search.getFilesInvestg({artist: this.mo.artist, track: this.mo.track});
			this.bindInvestgChanges();
			this.mo.bindFilesSearchChanges();
			if (this.last_search_opts){
				this.files_investg.startSearch(this.last_search_opts);
				this.last_search_opts = null;
			}
		}
		
	},
	init: function(opts, file) {
		this._super();
		this.omo = opts.omo;
		this.mo = opts.mo;
		this.complects = {};
		this.subscribed_to = [];
		this.preload_initors = [];

		var _this = this;

		this.mfPlayStateChange = function(e) {
			if (_this.state('used_mopla') == this){
				_this.updateState('play', e.value);
			}
		};
		this.mfError = function() {
			_this.checkMoplas(this);
		};
		/*
		this.semChange = function(val) {
			_this.semChanged(val);
		};
		*/
		this.wch(this.mo, 'is_important', this.hndMoImportant);

		

		if (file){
			this.file = file;
			file.models = file.models || {};
			file.getSongFileModel = file.getSongFileModel || Mp3Search.getSongFileModel;
			var complect = new MfComplect({
					mf_cor: this,
					mo: this.mo
				}, {
					file: this.file,
					source_name: 'vk'
				});
			this.addMFComplect(complect, this.file.from);
			this.updateDefaultMopla();
			this.updateNesting('sorted_completcs', [complect]);

		} else {
			//this.wch(this.mo, 'track', )
			this.mo.on('vip-state-change.track', this.hndTrackNameCh, {immediately: true, soft_reg: false, context: this});
			
		}
		
		this.archivateChildrenStates('sorted_completcs', 'moplas_list', function(values_array) {
			var args = values_array;
			for (var i = 0; i < args.length; i++) {
				var cur = args[i];
				if (cur && cur.length > 1){
					return true;
				}
			}
			return false;
		}, 'has_files');

		this.intMessages();


		

		/*
		this.watchStates(['has_files', 'vk_audio_auth '], function(has_files, vkaa) {
			if (has_files || vkaa){
				_this.updateState('must-be-expandable', true);
			}
		});*/

		
	},
	loadVideos: function() {
		if (this.videos_loaded){
			return this;
		}
		this.videos_loaded = true;
		var _this = this;
		var q = this.mo.artist + " - " + this.mo.track;
		get_youtube(q, function(r){
			var vs = r && r.feed && r.feed.entry;
			if (vs && vs.length){
				
			
				
				var preview_types = ["default","start","middle","end"];

				//set up filter app$control.yt$state.reasonCode != limitedSyndication

				var video_arr = [];

				for (var i=0, l = Math.min(vs.length, 3); i < l; i++) {
					var
						_v = vs[i],
						tmn = {},
						v_id = _v['media$group']['yt$videoid']['$t'],
						v_title = _v['media$group']['media$title']['$t'];
					var cant_show = spv.getTargetField(_v, "app$control.yt$state.name") == "restricted";
					cant_show = cant_show || spv.getTargetField(spv.filter(spv.getTargetField(_v, "yt$accessControl"), "action", "syndicate"), "0.permission") == "denied";


					var thmn_arr = spv.getTargetField(_v, "media$group.media$thumbnail");
					
					$.each(preview_types, function(i, el) {
						tmn[el] = spv.filter(thmn_arr, 'yt$name', el)[0].url;
					});

					var yt_v = new YoutubeVideo();
					yt_v.init({
						app: _this.mo.app,
						map_parent: _this.mo
					}, {
						yt_id: v_id,
						cant_show: cant_show,
						previews: tmn,
						title: v_title,
						mo: _this.mo
					});
					video_arr.push(yt_v);
				}

				video_arr.sort(function(a, b){
					return spv.sortByRules(a, b, ["cant_show"]);
				});
				_this.updateNesting('yt_videos', video_arr);
			}
		});
	},
	complex_states: {
		"must-be-expandable": {
			depends_on: ['has_files', 'vk_audio_auth ', 'few_sources', 'cant_play_music'],
			fn: function(has_files, vk_a_auth, fsrs, cant_play){
				return !!(has_files || vk_a_auth || fsrs || cant_play);
			}
		},
		mopla_to_use: {
			depends_on: ["user_preferred", "default_mopla"],
			fn: function(user_preferred, default_mopla){
				return user_preferred || default_mopla;
			}
		},
		user_preferred: {
			depends_on: ["selected_mopla_to_use", "almost_selected_mopla"],
			fn: function(selected_mopla_to_use, almost_selected_mopla) {
				return selected_mopla_to_use || almost_selected_mopla;
			}
		},
		current_mopla: {
			depends_on: ["used_mopla", "mopla_to_use"],
			fn: function(used_mopla, mopla_to_use) {
				return used_mopla || mopla_to_use;
			}
		},
		mopla_to_preload: {
			depends_on: ['current_mopla', 'search_ready', 'preload_allowed'],
			fn: function(current_mopla, search_ready, preload_allowed){
				return !!(preload_allowed && search_ready && current_mopla) && current_mopla;
			}
		}
	},
	state_change: {
		"mopla_to_use": function(nmf, omf) {
			if (nmf){
				this.listenMopla(nmf);
			}
		},
		"selected_mopla": function() {

		},
		"current_mopla": function(nmf, omf) {
			if (omf){
				omf.stop();
				omf.deactivate();
			}
			if (nmf){
				nmf.activate();
			}
		},
		"mopla_to_preload": function(nmf, omf){
			if (omf){
				omf.removeCache();
			}
			if (nmf) {
				nmf.load();
			}
		},
		"default_mopla": function(nmf, omf) {
			
		}

	},
	isSearchAllowed: function() {
		return !this.file;
	},
	intMessages: function() {
		this.notifier = new NotifyCounter();
		this.updateNesting('notifier', this.notifier);
		this.sf_notf = su.notf.getStore('song-files');
		var rd_msgs = this.sf_notf.getReadedMessages();

		for (var i = 0; i < rd_msgs.length; i++) {
			this.notifier.banMessage(rd_msgs[i]);
			if (rd_msgs[i] == 'vk_audio_auth '){
				this.vk_ntf_readed = true;
			}
		}
		this.bindMessagesRecieving();
		


		

		this.checkVKAuthNeed();

		var _this = this;
		this.player = this.mo.player;
		
		this.player
			.on('core-fail', function() {
				
				_this.updateState('cant_play_music', true);
				_this.notifier.addMessage('player-fail');
			})
			.on('core-ready', function() {
				_this.updateState('cant_play_music', false);
				_this.notifier.banMessage('player-fail');
			});


	},
	getCurrentMopla: function(){
		return this.state('current_mopla');
	},
	showOnMap: function() {
		this.mo.showOnMap();
		this.updateState('want_more_songs', true);
	},
	switchMoreSongsView: function() {
		if (!this.state('want_more_songs')){
			this.updateState('want_more_songs', true);
			//this.markMessagesReaded();
		} else {
			this.updateState('want_more_songs', false);
		}
		
	},
	markMessagesReaded: function() {
		this.sf_notf.markAsReaded('vk_audio_auth ');
		//this.notifier.banMessage('vk_audio_auth ');
	},
	addVKAudioAuth: function() {
		this.notifier.addMessage('vk_audio_auth ');
		if (!this.vk_auth_rqb){

			this.vk_auth_rqb = new comd.VkLoginB();
			this.vk_auth_rqb.init({
				auth: su.vk_auth
			}, {
				open_opts: {settings_bits: 8},
				notf: this.sf_notf,
				notify_readed: this.vk_ntf_readed,
				desc:
					(
						this.files_investg && this.files_investg.state('has_mp3_files') ?
						localize('to-find-better') :
						localize("to-find-and-play")
					)  +
					" " +  localize('music-files-from-vk')
			});
			this.updateNesting('vk_auth', this.vk_auth_rqb);
			this.updateState('changed', new Date());
			this.updateState('vk_audio_auth ', true);
		}

	},
	removeVKAudioAuth: function() {
		this.notifier.removeMessage('vk_audio_auth ');
		if (this.vk_auth_rqb){
			this.updateState('vk_audio_auth ', false);
			this.vk_auth_rqb.die();
			delete this.vk_auth_rqb;
		}

	},
	checkVKAuthNeed: function() {
		if (this.mo.mp3_search){
				
			if (this.mo.mp3_search.haveSearch('vk')){
				this.removeVKAudioAuth();
			} else {
				if (this.isHaveAnyResultsFrom('vk')){
					this.removeVKAudioAuth();
				} else {
					this.addVKAudioAuth();
				}
			}
		}
		return this;
	},
	bindMessagesRecieving: function() {

		var _this = this;
		if (this.mo.mp3_search){
			
			this.mo.mp3_search.on('new-search', function(search, name) {
				if (name == 'vk'){
					_this.removeVKAudioAuth();
				}
			});
		}
		this.sf_notf.on('read', function(message_id) {
			_this.notifier.banMessage(message_id);
		});
		
	},
	collapseExpanders: function() {
		this.updateState('want_more_songs', false);
	},
	/*
	setSem: function(sem) {
		if (this.file){
			throw new Error('already using single file instead of search');
		}
		if (this.sem != sem){
			if (this.sem){
				sem.off('changed', this.semChange);
			}
			this.sem  = sem;
			sem.on('changed', this.semChange);
		}
		
	},*/
	addMFComplect: function(complect, name) {
		this.complects[name] = complect;
	},
	hndFilesListCh: function(e) {
		if (e.value){
			this.updateDefaultMopla();
			this.checkVKAuthNeed();
		}
	},
	bindSource: function(f_investg_s) {
		var source_name = f_investg_s.search_name;
		if (!this.complects[source_name]){
			var complect = new MfComplect({
				mf_cor: this,
				mo: this.mo
			}, {
				//sem_part: songs_packs[i],
				search_source: f_investg_s,
				source_name: source_name
			});
			this.addMFComplect(complect, source_name);
			this.wch(f_investg_s, 'files-list', this.hndFilesListCh);
			
		//	many_files = many_files || complect.hasManyFiles();
		}

	},
	startSearch: function(opts) {
		if (this.files_investg){
			this.files_investg.startSearch(opts);
		} else {
			this.last_search_opts = opts;
		}
	},
	hndSourcesList: function(e) {
		var sorted_completcs = [];
		for (var i = 0; i < e.value.length; i++) {
			var cur = e.value[i];
			this.bindSource(cur);
			sorted_completcs.push(this.complects[cur.search_name]);
		}
		this.updateNesting('sorted_completcs', sorted_completcs);
		this.updateState('few_sources', e.value.length > 1);
	},
	bindInvestgChanges: function() {
		//
		var investg = this.files_investg;
		if (!investg){
			return;
		}
		this.wch(investg, 'search_ready_to_use', 'search_ready');
		investg.on('child-change.sources_list', this.hndSourcesList, this.getContextOpts());
		
		

	},
	/*
	semChanged: function(complete) {
		this.checkVKAuthNeed();

		var songs_packs = this.songs_packs = this.sem.getAllSongTracks();

		this.pa_o = spv.filter(songs_packs, 'name');

		var many_files = this.pa_o.length > 1;

		var sorted_completcs = [];

		for (var i = 0; i < this.pa_o.length; i++) {
			var cp_name = this.pa_o[i];
			if (!this.complects[cp_name]){
				var complect = new MfComplect({
					mf_cor: this,
					mo: this.mo
				}, {
					sem_part: songs_packs[i]
				});
				this.addMFComplect(complect, cp_name);
				
				
				many_files = many_files || complect.hasManyFiles();
			}
			sorted_completcs.push(this.complects[cp_name]);
		}


		this.updateState('has_files', many_files);
		this.updateDefaultMopla();

		this.updateNesting('sorted_completcs', sorted_completcs);

	},*/
	listenMopla: function(mopla) {
		if (this.subscribed_to.indexOf(mopla) == -1){
			mopla.on('state-change.play', this.mfPlayStateChange);
			mopla.on('unavailable', this.mfError);

			this.subscribed_to.push(mopla);
		}
		return this;
	},
	checkMoplas: function(unavailable_mopla) {
		var current_mopla_unavailable;
		if (this.state("used_mopla") == unavailable_mopla){
			this.updateState("used_mopla", false);
			current_mopla_unavailable = true;
		}
		if (this.state("default_mopla") == unavailable_mopla){
			this.updateDefaultMopla();
		}
		if (this.state("user_preferred") == unavailable_mopla){
			this.updateState("selected_mopla_to_use", false);
			var from = this.state("selected_mopla").from;
			var available = this.getFilteredFiles(from, function(mf) {
				if (mf.from == from && !mf.unavailable){
					return true;
				}
			});
			available = available && available[0];
			if (available){
				this.updateState("almost_selected_mopla", available.getSongFileModel(this.mo, this.mo.player));
			} else {
				this.updateState("almost_selected_mopla", false);
			}
			//available.getSongFileModel(this.mo, this.mo.player)

			//if ("selected_mopla")
			//from
			//updateState("almost_selected_mopla", )

		}
		if (current_mopla_unavailable){
			this.trigger("error", this.canPlay());
		}

	},
	updateDefaultMopla: function() {
		var available = this.getFilteredFiles(false, function(mf) {
			if (!mf.unavailable){
				return true;
			}
		});
		available = available && available[0];
		if (available){
			this.updateState("default_mopla", available.getSongFileModel(this.mo, this.mo.player));
		} else {
			this.updateState("default_mopla", false);
		}

	},
	preloadFor: function(id){
		if (this.preload_initors.indexOf(id) == -1){
			this.preload_initors.push(id);
		}
		this.updateState('preload_allowed', true);
	},
	unloadFor: function(id){
		this.preload_initors = spv.arrayExclude(this.preload_initors, id);
		this.updateState('preload_allowed', !!this.preload_initors.length);

	},
	setVolume: function(vol, fac){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.setVolume(vol, fac);
		}
	},
	stop: function(){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.stop();
		}
	},
	switchPlay: function(){
		if (this.state('play')){
			this.pause();
		} else {
			this.play();
		}
		
	},
	pause: function(){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.pause();
		}
		
	},
	playSelectedByUser: function(mopla) {
		mopla.use_once = true;
		this.updateState("selected_mopla_to_use", mopla);
		this.updateState('selected_mopla', mopla);

		var t_mopla = this.state("mopla_to_use");
		if (t_mopla){
			if (this.state("used_mopla") != t_mopla){
				this.updateState("used_mopla", false);
			}
			this.play();
		}
		
	},
	play: function(){
		var cm = this.state("used_mopla");
		if (cm){
			if (!cm.state('play')){
				this.trigger('before-mf-play', cm);
				cm.play();
			}
		} else {
			var mopla = this.state("mopla_to_use");
			if (mopla){
				this.updateState("used_mopla", mopla);
				this.trigger('before-mf-play', mopla);
				mopla.play();
			}
		}
		
	},
	raw: function(){
		return !!this.omo && !!this.omo.raw;
	},
	isHaveAnyResultsFrom: function(source_name){
		var complect = this.complects[source_name];
		return complect && complect.search_source && complect.search_source.state('search_complete');
	},
	song: function(){
		if (this.raw()){
			return this.omo.getSongFileModel(this.mo, this.mo.player);
		} else if (this.sem) {
			var s = this.sem.getAllSongTracks('mp3');
			return !!s && s[0].t[0].getSongFileModel(this.mo, this.mo.player);
		} else{
			return false;
		}
	},
	getVKFile: function(){
		var file = this.state('current_mopla');
		if (file && file.from == 'vk'){
			return file;
		} else{
			var files = this.getFilteredFiles('vk');
			return files && files[0];
		}
	},
	getFilteredFiles: function(source_name, fn, type) {
		type = type || 'mp3';
		var all_files = [];
		var mfs = [];

		if (this.file){
			all_files.push(this.file);
		} else {
			if (source_name){
				var complect = this.complects[source_name];
				if (complect){
					all_files = all_files.concat(complect.getFiles(type));
				}
				
			} else {
				var sources_list = this.getNesting('sorted_completcs');
				for (var i = 0; i < sources_list.length; i++) {
					all_files = all_files.concat(sources_list[i].getFiles(type));
				}
				this.mo.mp3_search.sortMusicFilesArray(all_files, this.files_investg.msq);
				


			}
			//all_files = this.files_investg.getFiles(source_name, type);
		}
		if (fn){
			$.each(all_files, function(i, el) {
				if (fn(el)){
					mfs.push(el);
				}
			});
			return mfs;
		} else {
			return all_files;
		}

	},
	compoundFiles: function(fn, type) {
		var
			r = [],
			mfs = [],
			all = this.file ? [{t: [this.file]}] : this.sem.getAllSongTracks(type || "mp3");

		for (var i = 0; i < all.length; i++) {
			mfs.push.apply(mfs, all[i].t);
		}
		if (fn){
			$.each(mfs, function(i, el) {
				if (fn(el)){
					r.push(el);
				}
			});
			return r;
		} else {
			return mfs;
		}

	},
	canPlay: function() {
		return !!this.state("mopla_to_use");
	}
});
return MfCor;
});