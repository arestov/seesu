var artCardUI = function(artcard) {
	this.artcard = artcard;
	
	this.init();
	this.createBase();
	this.setModel(artcard);
	
};

suServView.extendTo(artCardUI, {
	die: function() {
		this.blur();
		this._super();	
	},
	blur: function() {
		$(su.ui.els.slider).removeClass('show-art-card');
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
				$(su.ui.els.slider).addClass('show-art-card');
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
			for (var i=0; i < ob.ordered.length; i++) {
				var aul =  $('<ul></ul>');
				su.ui.renderArtistAlbums(ob.ordered[i], _this.artcard.artist, aul, true, true);
				aul.appendTo(this.ui.albumsc);
			};
			
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
							su.ui.showTopTacks(_this.artcard.artist, {save_parents: true, from_artcard: true}, {
								artist: _this.artcard.artist,
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
						su.ui.show_tag(el.name);
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
					su.views.showArtcardPage(el.name);
				}).text(el.name).appendTo(li);
				li.appendTo(ul);
				ul.append(' ');
				
			});
			
			var header_link = $('<a class="js-serv"></a>')
				.click(function(){
					su.ui.showSimilarArtists(_this.artcard.artist, {save_parents: true, from_artcard: true});	
				})
				.text(localize('similar-arts'))
			var header = this.ui.similarsc.children('h5').empty().append(header_link);
			
			ul.removeClass('hidden');
		}

	},
	createBase: function() {
		var _this = this;
		this.c = su.ui.samples.artcard.clone();
		this.ui = {
			imagec: this.c.find('.art-card-image .art-card-image-padding'),
			topc: this.c.find('.top-tracks'),
			tagsc: this.c.find('.art-card-tags'),
			albumsc: this.c.find('.art-card-albums'),
			similarsc: this.c.find('.art-card-similar'),
			bioc: this.c.find('.art-card-bio')
		};
		this.top_tracks_link = $(' <a class="js-serv extends-header"></a>').text(localize('full-list')).appendTo(this.ui.topc.children('.row-header')).click(function(){
			su.ui.showTopTacks(_this.artcard.artist, {save_parents: true, from_artcard: true});
		});
	}
});


