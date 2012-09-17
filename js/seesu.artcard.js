var artCardUI = function() {};

suServView.extendTo(artCardUI, {
	createDetailes: function(){
		this.createBase();
	},
	die: function() {
		this.blur();
		this._super();	
	},
	blur: function() {
		$(app_view.els.slider).removeClass('show-art-card');
	},
	state_change: {
		"mp-show": function(opts) {
			if (opts){
				this.c.removeClass('hidden');
			} else {
				this.c.addClass('hidden');
			}
		},
		"mp-blured": function(state) {
			if (state){
				this.blur();
			} else {
				$(app_view.els.slider).addClass('show-art-card');
			}
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
				app_view.renderArtistAlbums(ob.ordered[i], _this.md.artist, aul, true, true);
				
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
							su.showTopTacks(_this.md.artist, {save_parents: true, from_artcard: true}, {
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
					su.showSimilarArtists(_this.md.artist, {save_parents: true, from_artcard: true});	
				})
				.text(localize('similar-arts'))
			var header = this.ui.similarsc.children('h5').empty().append(header_link);
			
			ul.removeClass('hidden');
		}

	},
	createBase: function() {
		var _this = this;
		this.c = app_view.samples.artcard.clone();
		this.ui = {
			imagec: this.c.find('.art-card-image .art-card-image-padding'),
			topc: this.c.find('.top-tracks'),
			tagsc: this.c.find('.art-card-tags'),
			albumsc: this.c.find('.art-card-albums'),
			similarsc: this.c.find('.art-card-similar'),
			bioc: this.c.find('.art-card-bio')
		};
		this.top_tracks_link = $(' <a class="js-serv extends-header"></a>').text(localize('full-list')).appendTo(this.ui.topc.children('.row-header')).click(function(){
			su.showTopTacks(_this.md.artist, {save_parents: true, from_artcard: true});
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
	ui_constr: {
		main: artCardUI,
		nav: artCardNavUI	
	},
	model_name: 'artcard',
	page_name: "art card",
	getURL: function() {
		return '/catalog/' + su.encodeURLPart(this.artist);	
	},
	loadInfo: function(){
		this.loadAlbums();
		this.loadBaseInfo();
		this.loadTopTracks();
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
			})
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
				})
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
			})
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
	show: function(name, arrow_left, callback){
		if (!this.parts[name].active){
			this.hide(true);
		
		
			this.parts[name].c.removeClass('hidden');
			this.parts[name].active = true;
			
			
			if (!this.m.active){
				this.m.c.removeClass('hidden');
				this.m.active = true;
			}
			
		}
		if (arrow_left){
			//used for positioning 
			this.arrow.css('left', arrow_left + 'px').removeClass('hidden');
			
		} 
	},
	hide: function(not_itself){
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
		
		this.arrow.addClass('hidden');
		
	}
};

/*
var countergg = 0;
window.seesu_ui = function(d, with_dom){
	this.nums = ++countergg;
	this.d = d;
	this.cbs = [];
	this.created_at = new Date();
	console.log(this.nums);

	var _this = this;
	if (with_dom && getDefaultView(d)){
		this.can_die = true;
		this.checkLiveState = function() {
			if (!getDefaultView(d)){
				_this.die();
				return true;
			}
		};

		this.lst_interval = setInterval(this.checkLiveState, 1000);
		
	}


	this.els = {};
	if (!with_dom){
		dstates.connect_ui(d);
	}
};
seesu_ui.prototype = {
	die: function(){
		if (this.can_die && !this.dead){
			this.dead = true;
			clearInterval(this.lst_interval);
			var d = this.d;
			delete this.d;
			su.removeDOM(d, this);
			
			console.log('DOM dead! ' + this.nums);
			
		}
	},
	
	setDOM: function(opts, tracking_opts) {
		var _this = this;
		if (this.isAlive()){

			cloneObj(this, opts.su_dom);
		
			if (_this.isAlive()){

				jsLoadComplete(function() {
					
					su.trigger('dom', _this);
					console.log('fired dom!')
					_this.can_fire_on_domreg = true;
					
					
					for (var i = 0; i < _this.cbs.length; i++) {
						_this.cbs[i](opts);
					}
					
				});
				viewBlocks(_this, _this.d);
			}
			
		

			
		}
		big_timer.q.push([tracking_opts.category, 'ready-sui', big_timer.comp(tracking_opts.start_time), 'seesu ui ready', 100]);
		return this;
	},
	onReady: function(cb){
		this.cbs.push(cb);
		return this;
	},

	
	



};*/