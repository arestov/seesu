var songUI = function(){};

provoda.View.extendTo(songUI, {
	createDetailes: function(){
		this.rowcs = {};
		this.createBase();
	},
	complex_states: {
		'mp-show-end': {
			depends_on: ['map-animating', 'vis-mp-show', 'mp-show'],
			fn: function(anim, vis_mp_show, mp_show) {
				if (anim) {
					if (vis_mp_show && anim == vis_mp_show.anid){
						return vis_mp_show.value;
					} else {
						return false;
					}
					
				} else {
					return mp_show
				}
			}
		},
		'has-info-exts': {
			depends_on: ['artist', 'playcount', 'listeners', 'bio', 'similars'],
			fn: function(artist, playcount, listeners, bio, similars) {
				if (playcount || listeners || bio || similars){
					return artist;
				}
			}
		},
		'usable-artist-image': {
			depends_on: ['artist-image', 'vis-cool_photos'],
			fn: function(img, cph) {
				if (!cph){
					return !!img && img
				} else {
					return false;
				}
			}
		},
	},
	state_change : {
		"mp-show-end": function(opts) {
			if (opts){
				if (this.img_panorama){
					this.img_panorama.checkSize();
				}
			}
		},

		"mp-show": function(opts, old_opts) {
			if (opts){
				this.parent_view.c.addClass("show-zoom-to-track");
				this.activate();
			} else if (old_opts) {
				this.parent_view.c.removeClass("show-zoom-to-track");
				this.deactivate();
			}
			
			var tidominator = this.getPart('tidominator');
			if (tidominator && !opts){
				tidominator.removeClass('want-more-info');
			}
		},
		want_to_play: function(state, oldstate){
			if (state){
				this.node.addClass('marked-for-play');
			} else if (oldstate){
				this.node.removeClass('marked-for-play');
			}
		},
		"can-expand": function(state) {
			if (state){
				this.expand();
			}
			
		},
		files_search: function(opts){
			this.fsearch_status_c.attr('class', 'song-files-search-status');
			if (opts.complete && !opts.have_tracks){
				this.node.addClass('search-mp3-failed').removeClass('waiting-full-render');
				if (!opts.have_tracks){
					
				}
				this.fsearch_status_c.addClass('has-none-files');

			} else if (opts.have_best_tracks){
				this.fsearch_status_c.addClass('has-best-files');
			} else if (opts.have_tracks){
				this.fsearch_status_c.addClass('has-some-files');
			}

			
		},
		'searching-files': function(searching){
			this.node.toggleClass('search-mp3', searching);
		
		},
		'track-name-loading': function(state) {
			this.node.toggleClass('track-name-loading', state);
		},
		"player-song": function(state) {
			this.c.toggleClass('player-song', !!state);
		},
		play: function(state, oldstate){
			if (state == 'play'){
				this.hideYoutubeVideo();
			}
			this.c.toggleClass('playing-song', !!state);
			this.player_song_mark.toggleClass('playing-process', state == 'play');
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
		'artist': function(name) {
			this.artist_name_c.text(name);
		},
		'track': function(name) {
			this.titlec.toggleClass('has-no-track-title', !name);
			
			this.track_name_c.text(name);
		},
		'song-title': function(title) {
			//this.titlec.text(title);
			this.node.attr("title", title);
		},
		'song-image': function(url) {
			this.song_imagec.empty();
			if (url){
				$('<img/>')
					.attr({
						src: url,
						alt: this.state('artist')
					})
					.appendTo(this.song_imagec);
			}
			
		},
	},
	unmark: function(){
		this.c.removeClass('to-play-next to-play-previous');
		
	},
	markAs: function(statev){
	
		switch (statev) {
			case 'next':
				this.c.addClass('to-play-next');
				break
			case 'prev':
				this.c.addClass('to-play-previous');
				break
			default:
		}

		
	},
	deactivate: function(opts){
		this.c.removeClass('viewing-song');
		
		this.hideYoutubeVideo();

		for (var a in this.rowcs) {
			this.rowcs[a].hide();
		};
		//this.tidominator.removeClass('want-more-info');


		this.getMdChild('actionsrow').hideAll();
		this.getMdChild('mf_cor').collapseExpanders();
	},
	children_views: {
		actionsrow: TrackActionsRowUI,
		mf_cor: mfCorUI
	},
	activate: function(opts){
		this.expand();
		this.setImagesPrio();
		this.updateSongListeners();
		this.c.addClass('viewing-song');
		
	},
	setImagesPrio: function(){
		if (this.img_load_stack){
			for (var i = this.img_load_stack.length - 1; i >= 0; i--) {
				this.img_load_stack[i].setPrio("highest");
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
			this.photo_data.first_image = ai.images;

		} 
			
		if (artist && artist == oa) {
			
			
		} else{
			return false
		}

		
		//$(document.createDocumentFragment());//$(document.createTextNode(""));

		if (listeners){
		
			
		}
		if (playcount){
			
		}

		if (playcount || listeners){
			
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
		}

		if (bio){
			
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
		}
		
		
		
		
		
		if (tags && tags.length) {
			
		}
		
		if (similars && similars.length) {
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
			
		}
		
		if (has_some_info_extenders){
			
		}
		
	},
	'stch-bio': {
		fn: function(bio) {
			if (bio){
				this.ainf.bio.empty();
				this.ainf.bio.html(bio);
				this.ainf.bio.append('<span class="forced-end"></span>');
			}
			
		},
		dep_vp: ['artist-info']
	},
	'stch-listeners': {
		fn: function(state) {
			this.listeners_text_c.text(state || '');
			this.getPart('listeners-c').toggleClass('hidden', !state);
			//

		},
		dep_vp: ['listeners-c']
	},
	'stch-playcount': {
		fn: function(state) {
			this.playcount_text_c.text(state || '');
			this.getPart('playcount-c').toggleClass('hidden', !state);
		},
		dep_vp: ['playcount-c']
	},
	'stch-tags': {
		fn: function(state) {
			var tags = state;
			var tags_c = this.getPart('tags-c');
			if (state && state.length){
				for (var i=0, l = tags.length; i < l; i++) {
					var tag = tags[i],
						arts_tag_node = $("<a></a>")
							.text(tag.name)
							.attr({ 
								href: tag.url,
								'class': 'music-tag js-serv'
							})
							.data('music_tag', tag.name)
							.appendTo(this.tags_text_c); //!using in DOM
					this.tags_text_c.append(" ");
				}

			} else {

			}
			tags_c.toggleClass('hidden', !(state && state.length));
		},
		dep_vp: ['tags-c']
	},
	'stch-similars': {
		fn: function(state) {
			var similars = state;
			var similars_c = this.getPart('similars-c');
			if (state && state.length){
				for (var i=0, l = similars.length; i < l; i++) {
					var similar = similars[i],
						arts_similar_node = $("<a class='js-serv'></a>")
						  .text(similar.name)
						  .attr({ 
							href: similar.url, 
							'class' : 'artist js-serv' 
						  })
						  .data('artist', similar.name )
						  .appendTo(this.similars_text_c);//!using in DOM
					this.similars_text_c.append(" ");
				}
			}
			similars_c.toggleClass('hidden', !(state && state.length));

		},
		dep_vp: ['similars-c']
	},
	
	'stch-usable-artist-image': {
		fn: function(state) {
			if (state){
				if (su.env.opera_widget){
					state += '?somer=' + Math.random();
				}
				if (!this.photo_data.cool_photos){
					this.first_image = $('<img class="artist-image"/>').attr({'src': state ,'alt': this.state('artist')});
					this.photo_c.append(this.first_image);
				}
			}
			
		},
		dep_vp: ['artist-info']
	},
	'stch-has-info-exts': {
		fn: function(state) {
			if (state){
				this.extend_info.base_info = state; //artist name;
				this.extend_info.updateUI();
			}
		},
		dep_vp: ['artist-info']
	},
	parts_builder: {
		context: function() {
			return this.root_view.samples.track_c.clone(true);
		},
		tidominator: function() {
			return this.requirePart('context').children('.track-info-dominator');
		},
		'artist-stat-c': function() {
			return $('<p class="artist-stat-in-song"></p>');
		},
		'tags-c': function() {
			var tags_p = $("<p class='artist-tags hidden'></p>").append('<span class="simple-header"><em>'+localize('Tags')+':</em></span>');
			this.tags_text_c = $('<span class=""></span>').appendTo(tags_p).append('<span class="forced-end"></span>');
			
			return tags_p;
			
		},
		'similars-c': function() {
			var similars_p = $("<p class='artist-similar hidden'></p>"),
				similars_a = $('<em></em>').append($('<a></a>').append(localize('similar-arts') + ":").attr({ 'class': 'similar-artists js-serv'}).data('artist', this.state('artist')));	
			$('<span class="desc-name"></span>').append(similars_a).appendTo(similars_p);
			this.similars_text_c = $('<span class="desc-text"></span>').appendTo(similars_p).append('<span class="forced-end"></span>');
			
			return similars_p;
		},
		'playcount-c': function() {
			var playcount_c = $('<span class="hidden"></span>');

			$('<span class="desc"></span>').text('Playcount: ').appendTo(playcount_c);
			this.playcount_text_c = $('<span></span>').appendTo(playcount_c);
			playcount_c.append(" ");
			return playcount_c;
		},
		'listeners-c': function() {

			var listeners_c = $('<span class="hidden"></span>');

			$('<span class="desc"></span>').text('Listeners: ').appendTo(listeners_c);
			this.listeners_text_c =  $('<span></span>').appendTo(listeners_c);
			listeners_c.append(" ");
			return listeners_c;

		},	
		'artist-info': function() {
			var stat_c = this.requirePart('artist-stat-c');
			this.requirePart('listeners-c').appendTo(stat_c);
			this.requirePart('playcount-c').appendTo(stat_c);
			this.ainf.c.prepend(stat_c);


			var tags_p = this.requirePart('tags-c');
			this.dominator_head.append(tags_p);

			var similars_p = this.requirePart('similars-c');
			this.ainf.meta_info.append(similars_p);
			return true;
		}
	},
	createBase: function(){
		var _this = this;
		this.c = $('<li></li>').data('mo', this.md);
		

		this.node = $("<a></a>")
			.addClass('track-node waiting-full-render')
			.data('mo', this.md)
			.click(function(){
				var mo = _this.md;
				if (mo.player){
					mo.player.wantSong(mo);
				}

				mo.view(false, true);
				return false;
			});
		
		//
		this.player_song_mark = $('<span class="playing-song-mark"></span>').appendTo(this.node);
		var buttmen = this.root_view.els.play_controls.node.clone(true).data('mo', this.md);
			buttmen.find('.pc').data('mo', this.md);
		this.c.prepend(buttmen);

		this.song_imagec = $('<span class="song-image-con"></span>').appendTo(this.node);


		this.titlec = $('<span class="full-song-title has-no-track-title"></span>')
			.appendTo(this.node);
		this.fsearch_status_c = $('<span class="song-files-search-status"></span>').appendTo(this.titlec);

		$('<span class="nothing-toy"></span>').appendTo(this.titlec);

		
		this.track_name_c = $('<span class="song-track-name"></span>')
			.appendTo(this.titlec);
		this.artist_name_c = $('<span class="song-artist-name"></span>')
			.appendTo(this.titlec);
		

		$('<span class="placeholder-decor"></span>').appendTo(this.node);
	//	this.node.ap

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

		this.song_actions_c =  context.children('.song-actions');


		var actionsrow = this.getMdChild('actionsrow')
		var track_row_view = this.getFreeChildView('actionsrow', actionsrow);




		context.prepend(this.getAFreeCV('mf_cor'));
		
		
		
		


		//
		var tidominator = this.requirePart('tidominator');
		//this.tidominator = this.context.children('.track-info-dominator');
		this.dominator_head = tidominator.children('.dominator-head');
		this.a_info = tidominator.children('.artist-info');
		this.t_info = tidominator.children('.track-info');
		this.tv		= this.t_info.children('.track-video')

		var pl = this.md.plst_titl,
			pl_type = pl.playlist_type;
		
		var artist_link_con = this.dominator_head.children('.closer-to-track');
		
		if (pl_type == 'artist'){
			artist_link_con.addClass('one-artist-playlist');
		}

		$('<a class="js-serv">' + localize('artcard') + '</a>')
				.data('artist', this.md.artist)
				.appendTo(artist_link_con)
				.click(function(){
					su.showArtcardPage(_this.md.artist);
					su.trackEvent('Artist navigation', 'art card', _this.md.artist);
				});

		
			

		
		var users = context.children('.track-listeners');
		var users_list = users.children('.song-listeners-list');
		
		
		var users_row_context =  context.children('.row-listeners-context');
		var users_context = new contextRow(users_row_context);
		var uinfo_part = users_row_context.children('.big-listener-info');
		users_context.addPart(uinfo_part, 'user-info');
		
		
		var extend_switcher = this.dominator_head.children('.extend-switcher').click(function(e){
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
				
				su.infoGen(this.base_info, c, localize("more-ab-info"));
				//su.ui.infoGen(this.files, c, 'files: %s');
				//su.ui.infoGen(this.videos, c, 'video: %s');
				if (c.str){
					this.extend_switcher.find('.big-space').text(c.str);
				}
	
			}
		};
		
		this.rowcs.users_context = users_context;



		var getClickPosition = function(e, node){
			//e.offsetX || 
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};


		this.c.append(context);
			
	

		this.updateSongContext(true);
		
		this.requestAll();
	},
	die: function(){
		this.remove();
		this.dead = true;
	},
	remove: function(){
		this.c && this.c.remove();
	},
	updateSongContext: function(){
		var artist = this.md.artist;
		var a_info = this && this.a_info;
		if (a_info){
			if (artist) {this.update_artist_info(artist, a_info, this.md.plst_titl.playlist_type != 'artist');}
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
			this.root_view.createUserAvatar(user_info, div);
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
								above_limit_value = _this.root_view.createSongListeners(r.done[i], uul, above_limit_value, current_user, _this.rowcs.users_context);
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
		if (artist && !this.has_artist_info){
			this.has_artist_info = true;
			this.ainf = {
				bio: a_info.children('.artist-bio'),
				meta_info: a_info.children('.artist-meta-info'),
				c : a_info
			};
						
			this.ainf.bio.text('...');
			this.ainf.meta_info.empty();
			
			var tidominator = this.requirePart('tidominator');
			this.photo_c = tidominator.find('.photo-cont-lift');
			this.photo_data = {};

			this.requirePart('artist-info');


			var images_request = lfm.get('artist.getImages',{'artist': artist })
				.done(function(r){
					if (!_this.isAlive()){
						return
					}
					var images = r.images.image;
					if (images){
						images = toRealArray(images);
						_this.setVisState('cool_photos', true);//cool_photos
						_this.photo_data.cool_photos = images;
						
						if (images.length){
							var fragment = document.createDocumentFragment();

							//var shuffled_images = [images.shift()];

							//shuffled_images.push.apply(shuffled_images, shuffleArray(images));
							_this.img_load_stack = [];
							_this.img_requests = [];
							_this.img_panorama = new Panoramator();
							var main_c = _this.photo_c.parent()
				
							_this.img_panorama.init({
								viewport: main_c, 
								lift: _this.photo_c,
								onUseEnd: function(){
									seesu.trackEvent('Panoramator', 'artist photos');
								}
							});

							var my_window = getDefaultView(_this.getC()[0].ownerDocument);
							
							var checkPanoramaSize = function(){
								_this.img_panorama.checkSize();
							};

							$(my_window).on('resize', checkPanoramaSize);

							_this.onDie(function(){
								$(my_window).off('resize', checkPanoramaSize);
							});

							var images_collection = [];

							var updatePanorama = function(){
								images_collection.sort(function(a, b){
									return sortByRules(a, b, ['num']);
								});

								_this.img_panorama.setCollection($filter(images_collection, 'item'));
							}

							var appendImage = function(el, index, first_image) {
								var sizes = toRealArray(el.sizes.size);

								var image_jnode = $('<img class="artist-image hidden" alt=""/>');
								var req = loadImage({
									node: image_jnode[0],
									url: (sizes[5] || sizes[0])["#text"],
									timeout: 40000,
									queue: su.lfm_imgq,
									cache_allowed: true
								}).done(function(){
									if (first_image && _this.first_image){
										_this.first_image.remove();
									}
									

									image_jnode.removeClass("hidden");

									images_collection.push({
										num: index,
										item: image_jnode
									});

									updatePanorama();
								}).fail(function(){
									image_jnode.remove();
								});
								/*
								su.lfm_imgq.add(function(){
									
								});*/

								if (req.queued) {
									_this.img_load_stack.push(req.queued);
								}
								_this.img_requests.push(req);
								

								
								fragment.appendChild(image_jnode[0]);
								
							};
							if (images[0]){
								appendImage(images[0], 0, true);
							}
							$.each(images.slice(1, 10), function(i, el){
								appendImage(el, i + 1);
							});
							_this.photo_c.append(fragment);
							if (_this.state("mp-show")){
								_this.setImagesPrio();
							}
							main_c.addClass('loading-images');

							$.when.apply($, _this.img_requests).always(function(){
								main_c.removeClass('loading-images');
							});
							_this.img_panorama.checkSize();
							

						}
						
					}

				});
			if (this.state("mp-show")){
				images_request.queued && images_request.queued.setPrio('highest');
			}

		}
		
	},
	
	hideYoutubeVideo: function(){
		if (this.mf_cor_view){
			this.mf_cor_view.hideYoutubeVideo();
		}
		
	}
});