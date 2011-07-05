var views = function(){
	this.m = new browseMap();
}
views.prototype = {
	getCurrentSearchResultsContainer: function(){
		return this.m.getLevel(0);
	},
	getSearchResultsContainer: function(){
		var c = this.m.getFreeLevel(0);
		if (!c.ui){
			c.ui = $('<div class="search-results-container current-src"></div').appendTo(seesu.ui.els.searchres);
		}
		return c
	},
	getPlaylistContainer: function(skip_from){
		var c = this.m.getFreeLevel(1, 1-(skip_from + 1));
		if (!c.ui){
			var conie = $('<div class="playlist-container"></div>').appendTo(seesu.ui.els.artsTracks);
			c.ui = {
				conie: conie,
				canUse: function(){
					return this.conie && !!this.conie.parent() && this.conie[0].ownerDocument == su.ui.d;
				},
				remove: function(){
					return this.conie.remove();
				},
				hide: function(){
					return this.conie.hide()
				},
				show: function(){
					return this.conie.show()
				},
				wait: function(){
					this.tracks_container.addClass('loading');
				},
				ready: function(){
					this.tracks_container.removeClass('loading');
				},
				info_container: $('<div class="playlist-info"></div>').appendTo(conie),
				tracks_container: $('<ul class="tracks-c current-tracks-c tracks-for-play"></ul>').appendTo(conie)
			};
		} 
		return c;
	},
	getCurrentPlaylistContainer: function(){
		return this.m.getLevel(1);
	},
	findViewOfURL: function(url, only_freezed, only_free){
		return this.m.findURL(1, url, only_freezed, only_free);
	},
	findSeachResultsOfURL: function(url, only_freezed, only_free){
		return this.m.findURL(0, url, only_freezed, only_free);
	},
	findViewOfSearchQuery: function(query){
		return this.m.findLevelOfSearchQuery(0, query);
	},
	findViewOfPlaylist: function(puppet, only_playing){
		return this.m.findLevelOfPlaylist(1, puppet, only_playing);
	},
	freeze: function(g, not_reset_searches){
		var newfreeze = this.m.freezeMapOfLevel(1);
		if (newfreeze && !not_reset_searches){
			su.mp3_search.abortAllSearches();
		}
	},
	restoreFreezed: function(no_navi){
		this.m.restoreFreezed();
		var l = this.m.getLevel(1); // playlist page is 1 level
		if (l){
			this.swithToPlaylistPage(l.context.pl, no_navi);
		}
	},

	show_now_playing: function(){
		var current_page = seesu.ui.els.slider.className;
		this.restoreFreezed(true); // true is for supress navi.set
		su.player.view_song(su.player.c_song, true);
		seesu.track_event('Navigation', 'now playing', current_page);
	},
	show_start_page: function(focus_to_input, log_navigation, init, no_navi){
		// start page is -1 level
		this.m.sliceToLevel(-1);
		
		
		this.nav.daddy.empty();
		this.nav.daddy.append($('<img class="nav-title" title="Seesu start page" src="i/nav/seesu-nav-logo.png"/>').click(function(){
			seesu.ui.els.search_input[0].focus();
			seesu.ui.els.search_input[0].select();
		}));
		seesu.ui.els.slider.className = "show-start";
		if (focus_to_input){
			seesu.ui.els.search_input[0].focus();
			seesu.ui.els.search_input[0].select();
		}
		if (init){
			this.nav.daddy.removeClass('not-inited')
		} else if (!no_navi){
			navi.set('');
		}
		if (log_navigation){
			seesu.track_page('start page');
		}
		
		this.state = 'start';
	
	},
	newBrowse: function(){
		//mainaly for hash url games
		this.m.sliceToLevel(-1);
	},
	show_search_results_page: function(without_input, no_navi){
		// search results is 0 level
		this.m.sliceToLevel(0);
		
		
		this.nav.daddy.empty();
		this.nav.daddy.append(this.nav.start.unbind().click(function(){
			seesu.ui.views.show_start_page(true, true);
		}));
		this.nav.daddy.append('<img class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png"/>');
		var _s = seesu.ui.els.slider.className;
		var new_s = (without_input ? '' : 'show-search ') + "show-search-results";
		if (new_s != _s){
			seesu.ui.els.slider.className = new_s;
			seesu.track_page('search results');
		}
		this.state = 'search_results';
		if (!no_navi){
			navi.set(this.getCurrentSearchResultsContainer().getFullURL());
		}
		
		
		
	},
	swithToPlaylistPage: function(pl, no_navi){
		// playlist page is 1 level
		this.m.sliceToLevel(1);
		
		this.nav.daddy.empty();
		if (pl.with_search_results_link){
			this.nav.daddy.append(this.nav.results.unbind().click(function(){
				seesu.ui.views.show_search_results_page(true);
			}));
		} else{
			this.nav.daddy.append(this.nav.start.unbind().click(function(){
				seesu.ui.views.show_start_page(true, true);
			}));
		}
		this.nav.daddy.append('<span class="nav-title" src="i/nav/seesu-nav-search.png">' + pl.playlist_title + '</span>');
		$(seesu.ui.els.nav_playlist_page).text(pl.playlist_title);
		if (pl.with_search_results_link) {
			seesu.ui.els.slider.className = 'show-full-nav show-player-page';
		} else {
			seesu.ui.els.slider.className = 'show-player-page';
		}
		this.state = 'playlist';
		if (!no_navi){
			navi.set(this.getCurrentPlaylistContainer().getFullURL(),{pl:pl});
		}
		
		seesu.track_page('playlist', pl.playlist_type);
	},
	show_playlist_page: function(p, slice_level, no_navi){
		var skip_from;
		if (typeof slice_level == 'number'){
			
			this.m.sliceToLevel(skip_from = slice_level);
			// we want to clear map exept few first levels
		} else{
			// playlist page is 1 level
			this.m.sliceToLevel(skip_from = -1);
			//we want to clear map
			
		}
		var pl = p;
		if (!pl){
			var lev = this.getCurrentPlaylistContainer();
			pl = lev.context.pl;
		}

		if (pl && !pl.ui){
			var lev = this.getPlaylistContainer(skip_from);
			lev.context.pl = pl; 
			pl.ui = lev.ui;
			if (pl.loading){
				pl.ui.wait()
			}
			
			lev.setURL(getUrlOfPlaylist(pl));
		}
		if (pl && pl.length){
			
			var ui = pl.ui && pl.ui.canUse() && pl.ui.show();
			if (!ui){
				var lev = this.getPlaylistContainer(skip_from);
				lev.context.pl = pl;
				pl.ui = lev.ui;
				lev.setURL(getUrlOfPlaylist(pl));
			}
			seesu.ui.render_playlist(pl, pl.length > 1);
		}
		
		this.swithToPlaylistPage(pl, no_navi);
		
		
		
		
		
		
	},
	show_track_page: function(title, zoom, mo, no_navi){
		var pl = mo.plst_titl;
		
		if (title){
			seesu.ui.els.nav_track_zoom.text(title);
		}
		
		if (zoom){
			$(seesu.ui.els.slider).addClass('show-zoom-to-track');
			this.state = 'track';
		}
		if (zoom || this.state == 'track'){
			this.nav.daddy.empty();
			this.nav.daddy.append(this.nav.playlist.unbind().click(function(){
					seesu.ui.views.swithToPlaylistPage(pl);
			}));
			
			this.nav.daddy.append('<span class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png">' + title + '</span>');
		}
		
		if (!no_navi){
			navi.set(this.getCurrentPlaylistContainer().getFullURL() + mo.getURLPart(), {pl:pl, mo: mo});
		}
		
	}
}


