var artcardUI = function(artist, c){
	this.artist= artist;
	this.c = c;
	
	this.ui = {
		imagec: this.c.find('.art-card-image .art-card-image-padding'),
		topc: this.c.find('.top-tracks'),
		tagsc: this.c.find('.art-card-tags'),
		albumsc: this.c.find('.art-card-albums'),
		similarsc: this.c.find('.art-card-similar'),
		bioc: this.c.find('.art-card-bio')
	};	


	this.top_tracks_link = $(' <a class="js-serv">full list</a>').appendTo(this.ui.topc.children('.row-header')).click(function(){
		su.ui.show_artist(artist, true);
	});
	this.loadInfo();
}
artcardUI.prototype = {
	loadInfo: function(){
		this.loadBaseInfo();
		this.loadTopTracks();
		this.loadAlbums();
		
	},
	loadAlbums: function(){
		
		var _this = this;
		
		lfm('artist.getTopAlbums',{'artist': this.artist },function(r){
			if (r){
				var albums = toRealArray(r.topalbums.album);
				_this.showAlbums(albums);
			}
		});
	},
	loadTopTracks: function(){
		if (!this.has_top_tracks){
			var _this = this;
			var ul = this.ui.topc.children('ul');
			
			getTopTracks(this.artist, function(list){
				if (!_this.has_top_tracks){
					_this.has_top_tracks = true;
					
					$.each(list, function(i, el){
						if (i < 5){
							if (el.track){
								var a = $('<a class="js-serv"></a>').text(el.track);
								$('<li></li>').append(a).appendTo(ul);
							}
						}
						
					});
					ul.removeClass('hidden');
					
					console.log('TOP TRACKS');
					console.log(list);
				}
			});
		}
	},
	loadBaseInfo: function(){
		if (!this.has_base_info){
			var _this = this;
			
			lfm('artist.getInfo',{'artist': this.artist }, function(r){
				if (!_this.has_base_info){
					_this.has_base_info = true;
					
					var ai = parseArtistInfo(r);
					if (ai.images){
						_this.showArtistImage(ai.images);
					}
					if (ai.tags){
						_this.showTags(ai.tags);
					}
					if (ai.bio){
						_this.showBio(ai.bio);
					}
					if (ai.similars){
						_this.showSimilars(ai.similars);
					}
				}
			});
		}
	},
	showArtistImage: function(images){
		if (images[4]){
			this.ui.imagec.empty();
			this.ui.imagec.append(
				$('<img/>').attr('src', images[4])
			);
		}
		
	},
	showTags: function(tags){
		if (tags.length){
			var ul = this.ui.tagsc.children('ul');
			$.each(tags, function(i, el){
				if (el && el.name){
					var li = $('<li></li>');
					$('<a class="js-serv"></a>').text(el.name).attr('url', el.url).appendTo(li);
					li.appendTo(ul);
					ul.append(' ');
				}
				
			});
			ul.removeClass('hidden');
		}
		
	},
	showBio: function(text){
		if (text){
			this.ui.bioc.html(text.replace(/\n+/gi, '<br/><br/>'));
		}
		
	},
	showSimilars: function(artists){
		if (artists.length){
			var ul = this.ui.similarsc.children('ul');
			$.each(artists, function(i, el){
				var li = $('<li></li>');
				$('<a class="js-serv"></a>').text(el.name).appendTo(li);
				li.appendTo(ul);
				ul.append(' ');
				
			});
			ul.removeClass('hidden');
		}
		
		console.log(artists)
	},
	showAlbums: function(albums){
		if (albums.length){
			var ob = sortLfmAlbums(albums, this.artist);
			//ordered
			for (var i=0; i < ob.ordered.length; i++) {
				var aul =  $('<ul></ul>');
				su.ui.renderArtistAlbums(ob.ordered[i], this.artist, aul);
				aul.appendTo(this.ui.albumsc);
			};
			
			
		} else{
			
		}
	}
};




var contextRow = function(container){
	this.m = {
		c: container.hide(),
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
				c: cpart.hide(),
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
		
		
			this.parts[name].c.show();
			this.parts[name].active = true;
			
			
			if (!this.m.active){
				this.m.c.show();
				this.m.active = true;
			}
			
		}
		if (arrow_left){
			//used for positioning 
			this.arrow.css('left', arrow_left + 'px').show();
			
		} 
	},
	hide: function(not_itself){
		if (!not_itself){
			if (this.m.active){
				this.m.c.hide();
				this.m.active = false;
			}
			
		}
		
		for (var a in this.parts){
			if (this.parts[a].active){
				this.parts[a].c.hide();
				this.parts[a].active = false;
			}
			
		}
		
		this.arrow.hide();
		
	}
};

