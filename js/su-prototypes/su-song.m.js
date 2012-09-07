var song;
(function(){
	"use strict";

	var baseSong = function() {};
	provoda.extendFromTo("baseSong", suMapModel, baseSong);

	song = function(omo, playlist, player, mp3_search){
		this.init.call(this, omo, playlist, player, mp3_search);
		var _this = this;
		this.updateNavTexts();

		this.on('view', function(no_navi, user_want){
			su.views.show_track_page(this, no_navi);
			if (user_want){
				//fixme - never true!
				if (_this.wasMarkedAsPrev()){
					su.trackEvent('Song click', 'previous song');
				} else if (_this.wasMarkedAsNext()){
					su.trackEvent('Song click', 'next song');
				} else if (_this.state('play')){
					su.trackEvent('Song click', 'zoom to itself');
				}
			}
			
		});
		this.actionsrow = new TrackActionsRow(this);
		this.addChild(this.actionsrow);

		this.mf_cor = new mfCor(this, this.omo);
		this.addChild(this.mf_cor);
		this.mf_cor.on('before-mf-play', function(mopla) {

			_this.player.changeNowPlaying(_this);
			_this.mopla = mopla;
		});
		this.mf_cor.on("error", function(can_play) {
			_this.player.trigger("song-play-error", _this, can_play);
		});
		this.regDOMDocChanges(function() {
			if (su.ui.nav.daddy){
				var child_ui = _this.getFreeView(this, 'nav');
				if (child_ui){
					su.ui.nav.daddy.append(child_ui.getC());
					child_ui.appended();
				}
			}
		});
		this.watchStates(['files_search', 'marked_as'], function(files_search, marked_as) {
			if (marked_as && files_search && files_search.complete){
				this.updateState('can-expand', true);
			} else {
				this.updateState('can-expand', false);
			}
		});
		this.on('state-change.mp-show', function(e) {
			
			var
				_this = this,
				oldCb = this.makePlayableOnNewSearch;

			if (e.value){
				if (!oldCb){
					this.makePlayableOnNewSearch = function() {
						_this.makeSongPlayalbe(true);
					};
					this.mp3_search.on('new-search', this.makePlayableOnNewSearch);
					
				}
			} else {
				if (oldCb){
					this.mp3_search.off('new-search', oldCb);
					delete this.makePlayableOnNewSearch;
				}
			}
		});
	};

	baseSong.extendTo(song, {
		ui_constr: {
			main: songUI,
			nav: trackNavUI
		},
		page_name: 'song page',
		getShareUrl: function() {
			if (this.artist && this.track){
				return "http://seesu.me/o" + "#/catalog/" + su.encodeURLPart(this.artist) + "/_/" + su.encodeURLPart(this.track);
			} else {
				return "";
			}
		},
		updateFilesSearchState: function(complete, get_next){
			this._super.apply(this, arguments);
			if (this.isHaveTracks('mp3')){
				this.plst_titl.markAsPlayable();
			}
		},
		mlmDie: function() {
			this.hide();
		},
		getURL: function(mopla){
			var url ="";
			if (mopla || this.raw()){
				var s = mopla || this.omo;
				url += "/" + su.encodeURLPart(s.from) + '/' + su.encodeURLPart(s._id);
			} else{
				if (this.plst_titl && this.plst_titl.playlist_type == 'artist'){
					if (this.track){
						url += '/' + su.encodeURLPart(this.track);
					}
				} else if (this.artist){
					url += '/' + su.encodeURLPart(this.artist) + '/' + su.encodeURLPart(this.track || '_');
				}
			}
			return url;
		},
		postToVKWall: function(uid){
			var
				data = {},
				file = this.mf_cor.getVKFile();
			if (uid){
				data.owner_id = uid;
			}
			if (file){
				data.attachments = "audio" + file._id;
			}
			
			data.message = this.state('full-title') + " " + encodeURI(this.getShareUrl());
			if (data.attachments){
				data.attachment = data.attachments;
			}

			if (window.VK){
				VK.api("wall.post", data, function() {

				});
			} else {
				

				app_env.openURL( "http://seesu.me/vk/share.html" + 
					"?" + 
					stringifyParams({app_id: su.vkappid}, false, '=', '&') + 
					"#?" + 
					stringifyParams(data, false, '=', '&'));
			}
			seesu.trackEvent('song actions', 'vk share');

			return; //su.vk_api.get("wall.post", data, {nocache: true});
			//console.log(uid);
		}
	});


	



	var ScrobbleRowUI = function(){};
	BaseCRowUI.extendTo(ScrobbleRowUI, {
		init: function(md, parent_c, buttons_panel){
			this.md = md;
			this._super();
			this.c = parent_c.children('.last-fm-scrobbling');
			this.button = buttons_panel.find('.lfm-scrobbling-button');
			this.bindClick();
			this.setModel(md);
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}

			var lsc_view = this.md.lfm_scrobble.getFreeView(this);
			if (lsc_view){
				this.addChild(lsc_view);
				this.c.append(lsc_view.getC());
				lsc_view.appended();
			}
			
		}
	});

	var ScrobbleRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(ScrobbleRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();
			this.lfm_scrobble = new LfmScrobble(su.lfm_auth);
			this.addChild(this.lfm_scrobble);
		},
		row_name: 'lastfm',
		ui_constr: ScrobbleRowUI
	});



	var FlashErrorRowUI = function(){};
	BaseCRowUI.extendTo(FlashErrorRowUI, {
		init: function(md, parent_c, buttons_panel){
			this.md = md;
			this._super();
			this.c = parent_c.children('.flash-error');
			this.button = buttons_panel.find('.flash-secur-button');
			this.bindClick();
			this.setModel(md);
		}
	});

	var FlashErrorRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(FlashErrorRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();
		},
		row_name: 'flash-error',
		ui_constr: FlashErrorRowUI
	});


	var RepeatSongRowView = function(){};
	BaseCRowUI.extendTo(RepeatSongRowView, {
		"stch-rept-song": {
			fn: function(state) {
				this.getPart('rept-chbx').prop('checked', !!state);
			},
			dep_vp: ["rept-chbx"]
		},
		parts_builder: {
			"rept-chbx": function() {
				var _this = this;
				return this.c.find('.rept-song-label input').click(function() {
					_this.md.setDnRp($(this).prop('checked'));
				});
			}
		},
		init: function(md, parent_c, buttons_panel){
			this.md = md;
			this._super();
			this.c =  parent_c.children('.rept-song');
			this.button = buttons_panel.find('.rept-song-button');

			this.bindClick();
			
			this.setModel(md);
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			var _this = this;

			this.requirePart("rept-chbx");
		}
	});



	var RepeatSongRow = function(actionsrow){
		this.init(actionsrow);
	};
	BaseCRow.extendTo(RepeatSongRow, {
		init: function(actionsrow){
			this.actionsrow = actionsrow;
			this._super();

			var _this = this;

			var doNotReptPl = function(state) {
				_this.updateState('rept-song', state);
			};
			if (su.settings['rept-song']){
				doNotReptPl(true);
			}
			su.on('settings.rept-song', doNotReptPl);


		},
		setDnRp: function(state) {
			this.updateState('rept-song', state);
			su.setSetting('rept-song', state);
		},
		row_name: 'repeat-song',
		ui_constr: RepeatSongRowView
	});

	

	var TrackActionsRowUI = function() {};
	ActionsRowUI.extendTo(TrackActionsRowUI, {
		createBase: function(c){
			this.c = c;
			this.row_context = this.c.children('.row-song-context');

			this.buttons_panel = this.c.children('.track-panel');
			this.buttons_panel.find('.pc').data('mo', this.md.mo);
			this.createVolumeControl();
			
			this.arrow = this.row_context.children('.rc-arrow');
			var _this = this;

			this.setVisState('is-visible', !!this.parent_view.state('mp-show'))

			this.parent_view.on('state-change.mp-show', function(e){
				_this.setVisState('is-visible', !!e.value);
			});
		},
		"stch-vis-volume": function(state) {
			this.vol_bar.css({
				width: state
			});
		},
		complex_states: {
			"vis-volume-hole-width": {
				depends_on: ['vis-is-visible'],
				fn: function(visible){
					return visible && this.vol_hole.width();
				}
			},
			"vis-volume-bar-max-width": {
				depends_on: ['vis-volume-hole-width'],
				fn: function(vvh_w){
					return vvh_w && vvh_w - ( this.vol_bar.outerWidth() - this.vol_bar.width());
				}
			},
			"vis-volume": {
				depends_on: ['volume', 'vis-volume-bar-max-width'],
				fn: function(volume, vvb_mw){
					if (vvb_mw){
						return ((volume/100) * vvb_mw) + 'px';
					} else {
						return volume  + '%';
					}
				}
			}
		},
		createVolumeControl: function() {
			this.vol_cc = this.buttons_panel.find('.volume-control');
			this.vol_hole = this.vol_cc.find('.v-hole');
			this.vol_bar = this.vol_hole.find('.v-bar');

			var _this = this;

			var getClickPosition = function(e, node){
				//e.offsetX || 
				var pos = e.pageX - $(node).offset().left;
				return pos;
			};

			var path_points;
			var volumeChange = function(){
				var last = path_points[path_points.length - 1];

				//promiseStateUpdate
				//setVisState
				var hole_width = _this.state('vis-volume-hole-width');
				if (!hole_width){
					console.log("no width :!((")
				}
				var twid = Math.min(hole_width, Math.max(0, last.cpos));

				_this.promiseStateUpdate('volume', 100*twid/hole_width);
				_this.md.setVolume(100*twid/hole_width);
				/*
				if (!_this.width){
					_this.fixWidth();
				}
				_this.md.setVolumeByFactor(_this.width && (last.cpos/_this.width));
				*/

			}

			var touchDown = function(e){
				path_points = [];
				e.preventDefault();
				path_points.push({cpos: getClickPosition(e, _this.vol_hole), time: e.timeStamp});
				volumeChange();
			};
			var touchMove = function(e){

				if (e.which && e.which != 1){
					return true;
				}
				e.preventDefault();
				path_points.push({cpos: getClickPosition(e, _this.vol_hole), time: e.timeStamp});
				volumeChange();
			};
			var touchUp = function(e){

				if (e.which && e.which != 1){
					return true;
				}
				$(_this.vol_cc[0].ownerDocument)
					.off('mouseup', touchUp)
					.off('mousemove', touchMove);

				var travel;
				if (!travel){
					//
				}


				path_points = null;

				
			};
			_this.vol_cc.on('mousedown', function(e){

				$(_this.vol_cc[0].ownerDocument)
					.off('mouseup', touchUp)
					.off('mousemove', touchMove);

				if (e.which && e.which != 1){
					return true;
				}

				$(_this.vol_cc[0].ownerDocument)
					.on('mouseup', touchUp)
					.on('mousemove', touchMove);

				touchDown(e);

			});
		}
	});

	var TrackActionsRow = function(mo) {
		this.init(mo);
	};
	PartsSwitcher.extendTo(TrackActionsRow, {
		init: function(mo) {
			this._super();
			this.mo = mo;
			this.updateState('active_part', false);
			this.addPart(new ScrobbleRow(this, mo));
			this.addPart(new FlashErrorRow(this, mo));
			this.addPart(new RepeatSongRow(this, mo));

			var _this = this;

			var setVolume = function(state) {
				_this.updateState('volume', state);
			};
			if (su.settings['volume']){
				setVolume(su.settings['volume']);
			}
			su.on('settings.volume', setVolume);

			jsLoadComplete({
				test: function() {
					return typeof PlaylistAddRow != 'undefined' && typeof ShareRow != 'undefined' && typeof LoveRow != 'undefined';
				},
				fn: function() {
					_this.addPart(new PlaylistAddRow(_this, mo));
					_this.addPart(new ShareRow(_this, mo));
					_this.addPart(new LoveRow(_this, mo));
				}
			});
		},
		sendVolume: function(vol) {
			su.setSetting('volume', vol);
		},
		setVolume: function(state) {
			this.updateState('volume', state);
			this.sendVolume(state);
			
		},
		ui_constr: TrackActionsRowUI
	});
	//song.prototype = song_methods;
})();
