define(['provoda', 'spv', 'jquery', 'app_serv',
'./TrackActionsRowUI', './MfCorUI', './ArtcardUI', './SongcardPage', './coct'],
function(provoda, spv, $, app_serv,
TrackActionsRowUI, MfCorUI, ArtcardUI, SongcardPage, coct) {
"use strict";



var SongUI = function(){};

coct.SPView.extendTo(SongUI, {
	dom_rp: true,
	createDetailes: function(){
		this.createBase();
	},
	state_change : {
		"mp_show": function(opts, old_opts) {
			if (opts){
			//	this.parent_view.c.addClass("show-zoom-to-track");
				this.activate();
			} else if (old_opts) {
			//	this.parent_view.c.removeClass("show-zoom-to-track");
				this.deactivate();
			}
		},
		"can_expand": function(state) {
			if (state){
				this.expand();
			}
		}
	},

	deactivate: function(){

		var acts_row = this.getMdChild('actionsrow');
		if (acts_row) {
			acts_row.hideAll();
		}

		this.getMdChild('mf_cor').collapseExpanders();
	},
	children_views: {
		actionsrow: TrackActionsRowUI,
		mf_cor: MfCorUI,
		artist: ArtcardUI.ArtistInSongConstroller,
		songcard: SongcardPage.SongcardController
	},
	activate: function(){
		this.expand();
	},

	tpl_events: {
		showSong: function(e) {
			e.preventDefault();
			this.RPCLegacy('wantSong');
			this.RPCLegacy('requestPage');
		}
	},

	parts_builder: {
		context: function() {
			return this.root_view.getSample('track_c');
		}
	},
	createBase: function(){
		var _this = this;
		this.setVisState('lite_view', this.opts && this.opts.lite);
		this.c = this.root_view.getSample('song-view');
		//window.dizi = sonw;
		//this.tpl = this.getTemplate(sonw);
		if (!(this.opts && this.opts.lite)){
			var context = this.requirePart('context');
			this.c.append(context);

			var nart_dom = this.root_view.getSample('artist_preview-base');
			context.children('.nested_artist').append(nart_dom);

			this.createTemplate();
			//this.bigBind();
		} else {
			this.createTemplate();
		}

		this.canUseDeepWaypoints = function() {
			return !(_this.opts && _this.opts.lite) && !!_this.state('mp_show');
		};

	},
	expand: function(){
		if (this.opts && this.opts.lite){
			return false;
		}
		if (this.expanded){
			return true;
		} else{
			this.expanded = true;
		}



		var context = this.requirePart('context');

		this.song_actions_c =  this.tpl.ancs['song-actions'];

		this['collch-actionsrow'] = true;
		this.checkCollectionChange('actionsrow');

		context.prepend(this.getAFreeCV('mf_cor'));

		this.dom_related_props.push('song_actions_c');
		this.requestAll();
	}
});
return SongUI;
});