window.seesu_ui = function(d, with_dom){
	this.d = d;
	this.els = {};
	if (!with_dom){
		dstates.connect_ui(this);
	} else {
		this.views = new views(this);
	}
	
	this.popups = [];
	this.popups_counter = 0;
	this.buttons_li = {};
	
	this.now_playing ={
		link: null,
		nav: null
	};
	
	
	if (with_dom){
		connect_dom_to_som(d, this);
	}
};
seesu_ui.prototype = {
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
	show_tag: function(tag, query, no_navi, start_song){
		
		var pl_r = prepare_playlist('Tag: ' + tag, 'artists by tag', tag, query, start_song);
		get_artists_by_tag(tag, function(pl){
			proxy_render_artists_tracks(pl, pl_r);
		}, function(){
			proxy_render_artists_tracks();
		});
		this.views.show_playlist_page(pl_r, !!query, no_navi || !!start_song );
		
		if (start_song){
			pl_r.showTrack(start_song, no_navi);
		}
	},
	show_track: function(q){
		var title;
		if (q.q){
			title= q.q;
		} else if (q.artist || q.track){
			title = (q.artist || '') + " - " + (q.track || '');
		} else{
			title = 'unknow';
		}
		
		var pl_r = prepare_playlist(title , 'tracks', q , title)
		this.views.show_playlist_page(pl_r, !!q);
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

		
		
	},
	show_artist: function (artist, query, no_navi, start_song) {
		
		
		var pl = prepare_playlist('Top of ' + artist, 'artist', artist, query, start_song);

		this.views.show_playlist_page(pl, !!query, no_navi || !!start_song);
		if (start_song){
			pl.showTrack(start_song, no_navi);
		}
		getTopTracks(artist,function(track_list){
			create_playlist(track_list, pl);
		});
		lfm('artist.getInfo',{'artist': artist });
	
	
	
		
	},
	createFilesListElement: function(mopla, mo){
		
		var li = $('<li></li>');
		
		var desc_part = $('<span class="desc-name"></span>').appendTo(li);
		var main_part = $('<span class="desc-text"></span>').appendTo(li);
		
		
		var songitself = $('<a class="js-serv"></a>')
			.attr('href', 'http://seesu.me/o#/ds' + song_methods.getURLPart(mopla))
			.text(mopla.artist + " - " + mopla.track)
			.click(function(e){
				su.player.play_song(mo, true, mopla)
				e.preventDefault();
			}).appendTo(main_part);
			
		var d = $('<span class="duration"></span>').appendTo(desc_part);
		if (mopla.duration){
			var digits = mopla.duration % 60;
			d.text((Math.floor(mopla.duration/60)) + ':' + (digits < 10 ? '0'+digits : digits ));
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
				$(img).animate({'margin-top':  offset + 'px'},200);
			}
			return offset;
		}
		
		
	},
	preloadImage: function(src, callback, place){
		var image = document.createElement('img');
		image.alt='user photo';
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
		var image = this.preloadImage(info.photo_medium, function(img){
			_this.verticalAlign(img, 134, true);	
		}, imageplace); 
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
			var image = _this.preloadImage(lig.info.photo_big, function(img){
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
	createCurrentUserUI: function(mo, user_info){
		if (!mo.ui.t_users.current_user){
			var div = mo.ui.t_users.current_user = $('<div class="song-listener current-user-listen"></div>');
			this.createUserAvatar(user_info, div);
			
			mo.ui.t_users.list.append(div);
			return div;
		}
		
		
		
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
	createListenersHeader: function(mo){
		if (!mo.ui.t_users.header){
			mo.ui.t_users.header = $('<div></div>').text(localize('listeners-looks')).prependTo(mo.ui.t_users.c);
		}
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
	
	
	renderArtistAlbums: function(albums, original_artist, albums_ul){
		var _sui = this;
		if (albums.length) {
			for (var i=0; i < albums.length; i++) {
				albums_ul.append(this.createAlbum(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[1]['#text']) || '', albums[i].artist.name, original_artist));
			}
		} 
		return albums_ul;
	},
	showAlbum: function(artist, name, id, original_artist, query){
		var _sui = this;
		//prepare_playlist(artist, 'artist', artist, with_search_results, start_song);
		var pl_r = prepare_playlist('(' + artist + ') ' + name ,'album', {original_artist: original_artist || artist, album: name}, query);
		_sui.views.show_playlist_page(pl_r, !!query);
		if (id){
			get_artist_album_playlist(id, pl_r);
		} else{
			get_artist_album_info(artist, name, function(alb_data){
				get_artist_album_playlist(alb_data.album.id, pl_r);
			});
		}
		
	},
	createAlbum: function(al_name, al_url, al_image, al_artist, original_artist){
		var _sui = this;
		var li = $('<li></li>');
			var a_href= $('<a></a>')
				.attr('href', al_url )
				.data('artist', al_artist)
				.data('album', al_name)
				.click(function(e){
					e.preventDefault(); 
					_sui.showAlbum(al_artist, al_name, false, original_artist);
					seesu.track_event('Artist navigation', 'album', al_artist + ": " + al_name);
				})
				.appendTo(li);
			$('<img/>').attr('src', al_image).appendTo(a_href);
			$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
			
		return li;
	},

	render_playlist: function(pl, load_finished) { // if links present than do full rendering! yearh!
		
		if (pl.ui){
			var _sui = this;
			var ui = pl.ui.tracks_container;
			if (load_finished){
				pl.ui.ready();
				pl.loading = false;
			}
			
			if (!pl.length){
				ui.append('<li>' + localize('nothing-found','Nothing found') + '</li>');
			} else {
				var from_collection = +new Date;
				
				
				if (su.player.c_song && pl == su.player.c_song.plst_titl){
					
					var ordered = [];
					var etc = [];
					
					ordered.push(su.player.c_song);
					if (su.player.c_song.prev_song){
						ordered.push(su.player.c_song.prev_song);
					}
					if (su.player.c_song.next_song){
						ordered.push(su.player.c_song.next_song);
					}
					
					for (var i=0; i < pl.length; i++) {
						var mo = pl[i];
						if (ordered.indexOf(mo) == -1){
							etc.push(mo);
						}
						
					};
					
					for (var i=0; i < pl.length; i++) {
						pl[i].render(from_collection, i == pl.length-1, true);
					}
					for (var i=0; i < ordered.length; i++) {
						if (ordered[i].ui){
							ordered[i].ui.expand()
						} else{}
					};
					
					setTimeout(function(){
						for (var i=0; i < etc.length; i++) {
							if (etc[i].ui){
								etc[i].ui.expand()
							} else{}
						};
					},1000);
					
					
				} else{
					
					for (var i=0; i < pl.length; i++) {
						pl[i].render(from_collection, i == pl.length-1);
					}
				}
				su.player.fix_songs_ui();
			}
			return pl.ui
		}

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
		if (su.lfm_api.newtoken) {
			su.lfm_api.open_lfm_to_login(su.lfm_api.newtoken);
		} else {
			su.lfm_api.get_lfm_token(true);
		}
	},
	lfmCreateAuthFrame: function(first_key){
		if (this.lfm_auth_inited){
			return false;
		}
		var i = su.lfm_api.auth_frame = document.createElement('iframe');	
		addEvent(window, 'message', function(e){
			if (e.data == 'lastfm_bridge_ready:'){
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('lastfm_token:') === 0){
				su.lfm_api.newtoken = e.data.replace('lastfm_token:','');
				su.lfm_api.try_to_login(seesu.ui.lfm_logged);
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
			su.lfm_api.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	lfmAuthInit: function(){
		
		
		//init_auth_data.bridgekey		
		
		var init_auth_data = su.lfm_api.getInitAuthData();
		if (init_auth_data.bridgekey){
			this.lfmSetAuthBridgeKey(init_auth_data.bridgekey)
		} 
		
		
		open_url(init_auth_data.link);
		dstates.add_state('body','lfm-waiting-for-finish');
		
		
		return
		
	},
	lfm_logged : function(){
		dstates.add_state('body', 'lfm-auth-done');
		dstates.remove_state('body', 'lfm-auth-req-loved');
		dstates.remove_state('body', 'lfm-auth-req-recomm');
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
	search: function(query, no_navi, new_browse){
		if (new_browse){
			this.views.showStartPage();
		}
		this.els.search_input.val(query);
		input_change(this.els.search_input[0], no_navi);
	},
	create_playlists_link: function(){
		var _ui = this;
		if (!_ui.link && su.gena.playlists.length > 0 && _ui.els.start_screen){
			$('<p></p>').attr('id', 'cus-playlist-b').append(
				_ui.link = $('<a></a>').text(localize('playlists')).attr('class', 'js-serv').click(function(e){
					_ui.search(':playlists');
					e.preventDefault();
				}) 
			).appendTo(_ui.els.start_screen.children('.for-startpage'));
		}
	},
	remove_video: function(){
		if (this.video){
			if (this.video.link){
				this.video.link.removeClass('active');
				this.video.link[0].showed = false;
				this.video.link = false;
				
			}
			if (this.video.node){
				this.video.node.remove();
				this.video.node = false;
			}
		}
		
	},
	mark_c_node_as: function(marker){
		var s = this.els.pllistlevel.add(su.ui.now_playing.link);
		s.each(function(i, el){
			$(el).attr('class', el.className.replace(/\s*player-[a-z]+ed/g, ''));
		});
		switch(marker) {
		  case(PLAYED):
			s.addClass('player-played');
			break;
		  case(STOPPED):
			s.addClass('player-stopped');
			break;    
		  case(PAUSED):
			s.addClass('player-paused');
			break;
		  default:
			//console.log('Do nothing');
		}
	 
  
	}



}