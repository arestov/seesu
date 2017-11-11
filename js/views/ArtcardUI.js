define(function(require) {
'use strict';
var pv = require('pv');
var $ = require('jquery');
var coct = require('./coct');
var app_serv = require('app_serv');
var view_serv = require('view_serv');
var Panoramator = require('./modules/Panoramator');
var spv = require('spv');
var View = require('View');

var app_env = app_serv.app_env;

var ArtcardUI = spv.inh(View, {}, {
	die: function() {
		this._super();
	},
	children_views: {
		// top_songs: coct.ItemOfLL,
		// soundc_prof: coct.ItemOfLL,
		// hypem_new: coct.ItemOfLL,
		// hypem_fav: coct.ItemOfLL,
		// hypem_reblog: coct.ItemOfLL,
		// soundc_likes: coct.ItemOfLL,
		// similar_artists: coct.ItemOfLL,
		albums_list: coct.AlbumsListPreview,
		dgs_albums: coct.AlbumsListPreview,
		// tags_list: coct.TagsListPreview
	},
	state_change: {
		'selected_image': function(target, lfm_wrap) {
			if (!lfm_wrap){
				return;
			}
			var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/500/' + lfm_wrap.lfm_id : lfm_wrap.url;
			if (url){
				target.tpl.ancs.bigimagec.empty();
				target.tpl.ancs.bigimagec.append(
					$('<img/>').attr('src', url)
				);
			}
		},

		bio: function(target, text) {
			if (text){
				var safe_node = window.document.createElement('div');
				safe_node.innerHTML = text.replace(/([^\n])\n+/gi, '$1<br/><br/>');

				$(safe_node).find('script').remove();

				target.tpl.ancs.bio.empty().append(safe_node);
				target.root_view.bindLfmTextClicks(target.tpl.ancs.bio);
			}
		}
	},
	base_tree: {
		sample_name: 'art_card'
	}
});

var sortByNum = spv.getSortFunc(['num']);

var TagsController = spv.inh(View, {}, {
	bindBase: function() {},
	tpl_r_events: {
		'preview_list': {
			showTag: function(e, node, scope){
				e.preventDefault();
				this.RPCLegacy('showTag', scope.tag.name);
			}
		}
	}
});


var SimilarsController = spv.inh(View, {}, {
	tpl_r_events: {
		'similars': {
			showArtcardPage: function(e, node, scope) {
				e.preventDefault();
				this.root_view.tpl_events.showArtcardPage.call(this.root_view, e, node, scope.artist.name);
			}
		}
	}
});

var ArtistInSongConstroller = spv.inh(View, {}, {
	dom_rp: true,
	children_views:{
		tags_list: TagsController,
		similar_artists: SimilarsController
	},

	bindBase: function() {
		this.photo_data = {};
		this.dom_related_props.push('photo_data');
	},
	'compx-parent_vmp_show': [
		['^vmp_show'],
		function(vmp_show) {
			return vmp_show;
		}
	],
	'stch-parent_vmp_show': function(target, state) {
		if (!state) {
			target.setVisState('wamo_info', false);
		}
	},
	'compx-infb_text': {
		depends_on: ['artist_name', 'playcount', 'listeners', 'bio', '#locales.more-ab-info'],
		fn: function(artist, playcount, listeners, bio, lo_more) {
			if (!lo_more) {
				return;
			}
			if (!artist){
				return;
			}
			if (playcount || listeners || bio){
				return lo_more.replace('%s', artist);
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
	'stch-bio': function(target, text) {
		var bioc = target.tpl.ancs['artbio'];
		if (!bioc){
			return;
		}
		if (text){
			var safe_node = window.document.createElement('div');
			safe_node.innerHTML = $.trim(text).replace(/([^\n])\n+/gi, '$1<br/><br/>');

			$(safe_node).find('script').remove();

			bioc.empty().append(safe_node);
			target.root_view.bindLfmTextClicks(bioc);
		} else {

		}
	},
	'compx-pvm_key':{
		depends_on: ['^mp_show_end','mp_has_focus'],
		fn: function(parent_viewing_mode, focus) {
			if (parent_viewing_mode){
				return focus ? 1 : 2;
			}
		}
	},
	getPamoramaWidth: function() {
		return this.img_panorama.checkViewportWidth();
	},
	'stch-key-panorama_width': function(target, state) {
		if (state) {
			pv.update(target, 'panorama_width', target.getBoxDemensionByKey(target.getPamoramaWidth, state));
		}
	},
	'compx-key-panorama_width': [
		['panorama', '#workarea_width', 'pvm_key'],
		function (panorama, workarea_width, pvm_key) {
			if (panorama && pvm_key){
				//ширина иллюминатора - от ширины экрана + состояния mp-show
				return this.getBoxDemensionKey('panorama_width', workarea_width, pvm_key);
			}
		}
	],

	'stch-panorama_width': function(target, state) {
		if (state && target.img_panorama){
			target.img_panorama.setViewportWidth(state);
		}
	},
	getPamoramaLiftWidth: function() {
		return this.img_panorama.checkTotalWidth();
	},
	getFastPamoramaLiftWidth: function() {
		return this.getBoxDemensionByKey(this.getPamoramaLiftWidth, this.state('panorama_lift_width_key'));
	},

	'compx-panorama_lift_width_key':{
		depends_on: ['panorama', 'artist_name', 'images_combination', '#window_height', 'pvm_key'],
		fn: function(panorama,artist_name, images_combination, window_height, pvm_key) {
			if (!panorama || !artist_name || !images_combination || !pvm_key){
				return;
			}

			return this.getBoxDemensionKey('panorama_lift_width', artist_name, window_height, pvm_key, images_combination);
			//ширина лифта  зависит от артиста, комбинации загруженных картинок, высоты экрана + состояния mp-show

		}
	},
	// 'stch-panorama_lift_width': function(target, state) {
	// 	if (state && target.img_panorama){
	// 		//this.img_panorama.setTotalWidth(state);
	// 	}
	// },
	img_sample: $('<img class="artist_image hidden" alt=""/>'),
	updatePanoramaIMGs: function(collection, images_combination, img_panorama) {
		img_panorama.setCollection(collection, true);
		//this.img_panorama.setTotalWidth(this.img_panorama.checkTotalWidth());

		pv.update(this, 'images_combination', images_combination);
	},
	'stch-images': function(target, images) {
		if (!images || !images.length){
			return;
		}
		var photo_c = target.tpl.ancs['phocoli'];
		if (!photo_c){
			return;
		}

		var prepareImageAppend = function(index) {
			if (index === 0){
				target.tpl.ancs['first-image'].remove();
				target.tpl.ancs['first-image'] = null;
			}
		};
		var canUse = function() {
			return target.isAlive();
		};


		var queue = target.root_view.lfm_imgq;

		images = spv.toRealArray(images);
		target.setVisState('cool_photos', true);//cool_photos
		target.photo_data.cool_photos = images;
		target.dom_related_props.push('img_panorama');
		if (images.length){
			var fragment = window.document.createDocumentFragment();

			//var shuffled_images = [images.shift()];

			//shuffled_images.push.apply(shuffled_images, shuffleArray(images));
			target.img_requests = [];
			var img_requests = target.img_requests;

			var main_c = photo_c.parent();

			target.img_panorama = new Panoramator({
				viewport: main_c,
				lift: photo_c,
				improved_con: true,
				getFastLiftWidth: function() {
					return target.getFastPamoramaLiftWidth();
				},
				onUseEnd: function(){
					target.root_view.trackEvent('Panoramator', 'artist photos');
				}
			});


			//bindPanoramaResizeByWindow(img_panorama);
			pv.update(target, 'panorama', true);

			var images_collection = [];

			var updatePanorama = spv.debounce(function(){
				images_collection.sort(sortByNum);
				var images_combination = spv.filter(images_collection, 'num').join('_');

				target.nextLocalTick(target.updatePanoramaIMGs, [spv.filter(images_collection, 'item'), images_combination, target.img_panorama]);

			}, 100);

			var appendImage = function(el, index) {
				var sizes = spv.toRealArray(el.sizes.size);

				var image_jnode = target.img_sample.clone();
				var url = (sizes[5] || sizes[0])["#text"];
				var req = view_serv.loadImage({
					url: url,
					timeout: 40000,
					queue: queue,
					cache_allowed: true
				});

				req.then(function(){
					if (!canUse()){
						return;
					}
					image_jnode[0].src = url;
					prepareImageAppend(index);

					image_jnode.removeClass("hidden");

					images_collection.push({
						num: index,
						item: image_jnode
					});

					updatePanorama();
				}, function(){
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

			for (var i = 0; i < img_requests.length; i++) {
				target.addRequest( img_requests[i], { order: (img_requests.length - i) +1 } );
			}

			$.when.apply($, img_requests).always(function(){
				if (!canUse()){
					return;
				}
				main_c.removeClass('loading-images');
			});
			//target.nextLocalTick(checkPanoramaSize);
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
