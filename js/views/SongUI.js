define(['provoda', 'spv', 'jquery', 'app_serv',
'./SongActionsRowUI', './MfCorUI', './ArtcardUI', './SongcardPage', './coct'],
function(provoda, spv, $, app_serv,
SongActionsRowUI, MfCorUI, ArtcardUI, SongcardPage, coct) {
"use strict";



var SongUI = function(){};

coct.SPView.extendTo(SongUI, {
	dom_rp: true,
	createDetails: function(){
		this.createBase();
	},
	state_change : {
		"vmp_show": function(opts, old_opts) {
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
		actionsrow: SongActionsRowUI,
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
			this.expand();
			this.RPCLegacy('wantSong');
			this.RPCLegacy('requestPage');

		}
	},

	parts_builder: {
		context: function() {
			return this.root_view.getSample('track_c');
		},
		mf_cor_con: function() {
			var context = this.requirePart('context');
			var div = $('<div></div>');
			context.prepend(div);
			return div;
		}
	},
	createBase: function(){
		var _this = this;
		this.setVisState('lite_view', this.opts && this.opts.lite);
		this.c = this.root_view.getSample('song-view');
		//window.dizi = sonw;
		//this.tpl = this.getTemplate(sonw);

		this.createTemplate();
		this.canUseDeepWaypoints = function() {
			return !(_this.opts && _this.opts.lite) && !!_this.state('vmp_show');
		};

	},
	'collch-$ondemand-actionsrow': true,
	'collch-$ondemand-mf_cor': {
		place: function() {
			return this.requirePart('mf_cor_con');
		}
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
		if (!context){
			return;
		}
		

		var nart_dom = this.root_view.getSample('artist_preview-base');
		context.children('.nested_artist').append(nart_dom);

		
		this.parseAppendedTPLPart(context);
		this.c.append(context);

		//this['collch-actionsrow'] = true;
		this.checkCollectionChange('actionsrow');

		//this['collch-mf_cor'] = ;
		this.checkCollectionChange('mf_cor');
		

		this.checkChildrenModelsRendering();
		this.requestAll();
	}
});
return SongUI;
});
