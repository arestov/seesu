var songUI = function(){};

provoda.View.extendTo(songUI, {
	dom_rp: true,
	createDetailes: function(){
		this.rowcs = {};
		this.createBase();
		this.photo_data = {};
		this.dom_related_props.push('photo_data');
	},
	complex_states: {
		'mp_show_end': {
			depends_on: ['map_animating', 'vis_mp_show', 'mp_show'],
			fn: function(anim, vis_mp_show, mp_show) {
				if (anim) {
					if (vis_mp_show && anim == vis_mp_show.anid){
						return vis_mp_show.value;
					} else {
						return false;
					}
				} else {
					return mp_show;
				}
			}
		},
		'infb_text': {
			depends_on: ['artist', 'playcount', 'listeners', 'bio', 'similars'],
			fn: function(artist, playcount, listeners, bio, similars) {
				if (!artist){
					return;
				}
				if (playcount || listeners || bio || similars){
					return localize("more-ab-info").replace('%s', artist);
				}
			}
		},
		'usable_artist_image': {
			depends_on: ['artist_image', 'vis_cool_photos'],
			fn: function(img, cph) {
				if (!cph){
					var postfix = '';
					if (su.env.opera_widget){
						postfix = '?somer=' + Math.random();
					}
					return !!img && (img + postfix);
				} else {
					return false;
				}
			}
		}
	},
	state_change : {
		"mp_show_end": function(opts) {
			if (opts){
				if (this.img_panorama){
					this.img_panorama.checkSize();
				}
			}
		},

		"mp_show": function(opts, old_opts) {
			if (opts){
			//	this.parent_view.c.addClass("show-zoom-to-track");
				this.activate();
			} else if (old_opts) {
			//	this.parent_view.c.removeClass("show-zoom-to-track");
				this.deactivate();
			}
			var tidominator = this.tpl.ancs['tidmt'];
			if (tidominator && !opts){
				tidominator.removeClass('want-more-info');
			}
		},

		"can_expand": function(state) {
			if (state){
				this.expand();
			}
		}
	},

	deactivate: function(opts){
		for (var a in this.rowcs) {
			this.rowcs[a].hide();
		}

		var acts_row = this.getMdChild('actionsrow');
		if (acts_row) {
			acts_row.hideAll();
		}

		this.getMdChild('mf_cor').collapseExpanders();
	},
	children_views: {
		actionsrow: TrackActionsRowUI,
		mf_cor: mfCorUI
	},
	activate: function(opts){
		this.expand();
		this.updateSongListeners();
	},
	'stch-bio': function(bio) {
		var bioc = this.tpl.ancs['artbio'];
		if (!bioc){
			return;
		}
		if (bio){
			bioc.empty();
			bioc.html(bio);
			this.root_view.bindLfmTextClicks(bioc);
			bioc.append('<span class="forced-end"></span>');
		} else {

		}
	},
	tpl_r_events: {
		'tags': {
			showTag: function(e, scope){
				e.preventDefault();
				this.RPCLegacy('showTag', scope.tag.name);
			},
			showArtcardPage: function(e, scope) {
				e.preventDefault();
				this.RPCLegacy('showArtcardPage', scope.artist.name);
			}
		}
	},
	tpl_events: {
		
	},
	'stch-tags': function(state) {
		var _this = this;
		setTimeout(function() {
			var nodes = spv.filter(_this.tpl.pv_repeats.tags || [], 'root_node');
			for (var i = 0; i < nodes.length; i++) {
				var node = $(nodes[i]);
				node.after(document.createTextNode(' '));
				_this.addWayPoint(node, {
					simple_check: true
				});
			}
		},100);
	},
	'stch-similars': function(state) {
		var _this = this;
		setTimeout(function() {
			var nodes = spv.filter(_this.tpl.pv_repeats.similars || [], 'root_node');
			for (var i = 0; i < nodes.length; i++) {
				var node = $(nodes[i]);
				node.after(document.createTextNode(' '));
				_this.addWayPoint(node, {
					simple_check: true
				});
			}
		},100);
	},
	parts_builder: {
		context: function() {
			return this.root_view.getSample('track_c');
		}
	},
	createBase: function(){
		var _this = this;
		this.c = this.root_view.getSample('song-view');
		//window.dizi = sonw;
		//this.tpl = this.getTemplate(sonw);
		if (!(this.opts && this.opts.lite)){
			var context = this.requirePart('context');
			this.c.append(context);
			this.createTemplate();
			//this.bigBind();
		} else {
			this.createTemplate();
		}

		this.tpl.ancs['song-link'].click(function(){
			_this.RPCLegacy('wantSong');
			_this.RPCLegacy('showOnMap');
			return false;
		});
		this.canUseDeepWaypoints = function() {
			return !(_this.opts && _this.opts.lite) && !!_this.state('mp_show');
		};
		this.addWayPoint(this.tpl.ancs['song-link'], {
			canUse: function() {
				return (_this.opts && _this.opts.lite) || !_this.state('mp_show');
			}
		});

	},
	expand: function(){
		if (this.opts && this.opts.lite){
			return false;
		}
		if (this.expanded){
			return true;
		} else{
			this.expanded = true;
		}

		var _this = this;
		this.tpl.ancs['artcard-link'].click(function(){
			_this.RPCLegacy('showArtcardPage');
		});
		this.addWayPoint(this.tpl.ancs['artcard-link'], {});
		this.tpl.ancs['similar-a'].click(function() {
			_this.RPCLegacy('showArtistSimilarArtists');
		});
		this.addWayPoint(this.tpl.ancs['similar-a'], {simple_check: true});

		var context = this.requirePart('context');

		this.song_actions_c =  this.tpl.ancs['song-actions'];

		this['collch-actionsrow'] = true;
		this.checkCollectionChange('actionsrow');

	//	var actionsrow = this.getMdChild('actionsrow');
	//	var track_row_view = this.getFreeChildView({name: 'actionsrow'}, actionsrow);
		context.prepend(this.getAFreeCV('mf_cor'));
		//
		var tidominator = this.tpl.ancs['tidmt'];

		var users = this.tpl.ancs['track-listeners'];
		var users_list = this.tpl.ancs['song-listeners-list'];


		var users_row_context =  this.tpl.ancs['row-listeners-context'];
		var users_context = new contextRow(users_row_context);
		var uinfo_part = this.tpl.ancs['big-listener-info'];
		users_context.addPart(uinfo_part, 'user_info');


		var extend_switcher = this.tpl.ancs['extend-switcher'].click(function(e){
			tidominator.toggleClass('want-more-info');
			e.preventDefault();
		});
		this.addWayPoint(extend_switcher, {

		});

		this.t_users= {
			c: users,
			list: users_list
		};

		this.rowcs.users_context = users_context;
		this.dom_related_props.push('a_info', 't_info', 'dominator_head', 'song_actions_c', 'rowcs', 'extend_info', 't_users');
		this.requestAll();
	},

	createListenersHeader: function(){
		if (this && this.t_users){
			if (!this.t_users.header){
				this.t_users.header = $('<div></div>').text(localize('listeners-looks')).prependTo(this.t_users.c);
			}
		}
	},
	createCurrentUserUI: function(user_info){
		if (this.t_users && !this.t_users.current_user){
			var div = this.t_users.current_user = $('<div class="song-listener current-user-listen"></div>');
			this.root_view.createUserAvatar(user_info, div);
			this.t_users.list.append(div);
			return div;
		}
	},
	updateSongListeners: function(){
		if (!this.expanded){
			return;
		}
		var _this = this;
		var last_update = this.t_users.last_update;
		//var current_user = su.s.getId();

		var artist = this.state('artist');
		if (artist && (!last_update || (new Date() - last_update) > 1000 * 60 * 1)){
			var d = {artist: artist};
			if (this.state('track')){
				d.title = this.state('track');
			}
			var current_user = su.s.getId('vk');
			var user_info;
			if (current_user){
				user_info = su.s.getInfo('vk');
				if (user_info){
					_this.createCurrentUserUI(user_info);
				}
				_this.createListenersHeader();

			}
			su.s.api('track.getListeners', d, function(r){
				if (!_this.isAlive()){
					return;
				}
				var raw_users = r && r.done && [].concat.apply([], r.done);
				if (raw_users){
					var users = $filter(raw_users, 'user', function(value){
						if (value != current_user){
							return true;
						}
					});
					if (users.length){

						var above_limit_value = 0;
						var uul = $("<ul></ul>");
						for (var i=0; i < r.done.length; i++) {
							if (r.done[i] && r.done[i].length){
								above_limit_value = _this.root_view.createSongListeners(r.done[i], uul, above_limit_value, current_user, _this.rowcs.users_context);
							}

						}
						if (_this.t_users.other_users){
							_this.t_users.other_users.remove();
						}

						_this.createListenersHeader();

						_this.t_users.c.addClass('many-users');
						uul.appendTo(_this.t_users.list);
						_this.t_users.other_users = uul;
					}
				}
				//console.log(r)

			});
			this.t_users.last_update = (+new Date());
		}
	},
	update_artist_info: function(){
		var _this = this;
		var a_info = this.a_info;
		this.dom_related_props.push('ainf', 'photo_data', 'img_panorama');

		if (!this.has_artist_info){
			this.has_artist_info = true;
			this.ainf = {
				bio: a_info.children('.artist-bio'),
				meta_info: a_info.children('.artist-meta-info'),
				c : a_info
			};

			this.ainf.bio.text('...');
			this.ainf.meta_info.empty();

			var tidominator = this.requirePart('tidominator');

			this.requirePart('artist-info');
			this.requirePart('artist_link_con');
		}

	},
	'stch-images': function(images) {
		if (!images || !images.length){
			return;
		}
		var photo_c = this.tpl.ancs['phocoli'];
		if (!photo_c){
			return;
		}
		var _this = this;
		images = toRealArray(images);
		_this.setVisState('cool_photos', true);//cool_photos
		_this.photo_data.cool_photos = images;
		this.dom_related_props.push('img_panorama');
		if (images.length){
			var fragment = document.createDocumentFragment();

			//var shuffled_images = [images.shift()];

			//shuffled_images.push.apply(shuffled_images, shuffleArray(images));
			_this.img_requests = [];
			_this.img_panorama = new Panoramator();
			var main_c = photo_c.parent();

			_this.img_panorama.init({
				viewport: main_c,
				lift: photo_c,
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
			};

			var appendImage = function(el, index, first_image) {
				var sizes = toRealArray(el.sizes.size);

				var image_jnode = $('<img class="artist_image hidden" alt=""/>');
				var req = loadImage({
					node: image_jnode[0],
					url: (sizes[5] || sizes[0])["#text"],
					timeout: 40000,
					queue: _this.root_view.lfm_imgq,
					cache_allowed: true
				}).done(function(){
					if (!_this.isAlive()){
						return;
					}
					if (first_image){
						first_image = _this.tpl.ancs['first-image'];
						first_image.remove();
						_this.tpl.ancs['first-image'] = null;
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


				_this.img_requests.push(req);



				fragment.appendChild(image_jnode[0]);

			};
			if (images[0]){
				appendImage(images[0], 0, true);
			}
			$.each(images.slice(1, 10), function(i, el){
				appendImage(el, i + 1);
			});
			photo_c.append(fragment);

			main_c.addClass('loading-images');

			for (var i = _this.img_requests.length - 1; i >= 0; i--) {
				_this.mpx.RPCLegacy('addRequest', _this.img_requests[i], {
					space: 'demonstration'
				});

			}

			$.when.apply($, _this.img_requests).always(function(){
				main_c.removeClass('loading-images');
			});
			_this.img_panorama.checkSize();


		}
	}
});