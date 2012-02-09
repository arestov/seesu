



var songUI = function(mo, complex){
	this.init();
	this.md = mo;
	this.c = $('<li></li>').data('mo', mo);
	this.rowcs = {};
	this.createBase();

	this.setModel(mo);
};
songUI.prototype = new suServView();

cloneObj(songUI.prototype, {
	constructor: songUI,
	appendChildren: function() {
		//this.expand();
	},
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
		"can-expand": function() {
			this.expand();
		},
		files_search: function(opts){
			if (opts.complete){
				if (!opts.have_tracks){
					this.node.addClass('search-mp3-failed').removeClass('waiting-full-render');
				}
			}
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
				this.node
					.addClass('song')
					.removeClass('search-mp3-failed')
					.removeClass('waiting-full-render')
					.removeClass('mp3-download-is-not-allowed')
			
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
		},
		'song-title': function(title) {
			this.titlec.text(title);
		}
	},
	markAsPlaying: function(){
		this.c.addClass('playing-song');
	},
	unmarkAsPlaying: function(){
		this.c.removeClass('playing-song');
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
		this.c.removeClass('viewing-song');
		
		this.hideYoutubeVideo();

		for (var a in this.rowcs) {
			this.rowcs[a].hide();
		};
		//this.tidominator.removeClass('want-more-info');
		
		
		su.ui.hidePopups();
		this.md.mf_cor.collapseExpanders();
	},
	activate: function(opts){
		this.expand();
		this.updateSongListeners();
		this.c.addClass('viewing-song');
	},
	parts_builder: {
		context: function() {
			return su.ui.samples.track_c.clone(true);
		},
		tidominator: function() {
			var tidominator = this.requirePart('context').children('.track-info-dominator');
			this.watchState('mp-show', function(nv, ov) {
				if (!nv){
					this.getPart('tidominator').removeClass('want-more-info');
				}
			});
			return tidominator;
		},
		tp: function() {
			var context = this.requirePart('context');
			var tp = context.children('.track-panel');

			tp.find('.pc').data('mo', this.md);
			if (lfm.scrobbling) {
				su.ui.lfm_change_scrobbling(true, tp.find('.track-buttons'));
			}
			return tp;
		},
		song_row_context: function() {
			var tp = this.requirePart('tp');

			var context = this.requirePart('context');
				
			var song_row_context = context.children('.row-song-context');
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
			
			this.rowcs.song_context = song_context;
			return song_row_context;
		}
	},
	createBase: function(){
		var _this = this;
		this.node = $("<a></a>")
			.addClass('track-node waiting-full-render')
			.data('mo', this.md)
			.click(function(){
				var mo = _this.md;
				if (mo.player){
					mo.player.wantSong(mo);
				}
				if (mo.plst_titl.lev){
					mo.plst_titl.lev.freeze()
				}
				
				mo.view();
				return false;
			});
		
		var buttmen = su.ui.els.play_controls.node.clone(true).data('mo', this.md);
			buttmen.find('.pc').data('mo', this.md);
		this.c.prepend(buttmen);

		this.titlec = $("<span></span>").appendTo(this.node);
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

		var context = this.requirePart('context');

		this.requirePart('song_row_context');
		
		var tp = this.requirePart('tp');

		this.appendModelTo(this.md.mf_cor, function(ui_c){
			context.prepend(ui_c);
		});

		this.requirePart('song_row_context');
		
		
		


		//
		var tidominator = this.requirePart('tidominator');
		//this.tidominator = this.context.children('.track-info-dominator');
		var dominator_head = tidominator.children('.dominator-head');
		this.a_info = tidominator.children('.artist-info');
		this.t_info = tidominator.children('.track-info');
		this.tv		= this.t_info.children('.track-video')

		var pl = this.md.plst_titl,
			pl_type = pl.playlist_type;
			
		if (pl_type != 'artist'){
			$('<a class="js-serv">' + localize('artcard') + '</a>')
				.data('artist', this.md.artist)
				.appendTo(dominator_head.children('.closer-to-track'))
				.click(function(){
					su.ui.views.showArtcardPage(_this.md.artist);
					su.track_event('Artist navigation', 'art card', _this.md.artist);
				});
		}
		
		var users = context.children('.track-listeners');
		var users_list = users.children('.song-listeners-list');
		
		
		var users_row_context =  context.children('.row-listeners-context');
		var users_context = new contextRow(users_row_context);
		var uinfo_part = users_row_context.children('.big-listener-info');
		users_context.addPart(uinfo_part, 'user-info');
		
		
		var extend_switcher = dominator_head.children('.extend-switcher').click(function(e){
			tidominator.toggleClass('want-more-info');
			e.preventDefault();
		});
		
		
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
		
		this.rowcs.users_context = users_context;

		this.files_time_stamp = 0;


		var getClickPosition = function(e, node){
			//e.offsetX || 
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};


		var tbus = tp.find('.track-buttons');

		var volume_state = $('<div class="volume-state"></div>').click(function(e){
			var pos = getClickPosition(e, this);
			_this.md.setVolume((pos/50) * 100);
			var volumeSheet = su.ui.els.volume_s && su.ui.els.volume_s.sheet;
			(volumeSheet.cssRules || volumeSheet.sheet.rules)[0].style.width = pos + 'px';
			
		});
		$('<div class="volume-state-position"></div>').appendTo(volume_state);


		tbus.before(volume_state)

		this.c.append(context);
			
	

		this.updateSongContext(true);

		
	},
	die: function(){
		this.remove();
		this.dead = true;
	},
	remove: function(){
		this.c.remove();
	},
	updateSongContext: function(){
		var artist = this.md.artist;
		var a_info = this && this.a_info;
		if (a_info){
			if (artist) {this.update_artist_info(artist, a_info, this.md.plst_titl.playlist_type != 'artist');}
			this.show_video_info(this.tv, artist + " - " + this.md.track);
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
		
		
		if (this.md.artist && (!last_update || (new Date - last_update) > 1000 * 60 * 1)){
			var d = {artist: this.md.artist};
			if (this.md.track){
				d.title = this.md.track;
			}
			var current_user = su.s.getId('vk');
			var user_info;
			if (current_user){
				user_info = su.s.getInfo('vk');
				if (user_info){
					_this.createCurrentUserUI(this.md, user_info);
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
							_this.md.pause();
							this.showed = true;
						} else{
							_this.hideYoutubeVideo();
							_this.md.play();
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
		
	}
});