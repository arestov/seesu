define(['provoda', 'jquery', './coct', 'app_serv', './modules/Panoramator', 'spv'],
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
				this.RPCLegacy('showTag', scope.tag.name);
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

	bindBase: function() {

		this.photo_data = {};
		this.dom_related_props.push('photo_data');

		var _this = this;
		this.wch(this.root_view, 'window_height');
		this.wch(this.root_view, 'window_width');
		this.wch(this.parent_view, 'mp_show_end', 'parent_viewing_mode');

		this.parent_view.on('state_change.mp_show', function(e) {
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
		} else {

		}
	},
	'compx-pvm_key':{
		depends_on: ['parent_viewing_mode'],
		fn: function(parent_viewing_mode) {
			if (parent_viewing_mode){
				return parent_viewing_mode.userwant ? 1 : 2;
			}
		}
	},
	getPamoramaWidth: function() {
		return this.img_panorama.checkViewportWidth();
	},
	'compx-panorama_width':{
		depends_on: ['panorama', 'window_width', 'pvm_key'],
		fn: function(panorama, window_width, pvm_key) {
			if (panorama && pvm_key){
				//ширина иллюминатора - от ширины экрана + состояния mp-show
				return this.getBoxDemension(this.getPamoramaWidth, 'panorama_width', window_width, pvm_key);
			}
		}
	},
	'stch-panorama_width': function(state) {
		if (state && this.img_panorama){
			this.img_panorama.setViewportWidth(state);
		}
	},
	getPamoramaLiftWidth: function() {
		return this.img_panorama.checkTotalWidth();
	},
	getFastPamoramaLiftWidth: function() {
		return this.getBoxDemensionByKey(this.getPamoramaLiftWidth, this.state('panorama_lift_width_key'));
	},

	'compx-panorama_lift_width_key':{
		depends_on: ['panorama', 'artist_name', 'images_combination', 'window_height', 'pvm_key'],
		fn: function(panorama,artist_name, images_combination, window_height, pvm_key) {
			if (!panorama || !artist_name || !images_combination || !pvm_key){
				return;
			}
			
			return this.getBoxDemensionKey('panorama_lift_width', artist_name, window_height, pvm_key, images_combination);
			//ширина лифта  зависит от артиста, комбинации загруженных картинок, высоты экрана + состояния mp-show
			//return this.getBoxDemension(this.getPamoramaLiftWidth, 'panorama_lift_width', artist_name, window_height, pvm_key, images_combination);

		}
	},
	'stch-panorama_lift_width': function(state) {
		if (state && this.img_panorama){
			//this.img_panorama.setTotalWidth(state);
		}
	},
	img_sample: $('<img class="artist_image hidden" alt=""/>'),
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
				improved_con: true,
				getFastLiftWidth: function() {
					return _this.getFastPamoramaLiftWidth();
				},
				onUseEnd: function(){
					seesu.trackEvent('Panoramator', 'artist photos');
				}
			});
			//bindPanoramaResizeByWindow(img_panorama);
			_this.updateState('panorama', true);
			
			var images_collection = [];

			var updatePanorama = spv.debounce(function(){
				images_collection.sort(function(a, b){
					return spv.sortByRules(a, b, ['num']);
				});
				var images_combination = spv.filter(images_collection, 'num').join('_');
				
				_this.nextTick(function() {
					
					img_panorama.setCollection(spv.filter(images_collection, 'item'), true);
					//this.img_panorama.setTotalWidth(this.img_panorama.checkTotalWidth());

					_this.updateState('images_combination', images_combination);
				});
				
			}, 100);

			var appendImage = function(el, index) {
				var sizes = spv.toRealArray(el.sizes.size);

				var image_jnode = _this.img_sample.clone();
				var url = (sizes[5] || sizes[0])["#text"];
				var req = app_serv.loadImage({
					url: url,
					timeout: 40000,
					queue: queue,
					cache_allowed: true
				}).done(function(){
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

			for (var i = 0; i < img_requests.length; i++) {
				_this.addRequest( img_requests[i], { order: (img_requests.length - i) +1 } );
			}

			$.when.apply($, img_requests).always(function(){
				if (!canUse()){
					return;
				}
				main_c.removeClass('loading-images');
			});
			//_this.nextTick(checkPanoramaSize);
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