var songsListView;
(function() {

	var PlaylistSettingsRowView = function(){};
	BaseCRowUI.extendTo(PlaylistSettingsRowView, {
		"stch-dont-rept-pl": function(state) {
			this.dont_rept_pl_chbx.prop('checked', !!state);
		},
		createDetailes: function(){
			var parent_c = this.parent_view.row_context;
			var buttons_panel = this.parent_view.buttons_panel;
			this.c =  parent_c.children('.pla-settings');
			this.button = buttons_panel.children('.pl-settings-button');

			this.bindClick();
			//var _this = this;
			var md = this.md

			this.dont_rept_pl_chbx = this.c.find('.dont-rept-pl input').click(function() {
				md.setDnRp($(this).prop('checked'));
			});
		}
	});


	var MultiAtcsRowView = function(){};
	BaseCRowUI.extendTo(MultiAtcsRowView, {
		createDetailes: function(){
			var parent_c = this.parent_view.row_context;
			var buttons_panel = this.parent_view.buttons_panel;
			this.c =  parent_c.children('.pla-row');
			this.button = buttons_panel.children('.pla-button');

			

			var _this = this;

			this.c.find(".search-music-files").click(function(){
				_this.md.actionsrow.pl.makePlayable(true);
				su.trackEvent('Controls', 'make playable all tracks in playlist');
				//
			});
			
			this.c.find('.open-external-playlist').click(function(e){
				_this.md.actionsrow.pl.makeExternalPlaylist();
				su.trackEvent('Controls', 'make *.m3u');
				//e.preventDefault();
			});


			this.bindClick();
		}
	});




	
	var PlARowView = function() {};
	ActionsRowUI.extendTo(PlARowView, {
		createBase: function(c){
		//	var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
			this.c = this.parent_view.panel;
			this.row_context = this.c.find('.pla-row-content');
			this.arrow = this.row_context.children('.rc-arrow');
			this.buttons_panel = this.c.children().children('.pla-panel');
		},
		children_views: {
			"multiatcs": {
				main: MultiAtcsRowView
			},
			"pl-settings": {
				main: PlaylistSettingsRowView
			}
		}
	});





	var songsListBaseView = function() {};
	provoda.extendFromTo("songsListBaseView", provoda.View, songsListBaseView);
	



	songsListView = function(pl){};
	songsListBaseView.extendTo(songsListView, {
		'stch-mp-show': function(opts) {
			if (opts){
				this.c.removeClass('hidden');
				$(app_view.els.slider).addClass('show-player-page');
			} else {
				$(app_view.els.slider).removeClass('show-player-page');
				this.c.addClass('hidden');
			}
		},
		'stch-mp-blured': function(state) {
			if (state){
				
			} else {
				
			}
		},
		'stch-error': function(error){
			if (this.error_b && this.error_b.v !== error){
				this.error_b.n.remove();
			}
			if (error){
				if (error == 'vk_auth'){
					this.error_b = {
						v: error,
						n: $('<li></li>').append(app_view.samples.vk_login.clone()).prependTo(this.c)
					};
				} else {
					this.error_b = {
						v: error,
						n: $('<li>' + localize('nothing-found','Nothing found') + '</li>').appendTo(this.c)
					};
				}
			}
		},
		createPanel: function() {
			this.panel = app_view.samples.playlist_panel.clone();
			this.panel.appendTo(this.c)		
			return this;
		},
		'collch-plarow': function(name, md) {
			var view = this.getFreeChildView(name, md, 'main');
			this.requestAll();
		},
		children_views: {
			plarow: {
				main: PlARowView
			},
			'song': songUI
		}

	});

	
	

})();