window.seesu_ui = function(d, with_dom){
	this.d = d;
	this.els = {};
	if (!with_dom){
		dstates.connect_ui(this);
	} else {
		this.views = new views();
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
}
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
				c.hide();
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
		this.views.show_playlist_page(pl_r, query ? 0 : false, no_navi || !!start_song );
		if (start_song){
			start_song.view(no_navi);
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
		this.views.show_playlist_page(pl_r, 0);
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
	show_artist: function (artist,with_search_results, no_navi, start_song) {
		var pl = prepare_playlist(artist, 'artist', artist, with_search_results, start_song);
		var plist = su.ui.views.findViewOfURL(getUrlOfPlaylist(pl));
		if (plist){
			if (plist.freezed){
				su.ui.views.restoreFreezed(no_navi);
			}
		} else{
			this.views.show_playlist_page(pl, with_search_results ? 0 : false, no_navi || !!start_song);
			if (start_song){
				start_song.view(no_navi);
			}
			getTopTracks(artist,function(track_list){
				create_playlist(track_list, pl);
			});
			lfm('artist.getInfo',{'artist': artist });
		}
		
	
		
	},
	createFilesListElement: function(mopla, mo){
		
		var li = $('<li></li>');
		
		var desc_part = $('<span class="desc-name"></span>').appendTo(li);
		var main_part = $('<span class="desc-text"></span>').appendTo(li);
		
		
		var songitself = $('<a class="js-serv"></a>')
			.attr('href', 'http://seesu.me/o#/ds' + song_methods.getURLPart.call(mopla))
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
				$(img).css('margin-top', offset + 'px')
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
	createSongListener: function(lig){
		var _this = this;
		
		var li = $('<li class="song-listener"></li>').click(function() {
			su.ui.hidePopups(su.ui.els.wtm.id);
			
			var clicked_node = $(this);
			
			var target_offset = clicked_node.offset();
			var container_offset = su.ui.els.pllistlevel.offset();
			var container_width = su.ui.els.pllistlevel.width();
			var left = target_offset.left - container_offset.left;
			
			su.ui.els.wtm.wp.css({
				top: (target_offset.top - container_offset.top) + 'px',
				left: left + 'px',
				display: 'block'
			});
			
			if (left > container_width/2){
				su.ui.els.wtm.wp.addClass('close-to-right');
			} else{
				su.ui.els.wtm.wp.removeClass('close-to-right');
			}
			
			
			su.ui.els.wtm.con.text(Math.random());
			su.ui.els.wtm.wp.show();
			su.ui.els.wtm.visible = true;

			return false;
			//e.stop
		});
	
		var imageplace = $("<div class='image-cropper'></div>").appendTo(li)
		var image = this.preloadImage(lig.info.photo_medium, function(img){
			_this.verticalAlign(img, 134, true);	
		}, imageplace); 
		
		return li;
				
				
	},
	createSongListeners: function(listenings, place, above_limit_value){
		var _this = this;
		var users_limit = 3;
		for (var i=0, l = Math.min(listenings.length, Math.max(users_limit, users_limit + above_limit_value)); i < l; i++) {
			if (listenings[i].info){
				place.append(this.createSongListener(listenings[i]));
			}
		};
		return Math.max(users_limit - listenings.length, 0);
	},
	updateSongListeners: function(mo){
		var _this = this;
		var last_update = mo.ui.t_users.last_update;
		var current_user = su.distant_glow.getId();
		
		
		if (mo.artist && (!last_update || (new Date - last_update) > 1000 * 60 * 1)){
			var d = {artist: mo.artist};
			if (mo.track){
				d.title = mo.track;
			}
			su.api('track.getListeners', d, function(r){
				if (r && r.done && [].concat.apply([], r.done).length){
					var above_limit_value = 0;
					var uul = $("<ul class='song-listeners-list'></ul>");
					for (var i=0; i < r.done.length; i++) {
						if (r.done[i] && r.done[i].length){
							above_limit_value = _this.createSongListeners(r.done[i], uul, above_limit_value);
						}
						
					}; 
					mo.ui.t_users.c.empty();
					$('<div></div>').text(localize('listeners-looks')).appendTo(mo.ui.t_users.c);
					uul.appendTo(mo.ui.t_users.c);
				}
				console.log(r)
				
			});
			mo.ui.t_users.last_update = (+new Date);
		}
		
	},
	updateSongContext:function(mo, real_need){
		if (mo.ui){
			var artist = mo.artist;
			
			var a_info = mo.ui && mo.ui.a_info;
			if (a_info){
				if (artist) {this.update_artist_info(artist, a_info, mo.plst_titl.playlist_type != 'artist', mo.ui.extend_info);}
				//this.update_track_info(mo);
				this.show_video_info(mo.ui.tv, artist + " - " + mo.track, mo.ui.extend_info);
				this.updateSongFiles(mo, mo.ui.extend_info);
				if (real_need){
					this.updateSongListeners(mo);
				}
				
				if (su.lfm_api.scrobbling) {
					this.lfm_change_scrobbling(true, mo.ui.context.children('.track-panel').find('.track-buttons'));
				}
			} else{
				console.log('no context for:')
				console.log(mo)
			}
			
			
			
		}
		
		
	},
	updateSongFiles: function(mo, ext_info){
		if (!mo.ui){
			return false;
		}
		if (mo.wheneWasChanged() > mo.ui.files_time_stamp){
		
			var _sui = this;
			var c = mo.ui.files;
			c.empty();

			var songs = mo.songs();
			
			if (mo.isSearchCompleted() && mo.isNeedsAuth('vk')){
				if (!songs.length){
					mo.ui.files.before(_sui.samples.vk_login.clone())
				} else if(!mo.isHaveAnyResultsFrom('vk')){
					mo.ui.files.before(_sui.samples.vk_login.clone('enhancement'))
				} else {
					mo.ui.files.before(_sui.samples.vk_login.clone('stabilization'))
				}
				
				
			} 
			
			
			if (songs){
				var songs_counter = 0;
				var small_head = $('<div class="files-header"></div>').appendTo(c);
			
				
				
				var sc = $('<div class="files-lists"></div>');
				
				var just_link;
				var extend_link;
				
				
				
			
							
				for (var i=0; i < songs.length; i++) {
					songs_counter += songs[i].t.length
					var b = this.createFilesList(songs[i], mo);
					if (b){b.appendTo(sc);}
					if (!extend_link && songs[i].t && songs[i].t.length > 3){
						
						small_head.addClass("show-f-head")
						
						small_head.append(
							$('<a class="js-serv extend-switcher"><span class="big-space">' + localize('show-all-files') +'</span></a>').click(function(e){
								c.toggleClass('show-all-files');
								e.preventDefault();
							})
						);
						extend_link = true;
					}
					
					
				};
				ext_info.files = songs_counter;
				ext_info.updateUI();
				
				
				sc.appendTo(c);
				mo.ui.files_control.list_button.enable();
			} 
			
			var downloads = mo.mp3Downloads();
			if (downloads){
				mo.ui.files_control.quick_download_button.enable();
			}
			
			
			
			if (false && mo.isSearchCompleted() && !mo.isHaveAnyResultsFrom('soundcloud')){
				desc.append('<p>try to connect soundcloud search</p>')
			}
			mo.ui.files_time_stamp = +new Date();
		}
	},
	update_artist_info: function(artist, a_info, show_link_to_artist_page, ext_info){
		var _sui = this;
		if (a_info.data('artist') != artist || a_info.data('artist-lfm') != true){
			var ainf = {
				name: a_info.children('.artist-name'), 
				image: a_info.children('.image'),
				bio: a_info.children('.artist-bio'),
				meta_info: a_info.children('.artist-meta-info'),
				c : a_info
			};
			if (a_info.data('artist') != artist){
				a_info.data('artist', artist);
				ainf.name.empty()
				var arts_name = $('<span class="desc-name"></span>')
					.appendTo(ainf.name);
					
				
				
				$('<a></a>')
					.attr('href', 'http://www.last.fm/music/' + artist.replace(' ', '+'))
					.text(localize('profile'))
					.attr('title', 'last.fm profile')
					.click(function(e){
						var link = 'http://www.last.fm/music/' + artist.replace(' ', '+');
						open_url(link);
						seesu.track_event('Links', 'lastfm', link);
						e.preventDefault();
					})
					.appendTo(arts_name);
				
				$('<span class="desc-text"></span>')
					.text(artist)
					.appendTo(ainf.name);
					
				
				ainf.bio.text('...');
				ainf.meta_info.empty();
				
				
			}
			
			
			if (a_info.data('artist-lfm') != true){
				lfm('artist.getInfo',{'artist': artist }, function(r){
					if (a_info.data('artist') == artist && a_info.data('artist-lfm') != true){
						a_info.data('artist-lfm', true);
						_sui.show_artist_info(r, ainf, artist, ext_info);
						
					}
					
				});
			}

		}
		
	},
	create_youtube_video: function(id, transparent){
		var youtube_video = document.createElement('embed');
			youtube_video.setAttribute('type',"application/x-shockwave-flash");
			youtube_video.setAttribute('src', 'http://www.youtube.com/v/' + id);
			youtube_video.setAttribute('allowfullscreen',"true");
			youtube_video.setAttribute('class',"you-tube-video");
			if (transparent){
				youtube_video.setAttribute('wmode',"transparent");
			}
		return youtube_video;		
	},
	show_video_info: function(vi_c, q, ext_info){
		var _this = this;
		var _sui = this;
		if (vi_c.data('has-info')){return true;}
		get_youtube(q, function(r){			
			var vs = r && r.feed && r.feed.entry;
			if (vs && vs.length){
				vi_c.data('has-info', true);
				vi_c.empty();
				vi_c.append('<span class="desc-name"><a target="_blank" href="http://www.youtube.com/results?search_query='+ q +'">' + localize('video','Video') + '</a>:</span>');
				var v_content = $('<ul class="desc-text"></ul>');
			
				var make_v_link = function(img_link, vid, _title){
					var li = $('<li class="you-tube-video-link"></li>').click(function(e){
						var showed = this.showed;
						
						_this.remove_video();
						
						if (!showed){
							_sui.video = {
								link: $(this).addClass('active'),
								node: $(_this.create_youtube_video(vid, su.env.opera_widget)).appendTo(vi_c)
							}
							seesu.player.set_state('pause');
							this.showed = true;
						} else{
							seesu.player.set_state('play');
							this.showed = false;
						}
						e.preventDefault();
					});
					
					$("<a class='video-preview'></a>")
						.attr('href', 'http://www.youtube.com/watch?v=' + v_id)
						.append($('<img  alt=""/>').attr('src', img_link))
						.appendTo(li);
					
					$('<span class="video-title"></span>')
						.text(_title).appendTo(li);
						
					li.appendTo(v_content)
				}
				for (var i=0, l = Math.min(vs.length, 3); i < l; i++) {
					var _v = vs[i],
						tmn = _v['media$group']['media$thumbnail'][0].url,
						v_id = _v['media$group']['yt$videoid']['$t'],
						v_title = _v['media$group']['media$title']['$t'];
						
					make_v_link(tmn, v_id, v_title);
					
				};
				if (l){
					ext_info.videos = l;
					ext_info.updateUI();
				}
				
				v_content.appendTo(vi_c);
				
				
			}
		});
		
	},
	update_track_info: function(mo){
		if (!mo.ui){
			return false;
		}
		var ti = mo.ui.info.empty();
		var mo;
		if (mo.mopla && mo.mopla.from && mo.mopla.from == 'soundcloud'){
			if (mo.mopla.page_link){
				var sc_link = $('<a></a>')
					.attr('href', mo.mopla.page_link)
					.text('page of this track')
					.click(function(e){
						open_url(mo.mopla.page_link);
						seesu.track_event('Links', 'soundcloud track');
						e.preventDefault();
					});
			}
			
			ti.append(
				$('<p></p>')
					.text(
						'This track was found in SoundCloud. ' + 
						'It may not match with track you are searching for at all. Try to use vk.com (vkontakte.ru) '
					 )
					 .append(sc_link)
				
			);
		}	
	},
	show_artist_info: function(r, ainf, oa, ext_info){
		var _sui = this;
		var info	 = r.artist || false;
		var similars, artist, tags, bio, image, has_some_info_extenders;
		if (info) {
			similars = info.similar && info.similar.artist;
			artist	 = info.name;
			tags	 = info.tags && info.tags.tag;
			bio		 = info.bio && info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
			image	 = (info.image && info.image[2]['#text']) || lfm_image_artist;
		} 
			
		if (artist && artist == oa) {
			ainf.bio.parent().addClass('background-changes');
			if (su.env.opera_widget){
				image += '?somer=' + Math.random();
			}
			ainf.image.append($('<img class="artist-image"/>').attr({'src': image ,'alt': artist}));
		} else{
			return false
		}
		if (bio){
			ainf.bio.html(bio);
			ainf.bio.append('<span class="forced-end"></span>');
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
		}
		
		
		
		
		
		if (tags && tags.length) {
			var tags_p = $("<p class='artist-tags'></p>").append('<span class="desc-name"><em>'+localize('Tags')+':</em></span>');
			var tags_text = $('<span class="desc-text"></span>').appendTo(tags_p);
			for (var i=0, l = tags.length; i < l; i++) {
				var tag = tags[i],
					arts_tag_node = $("<a></a>")
						.text(tag.name)
						.attr({ 
							href: tag.url,
							'class': 'music-tag js-serv'
						})
						.data('music_tag', tag.name)
						.appendTo(tags_text); //!using in DOM
			}
			ainf.meta_info.append(tags_p);
		}
		
		if (similars && similars.length) {
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
			var similars_p = $("<p class='extending-info artist-similar'></p>"),
				similars_a = $('<em></em>').append($('<a></a>').append(localize('similar-arts') + ":").attr({ 'class': 'similar-artists js-serv'}).data('artist', artist));	
			$('<span class="desc-name"></span>').append(similars_a).appendTo(similars_p);
			var similars_text = $('<span class="desc-text"></span>').appendTo(similars_p);
			for (var i=0, l = similars.length; i < l; i++) {
				var similar = similars[i],
					arts_similar_node = $("<a class='js-serv'></a>")
					  .text(similar.name)
					  .attr({ 
						href: similar.url, 
						'class' : 'artist js-serv' 
					  })
					  .data('artist', similar.name )
					  .appendTo(similars_text);//!using in DOM
			}
			ainf.meta_info.append(similars_p);
		}
		var artist_albums_container = $('<div class="artist-albums extending-info"></div>').append('<span class="desc-name"><em>'+localize('albums')+':</em></span>').appendTo(ainf.meta_info);
		var artist_albums_text = $('<div class=""></div>').appendTo(artist_albums_container);
		if (artist_albums_container){
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
			var albums_link = $('<a class="js-serv get-artist-albums">' + localize('get-albums')+ '</a>')
				.click(function(){
					var _this = $(this);
					if (!_this.data('albums-loaded')){
						
						artist_albums_container.addClass('albums-loading');
						
						lfm('artist.getTopAlbums',{'artist': artist },function(r){
							if (typeof r != 'object') {return;}
							_sui.artist_albums_renderer(r, artist_albums_text, artist);
							_this.data('albums-loaded', true);
							artist_albums_container.removeClass('albums-loading');
						});
						_this.text(localize('hide-them','hide them'));
						seesu.track_event('Artist navigation', 'show artist info', artist);
					} else{
						_sui.toogle_art_alb_container(_this);
					}
				})
				.appendTo(artist_albums_text);
			artist_albums_container.data('albums_link', albums_link);
		}
		ainf.bio.parent().removeClass('background-changes');
		if (has_some_info_extenders){
			ext_info.base_info = artist;
			ext_info.updateUI();
		}
		
	},
	artist_albums_renderer: function(r, container, original_artist){
		var _sui = this;
		var albums = r.topalbums.album;
		var albums_ul = $('<ul></ul>');
		if (albums){
			
			var create_album = function(al_name, al_url, al_image, al_artist){
				var li = $('<li></li>').appendTo(albums_ul);
				var a_href= $('<a></a>')
					.attr('href', al_url )
					.data('artist', al_artist)
					.data('album', al_name)
					.click(function(e){
						e.preventDefault(); 
						
						var pl_r = prepare_playlist('(' + al_artist + ') ' + al_name ,'album', {original_artist: original_artist, album: al_name});
						_sui.views.show_playlist_page(pl_r);
						get_artist_album_info(al_artist, al_name, function(alb_data){
							get_artist_album_playlist(alb_data.album.id, pl_r);
						} );
						seesu.track_event('Artist navigation', 'album', al_artist + ": " + al_name);
						e.preventDefault();
					})
					.appendTo(li);
				$('<img/>').attr('src', al_image).appendTo(a_href);
				$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
			};
			if (albums.length) {
				for (var i=0; i < albums.length; i++) {
					create_album(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[1]['#text']) || '', albums[i].artist.name);
					
				}
			} else if (albums.name){
				create_album(albums.name, albums.url, (albums.image && albums.image[1]['#text']) || '', albums.artist.name );
			}
			
		} else {
			albums_ul.append('<li>No albums information</li>');
		}
		container.append(albums_ul);
	},
	toogle_art_alb_container: function(link){
		var artist_albums_container = link.parent().parent();
		if (artist_albums_container.is('.collapse-albums')){
			artist_albums_container.removeClass('collapse-albums');
			link.text(localize('hide-them', 'hide them'));
		} else{
			artist_albums_container.addClass('collapse-albums');
			link.text(localize('show-them', 'show them'));
		}
	},
	render_playlist: function(pl, load_finished) { // if links present than do full rendering! yearh!
		
		if (pl.ui){
			var _sui = this;
			if (pl.ui && !pl.ui.has_info && pl.playlist_type == 'artist'){
				//pl.ui.a_info = this.samples.a_info.clone().appendTo(pl.ui.info_container);
				//pl.ui.has_info = true;
				//this.update_artist_info(pl.key, pl.ui.a_info);
			}
			var ui = pl.ui.tracks_container;
			if (load_finished){
				pl.ui.ready();
				pl.loading = false;
			}
			
			if (!pl.length){
				ui.append('<li>' + localize('nothing-found','Nothing found') + '</li>');
			} else {
				var from_collection = +new Date;
				for (var i=0, l = pl.length; i < l; i++) {
					var mo = pl[i];
					mo.render(from_collection, i == pl.length-1);
				}
				su.player.fix_songs_ui();
			}
			return pl.ui
		}

	},
	displaySongMoplaInfo: function(mo, mopla){
		var duration = mopla.duration;
		var du = mo.ui.durationc;
		
		if (duration){
			var digits = duration % 60;
			var track_dur = (Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			du.text(track_dur);
		} else{
			du.text('');
		}
		
		var filename = mopla.artist + ' - ' +  mopla.track;
		
		mo.c.mopla_title.text(mopla.from + ": " + filename);
		mo.c.mopla_title.attr('title', mopla.description || '');
		
		
	},
	updateSong: function(mo, not_rend){
		var _sui = this;
		var down = mo.ui.node.siblings('a.download-mp3').remove();
		mo.ui.node
			.addClass('song')
			.removeClass('search-mp3-failed')
			.removeClass('waiting-full-render')
			.removeClass('mp3-download-is-not-allowed')
			.data('mo', mo)
			.unbind()
			.click(function(){
				_sui.views.freeze(mo.plst_titl);
				su.player.song_click(mo);
			});
		
		
		
		var mopla = mo.song();
		if (mopla){
			if (mopla.duration){
				this.displaySongMoplaInfo(mo, mopla);
			}
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
	create_playlist_element: function(mo){
		var _sui = this;

		var t_context = this.samples.track_c.clone(true);
		var tp = t_context.children('.track-panel');
		
		
		
		var track = $("<a></a>")
			.data('mo', mo)
			.data('t_context', t_context)
			.addClass('track-node waiting-full-render')
			.click(empty_song_click),
			li = $('<li></li>');
			
		var track_title_ui = $("<span></span>");
		var track_duration_ui = $('<a class="song-duration"></a>');
		
		track_title_ui.text(mo.getFullName());
		
		
		
		track.append(track_title_ui);
		track.prepend(track_duration_ui);
		
		
		var buttmen = _sui.els.play_controls.node.clone(true).data('mo', mo);
		tp.add(buttmen).find('.pc').data('mo', mo);



		var filesc = t_context.children('.track-files');
		var tidominator = t_context.children('.track-info-dominator');
		var dominator_head = tidominator.children('.dominator-head');
		var a_info = tidominator.children('.artist-info');
		var t_info = tidominator.children('.track-info');
		
		
		
		
		
		
		if (mo.plst_titl.playlist_type != 'artist'){
			$('<a class="js-serv">' + localize('top-tracks') + '</a>')
				.data('artist', mo.artist)
				.appendTo(dominator_head.children('.closer-to-track'))
				.click(function(){
					_sui.show_artist(mo.artist);
					su.track_event('Artist navigation', 'top tracks', mo.artist);
				});
		}
		
		
		
		var users = $('<div class="track-listeners"></div>').appendTo(t_context);
		
		
		var extend_switcher = dominator_head.children('.extend-switcher').click(function(e){
			tidominator.toggleClass('want-more-info');
			e.preventDefault();
		});
		
		var files_cc = $('<div class="files-control"></div>').prependTo(tp.children('.buttons-panel'));
		
		
		var files_list_nb = this.createNiceButton('left');
		
		files_list_nb.b.text( localize('Files', 'Files') + ' ▼');
		files_list_nb.c.appendTo(files_cc);
		files_list_nb.b.click(function(){
			if (!$(this).data('disabled')){
				filesc.toggleClass('show-files');
			}
			
		});
		
		
		
		var file_download_nb =  this.createNiceButton('right');
		file_download_nb.b.text(localize('Download', 'Download'));
		file_download_nb.c.appendTo(files_cc);
		file_download_nb.b.click(function(){
			if (!$(this).data('disabled')){
				var d = mo.mp3Downloads();
				if (d){
					open_url(d[0].link)
				}
				
			}
		});
		

		mo.ui = {
			titlec: track_title_ui,
			durationc: track_duration_ui,
			tidominator: tidominator,
			mainc: li,
			a_info: a_info,
			node: track,
			files_control: {
				list_button: files_list_nb,
				quick_download_button: file_download_nb
			},
			t_users: {
				c: users
			},
			context: t_context,
			t_info: t_info,
			extend_info: {
				files: false,
				videos: false,
				base_info: false,
				extend_switcher: extend_switcher,
				updateUI: function(){
					var c = {
						str: '',
						prev: false
					};
					su.ui.infoGen(this.base_info, c, 'more «%s» info');
					su.ui.infoGen(this.files, c, 'files: %s');
					su.ui.infoGen(this.videos, c, 'video: %s');
					if (c.str){
						this.extend_switcher.find('.big-space').text(c.str);
					}

				}
			},
			deactivate: function(){
				this.files.removeClass('show-files show-all-files')
				this.mainc.removeClass('viewing-song')
				this.tidominator.removeClass('want-more-info');
				su.ui.hidePopups();
			},
			activate: function(){
				this.mainc.addClass('viewing-song');
			},
			
			tv: t_info.children('.track-video'),
			files: filesc,
			remove: function(){
				this.mainc.remove();
			},
			files_time_stamp:0
		};
		
		
		
		
		
		
		var ph = seesu.player.controls.ph.clone(true);
		var tpt = ph.children('.track-progress').data('mo', mo);
		mo.c = {
			tr_progress_t: tpt,
			tr_progress_l: tpt.children('.track-load-progress'),
			tr_progress_p: tpt.children('.track-play-progress'),
			mopla_title: tpt.find('.track-node-text')
		};
		
		ph.prependTo(tp);
		
		
		

		
			
		var plistel = $(li)
			.data('mo', mo)
			.append(buttmen)
			.append(track)
			.append(t_context);
		
		
		
		return plistel;
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
		$('.lfm-finish input[type=checkbox]',this.d).attr('checked', 'checked');
		var f = $('.scrobbling-switches', this.d);
		var ii = f.find('input');
		ii.removeAttr('disabled');
	},
	lfm_change_scrobbling:function(enable, context){
		var lfm_ssw = $('.scrobbling-switches', context || this.d);
		if (lfm_ssw) {
			lfm_ssw.find('.enable-scrobbling').attr('checked', enable ? 'checked' : '');
			lfm_ssw.find('.disable-scrobbling').attr('checked',enable ? '' : 'checked');
		}
	},
	search: function(query, no_navi, new_browse){
		if (new_browse){
			this.views.newBrowse();
		}
		this.els.search_input.val(query);
		input_change(this.els.search_input[0], no_navi);
		//this.views.show_search_results_page(false, no_navi);
	},
	create_playlists_link: function(){
		var _ui = this;
		if (!_ui.link && su.gena.playlists.length > 0 && _ui.els.start_screen){
			$('<p></p>').attr('id', 'cus-playlist-b').append(
				_ui.link = $('<a></a>').text(localize('playlists')).attr('class', 'js-serv').click(function(e){
					_ui.search('');
					_ui.search(':playlists');
					e.preventDefault();
				}) 
			).appendTo(_ui.els.start_screen.children('.for-startpage'));
		}
	},
	make_search_elements_index: function(remark_enter_press, after_user){
		var srca = this.views.getCurrentSearchResultsContainer();
		var srui = srca.ui;
		if (!srui){
			return false;
		}
		var search_elements = srui.find('a:not(.nothing-found), button');
		srui.data('search_elements', search_elements)
		for (var i=0 , l = search_elements.length; i < l; i++) {
			$(search_elements[i]).data('search_element_index', i);
		};
		if (remark_enter_press) {
			var active_index = this.els.search_form.data('current_node_index') || 0;
			var new_active_node = search_elements[active_index];
			if (new_active_node) {
				
					var active_node = srui.data('node_for_enter_press');
					if (active_node) {
						active_node.removeClass('active');
					}
					set_node_for_enter_press($(new_active_node), false, after_user);
			}
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