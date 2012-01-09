var createFilesButton = function(song_context){
	var files_list_nb = su.ui.createNiceButton('left');

	files_list_nb.b.text( localize('Files', 'Files') + ' ▼');
	
	files_list_nb.b.click(function(){
		if (!$(this).data('disabled')){
			
			if (!song_context.isActive('files')){
				var p = su.ui.getRtPP(this);
				song_context.show('files', p.left + $(this).outerWidth()/2);
			} else{
				song_context.hide();
			}
		}
		
	});
	return files_list_nb;
};
var createDownloadButton = function(mo){
	var file_download_nb =  su.ui.createNiceButton('right');
	file_download_nb.b.text(localize('Download', 'Download'));
	
	file_download_nb.b.click(function(){
		if (!$(this).data('disabled')){
			var d = mo.mp3Downloads();
			if (d){
				app_env.openURL(d[0].link)
			}
			
		}
	});
	return file_download_nb;
};




var songUI = function(mo, complex){
	this.init();
	this.mo = mo;
	this.c = $('<li></li>').data('mo', mo);
	if (complex){
		this.expand();
	}
	this.states = {};
};
songUI.prototype = new servView();

cloneObj(songUI.prototype, {
	constructor: songUI,
	state_change : {
		"mp-show": function(opts) {
			if (opts){
				$(su.ui.els.slider).addClass("show-zoom-to-track");
				this.activate();
			} else {
				$(su.ui.els.slider).removeClass("show-zoom-to-track");
				this.deactivate();
			}
		},
		"mp-blured": function(state) {
			
		},
		want_to_play: function(state, oldstate){
			if (state){
				this.node.addClass('marked-for-play');
			} else if (oldstate){
				this.node.removeClass('marked-for-play');
			}
		},
		files_search: function(opts){
			if (opts.complete){
				if (this.states.marked_as){
					this.updateSongContext(true);
				}
				
				if (!opts.have_tracks){
					this.node.addClass('search-mp3-failed').removeClass('waiting-full-render');
				}
			}
			this.updateSongFiles();
		},
		'searching-files': function(searching){
			if (searching){
				this.node.addClass('search-mp3');
			} else{
				this.node.removeClass('search-mp3');
			}
		},
		loading : function(loading){
			if (loading){
				this.node.addClass('loading');
			} else {
				this.node.removeClass('loading');
			}
		},
		play: function(state, oldstate){
			if (state == 'play'){
				this.hideYoutubeVideo();
			}
			if (!state){
				this.unmarkAsPlaying();
			} else if (!oldstate){
				this.markAsPlaying();
			}

		},
		playable: function(new_state, old_state){
			if (new_state && !!new_state != !!old_state){
				var _this = this;

				if (this.node){
					var down = this.node.siblings('a.download-mp3').remove();
					this.node
						.addClass('song')
						.removeClass('search-mp3-failed')
						.removeClass('waiting-full-render')
						.removeClass('mp3-download-is-not-allowed')
				}
			}
		},
		marked_as: function(state, oldstate){
			if (state){
				if (oldstate){
					this.unmark();
				}
				this.markAs(state);
			} else {
				this.unmark();
			}
		}
	},
	prop_change: {
		track: function(title){
			this.titlec.text(this.mo.getFullName());
		},
		mopla: function(mopla, old){
			if (old){
				old.removeView(this.soco_view);
			}
			if (mopla){
				mopla.addView(this.soco_view);

				this.soco_view.setStates(mopla.states);
				var filename = mopla.artist + ' - ' +  mopla.track;
				this.soco_view.change(true, 'title', mopla.from + ": " + filename)
				this.soco_view.change(true, 'desc', mopla.description || '');
			}
			this.soco_view.song_file = mopla;
			var duration = Math.floor(mopla.duration/1000);
			var du = this.durationc;
			
			if (duration){
				var digits = duration % 60;
				var track_dur = (Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
				du.text(track_dur);
			} else{
				du.text('');
			}
			
			
		}
	},
	markAsPlaying: function(){
		this.node.parent().addClass('playing-song');
	},
	unmarkAsPlaying: function(){
		this.node.parent().removeClass('playing-song');
	},
	unmark: function(){
		var target_node = this.node && this.node.parent();
		if (target_node){
			target_node.removeClass('to-play-next to-play-previous');
		}
	},
	markAs: function(statev){
		var target_node = this.node && this.node.parent();
		if (target_node){
			switch (statev) {
				case 'next':
					target_node.addClass('to-play-next');
					break
				case 'prev':
					target_node.addClass('to-play-previous');
					break
				default:
			}

		}
	},
	deactivate: function(opts){
		this.hideYoutubeVideo();

		for (var a in this.rowcs) {
			this.rowcs[a].hide();
		};
		this.tidominator.removeClass('want-more-info');
		this.c.removeClass('viewing-song');
		
		su.ui.hidePopups();
	},
	activate: function(opts){
		this.expand();
		this.updateSongContext(true);
		this.c.addClass('viewing-song');
	},
	createBase: function(){
		var _this = this;
		this.node = $("<a></a>")
			.addClass('track-node waiting-full-render')
			.data('mo', this.mo)
			.click(function(){
				var mo = _this.mo;
				if (mo.player){
					mo.player.wantSong(mo);
				}
				if (mo.plst_titl.lev){
					mo.plst_titl.lev.freeze()
				}
				
				mo.view();
				return false;
			});
		this.titlec = $("<span></span>").text(this.mo.getFullName()).appendTo(this.node);
		this.durationc = $('<a class="song-duration"></a>').prependTo(this.node);
		this.c.append(this.node);
	},
	expand: function(){
		if (this.expanded){
			return true
		} else{
			this.expanded = true;
		}
		var _this = this;
	
	
		this.context = su.ui.samples.track_c.clone(true);
		var tp = this.context.children('.track-panel');
		
		
		this.createBase();
		
		
		
		
		var buttmen = su.ui.els.play_controls.node.clone(true).data('mo', this.mo);
		tp.add(buttmen).find('.pc').data('mo', this.mo);
		
		
		var song_row_context = this.context.children('.row-song-context');
		var song_context  = new contextRow(song_row_context);
		
		this.files = song_row_context.children('.track-files');
		
		song_context.addPart(this.files, 'files');
		
		song_context.addPart(song_row_context.children('.last-fm-scrobbling'), 'lastfm');
		
		
		tp.find('.lfm-scrobbling-button').click(function(){
			if (!song_context.isActive('lastfm')){
				var p = su.ui.getRtPP(this);
				song_context.show('lastfm', p.left + $(this).outerWidth()/2);
			} else{
				song_context.hide();
			}
		});
		
		song_context.addPart(song_row_context.children('.flash-error'), 'flash-error');
		
		
		tp.find('.flash-secur-button').click(function(){
			if (!song_context.isActive('flash-error')){
				var p = su.ui.getRtPP(this);
				song_context.show('flash-error', p.left + $(this).outerWidth()/2);
			} else{
				song_context.hide();
			}
		});

		this.tidominator = this.context.children('.track-info-dominator');
		var dominator_head = this.tidominator.children('.dominator-head');
		this.a_info = this.tidominator.children('.artist-info');
		this.t_info = this.tidominator.children('.track-info');
		this.tv		= this.t_info.children('.track-video')

		var pl = this.mo.plst_titl,
			pl_type = pl.playlist_type;
			
		if (pl_type != 'artist'){
			$('<a class="js-serv">' + localize('artcard') + '</a>')
				.data('artist', this.mo.artist)
				.appendTo(dominator_head.children('.closer-to-track'))
				.click(function(){
					su.ui.views.showArtcardPage(_this.mo.artist);
					su.track_event('Artist navigation', 'art card', _this.mo.artist);
				});
		}
		
		var users = this.context.children('.track-listeners');
		var users_list = users.children('.song-listeners-list');
		
		
		var users_row_context =  this.context.children('.row-listeners-context');
		var users_context = new contextRow(users_row_context);
		var uinfo_part = users_row_context.children('.big-listener-info');
		users_context.addPart(uinfo_part, 'user-info');
		
		
		var extend_switcher = dominator_head.children('.extend-switcher').click(function(e){
			_this.tidominator.toggleClass('want-more-info');
			e.preventDefault();
		});
		
		var files_cc = $('<div class="files-control"></div>').prependTo(tp.children('.buttons-panel'));
		
		
		
		
		
		var flb = createFilesButton(song_context);
		flb.c.appendTo(files_cc);
		
		
		var dlb = createDownloadButton(this.mo);
		
		dlb.c.appendTo(files_cc);
		
		
		this.files_control= {
			list_button: flb,
			quick_download_button: dlb
		};
		this.t_users= {
			c: users,
			list: users_list
		};
		this.extend_info= {
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
				//su.ui.infoGen(this.files, c, 'files: %s');
				//su.ui.infoGen(this.videos, c, 'video: %s');
				if (c.str){
					this.extend_switcher.find('.big-space').text(c.str);
				}
	
			}
		};
		this.rowcs={
			song_context: song_context,
			users_context: users_context
		};
		this.files_time_stamp = 0;


		var getClickPosition = function(e, node){
			//e.offsetX || 
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};

		var ph  = $('<div class="player-holder"></div>');
		var volume_state = $('<div class="volume-state"></div>').click(function(e){
			var pos = getClickPosition(e, this);
			_this.mo.setVolume((pos/50) * 100);
			var volumeSheet = su.ui.els.volume_s && su.ui.els.volume_s.sheet;
			(volumeSheet.cssRules || volumeSheet.sheet.rules)[0].style.width = pos + 'px';
			
		}).appendTo(ph);;
		$('<div class="volume-state-position"></div>').appendTo(volume_state);

		this.soco_view = new songControlsView();
		ph.append(this.soco_view.getC());
		ph.prependTo(tp);
		this.c
			.prepend(buttmen)
			.append(this.context);
			
			
		
		var pi = this.mo.playable_info; 
		//fixme for userplaylists
		setTimeout(function(){
			_this.mo.makeSongPlayalbe(pi.full_allowing, pi.packsearch, pi.last_in_collection);	
		},100)
		
	},
	die: function(){
		this.remove();
		this.dead = true;
	},
	remove: function(){
		this.c.remove();
	},
	updateSongContext: function(real_need){
		var artist = this.mo.artist;
		
		this.updateSongFiles();

		var a_info = this && this.a_info;
		if (a_info){
			if (artist) {this.update_artist_info(artist, a_info, this.mo.plst_titl.playlist_type != 'artist');}
			this.show_video_info(this.tv, artist + " - " + this.mo.track);
			
			if (real_need){
				this.updateSongListeners();
			}
			
			if (lfm.scrobbling) {
				su.ui.lfm_change_scrobbling(true, this.context.children('.track-panel').find('.track-buttons'));
			}
		} else{
			console.log('no context for:')
			console.log(this.mo)
		}
	},
	createListenersHeader: function(){
		if (this && this.t_users){
			if (!this.t_users.header){
				this.t_users.header = $('<div></div>').text(localize('listeners-looks')).prependTo(this.t_users.c);
			}
		}
	},
	createCurrentUserUI: function(mo, user_info){
		if (this.t_users && !this.t_users.current_user){
			var div = this.t_users.current_user = $('<div class="song-listener current-user-listen"></div>');
			su.ui.createUserAvatar(user_info, div);
			this.t_users.list.append(div);
			return div;
		}
	},
	updateSongListeners: function(){
		var _this = this;
		var last_update = this.t_users.last_update;
		var current_user = su.s.getId();
		
		
		if (this.mo.artist && (!last_update || (new Date - last_update) > 1000 * 60 * 1)){
			var d = {artist: this.mo.artist};
			if (this.mo.track){
				d.title = this.mo.track;
			}
			var current_user = su.s.getId('vk');
			var user_info;
			if (current_user){
				user_info = su.s.getInfo('vk');
				if (user_info){
					_this.createCurrentUserUI(this.mo, user_info);
				}
				_this.createListenersHeader();
				
			}
			su.s.api('track.getListeners', d, function(r){
				var raw_users = r && r.done && [].concat.apply([], r.done);
				if (raw_users){
					var users = $filter(raw_users, 'user', function(value){
						if (value != current_user){
							return true
						}
					});
					if (users.length){
						
						var above_limit_value = 0;
						var uul = $("<ul></ul>");
						for (var i=0; i < r.done.length; i++) {
							if (r.done[i] && r.done[i].length){
								above_limit_value = su.ui.createSongListeners(r.done[i], uul, above_limit_value, current_user, _this.rowcs.users_context);
							}
							
						}; 
						if (_this.t_users.other_users){
							_this.t_users.other_users.remove();
						}
						
						_this.createListenersHeader();
						
						_this.t_users.c.addClass('many-users')
						uul.appendTo(_this.t_users.list);
						_this.t_users.other_users = uul;
					}
				}
				//console.log(r)
				
			});
			this.t_users.last_update = (+new Date);
		}
		
	},
	update_artist_info: function(artist, a_info, show_link_to_artist_page){
		var _this = this;
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
						app_env.openURL(link);
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
				lfm.get('artist.getInfo',{'artist': artist })
					.done(function(r){
						if (a_info.data('artist') == artist && a_info.data('artist-lfm') != true){
							a_info.data('artist-lfm', true);
							_this.show_artist_info(r, ainf, artist);
							
						}
						
					});
			}

		}
		
	},
	show_artist_info: function(r, ainf, oa){
		var _mui = this;
		var info	 = r.artist || false;
		var similars, artist, tags, bio, image, has_some_info_extenders;
		
		if (info) {
			var ai = parseArtistInfo(r);
			
			similars = ai.similars;
			artist	 = ai.artist;
			tags	 = ai.tags;
			bio		 = ai.bio;
			image	 = (ai.images && ai.images[2]) || lfm_image_artist;
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
			var tags_text = $('<span class="desc-text"></span>').appendTo(tags_p).append('<span class="forced-end"></span>');
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
				tags_text.append(" ");
			}
			ainf.meta_info.append(tags_p);
		}
		
		if (similars && similars.length) {
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
			var similars_p = $("<p class='artist-similar'></p>"),
				similars_a = $('<em></em>').append($('<a></a>').append(localize('similar-arts') + ":").attr({ 'class': 'similar-artists js-serv'}).data('artist', artist));	
			$('<span class="desc-name"></span>').append(similars_a).appendTo(similars_p);
			var similars_text = $('<span class="desc-text"></span>').appendTo(similars_p).append('<span class="forced-end"></span>');
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
				similars_text.append(" ");
			}
			ainf.meta_info.append(similars_p);
		}
		
		ainf.bio.parent().removeClass('background-changes');
		if (has_some_info_extenders){
			this.extend_info.base_info = artist;
			this.extend_info.updateUI();
		}
		
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
	showYoutubeVideo: function(id, c, link){
		if (this.video){
			this.hideYoutubeVideo();
		}
		this.video = {
			link: link.addClass('active'),
			node: $(su.ui.create_youtube_video(id)).appendTo(c)
		};
	},
	hideYoutubeVideo: function(){
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
			delete this.video;
		}
	},
	show_video_info: function(vi_c, q){
		if (vi_c.data('has-info')){return true;}

		var _this = this;
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
						
						if (!showed){
							_this.showYoutubeVideo(vid, vi_c, $(this));
							_this.mo.pause();
							this.showed = true;
						} else{
							_this.hideYoutubeVideo();
							_this.mo.play();
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
				
				//set up filter app$control.yt$state.reasonCode != limitedSyndication
				for (var i=0, l = Math.min(vs.length, 3); i < l; i++) {
					var _v = vs[i],
						tmn = _v['media$group']['media$thumbnail'][0].url,
						v_id = _v['media$group']['yt$videoid']['$t'],
						v_title = _v['media$group']['media$title']['$t'];
						
					make_v_link(tmn, v_id, v_title);
					
				};
				if (l){
					_this.extend_info.videos = l;
					_this.extend_info.updateUI();
				}
				
				v_content.appendTo(vi_c);
				
				
			}
		});
		
	},
	updateSongFiles: function(ext_info){
		var ext_info = this.extend_info;
		if (this.mo.wheneWasChanged() > this.files_time_stamp){
		
			var c = this.files;
			c.empty();

			var songs = this.mo.songs();

			if (this.mo.isSearchCompleted() && this.mo.isNeedsAuth('vk')){
				
				var vklc = this.rowcs.song_context.getC();
				var oldvk_login_notify = this.vk_login_notify;
				if (!songs.length){
					this.vk_login_notify = su.ui.samples.vk_login.clone();
				} else if(!this.mo.isHaveAnyResultsFrom('vk')){
					this.vk_login_notify = su.ui.samples.vk_login.clone( localize('to-find-better') + " " +  localize('music-files-from-vk'));
				} else {
					this.vk_login_notify = su.ui.samples.vk_login.clone(localize('stabilization-of-vk'));
					
				}
				if (oldvk_login_notify){
					oldvk_login_notify.remove();
				}
				if (this.vk_login_notify){
					vklc.after(this.vk_login_notify);
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
					var b = su.ui.createFilesList(songs[i], this.mo);
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
				if (songs_counter > 1){
					this.files_control.list_button.enable();
				}
				
			} 
			
			var downloads = this.mo.mp3Downloads();
			if (downloads){
				this.files_control.quick_download_button.enable();
			}
			
			
			
			if (false && this.mo.isSearchCompleted() && !this.mo.isHaveAnyResultsFrom('soundcloud')){
				desc.append('<p>try to connect soundcloud search</p>')
			}
			this.files_time_stamp = +new Date();
		}
	}
});