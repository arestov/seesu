var artCardUI = function() {};

provoda.View.extendTo(artCardUI, {
	createDetailes: function(){
		this.createBase();
	},
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
			for (var i=0; i < ob.ordered.length; i++) {
				var aul =  $('<ul></ul>');
				this.root_view.renderArtistAlbums(ob.ordered[i], _this.md.artist, aul, {
					source_info: {
						page_md: _this.md,
						source_name: 'artist-albums',
					},
					from_artcard: true
				});
				
				aul.appendTo(albs_groups);
			};
			albs_groups.appendTo(this.ui.albumsc);
			
			$('<a class="js-serv extends-header"></a>').text(localize("Show-all")  + " (" + all_albums.length + ")").click(function(){
				_this.ui.albumsc.toggleClass('show-all-albums')
			}).appendTo(_this.ui.albumsc.children(".row-header"));
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
					}
				}
				
			});
			ul.removeClass('hidden');
		},
		images: function(images) {
			if (images[4]){
				this.ui.imagec.empty();
				this.ui.imagec.append(
					$('<img/>').attr('src', images[4])
				);
			}
		},
		tags: function(tags) {
			var ul = this.ui.tagsc.children('ul');
			$.each(tags, function(i, el){
				if (el && el.name){
					var li = $('<li></li>');
					$('<a class="js-serv"></a>').click(function(){
						su.show_tag(el.name);
					}).text(el.name).attr('url', el.url).appendTo(li);
					li.appendTo(ul);
					ul.append(' ');
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
				$('<a class="js-serv"></a>').click(function(){
					su.showArtcardPage(el.name);
				}).text(el.name).appendTo(li);
				li.appendTo(ul);
				ul.append(' ');
				
			});
			
			var header_link = $('<a class="js-serv"></a>')
				.click(function(){
					su.showSimilarArtists(_this.md.artist, {
						source_info: {
							page_md: _this.md,
							source_name: 'similar-artists',
						},
						
						from_artcard: true
					});	
				})
				.text(localize('similar-arts'))
			var header = this.ui.similarsc.children('h5').empty().append(header_link);
			
			ul.removeClass('hidden');
		}

	},
	createBase: function() {
		var _this = this;
		this.c = this.root_view.samples.artcard.clone();
		this.ui = {
			imagec: this.c.find('.art_card-image .art_card-image-padding'),
			topc: this.c.find('.top-tracks'),
			tagsc: this.c.find('.art_card-tags'),
			albumsc: this.c.find('.art_card-albums'),
			similarsc: this.c.find('.art_card-similar'),
			bioc: this.c.find('.art_card-bio')
		};
		this.top_tracks_link = $(' <a class="js-serv extends-header"></a>').text(localize('full-list')).appendTo(this.ui.topc.children('.row-header')).click(function(){
			su.showTopTacks(_this.md.artist, {
				source_info: {
					page_md: _this.md,
					source_name: 'top-tracks',
				},
				from_artcard: true
			});
		});
	}
});


var artCard = function(artist) {
	this.init();
	this.artist= artist;
	this.updateState('nav-text', artist);
	this.updateState('nav-title', artist);

	this.loadInfo();

	

};
mapLevelModel.extendTo(artCard, {
	model_name: 'artcard',
	page_name: "art card",
	getURL: function() {
		return '/catalog/' + su.encodeURLPart(this.artist);	
	},
	loadInfo: function(){
		this.loadTopTracks();
		this.loadAlbums();
		this.loadBaseInfo();
		
		this.setPrio('highest');
		
	},
	loadAlbums: function(){
		
		var _this = this;
		this.updateState('loading-albums', true);
		this.addRequest(lfm.get('artist.getTopAlbums',{'artist': this.artist })
			.done(function(r){
				_this.updateState('loading-albums', false)
				if (r){
					var albums = toRealArray(r.topalbums.album);
					
					if (albums.length){
						albums = sortLfmAlbums(albums, _this.artist);
						if (albums.ordered){
							_this.updateState('sorted-albums', albums);
						}
					}
				}
			})
			.fail(function(){
				_this.updateState('loading-albums', false)
			}), {
				order: 1
			}
		);
	},
	loadTopTracks: function(){
		
		var _this = this;
		this.updateState('loading-toptracks', true);
		this.addRequest(
			lfm.get('artist.getTopTracks',{'artist': this.artist, limit: 30, page: 1 })
				.done(function(r){
					var tracks = toRealArray(getTargetField(r, 'toptracks.track'));

					if (tracks.length){
						var track_list = [];
					
						for (var i=0, l = Math.min(tracks.length, 30); i < l; i++) {
							track_list.push({'artist' : this.artist ,'track': tracks[i].name, images: tracks[i].image});
						}

						_this.updateState('toptracks', track_list);
					}
					
				})
				.always(function(){
					_this.updateState('loading-toptracks', false);
				}),
			{
				order: 3
			}
		);
		
	},
	loadBaseInfo: function(){
		var _this = this;

		this.updateState('loading-baseinfo', true);
		this.addRequest(lfm.get('artist.getInfo',{'artist': this.artist })
			.done(function(r){
				_this.updateState('loading-baseinfo', false);
				r = parseArtistInfo(r);
				if (r.images){
					_this.updateState('images', r.images);
				}
				if (r.tags){
					_this.updateState('tags', r.tags);
				}
				if (r.bio){
					_this.updateState('bio', r.bio);
				}
				if (r.similars){
					_this.updateState('similars', r.similars);
				}
				
			})
			.fail(function(){
				_this.updateState('loading-baseinfo', false);
			}), {
				order: 2
			}
		);
	
	}
});


var contextRow = function(container){
	this.m = {
		c: container.addClass('hidden'),
		active: false
	};
	this.arrow = container.children('.rc-arrow');
	this.parts = {};
	
};
contextRow.prototype = {
	getC: function(){
		return this.m.c;
	},
	addPart: function(cpart, name){
		if (name){
			this.parts[name] = {
				c: cpart.addClass('hidden'),
				d:{},
				active: false
			};
		}
		
	},
	C: function(name){
		return this.parts[name]	 && this.parts[name].c;
	},
	D: function(name, key, value){
		if (name && this.parts[name]){
			if (typeof value != 'undefined' && key){
				return this.parts[name].d[key] = value;
			} else if (key){
				return this.parts[name].d[key];
			}
		}
		
	},
	isActive: function(name){
		return !!this.parts[name].active;
	},
	showPart: function(name, posFn, callback){
		

		if (!this.parts[name].active){

			this.hide(true);
		
		
			this.parts[name].c.removeClass('hidden');
			this.parts[name].active = true;
			
			
			if (!this.m.active){
				this.m.c.removeClass('hidden');
				this.m.active = true;
			}
			
		}
		if (posFn){
			//used for positioning 
			this.arrow.removeClass('hidden');
			var pos = posFn();
			var arrow_papos = this.arrow.offsetParent().offset();

			//.removeClass('hidden');
			this.arrow.css('left', ((pos.left + pos.owidth/2) - arrow_papos.left) + 'px')
			
		} 
		
	},
	hide: function(not_itself, skip_arrow){
		if (!not_itself){
			if (this.m.active){
				this.m.c.addClass('hidden');
				this.m.active = false;
			}
			
		}
		
		for (var a in this.parts){
			if (this.parts[a].active){
				this.parts[a].c.addClass('hidden');
				this.parts[a].active = false;
			}
			
		}
		if (!skip_arrow){
			this.arrow.addClass('hidden');
		}
		
		
		
	}
};
