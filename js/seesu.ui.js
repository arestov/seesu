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
			var albs_groups = $("<div class='albums-groups'></div>");
			for (var i=0; i < ob.ordered.length; i++) {
				var aul =  $('<ul></ul>');
				su.ui.renderArtistAlbums(ob.ordered[i], _this.md.artist, aul, true, true);
				
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
							su.ui.showTopTacks(_this.md.artist, {save_parents: true, from_artcard: true}, {
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
					su.app_md.showArtcardPage(el.name);
				}).text(el.name).appendTo(li);
				li.appendTo(ul);
				ul.append(' ');
				
			});
			
			var header_link = $('<a class="js-serv"></a>')
				.click(function(){
					su.ui.showSimilarArtists(_this.md.artist, {save_parents: true, from_artcard: true});	
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
			su.ui.showTopTacks(_this.md.artist, {save_parents: true, from_artcard: true});
		});
	}
});


var artCard = function(artist) {
	this.init();
	this.artist= artist;
	this.updateState('nav-text', artist);
	this.updateState('nav-title', artist);

	this.loadInfo();

	var _this = this;

	this.regDOMDocChanges(function() {
		if (su.ui.els.artcards){
			var child_ui = _this.getFreeView(this);
			if (child_ui){
				su.ui.els.artcards.append(child_ui.getA());
				child_ui.requestAll();
			}
		}
		if (su.ui.nav.daddy){
			var child_ui = _this.getFreeView(this, 'nav');
			if (child_ui){
				su.ui.nav.daddy.append(child_ui.getA());
				child_ui.requestAll();
			}
		}
	});


};
suMapModel.extendTo(artCard, {
	ui_constr: {
		main: artCardUI,
		nav: artCardNavUI	
	},
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
	isAlive: function(){
		if (this.dead){
			return false;
		}
		return !this.checkLiveState();
	},
	setDOM: function(opts, tracking_opts) {
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
							su.app_md.show_now_playing(true);
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
					big_timer.q.push([tracking_opts.category, 'process-thins-sui', big_timer.comp(tracking_opts.start_time), 'seesu ui in process', 100]);
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

	
	verticalAlign: function(img, opts){
		//target_height, fix
		var real_height = opts.real_height || (img.naturalHeight ||  img.height);
		if (real_height){
			var offset = (opts.target_height - real_height)/2;
			
			if (offset){
				if (opts.animate){
					$(img).animate({'margin-top':  offset + 'px'}, 200);
				} else {
					$(img).css({'margin-top':  offset + 'px'});
				}
				
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
			setTimeout(function(){
				if (callback){
					callback(image)
				}
			}, 10)
			
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
						su.trackEvent('people likes', 'liked');
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
						su.trackEvent('people likes', 'accepted', false, 5);
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
			var algd;
			var doAlign = function(){

			};
			var img = _this.preloadImage(lig.info.photo_big, 'user photo', function(img){
				if (!algd){
					algd = true;
					_this.verticalAlign(img, {
						target_height: 252,
						animate: true
					});
				}
					
			}, $('<div class="big-user-avatar"></div>').appendTo(c));

			var real_height = (img.naturalHeight ||  img.height);
			if (real_height){
				algd = true;
				this.verticalAlign(img, {
					real_height: real_height,
					target_height: 252
				});

			}

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
				su.trackEvent('peoples', 'view');
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
			youtube_video.setAttribute('src', 'https://www.youtube.com/v/' + id);
			youtube_video.setAttribute('allowfullscreen',"true");
			youtube_video.setAttribute('class',"you-tube-video");
			
		return youtube_video;		
	},
	
	
	renderArtistAlbums: function(albums, original_artist, albums_ul, save_parents, simple){
		var _sui = this;
		if (albums.length) {
			for (var i=0; i < albums.length; i++) {
				albums_ul.append(this.createAlbum(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[2]['#text']) || '', albums[i].artist.name, original_artist, save_parents, simple));
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
					seesu.trackEvent('Artist navigation', 'album', al_artist + ": " + al_name);
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
				return this;
				
			},
			disable: function(){
				if (this._enabled){
					this.b.removeClass('nicebutton').addClass('disabledbutton');	
					this.b.data('disabled', true);
					this._enabled = false;
				}
				return this;
			},
			toggle: function(state){
				if (typeof state != 'undefined'){
					if (state){
						this.enable();
					} else {
						this.disable();
					}
				}
				
			}
		}
		bb.disable();
		return bb;
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



};