var artCard = function(artist) {
	this.callParentMethod('init')
	this.artist= artist;
	this.updateState('nav-text', artist);
	this.updateState('nav-title', artist);

	this.loadInfo();

	var _this = this;

	this.regDOMDocChanges(function() {
		if (su.ui.els.artcards){
			var child_ui = _this.getFreeView();
			if (child_ui){
				su.ui.els.artcards.append(child_ui.getC());
				child_ui.appended();
			}
		}
		if (su.ui.nav.daddy){
			var child_ui = _this.getFreeView('nav');
			if (child_ui){
				su.ui.nav.daddy.append(child_ui.getC());
				child_ui.appended();
			}
		}
	});


};
createPrototype(artCard, new suMapModel(), {
	ui_constr: {
		main: function(){
			return new artCardUI(this)
		},
		nav: function() {
			return new artCardNavUI(this)
		}	
	},
	page_name: "art card",
	getURL: function() {
		return '/catalog/' + this.artist;	
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
			lfm.get('artist.getTopTracks',{'artist': this.artist, limit: 30 })
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
	
	this.popups = [];
	this.popups_counter = 0;
	this.buttons_li = {};
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
	isAlive: function(){
		if (this.dead){
			return false;
		}
		return !this.checkLiveState();
	},
	setDOM: function(opts) {
		var _this = this;
		if (this.isAlive()){

			cloneObj(this, opts.su_dom);
		
			if (_this.isAlive()){

				jsLoadComplete(function() {
					if (opts.ext_search_query) {
						_this.search(opts.ext_search_query);
					}

					var state_recovered;
					if (window.su && su.p && su.p.c_song){
						if (su.p.c_song && su.p.c_song.plst_titl){
							su.views.show_now_playing(true);
							state_recovered = true;
						}
					}
					su.trigger('dom', _this);
					console.log('fired dom!')
					_this.can_fire_on_domreg = true;
					
					if (state_recovered){
						opts.state_recovered = true;
					}
					for (var i = 0; i < _this.cbs.length; i++) {
						_this.cbs[i](opts);
					};
				});
				viewBlocks(_this, _this.d);
			}
			
		

			
		}
		return this;
	},
	onReady: function(cb){
		this.cbs.push(cb);
		return this;
	},
	appendStyle: function(style_text){
		//fixme - check volume ondomready
		var style_node = this.d.createElement('style');
			style_node.setAttribute('title', 'button_menu');
			style_node.setAttribute('type', 'text/css');

		if (!style_node.styleSheet){
			style_node.appendChild(this.d.createTextNode(style_text));
		} else{
			style_node.styleSheet.cssText = style_text;
		}

		this.d.documentElement.firstChild.appendChild(style_node);
			
	},
	addPopup: function(popup_node, testf, hidef){
		var ob = {
			test: testf,
			hide: hidef,
			id: ++this.popups_counter
		}
		popup_node.click(function(e){
			e.stopPropagation();
			test_pressed_node(e, {
				stay_popup: ob.id
			})
		});
		this.popups.push(ob);
		return ob.id;
	},
	hidePopups: function(e, exlude_id){
		for (var i=0; i < this.popups.length; i++) {
			var c = this.popups[i];
			if (c.id != exlude_id && c.test(e)){
				if (c.hide){
					c.hide();
				}
				
			}
			
		};	
	},
	show_tag: function(tag, vopts, start_song){
		//save_parents, no_navi
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl_r = su.preparePlaylist('Tag: ' + tag, 'artists by tag', {tag: tag}, start_song).loading();
		get_artists_by_tag(tag, function(pl){
			proxy_render_artists_tracks(pl, pl_r);
		}, function(){
			proxy_render_artists_tracks(false, pl_r);
		});
		su.views.show_playlist_page(pl_r, vopts.save_parents, vopts.no_navi);
		
		if (start_song){
			pl_r.showTrack(start_song, full_no_navi);
		}
	},
	/*
	show_track: function(q){
		var title;
		if (q.q){
			title= q.q;
		} else if (q.artist || q.track){
			title = (q.artist || '') + " - " + (q.track || '');
		} else{
			title = 'unknow';
		}
		
		var pl_r = su.preparePlaylist(title , 'tracks', {query: q} , title).loading();
		su.views.show_playlist_page(pl_r, !!q);
		su.mp3_search.find_files(q, false, function(err, pl, c, complete){
			if (complete){
				c.done = true;
				var playlist = [];
				if (pl && pl.length){
					for (var i=0; i < pl.length; i++) {
						if (pl[i].t){
							playlist.push.apply(playlist, pl[i].t);
						}
					};
				}
				
				var playlist_ui = create_playlist(playlist.length && playlist, pl_r);
				if (!su.mp3_search.haveSearch('vk')){
					playlist_ui.prepend($('<li></li>').append(su.ui.samples.vk_login.clone()));
				}
				
			}
			
			
		}, false);

		
		
	},*/
	//showArtistPlaylist: function(artist, pl, save_parents, no_navi, simple){
	showArtistPlaylist: function(artist, pl, vopts){
		vopts = vopts || {};
		var cpl = su.p.isPlaying(pl);
		if (!cpl){
			if (!vopts.from_artcard){
				su.views.showArtcardPage(artist, vopts.save_parents, true);
			}
			su.views.show_playlist_page(pl, !vopts.from_artcard || !!vopts.save_parents, vopts.no_navi);
			return false;
		} else{
			su.views.restoreFreezed();
			return cpl;
		}
	},
	/*
	var vopts = {
		save_parents: save_parents,
		no_navi,
		from_artcard
	}*/
	showAlbum: function(opts, vopts, start_song){
	//showAlbum: function(opts, save_parents, start_song, simple){
		var artist			= opts.artist, 
			name			= opts.album_name,
			id				= opts.album_id, 
			original_artist	= opts.original_artist,
			vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = su.preparePlaylist('(' + artist + ') ' + name, 'album', {artist: original_artist || artist, album: name}, start_song).loading();
	
		var recovered = this.showArtistPlaylist(original_artist || artist, pl, vopts);
		
		if (!recovered){
			var get_artist_album_playlist = function(album_id, pl_r){
				if (album_id) {
					lfm.get('playlist.fetch',{'playlistURL': 'lastfm://playlist/album/' + album_id})
						.done(function(pl_data){
							make_lastfm_playlist(pl_data, pl_r);
						});
				}
			};
			if (id){
				get_artist_album_playlist(id, pl);
			} else{
				lfm.get('album.getInfo',{'artist': artist, album : name})
					.done(function(alb_data){
						get_artist_album_playlist(alb_data.album.id, pl);
					});
			}
		}
		if (start_song){
			(recovered || pl).showTrack(start_song, vopts.no_navi);
		}
	},
	showTopTacks: function (artist, vopts, start_song) {
	//showTopTacks: function (artist, save_parents, no_navi, start_song, simple) {
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		
		
		var pl = su.preparePlaylist('Top of ' + artist, 'artist', {artist: artist}, start_song).loading();
		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		
		if (!recovered){
			lfm.get('artist.getTopTracks',{'artist': artist, limit: 30 })
				.done(function(r){
					var tracks = r.toptracks.track || false;
					if (tracks) {
						var track_list = [];
						tracks = toRealArray(tracks);
						
						for (var i=0, l = Math.min(tracks.length, 30); i < l; i++) {
							track_list.push({'artist' : artist ,'track': tracks[i].name, images: tracks[i].image});
						}
						create_playlist(track_list, pl);
					}
				});
		}
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	showTrackById: function(sub_raw, vopts){
		var pl_r = su.preparePlaylist('Track' , 'tracks', {time: + new Date()});
		su.views.show_playlist_page(pl_r, vopts.save_parents, vopts.no_navi);
		
		if (sub_raw.type && sub_raw.id){
			su.mp3_search.getById(sub_raw, function(song, want_auth){
				
				if (pl_r.ui){
					if (!song){
						if (want_auth){
							if (sub_raw.type == 'vk'){
								pl_r.loadComplete('vk_auth');
							} else{
								pl_r.loadComplete(true);							
							}
						} else {
							pl_r.loadComplete(true);

						}
					} else{
						pl_r.push(song, true);
						pl_r.loadComplete();
					}
					if (want_auth){
						return true;
					}
					console.log(song)
				} 
			}, function(){
				return !!pl_r.getC();
			}, function(){

			})
		} else{
			
		}
	},
	showMetroChart: function(country, metro, vopts){
		vopts = vopts || {};
		var plr = su.preparePlaylist('Chart of ' + metro, 'chart', {country: country, metro: metro}).loading();

		lfm.get('geo.getMetroUniqueTrackChart', {country: country, metro: metro, start: new Date - 60*60*24*7})
			.done(function(r){
					
				if (r && r.toptracks && r.toptracks.track){
					var metro_tracks = toRealArray(r.toptracks.track);
					for (var i=0; i < Math.min(metro_tracks.length, 30); i++) {
						
						var _trm = metro_tracks[i];
						plr.push({artist: _trm.artist.name, track: _trm.name});
					};
					pl_r.loadComplete(metro_tracks.length);
				} else {
					pl_r.loadComplete(true);
				}

				
			});
		su.views.show_playlist_page(plr, vopts.save_parents, vopts.no_navi);
	},
	showSimilarArtists: function(artist, vopts, start_song){
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = su.preparePlaylist('Similar to «' + artist + '» artists', 'similar artists', {artist: artist}, start_song).loading();
		//su.views.show_playlist_page(pl, false, no_navi || !!start_song);
		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		if (!recovered){

			lfm.get('artist.getSimilar',{'artist': artist})
				.done(function(r){
					var artists = r.similarartists.artist;
					if (artists && artists.length) {
						var artist_list = [];
						for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
							artist_list.push(artists[i].name);
						}
						proxy_render_artists_tracks(artist_list, pl);
					}
				})
				.fail(function() {
					proxy_render_artists_tracks(false, pl);
				});
		
		}
		
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	createFilesListElement: function(mopla, mo){
		
		var li = $('<li></li>');
		
		var desc_part = $('<span class="desc-name"></span>').appendTo(li);
		var main_part = $('<span class="desc-text"></span>').appendTo(li);
		
		
		var songitself = $('<a class="js-serv"></a>')
			.attr('href', 'http://seesu.me/o#/ds' + mo.getURL(mopla))
			.text(mopla.artist + " - " + mopla.track)
			.click(function(e){
				mo.play(mopla);
				e.preventDefault();
			}).appendTo(main_part);
			
		var d = $('<span class="duration"></span>').appendTo(desc_part);
		if (mopla.duration){
			var duration = Math.floor(mopla.duration/1000);
			var digits = duration % 60;
			d.text((Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+digits : digits ));
		}
		
		
		var mp3l = $('<a class="desc external"></a>').appendTo($('<span class="mp3-file-link"></span>').appendTo(desc_part));
		if (mopla.downloadable){
			mp3l.attr('href', mopla.link).text('mp3')
		}
			
		if (mopla.page_link){
			$('<a class="external desc page-link" href="' + mopla.page_link + '">page</a>').appendTo(desc_part);
			
		}
		return li;
	},
	createFilesList: function(part, mo){
		if (part.t && part.t.length){
			var fl = $();
			fl = fl.add($('<div class="files-source"></div>').text(part.name));
			var ul = $('<ul></ul>');
			fl = fl.add(ul);
			for (var i=0; i < part.t.length; i++) {
				var el = this.createFilesListElement(part.t[i], mo);
				if (i > 2){
					el.addClass('addition-file')
				}
				ul.append(el);
			};
			return fl;
		}
		
	},
	verticalAlign: function(img, target_height, fix){
		var real_height = img.naturalHeight ||  img.height;
		if (real_height){
			var offset = (target_height - real_height)/2;
			
			if (offset && fix){
				$(img).animate({'margin-top':  offset + 'px'}, 200);
			}
			return offset;
		}
	},
	preloadImage: function(src, alt, callback, place){
		var image = document.createElement('img');
		if (alt){
			image.alt= alt;
		}
		
		image.onload = function(){
			if (callback){
				callback(image)
			}
		};
		if (place){
			$(place).append(image);
		}
		image.src = src;
		if (image.complete){
			if (callback){
				callback(image)
			}
		}
		return image;
	},
	getRtPP: function(node){
			
		var clicked_node = $(node);
		
		var target_offset = clicked_node.offset();
		var container_offset = su.ui.els.pllistlevel.offset();
		return {
			left: target_offset.left - container_offset.left,
			top: target_offset.top - container_offset.top,
			cwidth: su.ui.els.pllistlevel.width()
		};
	},
	createUserAvatar: function(info, c, size){
		var _this = this;
		var imageplace = $("<div class='image-cropper'></div>").appendTo(c)
		$('<img alt="user photo" width="50" height="50"/>').attr('src', info.photo).appendTo(imageplace);
		/*
		var image = this.preloadImage(info.photo, 'user photo', function(img){
			_this.verticalAlign(img, 50, true);	
		}, imageplace); */
	},
	createLikeButton: function(lig){
		var nb = this.createNiceButton();
		nb.b.text( localize('want-meet', 'Want to meet') + '!');
		nb.enable();
		var pliking = false;
		nb.b.click(function(){
			if (!pliking){
				var p =
				su.s.api('relations.setLike', {to: lig.user}, function(r){
					
					if (r.done){
						su.track_event('people likes', 'liked');
						var gc = $("<div></div>");
						nb.c.after(gc);

						gc.append($('<span class="desc people-list-desc"></span>').text(localize('if-user-accept-i') + " " + localize('will-get-link')));
						nb.c.remove();
					}
					pliking = false;
				})
				pliking = true
			}
			
			
			
		});
		return nb;
	},
	createAcceptInviteButton: function(lig){
		var nb = this.createNiceButton();
		nb.b.text( localize('accept-inv', 'Accept invite'));
		nb.enable();
		var pliking = false;
		nb.b.click(function(){
			if (!pliking){
				var p =
				su.s.api('relations.acceptInvite', {from: lig.user}, function(r){
					
					if (r.done){
						su.track_event('people likes', 'accepted');
						nb.c.after(
							$('<span class="people-list-desc desc"></span>')
								.text(su.ui.getRemainTimeText(r.done.est, true))
						);
						nb.c.remove();
					}
					pliking = false;
				})
				pliking = true
			}
			
			
			
		});
		return nb;
	},
	getRemainTimeText: function(time_string, full){
		var d = new Date(time_string);
		var remain_desc = '';
		if (full){
			remain_desc += localize('wget-link') + ' ';
		}
		
		
		remain_desc += d.getDate() + 
		" " + localize('m'+(d.getMonth()+1)) + 
		" " + localize('attime') + ' ' + d.getHours() + ":" + d.getMinutes();
		
		return remain_desc;
	},
	getAcceptedDesc: function(rel){
		var link = rel.info.domain && ('http://vk.com/' + rel.info.domain);
		if (link && rel.info.full_name){
			return $('<a class="external"></a>').attr('href', link).text(rel.info.full_name);
		}  else if (rel.item.est){
			return $("<span class='desc'></span>").text(this.getRemainTimeText(rel.item.est, true));
		}
	},
	showBigListener: function(c, lig){
		
		var _this = this;
		
		c.empty();
		
		if (lig.info && lig.info.photo_big){
			var image = _this.preloadImage(lig.info.photo_big, 'user photo', function(img){
				_this.verticalAlign(img, 252, true);	
			}, $('<div class="big-user-avatar"></div>').appendTo(c));
		}
		
		if (su.s.loggedIn()){
			var liked = su.s.susd.isUserLiked(lig.user);
			var user_invites_me = su.s.susd.didUserInviteMe(lig.user);
			
			if (liked){
				
				
				if (liked.item.accepted){
					c.append(this.getAcceptedDesc(liked));
				} else{
					
					c.append(localize('you-want-user'));
					
					c.append('<br/>');
					
					c.append($('<span class="desc people-list-desc"></span>').text(localize('if-user-accept-i') + " " + localize('will-get-link')));
				}
				
				
			} else if (user_invites_me){
				if ( user_invites_me.item.accepted){
					c.append(this.getAcceptedDesc(user_invites_me));
				} else{
					c.append(localize('user-want-you'));
					c.append('<br/>');
					var lb = this.createAcceptInviteButton(lig);
					lb.c.appendTo(c);
				}
				
			} else {
				var lb = this.createLikeButton(lig);
				lb.c.appendTo(c);
			}
			
		} else{
			c.append(this.samples.vk_login.clone(localize('to-meet-man-vk')));
			
		}
		
		
	},
	createSongListener: function(lig, uc){
		var _this = this;
		
		var li = $('<li class="song-listener"></li>').click(function() {
			
			if (!uc.isActive('user-info') || uc.D('user-info', 'current-user') != lig.user){
				
				
				
				uc.D('user-info', 'current-user', lig.user);
				var p = _this.getRtPP(li[0]);
				
				var c = uc.C('user-info');

				_this.showBigListener(c, lig);
				su.s.auth.regCallback('biglistener', function(){
					_this.showBigListener(c, lig);
				});
				
				uc.show('user-info', (p.left + $(li[0]).outerWidth()/2) -13 );
			} else{
				uc.hide();
			}

		});
		this.createUserAvatar(lig.info, li);
		
		
		return li;
				
				
	},
	createSongListeners: function(listenings, place, above_limit_value, exlude_user, users_context){
		var _this = this;
		var users_limit = 3;
		for (var i=0, l = Math.min(listenings.length, Math.max(users_limit, users_limit + above_limit_value)); i < l; i++) {
			if (!exlude_user || (listenings[i].user != exlude_user && listenings[i].info)){
				place.append(this.createSongListener(listenings[i], users_context));
			}
		};
		return Math.max(users_limit - listenings.length, 0);
	},
	create_youtube_video: function(id, transparent){
		var youtube_video = document.createElement('embed');
		if (su.env.opera_widget){
			youtube_video.setAttribute('wmode',"transparent");
		} else if (su.env.opera_extension){
			youtube_video.setAttribute('wmode',"opaque");
		}
		
		
			youtube_video.setAttribute('type',"application/x-shockwave-flash");
			youtube_video.setAttribute('src', 'http://www.youtube.com/v/' + id);
			youtube_video.setAttribute('allowfullscreen',"true");
			youtube_video.setAttribute('class',"you-tube-video");
			
		return youtube_video;		
	},
	
	
	renderArtistAlbums: function(albums, original_artist, albums_ul, save_parents, simple){
		var _sui = this;
		if (albums.length) {
			for (var i=0; i < albums.length; i++) {
				albums_ul.append(this.createAlbum(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[1]['#text']) || '', albums[i].artist.name, original_artist, save_parents, simple));
			}
		} 
		return albums_ul;
	},
	createAlbum: function(al_name, al_url, al_image, al_artist, original_artist, save_parents, from_artcard){
		var _sui = this;
		var li = $('<li></li>');
			var a_href= $('<a></a>')
				.attr('href', al_url )
				.data('artist', al_artist)
				.data('album', al_name)
				.click(function(e){
					e.preventDefault(); 
					_sui.showAlbum({
						artist: al_artist, 
						album_name: al_name,
						original_artist: original_artist
					}, {
						save_parents: save_parents,
						from_artcard: from_artcard
					});
					seesu.track_event('Artist navigation', 'album', al_artist + ": " + al_name);
				})
				.appendTo(li);
			$('<img/>').attr('src', al_image).appendTo(a_href);
			$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
			
		return li;
	},
	infoGen: function(dp, c, base_string){
		if (dp){
			if (c.prev){
				c.str += ', ';
			}
			c.str += base_string.replace('%s', dp);
			if (!c.prev){
				c.prev = true
			}
		}	
	},
	createNiceButton: function(position){
		var c = $('<span class="button-hole"><a class="nicebutton"></a></span>');
		var b = c.children('a');
		
		if (position == 'left'){
			c.addClass('bposition-l')
		} else if (position == 'right'){
			c.addClass('bposition-r')
		}

		var bb = {
			c: c,
			b: b,
			_enabled: true,
			enable: function(){
				if (!this._enabled){
					this.b.addClass('nicebutton').removeClass('disabledbutton');
					this.b.data('disabled', false);
					this._enabled = true;
				}
				
			},
			disable: function(){
				if (this._enabled){
					this.b.removeClass('nicebutton').addClass('disabledbutton');	
					this.b.data('disabled', true);
					this._enabled = false;
				}
				
			}
		}
		bb.disable();
		return bb;
	},
	lfmRequestAuth: function(){
		
		this.lfmAuthInit();
		return 
	},
	lfmCreateAuthFrame: function(first_key){
		if (this.lfm_auth_inited){
			return false;
		}
		var i = lfm.auth_frame = document.createElement('iframe');	
		addEvent(window, 'message', function(e){
			if (e.data == 'lastfm_bridge_ready:'){
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('lastfm_token:') === 0){
				lfm.newtoken = e.data.replace('lastfm_token:','');
				lfm.try_to_login(seesu.ui.lfm_logged);
				console.log('got token!!!!')
				console.log(e.data.replace('lastfm_token:',''));
			}
		});
		i.className = 'serv-container';
		i.src = 'http://seesu.me/lastfm/bridge.html';
		document.body.appendChild(i);
		this.lfm_auth_inited = true;
	},
	lfmSetAuthBridgeKey: function(key){
		if (!this.lfm_auth_inited){
			this.lfmCreateAuthFrame(key)
		} else{
			lfm.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	lfmAuthInit: function(){
		
		
		//init_auth_data.bridgekey		
		
		var init_auth_data = lfm.getInitAuthData();
		if (init_auth_data.bridgekey){
			this.lfmSetAuthBridgeKey(init_auth_data.bridgekey)
		} 
		if (app_env.showWebPage){
			
			app_env.showWebPage(init_auth_data.link, function(url){
				var path = url.split('/')[3];
				if (!path || path == 'home'){
					app_env.hideWebPages();
					app_env.clearWebPageCookies();
					return true
				} else{
					var sb = 'http://seesu.me/lastfm/callbacker.html';
					if (url.indexOf(sb) == 0){
						var params = get_url_parameters(url.replace(sb, ''));
						if (params.token){
							lfm.newtoken = params.token;
							lfm.try_to_login(seesu.ui.lfm_logged);
						}

						app_env.hideWebPages();
						app_env.clearWebPageCookies();
						return true;
					}
				}
				
			}, function(e){
				app_env.openURL(init_auth_data.link);
				
			}, 960, 750);
		} else{
			app_env.openURL(init_auth_data.link);
		}
	
		
		su.main_level.updateState('lfm-waiting-for-finish', true);
		
		
		return
		
	},
	lfm_logged : function(){
		su.main_level.updateState('lfm-auth-done', true);
		su.main_level.updateState('lfm-auth-req-loved', false);
		su.main_level.updateState('lfm-auth-req-recomm', false);
		$('.lfm-finish input[type=checkbox]',this.d).prop('checked', true);
		var f = $('.scrobbling-switches', this.d);
		var ii = f.find('input');
		ii.removeAttr('disabled');
	},
	lfm_change_scrobbling:function(enable, context){
		var lfm_ssw = $('.scrobbling-switches', context || this.d);
		if (lfm_ssw) {
			lfm_ssw.find('.enable-scrobbling').prop('checked', enable ? true : false);
			lfm_ssw.find('.disable-scrobbling').prop('checked',enable ? false : true);
		}
	},
	setSearchInputValue: function(value) {
		this.els.search_input.val(value);
	},
	search: function(query, no_navi, new_browse){
		if (new_browse){
			su.views.showStartPage();
		}
		if (su.search_query != query){
			su.search_query = query;
			this.setSearchInputValue(query);
		}
		inputChange(query, this.els.search_label, no_navi);
	},
	create_playlists_link: function(){
		var _ui = this;
		if (!_ui.link && su.gena.playlists.length > 0 && _ui.els.start_screen){
			$('<p></p>').attr('id', 'cus-playlist-b').append(
				_ui.link = $('<a></a>').text(localize('playlists')).attr('class', 'js-serv').click(function(e){
					_ui.search(':playlists');
					e.preventDefault();
				}) 
			).appendTo(_ui.els.start_page_place);
		}
	}



}