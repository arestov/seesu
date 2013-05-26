define(['provoda', 'spv', 'jquery', 'js/modules/Panoramator', 'app_serv', './TrackActionsRowUI', './MfCorUI', './etc_views'],
function(provoda, spv, $, Panoramator, app_serv, TrackActionsRowUI, MfCorUI, etc_views) {
"use strict";
var localize = app_serv.localize;
var app_env = app_serv.app_env;
var TagsController = function() {};
provoda.View.extendTo(TagsController, {
	bindBase: function() {},
	tpl_r_events: {
		'preview_list': {
			showTag: function(e, node, scope){
				e.preventDefault();
				this.RPCLegacy('showTag', scope.tag);
			}
		}
	}
});

/*
	'stch-tags': function(state) {
		var _this = this;
		setTimeout(function() {
			var nodes = spv.filter(_this.tpl.pv_repeats.tags || [], 'root_node');
			for (var i = 0; i < nodes.length; i++) {
				var node = $(nodes[i]);
				node.after(document.createTextNode(' '));
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
			}
		},100);
	},
*/

var SimilarsController = function() {};
provoda.View.extendTo(SimilarsController, {
	tpl_r_events: {
		'similars': {
			showArtcardPage: function(e, node, scope) {
				e.preventDefault();
				this.RPCLegacy('showArtcardPage', scope.artist.name);
			}
		}
	}
});

var ArtistInSongConstroller = function() {};
provoda.View.extendTo(ArtistInSongConstroller, {
	dom_rp: true,
	children_views:{
		tags_list: TagsController,
		similar_artists: SimilarsController
	},
	bindBase: function() {

		this.photo_data = {};
		this.dom_related_props.push('photo_data');

		var _this = this;
		this.parent_view.on('state-change.mp_show_end', function(e) {
			if (e.value){
				if (_this.img_panorama){
					setTimeout(function() {
						_this.img_panorama.checkSize();
					},50);
				}
			}
		});
		this.parent_view.on('state-change.mp_show', function(e) {
			if (!e.value){
				_this.setVisState('wamo_info', false);
			}
		});

	},
	'compx-infb_text': {
		depends_on: ['artist_name', 'playcount', 'listeners', 'bio'],
		fn: function(artist, playcount, listeners, bio) {
			if (!artist){
				return;
			}
			if (playcount || listeners || bio){
				return localize("more-ab-info").replace('%s', artist);
			}
		}
	},
	'compx-usable_artist_image': {
		depends_on: ['selected_image', 'vis_cool_photos'],
		fn: function(img, cph) {
			if (!cph){
				var postfix = '';
				if (app_env.opera_widget){
					postfix = '?somer=' + Math.random();
				}
				return !!img && (img + postfix);
			} else {
				return false;
			}
		}
	},
	'stch-bio': function(text) {
		var bioc = this.tpl.ancs['artbio'];
		if (!bioc){
			return;
		}
		if (text){
			var safe_node = document.createElement('div');
			safe_node.innerHTML = $.trim(text).replace(/([^\n])\n+/gi, '$1<br/><br/>');

			$(safe_node).find('script').remove();

			bioc.empty().append(safe_node);
			this.root_view.bindLfmTextClicks(bioc);
			bioc.append('<span class="forced-end"></span>');
		} else {

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

		var prepareImageAppend = function(index) {
			if (index === 0){
				_this.tpl.ancs['first-image'].remove();
				_this.tpl.ancs['first-image'] = null;
			}
		};
		var canUse = function() {
			return _this.isAlive();
		};
		var bindPanoramaResizeByWindow = function(img_panorama) {
			var my_window = spv.getDefaultView(_this.getC()[0].ownerDocument);

			var checkPanoramaSize = function(){
				img_panorama.checkSize();
			};

			$(my_window).on('resize', checkPanoramaSize);

			_this.onDie(function(){
				$(my_window).off('resize', checkPanoramaSize);
			});
		};

		var queue = this.root_view.lfm_imgq;

		images = spv.toRealArray(images);
		_this.setVisState('cool_photos', true);//cool_photos
		_this.photo_data.cool_photos = images;
		this.dom_related_props.push('img_panorama');
		if (images.length){
			var fragment = document.createDocumentFragment();

			//var shuffled_images = [images.shift()];

			//shuffled_images.push.apply(shuffled_images, shuffleArray(images));
			_this.img_requests = [];
			var img_requests = _this.img_requests;
		
			_this.img_panorama = new Panoramator();
			var img_panorama = _this.img_panorama;
			var main_c = photo_c.parent();

			img_panorama.init({
				viewport: main_c,
				lift: photo_c,
				onUseEnd: function(){
					seesu.trackEvent('Panoramator', 'artist photos');
				}
			});
			bindPanoramaResizeByWindow(img_panorama);

			
			var images_collection = [];

			var updatePanorama = function(){
				images_collection.sort(function(a, b){
					return spv.sortByRules(a, b, ['num']);
				});

				img_panorama.setCollection(spv.filter(images_collection, 'item'));
			};

			var appendImage = function(el, index) {
				var sizes = spv.toRealArray(el.sizes.size);

				var image_jnode = $('<img class="artist_image hidden" alt=""/>');
				var req = app_serv.loadImage({
					node: image_jnode[0],
					url: (sizes[5] || sizes[0])["#text"],
					timeout: 40000,
					queue: queue,
					cache_allowed: true
				}).done(function(){
					if (!canUse()){
						return;
					}
					prepareImageAppend(index);

					image_jnode.removeClass("hidden");

					images_collection.push({
						num: index,
						item: image_jnode
					});

					updatePanorama();
				}).fail(function(){
					image_jnode.remove();
				});

				fragment.appendChild(image_jnode[0]);
				return req;

			};
			if (images[0]){
				img_requests.push(appendImage(images[0], 0));
			}
			$.each(images.slice(1, 10), function(i, el){
				img_requests.push(appendImage(el, i + 1));
			});
			photo_c.append(fragment);

			main_c.addClass('loading-images');

			for (var i = img_requests.length - 1; i >= 0; i--) {
				_this.parent_view.mpx.RPCLegacy('addRequest', img_requests[i], {
					space: 'demonstration'
				});
			}
			$.when.apply($, img_requests).always(function(){
				if (!canUse()){
					return;
				}
				main_c.removeClass('loading-images');
			});
			img_panorama.checkSize();
		}
	},
	tpl_events: {
		showMoreInfo: function(e) {
			var cst = this.state('vis_wamo_info');
			this.setVisState('wamo_info', !cst);
			e.preventDefault();
		}
	}
});

var SongcardController = function() {};
provoda.View.extendTo(SongcardController, {
	dom_rp: true,
	bindBase: function() {
		this.rowcs = {};
		var _this = this;
		this.parent_view.on('state-change.mp_show', function(e) {
			if (!e.value && _this.rowcs.users_context){
				_this.rowcs.users_context.hide();
			}
		});
		this.parent_view.on('state-change.mp_show', function(e) {
			if (e.value){
				_this.expand();
				_this.updateSongListeners();
			}
		});


	},
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}

		var users = this.tpl.ancs['track-listeners'];
		var users_list = this.tpl.ancs['song-listeners-list'];


		var users_row_context =  this.tpl.ancs['row-listeners-context'];
		var users_context = new etc_views.contextRow(users_row_context);
		var uinfo_part = this.tpl.ancs['big-listener-info'];
		users_context.addPart(uinfo_part, 'user_info');

		this.t_users= {
			c: users,
			list: users_list
		};

		this.rowcs.users_context = users_context;
		this.dom_related_props.push('song_actions_c', 'rowcs', 't_users');
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
		var su = window.su;
		var _this = this;
		var last_update = this.t_users.last_update;
		//var current_user = su.s.getId();
		var artist_name = this.state('artist_name');
		var track_name = this.state('track_name');

		if (artist_name && track_name && (!last_update || (Date.now() - last_update) > 1000 * 60 * 1)){
			var d = {
				artist: artist_name,
				title: track_name
			};
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
					var users = spv.filter(raw_users, 'user', function(value){
						if (value != current_user){
							return true;
						}
					});
					if (users.length){

						var above_limit_value = 0;
						var uul = $("<ul></ul>");
						for (var i=0; i < r.done.length; i++) {
							if (r.done[i] && r.done[i].length){
								above_limit_value = _this.root_view.createSongListeners(
									r.done[i], uul, above_limit_value, current_user, _this.rowcs.users_context);
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
	}
});

var SongUI = function(){};

provoda.View.extendTo(SongUI, {
	dom_rp: true,
	createDetailes: function(){
		
		this.createBase();
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
		}
	},
	state_change : {
		"mp_show": function(opts, old_opts) {
			if (opts){
			//	this.parent_view.c.addClass("show-zoom-to-track");
				this.activate();
			} else if (old_opts) {
			//	this.parent_view.c.removeClass("show-zoom-to-track");
				this.deactivate();
			}
			
		},
		"can_expand": function(state) {
			if (state){
				this.expand();
			}
		}
	},

	deactivate: function(){

		var acts_row = this.getMdChild('actionsrow');
		if (acts_row) {
			acts_row.hideAll();
		}

		this.getMdChild('mf_cor').collapseExpanders();
	},
	children_views: {
		actionsrow: TrackActionsRowUI,
		mf_cor: MfCorUI,
		artist: ArtistInSongConstroller,
		songcard: SongcardController
	},
	activate: function(){
		this.expand();
	},

	tpl_events: {
		showSong: function(e) {
			e.preventDefault();
			this.RPCLegacy('wantSong');
			this.RPCLegacy('showOnMap');
		}
	},

	parts_builder: {
		context: function() {
			return this.root_view.getSample('track_c');
		}
	},
	createBase: function(){
		var _this = this;
		this.setVisState('lite_view', this.opts && this.opts.lite);
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

		this.canUseDeepWaypoints = function() {
			return !(_this.opts && _this.opts.lite) && !!_this.state('mp_show');
		};

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



		var context = this.requirePart('context');

		this.song_actions_c =  this.tpl.ancs['song-actions'];

		this['collch-actionsrow'] = true;
		this.checkCollectionChange('actionsrow');

		context.prepend(this.getAFreeCV('mf_cor'));

		
		this.dom_related_props.push('song_actions_c');
		this.requestAll();
	}
});
return SongUI;
});
