if (app_env.needs_url_history) {
	if ('onhashchange' in window){
		(function(){
			var hash = location.hash.replace(/^\#/, '');
			window.onhashchange = function(e){
				e = e || window.Event;
				var newhash = location.hash.replace(/^\#/, '');
				if (newhash != hash){
					var hnew = e.newURL || newhash;
					var hold = e.oldURL || hash;
					var have_new_hash = hnew.indexOf('#')+1;
					var have_old_hash = hold.indexOf('#')+1;

					var o = {
						newURL: have_new_hash ? hnew.slice(have_new_hash) : '',
						oldURL: have_old_hash ? hold.slice(have_old_hash) : ''
					};


					var too_fast_hash_change = (o.newURL != newhash);
					if (!too_fast_hash_change){
						if (typeof hashchangeHandler == 'function'){
							hashchangeHandler(o);
						}
						hash = newhash;
					}
					
				}
			};
		})();
		
	} else{
		(function(){
			var hash = location.hash;
			setInterval(function(){
				var newhash = location.hash;
				if (newhash != hash){
					if (typeof hashchangeHandler == 'function'){
						hashchangeHandler({
							newURL: newhash.replace(/^\#/, ''),
							oldURL: hash.replace(/^\#/, '')
						});
					}
					
					hash = newhash;
				}
				
			},150);
		})();
	}
}


(function() {
	var getURLBase = function(){
		var cbase;
		if (location.href.indexOf('#') > -1){
			cbase = location.href.slice(0, location.href.indexOf('#'));
		} else{
			cbase = location.href;
		}
		return cbase;
	};
	var zerofy = function(str, digits){
		str = "" + str;
		if (digits){
			while (str.length < digits){
				str = 0 + str;
			}
		}
		return str;
	};
	var tag_regexp = /\ ?\$...$/;
	navi = {
		counter: Math.round((Math.random() * parseInt('zzz', 36))),
		states_index: {},
		fake_current_url:'',
		getUniqId: function(){
			var uniq_tag = (uniq_tag = (this.counter++).toString(36)) && zerofy(uniq_tag.substring(uniq_tag.length-3, uniq_tag.length), 3);
			return uniq_tag;
		},
		setFakeURL: function(url){
			if (this.fake_current_url != url){
				this.fake_current_url = url;
			}
		},
		getFakeURL: function(){
			return this.fake_current_url;
		},
		getURLData: function(url){
			var tags		= (tag = url.match(tag_regexp)) && tag[0],
				clear_url	= url.replace(tag_regexp, ''),
				uniq_url	= url + (tag || (' $' + this.getUniqId()));

			return {
				clear_url: clear_url,
				uniq_url: uniq_url
			};
		},
		_saveHistory: function(url, data, old_url){
		
			var fakeud = this.getURLData(this.fake_current_url);
			var replace;
			
			if (old_url){
				
				var oldud = this.getURLData(old_url);
					replace = fakeud.clear_url == oldud.clear_url;
			}
			
			var ud = this.getURLData(url);
			if ((fakeud.clear_url !=  ud.clear_url) || replace){
				if (!this.states_index[ud.uniq_url]){
					this.setFakeURL(ud.uniq_url);
					this.states_index[ud.uniq_url] = {
						date: new Date(),
						url: ud.clear_url,
						data: data
					};
					if (!replace){
						location.assign(getURLBase() + '#' + ud.uniq_url);
					} else{
						location.replace(getURLBase() + '#' + ud.uniq_url);
					}
					
				}
			}
			
			
		},
		set: function(url, data){
			this._saveHistory(url, data);
		},
		replace: function(oldurl, url, data){
			this._saveHistory(url, data, oldurl);
		},
		findHistory: function(url){
			return this.states_index[url];
		}
		
	};
})();




/*
catalog
users
tags
*/
var separatePathParts = function(pth) {
	for (var i = 0; i < pth.length; i++) {
		pth[i] = {
			original_part: pth[i].replace(/([^\/])\+/g, '$1 ')
		};
	}
	return pth;
};

var routePath = function(pth_string, route_tree) {
	var pth = pth_string.replace(/([^\/])\+/g, '$1 ')/*.replace(/^\//,'')*/.split('/');
	//
	//separatePathParts(pth);
	

	var cur_brch = route_tree; //current_branch
	var created_md;

	var full_path = [];

	for (var i = 0; i < pth.length; i++) {
		var cur = pth[i];
		var path_opts;
		var path_name;
		if (!cur_brch){
			break;
		}
		
		if (cur_brch.parse_opts){
			var path_name_parts = cur.split('?');
			path_name = path_name_parts[0];
			if (path_name_parts[1]){
				path_opts = app_serv.get_url_parameters(path_name_parts[1], true);
			}
		} else {
			path_name = cur;
		}
		var selected_path;

		if (cur_brch && cur_brch.names && cur_brch.names[path_name]){
			selected_path = cur_brch.names[path_name];
		} else if (cur_brch.other){
			selected_path = cur_brch.other;
		}

		if (!selected_path){
			break;
		} else {
			full_path.push({

				selected_path: selected_path,
				path_name: decodeURIComponent(path_name),
				path_opts: path_opts || {},
				sub_paths: pth.slice(i+1)
			});
			cur_brch = selected_path.branch;
		}

	}
	return full_path;
};
var routeAppByPath = function(full_path) {
	var result;
	for (var i = 0; i < full_path.length; i++) {
		var cur = full_path[i];
		if (cur.selected_path.fn){
			result = cur.selected_path.fn(cur.path_name, cur.path_opts, cur.sub_paths, result);
		}
	}
};


var route_tree = {
	//before first slash (#?q=be/tags/beautiful) ----- ?q=be
	parse_opts: true,
	other: {
		fn: function(path_name, opts) {
			su.showStartPage();
			if (opts.query){
				return su.showResultsPage(opts.query);
			} else {
				return su.start_page;
			}
		},
		branch: {//next
			names: {
				'catalog': {
					branch: {
						other: {
							fn: function(path_name, opts, sub_paths, parent_md) {
								//artist name
								return su.showArtcardPage(path_name, parent_md);
							},
							branch: {
								names: {
									'_': {
										fn: function(path_name, opts, sub_paths, parent_md) {
											var track_name = sub_paths && sub_paths[0];
											parent_md.showTopTacks(track_name);
										}
									},
									'+similar': {
										fn: function(path_name, opts, sub_paths, parent_md) {
											parent_md.showSimilarArtists();
										},
										branch: {
											names: {
												'~': {
													fn: function() {

													}
												}
											}
										}
									}
								},
								other: {
									//albums
									fn: function(path_name, opts, sub_paths, parent_md) {
										/*
										parent_md.showAlbum({
											album_name: path_name
										});*/
									},
									branch: {
										other: {
											//artist name and track
											fn: function() {

											}
										}
									}
								}
							}
						}
					}
				},
				'tags': {
					branch: {
						other: {
							fn: function(path_name, opts, sub_paths, parent_md) {
								su.show_tag(path_name, parent_md);
							},
							branch: {
								names: {
									'songs': {
										fn: function() {

										},
										branch: {
											names: {
												'_': {

												}
											}
										}
									},
									'artists': {
										fn: function() {

										},
										branch: {
											names: {
												'_': {

												},
												'week': {

												}
											}
										}

									},
									'albums': {
										fn: function() {

										},
										branch: {
											names: {
												'_': {
													fn: function() {

													}
												}
											}
										}
									},
									'tags': {
										fn: function() {

										}
									}
								}
							}
						}
					}
				},
				'users': {
					branch: {
						name: {
							'me': {
								fn: function() {

								},
								branch: {
									names: {
										'recommendations': {

										},
										'loved': {

										}
									}
								}
							}
						},
						other: {
							fn: function() {

							}
						}
					}
				},
				'conductor': {

				}
			}
		}
	}
};

/*
#/catalog/The+Killers/_/Try me
#?q=be/tags/beautiful
#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Phone+Call
#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Beastie+boys/Phone+Call
#/catalog/The+Killers/+similar/Beastie+boys/Phone+Call
#/recommendations/Beastie+boys/Phone+Call
#/loved/Beastie+boys/Phone+Call
#/radio/artist/The+Killers/similarartist/Bestie+Boys/Intergalactic
#?q=be/directsearch/vk/345345
'artists by loved'
#/ds/vk/25325_2344446
http://www.lastfm.ru/music/65daysofstatic/+similar
*/



var gunm = function(lev){
	var levs = [].concat(lev, lev.parent_levels),
		live_levs = [],
		dead_levs = [];
		
	levs.reverse();
	
	for (var i=0; i < levs.length; i++) {
		var cur = levs[i];
		if (cur && !dead_levs.length){
			if (cur.canUse()){
				live_levs.push(cur);
			} else{
				var liveclone = cur.getResurrectedClone();
				if (liveclone){
					live_levs.push(liveclone);
				} else{
					dead_levs.push(cur);
				}
				
			}
			
		} else{
			dead_levs.push(cur);
		}
	}
	return {
		live: live_levs,
		dead: dead_levs
	};
	// есть живые предки то восстанавливаем их


};

var routePathByModels = function(pth_string, start_page) {
	var pth = pth_string.replace(/^\//, '').replace(/([^\/])\+/g, '$1 ')/*.replace(/^\//,'')*/.split('/');

	var cur_md = start_page;
	var tree_parts_group = null;
	for (var i = 0; i < pth.length; i++) {
		if (cur_md.sub_pages_routes && cur_md.sub_pages_routes[pth[i]]){
			if (!tree_parts_group){
				tree_parts_group = [];
			}
			tree_parts_group.push(pth[i]);
			continue;
		} else {
			var path_full_string;
			if (tree_parts_group){
				path_full_string = [].concat(tree_parts_group, [pth[i]]).join('/');
			} else {
				path_full_string = pth[i];
			}
			tree_parts_group = null;
			var md = cur_md.findSPbyURLPart(path_full_string);
			if (md){
				cur_md = md;
			} else {
				break;
			}

		}

		
	}
	if (cur_md){
		cur_md.showOnMap();
	}
	return cur_md;
};

var hashChangeRecover = function(e, soft){
	var url = e.newURL;
	su.map.startChangesCollecting({
		skip_url_change: true
	});

	var state_from_history = navi.findHistory(e.newURL);
	if (state_from_history){
		state_from_history.data.showOnMap();
	} else{
		routePathByModels(url.replace(/\ ?\$...$/, ''), su.start_page);
		/*
		var finded_path = routePath(url.replace(/\ ?\$...$/, ''), route_tree);
		if (!finded_path.length){
			if (!soft){
				su.showStartPage();
			}
		} else {
			routeAppByPath(finded_path);
		}*/
	}
	su.map.finishChangesCollecting();
};

var hashchangeHandler=  function(e, soft){
	if (e.newURL != navi.getFakeURL()){
		navi.setFakeURL(e.newURL);
		if (e.oldURL != e.newURL){
			hashChangeRecover(e, soft);
		}
	}
};
(function(){
	var url = window.location && location.hash.replace(/^\#/,'');
	if (url){
		su.on('handle-location', function() {
			hashchangeHandler({
				newURL: url
			}, true);

		});
	}
})();