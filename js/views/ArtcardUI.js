define(['provoda', 'jquery', './coct', 'app_serv', 'js/modules/Panoramator', 'spv'],
function(provoda, $, coct, app_serv, Panoramator, spv) {
"use strict";
var localize = app_serv.localize;
var app_env = app_serv.app_env;

var ArtcardUI = function() {};
provoda.View.extendTo(ArtcardUI, {
	die: function() {
		this._super();
	},
	children_views: {
		top_songs: coct.ItemOfLL,
		soundc_prof: coct.ItemOfLL,
		hypem_new: coct.ItemOfLL,
		hypem_fav: coct.ItemOfLL,
		hypem_reblog: coct.ItemOfLL,
		soundc_likes: coct.ItemOfLL,
		similar_artists: coct.ItemOfLL,
		albums_list: coct.AlbumsListPreview,
		dgs_albums: coct.AlbumsListPreview,
		tags_list: coct.TagsListPreview
	},
	state_change: {
		"mp_show": function(opts) {
			this.c.toggleClass('hidden', !opts);
		},
		'selected_image': function(lfm_wrap) {
			if (!lfm_wrap){
				return;
			}
			var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/500/' + lfm_wrap.lfm_id : lfm_wrap.url;
			if (url){
				this.tpl.ancs.bigimagec.empty();
				this.tpl.ancs.bigimagec.append(
					$('<img/>').attr('src', url)
				);
			}
		},

		bio: function(text) {
			if (text){
				var safe_node = document.createElement('div');
				safe_node.innerHTML = text.replace(/([^\n])\n+/gi, '$1<br/><br/>');

				$(safe_node).find('script').remove();

				this.tpl.ancs.bio.empty().append(safe_node);
				this.root_view.bindLfmTextClicks(this.tpl.ancs.bio);
			}
		}
	},
	createBase: function() {
		this.c = this.root_view.getSample('artcard');
		this.createTemplate();
	}
});

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
	checkPanoramaSize: function() {
		if (this.img_panorama){
			this.img_panorama.checkSize();
		}
	},
	bindBase: function() {

		this.photo_data = {};
		this.dom_related_props.push('photo_data');

		var _this = this;
		this.parent_view.on('state-change.mp_show_end', function(e) {
			if (e.value){
				setTimeout(function() {
					_this.checkPanoramaSize();
				},50);
				
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
ArtcardUI.ArtistInSongConstroller = ArtistInSongConstroller;
return ArtcardUI;
});