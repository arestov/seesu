var ArtcardViewInList = function() {};
provoda.View.extendTo(ArtcardViewInList, {

});


var ArtistListView = function() {};
provoda.View.extendTo(ArtistListView, {
	createBase: function() {
		this.c = this.root_view.getSample('artists_list');
		var _this = this;
		this.generate_button = this.c.find('.to-open-block').click(function() {
			_this.md.requestRandomPlaylist();
		});

	},
	'stch-mp-show': function(opts) {
		this.c.toggleClass('hidden', !opts);
	},
	children_views: {
		artists_list: {
			main: ArtcardViewInList
		}
	}
});


var artCardUI = function() {};
provoda.View.extendTo(artCardUI, {
	die: function() {
		this._super();
	},
	state_change: {
		"mp-show": function(opts) {
			this.c.toggleClass('hidden', !opts);
		},
		"loading-albums": function(state) {
			if (state){
				this.ui.albumsc.addClass('loading');
			} else {
				this.ui.albumsc.removeClass('loading');
			}
		},
		"loading-toptracks": function(state) {
			if (state){
				this.ui.topc.addClass('loading');
			} else {
				this.ui.topc.removeClass('loading');
			}
		},
		"loading-baseinfo": function(state) {
			var mark_loading_nodes = this.ui.tagsc.add(this.ui.bioc).add(this.ui.similarsc);

			if (state){
				mark_loading_nodes.addClass('loading');
			} else {
				mark_loading_nodes.removeClass('loading');
			}
		},
		"sorted-albums": function(ob) {
			var all_albums = Array.prototype.concat.apply([], ob.ordered);

			var _this = this;
			var albs_groups = $("<div class='albums-groups'></div>");
			var addWP = function(alb_dom) {
				_this.addWayPoint(alb_dom.link);
			};
			for (var i=0; i < ob.ordered.length; i++) {
				var aul =  $('<ul></ul>');
				this.root_view.renderArtistAlbums(ob.ordered[i], _this.md.artist, aul, {
					source_info: {
						page_md: _this.md,
						source_name: 'artist-albums'
					},
					from_artcard: true
				}, addWP);
				
				aul.appendTo(albs_groups);
			}
			albs_groups.appendTo(this.ui.albumsc);
			
			var all_albs_link = $('<a class="js-serv extends-header"></a>').text(localize("Show-all")  + " (" + all_albums.length + ")").click(function(){
				_this.ui.albumsc.toggleClass('show-all-albums');
			}).appendTo(_this.ui.albumsc.children(".row-header"));
			this.addWayPoint(all_albs_link, {
				simple_check: true
			});
		},
		toptracks: function(list) {
			var _this = this;
			var ul = this.ui.topc.children('ul');
			$.each(list, function(i, el){
				if (i < 5){
					if (el.track){
						var a = $('<a class="js-serv"></a>').click(function(){
							su.showTopTacks(_this.md.artist, {
								source_info: {
									page_md: _this.md,
									source_name: 'top-tracks'
								}
							}, {
								artist: _this.md.artist,
								track: el.track
							});
						}).text(el.track);
						$('<li></li>').append(a).appendTo(ul);
						_this.addWayPoint(a);
					}
				}
				
			});
			ul.removeClass('hidden');
		},
		'selected-image': function(lfm_wrap) {
			if (!lfm_wrap){
				return;
			}
			var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/500/' + lfm_wrap.lfm_id : lfm_wrap.url;


			if (url){
				this.ui.imagec.empty();
				this.ui.imagec.append(
					$('<img/>').attr('src', url)
				);
			}
		},
		tags: function(tags) {
			var ul = this.ui.tagsc.children('ul');
			var _this = this;
			$.each(tags, function(i, el){
				if (el && el.name){
					var li = $('<li></li>');
					var a = $('<a class="js-serv"></a>').click(function(){
						su.show_tag(el.name);
					}).text(el.name).attr('url', el.url).appendTo(li);
					_this.addWayPoint(a);
					li.appendTo(ul);
					ul.append(document.createTextNode(' '));
				}
				
			});
			ul.removeClass('hidden');
		},
		bio: function(text) {
			if (text){
				this.ui.bioc.html(text.replace(/\n+/gi, '<br/><br/>'));
				this.root_view.bindLfmTextClicks(this.ui.bioc);
			}
		},
		similars: function(artists) {
			var _this = this;
			var ul = this.ui.similarsc.children('ul');
			$.each(artists, function(i, el){
				var li = $('<li></li>');
				var a = $('<a class="js-serv"></a>').click(function(){
					su.showArtcardPage(el.name);
				}).text(el.name).appendTo(li);
				_this.addWayPoint(a);
				li.appendTo(ul);
				ul.append(document.createTextNode(' '));
				
			});
			ul.removeClass('hidden');
		}

	},
	createBase: function() {
		var _this = this;
		this.c = this.root_view.getSample('artcard');
		this.ui = {
			imagec: this.c.find('.art_card-image .art_card-image-padding'),
			topc: this.c.find('.top-tracks'),
			tagsc: this.c.find('.art_card-tags'),
			albumsc: this.c.find('.art_card-albums'),
			similarsc: this.c.find('.art_card-similar'),
			bioc: this.c.find('.art_card-bio')
		};
		this.top_tracks_link = $('<a class="js-serv extends-header"></a>')
			.text(localize('full-list'))
			.appendTo(this.ui.topc.children('.row-header'))
			.click(function(){
				su.showTopTacks(_this.md.artist, {
					source_info: {
						page_md: _this.md,
						source_name: 'top-tracks'
					},
					from_artcard: true
				});
			});
		this.addWayPoint(this.top_tracks_link);

		this.similars_link = $('<a class="js-serv extends-header"></a>')
			.click(function(){
				su.showSimilarArtists(_this.md.artist, {
					source_info: {
						page_md: _this.md,
						source_name: 'similar-artists'
					},
					
					from_artcard: true
				});
			})
			.text(localize('full-list'));
		this.addWayPoint(this.similars_link);
		this.ui.similarsc.children('h5').append(this.similars_link);
	}
});
