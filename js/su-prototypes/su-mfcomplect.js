

var notifyCounterUI = function() {};

suServView.extendTo(notifyCounterUI, {
	init: function(md){
		this._super();
		this.createBase();
		this.setModel(md);
	},
	createBase: function() {
		this.c = $('<span class="notifier hidden"></span>');
	},
	state_change: {
		counter: function(state) {
			if (state){
				this.c.text(state);
				this.c.removeClass('hidden');
			} else {
				this.c.addClass('hidden');
			}
		}
	}
});

var notifyCounter = function(name, banned_messages) {
	this.init();
	this.messages = {};
	this.banned_messages = banned_messages || [];
	this.name = name;
};

provoda.Model.extendTo(notifyCounter, {
	ui_constr: notifyCounterUI,
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
			++counter
		}
		this.updateState('counter', counter);
	}
});

var mfComplectUI = function() {};
suServView.extendTo(mfComplectUI, {
	init: function(md){
		this.md = md;
		this._super();
		this.createBase();
		this.setModel(md);
	},
	createBase: function() {
		this.c = $('<div class="moplas-list"></div>');
		this.header_text = this.md.sem_part.name;
		this.header_c = $('<h4></h4>').text(this.header_text).appendTo(this.c);
		this.lc = $('<ul></ul>').appendTo(this.c);
	},
	appendChildren: function() {
		var moplas_list = this.md.moplas_list;

		for (var i = 0; i < moplas_list.length; i++) {
			var ui  = moplas_list[i].getFreeView();
			if (ui){
				this.lc.append(ui.getC())
				ui.appended(this)
			}
		}
	},
	state_change: {
		overstock: function(state) {
			if (state){
				var _this = this;
				var header = $('<a class="js-serv"></a>').click(function() {
					_this.md.toggleOverstocked();
				}).text(this.header_text);
				this.header_c.empty().append(header);
			}
		},
		"show-overstocked": function(state, oldstate){
			if (state){
				this.c.addClass('want-overstocked-songs');
			} else if (oldstate){
				this.c.removeClass('want-overstocked-songs');
			}
		}
	}
});

var mfComplect = function(mf_cor, sem_part, mo) {
	this.init();
	this.sem_part = sem_part;
	this.mo = mo;
	this.mf_cor = mf_cor;
	this.moplas_list = [];

	var _this = this;
	var playMf = function() {
		_this.mf_cor.play(this);
	};
	if (this.sem_part.t.length > this.overstock_limit){
		this.updateState('overstock', true);
	}
	
	for (var i = 0; i < this.sem_part.t.length; i++) {
		var sf = this.sem_part.t[i]
				.getSongFileModel(mo, mo.player)
					.on('want-to-be-selected', playMf);

		if (i + 1 > this.overstock_limit){
			sf.updateState('overstock', true);
		}
		this.addChild(sf);
		this.moplas_list.push(sf);
	}
};

provoda.Model.extendTo(mfComplect, {
	ui_constr: mfComplectUI,
	toggleOverstocked: function() {
		this.updateState('show-overstocked', !this.state('show-overstocked'));
	},
	overstock_limit: 5,
	hasManyFiles: function() {
		return this.sem_part && this.sem_part.t && this.sem_part.t.length > 1;
	}
});



