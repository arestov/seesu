var songUI = function(){};

suServView.extendTo(songUI, {
	init: function(md) {
		this._super();
		this.md = md;
		this.rowcs = {};
		this.createBase();
		this.setModel(md);
	
		return this;
	},
	appendChildren: function() {
		//this.expand();
	},
	state_change : {
		"mp-show": function(opts, old_opts) {
			if (opts){
				$(su.ui.els.slider).addClass("show-zoom-to-track");
				this.activate();
			} else if (old_opts) {
				$(su.ui.els.slider).removeClass("show-zoom-to-track");
				this.deactivate();
			}
			
			var tidominator = this.getPart('tidominator');
			if (tidominator && !opts){
				tidominator.removeClass('want-more-info');
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
		"can-expand": function(state) {
			if (state){
				this.expand();
			}
			
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
			this.node.attr("title", title);
		}
	},
	markAsPlaying: function(){
		this.c.addClass('playing-song');
	},
	unmarkAsPlaying: function(){
		this.c.removeClass('playing-song');
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
			
		this.md.traackrow.hideAll();
		
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
			return this.requirePart('context').children('.track-info-dominator');
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
				if (mo.plst_titl.lev){
					mo.plst_titl.lev.freeze()
				}
				
				mo.view(false, true);
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

		this.md.traackrow.getFreeView(false, context.children('.song-actions'));


		this.mf_cor_view = this.md.mf_cor.getFreeView();
		if (this.mf_cor_view){
			var mf_cor_view_c = this.mf_cor_view.getC();
			this.addChild(this.mf_cor_view);
			context.prepend(mf_cor_view_c);
			this.mf_cor_view.appended(this);
			//fixme - remove link to view (this.mf_cor_view) when dieing 
		
		}
		
		
		


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
					su.views.showArtcardPage(_this.md.artist);
					su.track_event('Artist navigation', 'art card', _this.md.artist);
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
				
				su.ui.infoGen(this.base_info, c, localize("more-ab-info"));
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

			
			lfm.get('artist.getInfo',{'artist': artist })
				.done(function(r){
					_this.show_artist_info(r, this.ainf, artist);

				});

			lfm.get('artist.getImages',{'artist': artist })
				.done(function(r){
					var images = r.images.image;
					if (images){
						images = toRealArray(images);
						_this.photo_data.cool_photos = images;
						
						if (images.length){
							var fragment = document.createDocumentFragment();

							//var shuffled_images = [images.shift()];

							//shuffled_images.push.apply(shuffled_images, shuffleArray(images));

							var appendImage = function(el, first_image) {
								var sizes = toRealArray(el.sizes.size);

								var image_jnode = $('<img class="artist-image hidden" alt=""/>');
								su.lfm_imgq.add(function(){
									loadImage({
										node: image_jnode[0],
										url: (sizes[5] || sizes[0])["#text"],
										timeout: 40000
									}).done(function(){
										if (first_image && _this.first_image){
											_this.first_image.remove();
										}
										image_jnode.removeClass("hidden");
									}).fail(function(){
										image_jnode.remove();
									})
								});

								
								fragment.appendChild(image_jnode[0]);
								
							};
							if (images[0]){
								appendImage(images[0], true);
							}
							$.each(images.slice(1, 10), function(i, el){
								appendImage(el);
							});
							_this.photo_c.append(fragment);
						}
						
					}

				});
			

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
			this.ainf.bio.parent().addClass('background-changes');
			if (su.env.opera_widget){
				image += '?somer=' + Math.random();
			}
			if (!this.photo_data.cool_photos){
				this.first_image = $('<img class="artist-image"/>').attr({'src': image ,'alt': artist});
				this.photo_c.append(this.first_image);
			}
			
		} else{
			return false
		}
		if (bio){
			this.ainf.bio.html(bio);
			this.ainf.bio.append('<span class="forced-end"></span>');
			if (!has_some_info_extenders){
				has_some_info_extenders = true;
			}
		}
		
		
		
		
		
		if (tags && tags.length) {
			var tags_p = $("<p class='artist-tags'></p>").append('<span class="simple-header"><em>'+localize('Tags')+':</em></span>');
			var tags_text = $('<span class=""></span>').appendTo(tags_p).append('<span class="forced-end"></span>');
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
			this.dominator_head.append(tags_p);
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
			this.ainf.meta_info.append(similars_p);
		}
		
		this.ainf.bio.parent().removeClass('background-changes');
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
	hideYoutubeVideo: function(){
		if (this.mf_cor_view){
			this.mf_cor_view.hideYoutubeVideo();
		}
		
	}
});