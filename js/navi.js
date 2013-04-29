define(['app_env', 'spv'], function(app_env, spv) {
'use strict';

if (app_env.needs_url_history) {
	if ('onhashchange' in window){
		(function(){
			var hash = location.hash.replace(/^\#/, '');
			spv.addEvent(window, 'hashchange', function(e){
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
var navi;
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
		init: function() {
			if (!this.binded){
				this.binded = true;
			}
		},
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
			var parts = url.match(tag_regexp);
			var tag = parts && parts[0],
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
return navi;
});