var mfCorUI = function(md) {};
suServView.extendTo(mfCorUI, {
	init: function(md){
		this.md = md;
		this._super();
		this.createBase();
		this.setModel(md);
	},
	state_change: {
		changed: function(val) {
			this.appendChildren();
		},
		"want-more-songs": function(state) {
			if (state){
				this.c.addClass('want-more-songs');
			} else {
				this.c.removeClass('want-more-songs');
			}
		},
		"must-be-expandable": function(state) {
			if (state){
				this.sall_songs.removeClass('hidden')
			}
		}
	},
	createBase: function() {
		this.c = $('<div class="song-row-content moplas-block"></div>');
		
		
		


		if (!this.more_songs_b){
			var _this = this;
			this.sall_songs =  $('<div class="show-all-songs hidden"></div>');

			this.more_songs_b = $('<a class=""></a>').appendTo(this.sall_songs);
			this.more_songs_b.click(function() {
				_this.md.switchMoreSongsView();
			});
			$('<span></span>').text(localize('Files')).appendTo(this.more_songs_b);
			this.c.prepend(this.sall_songs);

			var nof_ui = this.md.notifier.getFreeView();
			if (nof_ui){
				this.sall_songs.append(nof_ui.getC());
				nof_ui.appended(this);
				this.addChild(nof_ui);
			}

			this.messages_c = $('<div class="messages-c"></div>').appendTo(this.c);
		}
		this.video_c = $('<div class="track-video hidden"></div>');
		if (this.md.mo.artist && this.md.mo.track){
			this.show_video_info(this.video_c, this.md.mo.artist + " - " + this.md.mo.track);
		}
		this.c.append(this.video_c);
	},
	appendChildren: function() {
		var _this = this;
		if (this.md.vk_audio_auth){
			var vk_auth_mess = this.md.vk_audio_auth.getFreeView(),
				vk_auth_mess_c = vk_auth_mess && vk_auth_mess.getC();
			if (vk_auth_mess_c){
				this.addChild(vk_auth_mess);
				this.messages_c.append(vk_auth_mess_c);
				vk_auth_mess.appended(this);
			}

		}
		


		if (this.md.pa_o){
			var pa = this.md.pa_o;

			var append = function(cur_view){
				var ui_c = cur_view && cur_view.getC();
				if (!ui_c){
					return;
				}

				var prev_name = pa[i-1];
				var prev = prev_name && _this.md.complects[prev_name];
				var prev_c = prev && prev.getC();
				if (prev_c){
					prev_c.after(ui_c);
				} else {
					var next_c = _this.getNextSemC(pa, i+1);
					if (next_c){
						next_c.before(ui_c);
					} else {
						_this.video_c.before(ui_c);
						//_this.c.append(ui_c);
					}
				}
				_this.addChild(cur_view);
				cur_view.appended(_this);
			};

			for (var i = 0; i < pa.length; i++) {
				append(this.md.complects[pa[i]].getFreeView());
			}
		}
		
	},
	getNextSemC: function(packs, start) {
		for (var i = start; i < packs.length; i++) {
			var cur_name = packs[i];
			var cur_mf = cur_name && this.md.complects[cur_name];
			return cur_mf && cur_mf.getC();
		}
	},
	showYoutubeVideo: function(id, c, link){
		if (this.video){
			this.hideYoutubeVideo();
		}
		this.video = {
			link: link.addClass('active'),
			node: $(su.ui.create_youtube_video(id)).appendTo(c)
		};
	},
	hideYoutubeVideo: function(){
		if (this.video){
			if (this.video.link){
				this.video.link.removeClass('active');
				this.video.link[0].showed = false;
				this.video.link = false;
				
			}
			if (this.video.node){
				this.video.node.remove();
				this.video.node = false;
			}
			delete this.video;
		}
	},
	show_video_info: function(vi_c, q){
		if (vi_c.data('has-info')){return true;}

		var _this = this;
		get_youtube(q, function(r){			
			var vs = r && r.feed && r.feed.entry;
			if (vs && vs.length){
				vi_c.data('has-info', true);
				vi_c.empty();
				//vi_c.append('<span class="desc-name"><a target="_blank" href="http://www.youtube.com/results?search_query='+ q +'">' + localize('video','Video') + '</a>:</span>');
				var v_content = $('<ul class=""></ul>');
			
				var make_v_link = function(thmn, vid, _title, cant_show){
					var link = 'http://www.youtube.com/watch?v=' + v_id

					var li = $('<li class="you-tube-video-link"></li>').click(function(e){
						if (!cant_show){
							var showed = this.showed;
							
							if (!showed){
								_this.showYoutubeVideo(vid, vi_c, $(this));
								_this.md.pause();
								this.showed = true;
							} else{
								_this.hideYoutubeVideo();
								_this.md.play();
								this.showed = false;
							}
							
						} else{
							app_env.openURL(link);
						}
						e.stopPropagation();
						e.preventDefault();
					});
					if (cant_show){
						li.addClass("cant-show")
					}


					var imgs = $();

					//thmn $('<img  alt=""/>').attr('src', img_link);

					if (thmn.start && thmn.middle &&  thmn.end){
						$.each(["start","middle","end"], function(i, el) {

							var span = $("<span class='preview-slicer'></span>");

							$('<img  alt=""/>').addClass('preview-part preview-' + el).attr('src', thmn[el]).appendTo(span);

							imgs = imgs.add(span);

							tmn[el] = $filter(thmn_arr, 'yt$name', el)[0].url;
						});
					} else {
						imgs.add($('<img  alt="" class="whole"/>').attr('src', thmn.default))
					}
					
					$("<a class='video-preview external'></a>")
						.attr('href', link)
						.append(imgs)
						.appendTo(li);
					
					$('<span class="video-title"></span>')
						.text(_title).appendTo(li);
						
					li.appendTo(v_content)
				}
				var preview_types = ["default","start","middle","end"];

				//set up filter app$control.yt$state.reasonCode != limitedSyndication

				var video_arr = []

				for (var i=0, l = Math.min(vs.length, 3); i < l; i++) {
					var 
						_v = vs[i],
						tmn = {},
						v_id = _v['media$group']['yt$videoid']['$t'],
						v_title = _v['media$group']['media$title']['$t'];
					var cant_show = getTargetField(_v, "app$control.yt$state.name") == "restricted";
					cant_show = cant_show || getTargetField($filter(getTargetField(_v, "yt$accessControl"), "action", "syndicate"), "0.permission") == "denied";


					var thmn_arr = getTargetField(_v, "media$group.media$thumbnail");
					
					$.each(preview_types, function(i, el) {
						tmn[el] = $filter(thmn_arr, 'yt$name', el)[0].url;
					});

					video_arr.push({
						thmn: tmn,
						vid: v_id,
						title: v_title,
						cant_show: cant_show
					});

					
					
				};

				video_arr.sort(function(a, b){
					return sortByRules(a, b, ["cant_show"]);
				});
				$.each(video_arr, function(i, el) {
					make_v_link(el.thmn, el.vid, el.title, el.cant_show);
				});

				
				
				vi_c.append(v_content).removeClass('hidden')
				
			}
		});
		
	}
});


