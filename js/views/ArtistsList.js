var ArtcardViewInList = function() {};
provoda.View.extendTo(ArtcardViewInList, {
	createBase: function() {
		this.c = $('<li class="artist_in_list"></li>');
		this.alink = $('<span class=""></span>').appendTo(this.c);
		var _this = this;
		this.c.click(function() {
			_this.md.showArtcard();
			return false;
		});
		this.image_place = $('<span class="song-image-con"></span>').appendTo(this.c);
		this.addWayPoint(this.c);
	},
	'stch-artist-name': function(state) {
		this.alink.text(state);
	},
	'stch-selected-image': function(lfm_wrap) {
		if (!lfm_wrap){
			return;
		}
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/64s/' + lfm_wrap.lfm_id : lfm_wrap.url;


		if (url){
			this.image_place.empty();
			this.image_place.append(
				$('<img/>').attr('src', url)
			);
		}
	}
});


var ArtistListView = function() {};
provoda.View.extendTo(ArtistListView, {
	createBase: function() {
		this.c = this.root_view.getSample('artists_list');
		var _this = this;
		this.generate_button = this.c.find('.to-open-block').click(function() {
			_this.md.requestRandomPlaylist();
		});
		this.listc = this.c.find('ul');
		this.addWayPoint(this.generate_button);
	},

	'stch-mp-show': function(opts) {
		this.c.toggleClass('hidden', !opts);
	},
	'stch-list-loading': function(state){
		this.c.toggleClass('list_loading_state', !!state);
	},
	children_views: {
		artists_list: {
			main: ArtcardViewInList
		}
	},
	'collch-artists_list': 'listc'
});


var artCardUI = function() {};
provoda.View.extendTo(artCardUI, {
	die: function() {
		this._super();
	},
	children_views: {
		top_songs: {
			main: ItemOfLL
		},
		similar_artists: {
			main: ItemOfLL
		}
	},
	'collch-similar_artists': 'ui.similarsc',
	'collch-top_songs': 'ui.topc',
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
		"loading-baseinfo": function(state) {
			var mark_loading_nodes = this.ui.tagsc.add(this.ui.bioc);

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
				this.root_view.renderArtistAlbums(ob.ordered[i], _this.md.artist, aul, _this.md, addWP);
				
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
				var safe_node = document.createElement('div');
				safe_node.innerHTML = text.replace(/([^\n])\n+/gi, '$1<br/><br/>');

				$(safe_node).find('script').remove();

				this.ui.bioc.empty().append(safe_node);
			//	this.ui.bioc.html(text.replace(/[^^]\n+/gi, '<br/><br/>'));
				this.root_view.bindLfmTextClicks(this.ui.bioc);
			}
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


		
	}
});
