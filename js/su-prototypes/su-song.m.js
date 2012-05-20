var song;
(function(){
	"use strict";

	var baseSong = function() {};
	provoda.extendFromTo("baseSong", suMapModel, baseSong);

	song = function(omo, player, mp3_search){
		this.init.call(this, omo, player, mp3_search);
		var _this = this;
		this.updateNavTexts();

		this.on('view', function(no_navi, user_want){
			su.views.show_track_page(this, no_navi);
			if (user_want){
				//fixme - never true!
				if (_this.wasMarkedAsPrev()){
					su.track_event('Song click', 'previous song');
				} else if (_this.wasMarkedAsNext()){
					su.track_event('Song click', 'next song');
				} else if (_this.state('play')){
					su.track_event('Song click', 'zoom to itself');
				}
			}
			
		});
		this.traackrow = new TrackActionsRow(this);
		this.addChild(this.traackrow);

		this.mf_cor = new mfCor(this, this.omo);
		this.addChild(this.mf_cor);
		this.mf_cor.on('before-mf-play', function(mopla) {
			_this.player.changeNowPlaying(_this);
			_this.findNeighbours();
			_this.mopla = mopla;
		});
		this.regDOMDocChanges(function() {
			if (su.ui.nav.daddy){
				var child_ui = _this.getFreeView('nav');
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
		this.watchState('mp-show', function(opts) {
			var
				_this = this,
				oldCb = this.makePlayableOnNewSearch;

			if (opts){
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
				return "http://seesu.me/o" + "#/catalog/" + this.artist + "/_/" + this.track;
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
		}
	});


	



	var LastfmRowUI = function(){};
	BaseCRowUI.extendTo(LastfmRowUI, {
		init: function(md, parent_c, buttons_panel){
			this.md = md;
			this._super();
			this.c = parent_c.children('.last-fm-scrobbling');
			this.button = buttons_panel.find('.lfm-scrobbling-button');
			this.bindClick();
			this.setModel(md);
		}
	});

	var LastfmRow = function(traackrow){
		this.init(traackrow);
	};
	BaseCRow.extendTo(LastfmRow, {
		init: function(traackrow){
			this.traackrow = traackrow;
			this._super();
		},
		row_name: 'lastfm',
		ui_constr: LastfmRowUI
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

	var FlashErrorRow = function(traackrow){
		this.init(traackrow);
	};
	BaseCRow.extendTo(FlashErrorRow, {
		init: function(traackrow){
			this.traackrow = traackrow;
			this._super();
		},
		row_name: 'flash-error',
		ui_constr: FlashErrorRowUI
	});


	var TrackActionsRowUI = function() {};
	suServView.extendTo(TrackActionsRowUI, {
		init: function(md, c) {
			this.md = md;
			this._super();
			this.c = c;
			this.song_row_context = this.c.children('.row-song-context');
			this.arrow = this.song_row_context.children('.rc-arrow');
			

			this.parts_views = {};

			var	
				parts = this.md.getAllParts(),
				tp = this.getTP();

			

			for (var i in parts) {
				var pv = parts[i].getFreeView(false, this.song_row_context, tp);
				if (pv){
					this.parts_views[i] = pv;
				}
			}

			this.setModel(md);


		},
		state_change: {
			active_part: function(nv, ov) {
				if (nv){
					this.song_row_context.removeClass('hidden');

					var ar_pos = this.parts_views[nv].getArrowPos();
					if (ar_pos){
						this.arrow.css('left', ar_pos + 'px').removeClass('hidden');
					}
					//this.arrow.css('left', arrow_left + 'px').removeClass('hidden');
				} else {
					this.song_row_context.addClass('hidden');
				}
			}
		},
		getTP: function() {
			var tp = this.c.children('.track-panel');

			tp.find('.pc').data('mo', this.md.mo);
			if (lfm.scrobbling) {
				su.ui.lfm_change_scrobbling(true, tp.find('.track-buttons'));
			}
			return tp;
		}
	});

	var TrackActionsRow = function(mo) {
		this.init(mo);
	};
	ContextRow.extendTo(TrackActionsRow, {
		init: function(mo) {
			this._super();
			this.mo = mo;
			this.updateState('active_part', false);
			this.addPart(new LastfmRow(this, mo));
			this.addPart(new FlashErrorRow(this, mo));
			this.addPart(new PlaylistAddRow(this, mo));
			this.addPart(new ShareRow(this, mo));
			


		},
		ui_constr: TrackActionsRowUI
	});
	//song.prototype = song_methods;
})();