var mfCor = function(mo, omo) {
	this.init();
	this.omo = omo;
	this.mo = mo;
	this.complects = {};
	this.subscribed_to = [];

	this.notifier = new notifyCounter();
	this.sf_notf = su.notf.getStore('song-files');
	var rd_msgs = this.sf_notf.getReadedMessages();
	for (var i = 0; i < rd_msgs.length; i++) {
		this.notifier.banMessage(rd_msgs[i]);
	};
	this.bindMessagesRecieving();
	


	this.addChild(this.notifier);
	

	this.checkVKAuthNeed();

	var _this = this;
	this.watchStates(['has_files', 'vk-audio-auth'], function(has_files, vkaa) {
		if (has_files || vkaa){
			_this.updateState('must-be-expandable', true);
		}
	});
};
provoda.Model.extendTo(mfCor, {
	ui_constr: mfCorUI,
	state_change: {
		"current_mopla": function(nmf, omf) {
			if (omf){
				omf.unmarkAsPlaying();
			}
			if (nmf){
				nmf.markAsPlaying();
			}
		},
		"default_mopla": function(nmf, omf) {
			if (omf){
				omf.deactivate();
			}
			if (nmf){
				nmf.activate();
			}
		}

	},
	switchMoreSongsView: function() {
		if (!this.state('want-more-songs')){
			this.updateState('want-more-songs', true);
			this.markMessagesReaded();
		} else {
			this.updateState('want-more-songs', false);
		}
		
	},
	markMessagesReaded: function() {
		this.sf_notf.markAsReaded('vk-audio-auth');
		//this.notifier.banMessage('vk-audio-auth');
	},
	vkAudioAuth: function(remove) {
		if (remove){
			this.notifier.removeMessage('vk-audio-auth');
			if (this.vk_audio_auth){
				this.updateState('vk-audio-auth', false);
				this.vk_audio_auth.die();
				delete this.vk_audio_auth;
			}
		} else {
			
			this.notifier.addMessage('vk-audio-auth');
			if (!this.vk_audio_auth){

				this.vk_audio_auth = new vkLogin();
				this.vk_audio_auth.on('auth-request', function() {
					if (su.vk_app_mode){
						if (window.VK){
							VK.callMethod('showSettingsBox', 8);
						}
					} else {
						su.vk_auth.requestAuth();
					}
					//console.log()
				});
				this.addChild(this.vk_audio_auth);
				this.updateState('changed', new Date());
				this.updateState('vk-audio-auth', true);
			}

			
			
			
			this.vk_audio_auth.setRequestDesc(
					(
						this.isHaveTracks('mp3') ? 
							localize('to-find-better') : 
							localize("to-find-and-play")
					)  + " " +  localize('music-files-from-vk'));
			/*
				if (!songs.length){
					this.vk_login_notify = su.ui.samples.vk_login.clone();
				} else if(!this.mo.isHaveAnyResultsFrom('vk')){
					this.vk_login_notify = su.ui.samples.vk_login.clone( localize('to-find-better') + " " +  localize('music-files-from-vk'));
				} else {
					this.vk_login_notify = su.ui.samples.vk_login.clone(localize('stabilization-of-vk'));
					
				}*/
		}
	},
	checkVKAuthNeed: function() {
		if (this.mo.mp3_search){
				
			if (this.mo.mp3_search.haveSearch('vk')){
				this.vkAudioAuth(true);
			} else {
				if (this.isHaveAnyResultsFrom('vk')){
					this.vkAudioAuth(true);
				} else {
					this.vkAudioAuth();
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
					_this.vkAudioAuth(true);
				}
			});
		}
		this.sf_notf.on('read', function(message_id) {
			_this.notifier.banMessage(message_id);
		});
		
	},
	collapseExpanders: function() {
		this.updateState('want-more-songs', false);
	},
	setSem: function(sem) {
		this.sem  = sem;
		var _this = this;
		sem.on('changed', function(val) {
			_this.semChanged(val);
		});
	},
	semChanged: function(complete) {
		this.checkVKAuthNeed();

		var songs_packs = this.songs_packs = this.sem.getAllSongTracks();

		this.pa_o = $filter(songs_packs, 'name');

		var many_files = this.pa_o.length > 1;
		for (var i = 0; i < this.pa_o.length; i++) {
			var cp_name = this.pa_o[i];
			if (!this.complects[cp_name]){
				this.complects[cp_name] = new mfComplect(this, songs_packs[i], this.mo);
				this.addChild(this.complects[cp_name]);
				many_files = many_files || this.complects[cp_name].hasManyFiles();
			}
		}
		this.updateState('has_files', many_files);
		if (!this.state('current_mopla')){
			this.updateState('default_mopla', this.song());
		}
		this.updateState('changed', new Date());
		

	},
	setCurrentMopla: function(mf) {
		var _this = this;

		if (!this.mfPlayStateChange){
			this.mfPlayStateChange = function(state) {
				if (_this.state('current_mopla') == this){
					_this.updateState('play', state);
				}
			};
		}

		if (mf){
			if (this.subscribed_to.indexOf(mf) == -1){
				mf.on('play-state-change', this.mfPlayStateChange);
				
				this.subscribed_to.push(mf);
			}
			this.updateState('default_mopla', mf);
			this.updateState('current_mopla', mf);
		} else {
			this.updateState('current_mopla', false);
		}
	},
	preloadSongFile: function(){

		if (this.isHaveBestTracks() || this.isSearchCompleted()){

			var mopla = this.state('default_mopla');
			if (mopla){
				mopla.load();
			}
			
		}
	},
	setVolume: function(vol){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.setVolume(vol);
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
	play: function(mopla){
		var cmf = this.state('current_mopla');
		var dmf = this.state('default_mopla');
		if (this.isHaveTracks('mp3')){
			mopla = mopla || dmf;
			if (mopla != cmf || !this.state('play')){
				if (cmf && mopla != cmf){
					cmf.stop();
				}
				mopla = mopla || this.song();
				if (mopla){
					this.setCurrentMopla(mopla);
					this.trigger('before-mf-play', mopla);
					mopla.play();
				}
				

			}
		}
	},
	raw: function(){
		return !!this.omo && !!this.omo.raw;
	},
	isHaveAnyResultsFrom: function(source_name){
		return !!this.raw() || !!this.sem && this.sem.isHaveAnyResultsFrom(source_name);
	},
	isHaveTracks: function(type){
		return !!this.raw() || !!this.sem && this.sem.isHaveTracks(type);
	},
	isSearchCompleted: function(){
		return !!this.raw() || !!this.sem && this.sem.search_completed;
	},
	isHaveBestTracks: function(){
		return !!this.raw() || !!this.sem && this.sem.have_best;
	},
	getMf: function() {
		return this.state('default_mopla');	
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
	songs: function(){
		if (this.raw()){
			return [{t:[this.omo.getSongFileModel(this.mo, this.mo.player)]}];
		} else if (this.sem){
			return this.sem.getAllSongTracks('mp3');
		} else{
			return false;
		}
		
	}
});

/*

this.trigger('got-results')

this.trigger('got-result')

this.trigger('error')


this.trigger('got-nothing')

в процессе

завершен



имеет результаты

0 результатов


имеет ошибку

 непоправимую ошибку

 ошибку поправимую кем угодно
 ошибку поправимую только несамостоятельно


*/


/*

var songs = this.mo.songs();

			if (this.mo.isSearchCompleted() && this.mo.isNeedsAuth('vk')){
				
				var vklc = this.rowcs.song_context.getC();
				var oldvk_login_notify = this.vk_login_notify;
				if (!songs.length){
					this.vk_login_notify = su.ui.samples.vk_login.clone();
				} else if(!this.mo.isHaveAnyResultsFrom('vk')){
					this.vk_login_notify = su.ui.samples.vk_login.clone( localize('to-find-better') + " " +  localize('music-files-from-vk'));
				} else {
					this.vk_login_notify = su.ui.samples.vk_login.clone(localize('stabilization-of-vk'));
					
				}
				if (oldvk_login_notify){
					oldvk_login_notify.remove();
				}
				if (this.vk_login_notify){
					vklc.after(this.vk_login_notify);
				}
			} 

			*/