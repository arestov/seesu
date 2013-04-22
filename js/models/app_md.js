/*
freeze
!restoreFreezed

*/
var appModel;
(function() {
"use strict";
var appModelBase = function() {};
provoda.Model.extendTo(appModelBase, {
	init: function() {
		this._super();
		this.navigation = [];
		this.map = new browseMap();
	},
	getBMapTravelFunc: function(func, context) {
		return function() {
			return context.collectChanges(func, arguments);
		};
	},
	changeNavTree: function(nav_tree) {
		this.nav_tree = $filter(nav_tree, 'resident');
		this.checkNowPlayNav();
	},
	restoreFreezed: function(transit){
		this.map.restoreFreezed(transit);
	},
	showStartPage: function(){
		//mainaly for hash url games
		this.map.startNewBrowse();
	},
	'mapch-handlers': {
		"zoom-in": function(array) {
			var target;
			for (var i = array.length - 1; i >= 0; i--) {
				var cur = array[i];
				if (cur.type == 'move-view' && cur.value){
					target = cur.target.getMD();
					break;
				}

			}
			return target;
		},
		"zoom-out": function(array) {
			var target;
			for (var i = array.length - 1; i >= 0; i--) {
				var cur = array[i];
				if (cur.type == 'zoom-out' || cur.type == 'move-view'){//&& cur.value
					target = cur.target.getMD();
					break;
				}

			}
			return target;
		}
	},
	'model-mapch': {
		'move-view': function(change) {
			var parent = change.target.getMD().getParentMapModel();
			if (parent){
				//mp-source
				/*
				var mp_source = change.target.state('mp-source');
				if (mp_source){
					parent.updateState('mp-highlight', mp_source);
				}*/
				parent.updateState('mp_has_focus', false);
			}
			change.target.getMD().updateState('mp_show', change.value);
		},
		'zoom-out': function(change) {
			change.target.getMD().updateState('mp_show', false);
		},
		'destroy': function(change) {
			change.target.getMD().mlmDie();
		}
	},
	animationMark: function(models, mark) {
		for (var i = 0; i < models.length; i++) {
			models[i].getMD().updateState('map_animating', mark);
		}
	},
	animateMapChanges: function(changes) {
		var
			i,
			target_md,
			all_changhes = $filter(changes.array, 'changes');

		all_changhes = [].concat.apply([], all_changhes);
		var models = $filter(all_changhes, 'target');
		this.animationMark(models, changes.anid);

		for (i = 0; i < all_changhes.length; i++) {
			var change = all_changhes[i];
		//	change.anid = changes.anid;
			var handler = this['model-mapch'][change.type];
			if (handler){
				handler.call(this, change);
			}
		}

		for (i = changes.array.length - 1; i >= 0; i--) {
			var cur = changes.array[i];
			if (this['mapch-handlers'][cur.name]){
				target_md = this['mapch-handlers'][cur.name].call(this, cur.changes);
				break;
			}
		}
		/*
			подсветить/заменить текущий источник
			проскроллить к источнику при отдалении
			просроллить к источнику при приближении
		*/
		if (target_md){
			target_md.updateState('mp_has_focus', true);

			this.updateState('show_search_form', !!target_md.state('needs_search_from'));
			this.updateState('full_page_need', !!target_md.full_page_need);
			this.updateState('current_mp_md', target_md);
			//target_md.updateState('mp-highlight', false);


		}

		this.updateState('map_animation', changes);
		this.updateState('map_animation', false);
		this.animationMark(models, false);
	},
	bindMMapStateChanges: function(md) {
		var _this = this;

		md.on('mpl-attach', function() {
			var navigation = _this.getNesting('navigation');
			var target_array = _this.getNesting('map_slice') || [];


			if (navigation.indexOf(md) == -1) {
				navigation.push(md);
				_this.updateNesting('navigation', navigation);
			}
			if (target_array.indexOf(md) == -1){
				target_array.push(md);
				_this.updateNesting('map_slice', target_array);
			}

		}, {immediately: true});
		md.on('mpl-detach', function(){
			var navigation = _this.getNesting('navigation');
			var target_array = _this.getNesting('map_slice') || [];

			var new_nav = arrayExclude(navigation, md);
			if (new_nav.length != navigation.length){
				_this.updateNesting('navigation', new_nav);
			}
			var new_tarr = arrayExclude(target_array, md);

			if (new_tarr.length != target_array.length){
				_this.updateNesting('map_slice', new_tarr);
			}
		}, {immediately: true});
	},
	showMOnMap: function(model) {

		var aycocha = this.map.isCollectingChanges();
		if (!aycocha){
			this.map.startChangesCollecting();
		}

		if (!model.lev || !model.lev.canUse()){
			//если модель не прикреплена к карте прежде чем что-то делать - отображаем "родительску" модель
			this.showMOnMap(model.map_parent);
		}
		if (model.lev && model.lev.canUse()){//если модель прикреплена к карте

			if (model.lev.closed){
				//если замарожены - удаляем "незамороженное" и углубляемся до нужного уровня
				this.map.restoreFreezedLev(model.lev);
			}
			//отсекаем всё более глубокое
			model.lev.sliceTillMe();
		} else {
			if (!model.model_name){
				throw new Error('model must have model_name prop');
			}
			this.bindMMapStateChanges(model, model.model_name);
			this.map.goDeeper(model);

		}

		if (!aycocha){
			this.map.finishChangesCollecting();
		}

		return model;
		//
	},
	collectChanges: function(fn, args, opts) {
		var aycocha = this.map.isCollectingChanges();
		if (!aycocha){
			this.map.startChangesCollecting(opts);
		}

		var result = fn.apply(this, args);

		if (!aycocha){
			this.map.finishChangesCollecting();
		}
		return result;
	}
});


appModel = function(){};
appModelBase.extendTo(appModel, {
	init: function(){
		this._super();

		for (var func_name in this.bmap_travel){
			this[func_name] = this.getBMapTravelFunc(this.bmap_travel[func_name], this);
		}

		return this;
	},
	checkUserInput: function(opts) {
		if (opts.ext_search_query) {
			this.search(opts.ext_search_query);
		}

		var state_recovered;
		if (this.p && this.p.c_song){
			if (this.p.c_song){
				this.showNowPlaying(true);
				state_recovered = true;
			}
		}

		if (state_recovered){
			opts.state_recovered = true;
		}
		if (!state_recovered && !opts.ext_search_query){
			this.trigger('handle-location');
		}

		//big_timer.q.push([tracking_opts.category, 'process-thins-sui', big_timer.comp(tracking_opts.start_time), 'seesu ui in process', 100]);
		this.start_page.updateState('can_expand', true);

	},
	infoGen: function(dp, c, base_string){
		if (dp){
			if (c.prev){
				c.str += ', ';
			}
			c.str += base_string.replace('%s', dp);
			if (!c.prev){
				c.prev = true;
			}
		}
	},
	getRemainTimeText: function(time_string, full){
		var d = new Date(time_string);
		var remain_desc = '';
		if (full){
			remain_desc += localize('wget-link') + ' ';
		}


		remain_desc += d.getDate() +
		" " + localize('m'+(d.getMonth()+1)) +
		" " + localize('attime') + ' ' + d.getHours() + ":" + d.getMinutes();

		return remain_desc;
	},

	nowPlaying: function(mo) {
		this.updateState('now_playing', mo.getTitle());
		this.current_playing = mo;
		this.checkNowPlayNav();
	},
	checkNowPlayNav: debounce(function() {
		if (this.current_playing){
			this.updateState('viewing_playing', this.nav_tree.indexOf(this.current_playing) != -1);
		}

	}, 30),
	playing: function() {
		this.updateState('playing', true);
	},
	notPlaying: function() {
		this.updateState('playing', false);
	},
	setDocTitle: function(title) {
		this.updateState('doc_title', title);
	},
	createSonglist: function(map_parent, params, first_song) {
		var pl = new songsList();
		pl.init({
			app: this,
			map_parent: map_parent
		}, params, first_song);
		return pl;
	},
	preparePlaylist: function(params, first_song){
		var pl = new songsList();
		pl.init({
			app: this
		}, params, first_song);
		return pl;
	},
	keyNav: function(key_name) {
		var md = this.map.getCurMapL().resident;
		if (md.key_name_nav){
			var func = md.key_name_nav[key_name];
			func.call(md);
		}

	},
	bmap_travel: {
		
		showArtcardPage: function(artist, page_md){
			var md = this.start_page.getSPI('catalog/' + artist, true);
			md.showOnMap();
			/*
			var md = new ArtCard();
			md.init({
				app: this,
				map_parent: page_md || this.start_page
			}, {
				artist: artist
			});
			md.showOnMap();*/
			return md;
		},
		showArtistAlbum: function(params, page_md, start_song){
			var artcard = this.showArtcardPage(params.album_artist, page_md);
			var pl = artcard.showAlbum(params, start_song);
			if (start_song) {
				pl.showTrack(start_song);
			}
			return pl;
		},
		showNowPlaying: function(no_stat) {
			this.p.c_song.showOnMap();
			if (!no_stat){
				this.trackEvent('Navigation', 'now playing');
			}
		},
		showResultsPage: function(query){
			var lev;
			var cur_el = this.search_el;
			if (!cur_el || !cur_el.state('mp_has_focus') || !cur_el.lev.isOpened()){
				var md = this.createSearchPage();
				var _this = this;
				md.on('state-change.mp_show', function(e) {
					if (e.value){
						_this.search_el = this;
					}
				}, {immediately: true});

				md.showOnMap();
				lev = md.lev;
			} else {
				lev = this.search_el.lev;
			}
			var invstg = lev.resident;
			invstg.changeQuery(query);
			return invstg;

		},
		show_tag: function(tag, page_md, start_song){
			var md = this.start_page.getSPI('tags/' + tag, true);
			md.showOnMap();
			return md;
		},
		showArtistTopTracks: function(artist, page_md, start_song) {
			var artcard = this.showArtcardPage(artist, page_md);

			var track_name = start_song && start_song.track;
			var pl = artcard.showTopTacks(track_name);

			return pl;
		},
		showMetroChart: function(country, metro){
			var pl = this.createMetroChartPlaylist(country, metro);
			pl.requestMoreData();
			pl.showOnMap();
		},
		showArtistSimilarArtists: function(artist, start_song){
			var artcard = this.showArtcardPage(artist, this.start_page);
			return artcard.showSimilarArtists();
		}
	},
	createMetroChartPlaylist: function(country, metro) {
		//fixme (remove?)
		var pl = this.createSonglist(this.start_page, {//can autoload
			title: 'Chart of ' + metro,
			type: 'chart',
			data: {country: country, metro: metro}
		});
		pl.setLoader(function(paging_opts) {
			var request_info = {};
			request_info.request = lfm.get('geo.getMetroUniqueTrackChart', {
				country: country,
				metro: metro,
				limit: 30,
				start: (new Date()) - 60*60*24*7,
				page: paging_opts.next_page
			})
				.done(function(r) {
					if (r.error){
						pl.requestComplete(request_info.request, true);
						return;
					}

					var tracks = toRealArray(getTargetField(r, 'toptracks.track'));
					var track_list = [];
					if (tracks.length) {
						var l = Math.min(tracks.length, paging_opts.page_limit);
						for (var i=paging_opts.remainder; i < l; i++) {
							var cur = tracks[i];
							track_list.push({
								artist : cur.artist.name,
								track: cur.name,
								lfm_image: {
									array: cur.image
								}
							});
						}

					}
					pl.putRequestedData(request_info.request, track_list, r.error);


				})
				.fail(function() {
					pl.requestComplete(request_info.request, true);
				})
				.always(function() {
					request_info.done = true;
				});

			return request_info;
		});
		return pl;
	},
	search: function(query){
		var old_v = this.state('search_query');
		if (query != old_v){
			if (!query) {
				this.showStartPage();
			} else {
				this.showResultsPage(query);
			}

		}
		this.updateState('search_query', query);
	}

});

})();