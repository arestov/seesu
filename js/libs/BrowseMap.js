define(['pv', 'spv'], function(pv, spv) {
"use strict";
var MapLevel = function(num, parent_levels, resident, map){
	this.closed = null;
	this.resident = null;
	this.num = num;
	this.map = map;
	this.parent_levels = parent_levels;
	if (resident){
		this.setResident(resident);
		
	}
	return this;
};

spv.Class.extendTo(MapLevel, {
	setResident: function(resident){
		this.resident = resident;
		//resident.updateState('');
		resident.assignMapLev(this);
		resident.trigger('mpl-attach');
		this.map.addResident(this.resident);
	},
	getResident: function(){
		return this.resident;
	},
	getParentLev: function(){
		return this.parent_levels[0] || ((this.num > -1) && this.map.levels[-1].free);
	},
	getParentResident: function() {
		var parent = this.getParentLev();
		return parent && parent.resident;
	},
	show: function(){
		this.map.addChange({
			type: 'move-view',
			target: this.resident.getMDReplacer(),
			value: true
		});
	},
	hide: function(){
		this.map.addChange({
			type: 'zoom-out',
			target: this.resident.getMDReplacer()
		});
	},
	die: function(){
		this.map.addChange({
			type: 'destroy',
			target: this.resident.getMDReplacer()
		});
		this.resident.trigger('mpl-detach');
		this.map.removeResident(this.resident);
		this.map = null;
	},
	_sliceTM: function(){ //private alike
		var current_level = this.map.getCurrentLevel();
		if (current_level == this){
			return;
		}
		var aycocha = this.map.isCollectingChanges();
		if (!aycocha){
			this.map.startChangesCollecting();
		}

		var just_started = this.map.startChangesGrouping('zoom-out', true);
		this.map.sliceDeepUntil(this.num);
		if (just_started){
			this.map.finishChangesGrouping('zoom-out');
		}

		if (!aycocha){
			this.map.finishChangesCollecting();
		}
	},
	zoomOut: function() {
		this._sliceTM();
	},
	sliceTillMe: function(){
		this._sliceTM();
	},
	markAsFreezed: function() {
		this.closed = true;
		this.resident.updateState('mp_freezed', true);
	},
	freeze: function(){
		if (this.isOpened()){
			this.map.freezeMapOfLevel(this.num);
		}
		
	},
	canUse: function(){
		return !!this.map;
	},
	isOpened: function(){
		return !!this.map && !this.closed;
	}
	
});


var BrowseMap = function (){};

pv.Eventor.extendTo(BrowseMap, {
	init: function(maleres){
		this._super();

		this.changes_group = null;
		this.grouping_changes = null;
		this.residents_tree_change = null;
		this.collecting_changes = null;
		this.current_level_num = null;
		this.old_nav_tree = null;
		this.nav_tree = null;
		this.onNavTitleChange = null;
		this.onNavUrlChange = null;


		
		this.levels = [];
		if (!maleres){
			throw new Error('give me 0 index level (start screen)');
		}
		this.mainLevelResident = maleres;


		this.cha_counter = 0;
		this.chans_coll = [];
		this.residents = [];



		return this;
	},
	addResident: function(resident) {
		if (this.residents.indexOf(resident) == -1){
			this.residents.push(resident);
			this.residents_tree_change = true;
		}
	},
	removeResident: function(resident) {
		var clean_array = spv.arrayExclude(this.residents, resident);
		if (clean_array.length != this.residents){
			this.residents = clean_array;
			this.residents_tree_change = true;
		}

	},
	isGroupingChanges: function() {
		return this.grouping_changes;
	},
	startChangesGrouping: function(group_name, soft_allowed) {
		if (this.grouping_changes){
			if (!soft_allowed){
				throw new Error('already grouping');
			}
			
		} else {
			this.changes_group = {
				name: group_name,
				changes: []
			};
			this.grouping_changes = true;
			return true;
		}
	},
	finishChangesGrouping: function(group_name) {
		if (!this.grouping_changes){
			throw new Error('none to finish');
		} else {
			this.grouping_changes = false;
			this.emitChangesGroup(group_name);
		}
	},
	emitChangesGroup: function(group_name) {
		if (this.changes_group.name != group_name){
			throw new Error('wrong changes group name');
		}
		if (this.changes_group.changes.length){

			this.chans_coll.push(this.changes_group);
			this.changes_group = null;
			if (!this.isCollectingChanges()){
				this.emitChanges();
			}
		}
	},
	addChangeToGroup: function(change) {
		if (this.grouping_changes){
			this.changes_group.changes.push(change);
		} else {
			var last_group = this.chans_coll[this.chans_coll.length-1];
			if (last_group && !last_group.name){
				last_group.changes.push(change);
			} else {
				throw new Error('unknow changes');
			}
		}
	},
	isCollectingChanges: function() {
		return !!this.collecting_changes;
	},
	startChangesCollecting: function(soft_allowed, opts) {
		if (this.collecting_changes){
			if (!soft_allowed){
				throw new Error('already collecting');
			}
			
		} else {
			this.collecting_changes = opts || {};
			return true;
			
		}
	},
	finishChangesCollecting: function() {
		if (!this.collecting_changes){
			throw new Error('none to finish');
		} else {
			var opts = this.collecting_changes;
			this.collecting_changes = false;
			this.emitChanges(opts);
		}
	},
	addChange: function(change) {
		this.addChangeToGroup(change);
		if (!this.collecting_changes){
			this.emitChanges();
		}
	},
	zipChanges: function() {
		var
			cur,
			prev,
			zipped = [];

		for (var i = 0; i < this.chans_coll.length; i++) {
			if (cur){
				if (!prev || cur.name != prev.name){
					prev = cur;
				}
			}
			
			cur = this.chans_coll[i];
			if (prev && cur.name == prev.name){
				prev.changes = prev.changes.concat(cur.changes);
				prev.zipped=  true;
			} else {
				zipped.push(cur);
			}
		}
		if (zipped.length < this.chans_coll.length){
			this.chans_coll = zipped;
		}
	},
	emitChanges: function(opts) {
		opts = opts || {};
		if (this.chans_coll.length){
			this.zipChanges();

			var all_changes = spv.filter(this.chans_coll, 'changes');
			var big_line = [];
			for (var i = 0; i < all_changes.length; i++) {
				big_line = big_line.concat(all_changes[i]);
			}
			var move_view_changes = spv.filter(big_line, 'type', 'move-view');

			for (var jj = 0; jj < move_view_changes.length; jj++) {
				var cur = move_view_changes[jj];
				if (jj == move_view_changes.length -1){
					//cur.value = true;
					this.updateNav(cur.target.getMD().lev, opts);
				} else {
					//cur.value = true;
				}
			}

			var changed_residents;
			
			if (this.residents_tree_change){
				this.residents_tree_change = false;
				changed_residents = this.residents;
			}

			this.trigger('changes', {
				array: this.chans_coll,
				changes_number: this.cha_counter
			}, changed_residents, this.residents);
			this.chans_coll = [];
			this.chans_coll.changes_number = ++this.cha_counter;

		}
		
	},
	makeMainLevel: function(){
		this.startChangesGrouping('zoom-in');
		this.setLevelPartActive(this.getFreeLevel(-1, false, this.mainLevelResident));
		this.finishChangesGrouping('zoom-in');
		return this;
	},
	getCurrentLevel: function() {
		return this.getLevel(this.getActiveLevelNum());
	},
	getCurrentResident: function() {
		return this.getCurrentLevel().resident;
	},
	getLevel: function(num){
		if (this.levels[num]){
			return this.levels[num].free || this.levels[num].freezed;
		} else{
			return false;
		}
	},
	getActiveLevelNum: function(){
		return this.current_level_num;
	},
	setLevelPartActive: function(lp){
		lp.show();
		this.current_level_num = lp.num;
	},
	_goDeeper: function(resident){
		//var cl = this.getActiveLevelNum();
		var cur_res = this.getCurrentResident();
		if (cur_res == resident){
			return cur_res.lev;
		}


		var just_started_zoomout = this.startChangesGrouping('zoom-out', true);
		var parent_md = resident.map_parent;
		if (parent_md){
			//this.sliceDeepUntil(cl, false, true);
			parent_md.lev.sliceTillMe(true);
		}  else if (resident.zero_map_level){
			//this.sliceDeepUntil(-1, false, true);
			this.clearCurrent();
		} else {
			throw new Error('resident does not have map_parent');
		}
		if (just_started_zoomout){
			this.finishChangesGrouping('zoom-out');
		}
		var target_lev;
		if (resident.lev && resident.lev.canUse()){
			target_lev = resident.lev;
		} else {
			//reusing freezed;
			target_lev = this.getFreeLevel(parent_md ? parent_md.lev.num + 1 : 0, parent_md, resident);
		}

		var just_started = this.startChangesGrouping('zoom-in');
		this.setLevelPartActive(target_lev);
		if (just_started){
			this.finishChangesGrouping('zoom-in');
		}
		return target_lev;
		
	},
	goDeeper: function(resident){
		return this._goDeeper(resident);
	},
	createLevel: function(num, parent_levels, resident){
		return new MapLevel(num, parent_levels, resident, this);
	},
	getCurrentShallowLevelsAsParents: function(num){
		var lvls = [];
		//from deep levels to top levels;
		if (this.levels.length){
			var prev_lev_num = num - 1;
			if (prev_lev_num > -1){
				var prev_lev = this.getLevel(prev_lev_num);
				if (prev_lev){
					lvls.push(prev_lev);
					if (prev_lev.parent_levels.length){
						lvls = lvls.concat(prev_lev.parent_levels);
					}
				}
			}
		}
		return lvls;
	},
	getFreeLevel: function(num, parent_md, resident){//goDeeper
		if (!this.levels[num]){
			this.levels[num] = {};
		}
		if (this.levels[num].free && this.levels[num].free != this.levels[num].freezed){
			return this.levels[num].free;
		} else{
			var parent_levels;

			if (parent_md){
				var parents_of_parent = parent_md.lev.parent_levels;
				parent_levels = [];
				if (parent_md.lev != this.getLevel(-1)){
					parent_levels.push(parent_md.lev);
					//throw new Error('start level can\'t be parent')
					//parent_levels = [parent_md.lev];
				}
				
				if (parents_of_parent && parents_of_parent.length){
					parent_levels = parent_levels.concat(parents_of_parent);
				}
			} else {
				parent_levels = [];
			}
			return this.levels[num].free = this.createLevel(num, parent_levels, resident);
		}
	},
	freezeMapOfLevel : function(num){
		var
			i,
			fresh_freeze = false,
			l = Math.min(num, this.levels.length - 1);

		this.startChangesGrouping('freezing');

		for (i = l; i >= 0; i--){
			if (this.levels[i]){
				if (this.levels[i].free){
					if (this.levels[i].free != this.levels[i].freezed){
						if (this.levels[i].freezed){ //removing old freezed
							this.levels[i].freezed.die();
							this.levels[i].freezed = null;
						}
						this.levels[i].freezed = this.levels[i].free;
						this.levels[i].freezed.markAsFreezed();
						fresh_freeze = true;
					}
				}
				this.levels[i].free = null;
			}
			
			
		}

		
		//clearing if have too much levels !?!?!??!?!?!
		if (l + 1 < this.levels.length -1) {
			for (i= l + 1; i < this.levels.length; i++) {
				if (this.levels[i].freezed){
					this.levels[i].freezed.die();
					this.levels[i].freezed = null;
				}
				
			}
		}
		this.finishChangesGrouping('freezing');
		return fresh_freeze;
	},
	checkLRCI: function(lev, Constructor) { //checkLevelResidentInstance
		if (lev && lev.getResident() instanceof Constructor){
			return lev.getResident();
		}
	},
	findViewingResInstance: function(Constructor) {
		var matched = [];
		var freezed;
		var free;

		for (var i = 0; i < this.levels.length; i++) {
			var cur = this.levels[i];
			if (!freezed){
				freezed = this.checkLRCI(cur.freezed, Constructor);

			}
			if (!free){
				free = this.checkLRCI(cur.free, Constructor);
			}
		}
		if (free){
			matched.push(free);
		}
		if (freezed){
			matched.push(freezed);
		}
		

		return matched;
	},
	findDeepestActiveFreezed: function() {
		var
			target,
			f_lvs = spv.filter(this.levels, 'freezed'),
			current_lev = this.getCurrentLevel(),
			active_tree = [current_lev].concat(current_lev.parent_levels);

		for (var i = 0; i < active_tree.length; i++) {
			if (f_lvs.indexOf(active_tree[i]) != -1){
				target = active_tree[i];
				break;
			}
		}

		return target;

	},
	restoreFreezedLev: function(lev) {
		//this.hideMap();
		var defzactv = this.findDeepestActiveFreezed();
		var f_lvs = spv.filter(this.levels, 'freezed');

		var target_lev_pos;
		if (lev) {
			target_lev_pos = f_lvs.indexOf(lev);
			if (target_lev_pos == -1){
				throw new Error('lev was not freezed!?');
			}
		} else {
			target_lev_pos = f_lvs.length - 1;
		}
		var stop_pos = target_lev_pos + 1;

		var just_started_zoomout = this.startChangesGrouping('zoom-out', true);
		if (defzactv){
			this.clearShallow(defzactv, true);
		} else {
			this.hideMap(true);
		}
		if (just_started_zoomout){
			this.finishChangesGrouping('zoom-out');
		}

		var dfa_pos = defzactv ? f_lvs.indexOf(defzactv) : 0;

		var just_started_zoomin = this.startChangesGrouping('zoom-in', true);
		for (var i= dfa_pos; i < stop_pos; i++) {
			/*
			если "замороженный" уже отображается, то его родителям
			не нужно устанавливать "активный" статус

			поэтому находим верхнего родителя и начинаем устанавливать статусы с него
			*/
			this.setLevelPartActive(f_lvs[i]);
		}
		if (just_started_zoomin){
			this.finishChangesGrouping('zoom-in');
		}
	},
	restoreFreezed: function(){
		this.restoreFreezedLev();
	},
	hideFreeLevel: function(lev, exept) {
		if (lev.free && lev.free != exept){
			lev.free.die();
			lev.free = null;
		}
	},
	hideLevel: function(lev, exept, only_free){
		if (lev){
			if (!only_free){
				if (lev.freezed && lev.freezed != exept){
					lev.freezed.hide();
				}
			}
			
			this.hideFreeLevel(lev, exept);
			
		}
	},
	hideMap: function(only_free){
		for (var i = this.levels.length - 1; i >= 0; i--) {
			this.hideLevel(this.levels[i], false, only_free);
		}
	},
	sProp: function(prop_name, nv, cb) {
		if (this[prop_name] != nv){
			var ov = this[prop_name];
			this[prop_name] = nv;
			if (cb) {
				cb(nv, ov);
			}
			return {nv: nv, ov: ov};
		}
	},
	updateNav: function(tl, urlop){
		var lvls = [tl].concat(tl.parent_levels);
		tl.resident.stackNav(false);

		var prev = lvls[1];
		if (prev){
			//if (lvls[2]){
				// this is top of stack, but only we have "stack";
				prev.resident.stackNav('top');
				this.getLevel(-1).resident.stackNav(true);
			//}
		} else {
			this.getLevel(-1).resident.stackNav(false);
		}

		for (var i = 2; i < lvls.length; i++) {
			lvls[i].resident.stackNav( i + 1 === lvls.length ? 'bottom' : 'middle');
		}
		this.setNavTree(lvls, urlop);
	},
	setNavTree: function(tree, urlop) {
		var old_tree = this.nav_tree;
		if (old_tree){
			this.old_nav_tree = old_tree;
		}
		this.nav_tree = tree;
		var
			url_changed = this.setCurrentURL(tree, old_tree, urlop),
			title_changed = this.setCurrentNav(tree, old_tree, urlop);
		if (url_changed){
				
			this.trigger('nav-change',
				{
					url: url_changed.nv || "",
					map_level: this.getCurMapL()
				},
				{
					url: url_changed.ov || "",
					map_level: this.getPrevMampL()
				},
				!!urlop.skip_url_change, title_changed);
		}
		this.trigger("map-tree-change", this.nav_tree, this.old_nav_tree);
		

	},
	getPrevMampL: function() {
		return this.old_nav_tree && this.old_nav_tree[0];
	},
	getCurMapL: function() {
		return this.nav_tree[0];
	},
	getTreeResidents: function(n) {
		return n && spv.filter(n, 'resident');
	},
	getTitleNav: function(n) {
		return n && (n = this.getTreeResidents(n)) && n.slice(0, 2);
	},
	setCurrentNav: function(new_nav, old_nav) {
		var _this = this;
		if (!this.onNavTitleChange){
			this.onNavTitleChange = function() {
				var cur_nav = _this.getTitleNav(_this.nav_tree);
				var s_num = cur_nav.indexOf(this);
				if (s_num != -1){
					_this.refreshTitle(s_num);
				}
			};
		}
		old_nav = this.getTitleNav(old_nav);


		var i;

		if (old_nav){
			for (i = 0; i < old_nav.length; i++) {
				old_nav[i].offTitleChange( this.onNavTitleChange); //unbind
			}
		}

		new_nav = this.getTitleNav(new_nav);

		for (i = 0; i < new_nav.length; i++) {
			new_nav[i].onTitleChange(this.onNavTitleChange);
		}

		return this.setTitle(this.joinNavTitle(new_nav));
	},
	setTitle: function(new_title) {
		var _this = this;
		return this.sProp('cur_title', new_title, function(nv, ov) {
			_this.trigger('title-change', nv, ov);
		});
	},
	joinNavTitle: function(nav) {
		var nav_t = [];
		for (var i = 0; i < nav.length; i++) {
			if (nav[i].getTitle){
				nav_t.push(nav[i].getTitle());
			}
		}
		return nav_t.join(' ← ');
	},
	refreshTitle: function() {
		this.setTitle(this.joinNavTitle(this.getTitleNav(this.nav_tree)));
		return this;
	},
	setCurrentURL: function(new_tree, old_tree, urlop) {
		var _this = this;
		if (!this.onNavUrlChange){
			this.onNavUrlChange = function() {
				var cur_nav = _this.getTreeResidents(_this.nav_tree);
				var s_num = cur_nav.indexOf(this);
				if (s_num != -1){
					_this.replaceURL(s_num);
				}
			};
		}
		old_tree = this.getTreeResidents(old_tree);
		var i;
		if (old_tree){
			for (i = 0; i < old_tree.length; i++) {
				old_tree[i].off('state_change-url_part', this.onNavUrlChange); //unbind
			}
		}

		new_tree = this.getTreeResidents(new_tree);
		for (i = 0; i < new_tree.length; i++) {
			new_tree[i].on('state_change-url_part', this.onNavUrlChange, {
				skip_reg: true
			});
		}
		return this.setURL(this.joinNavURL(new_tree), false, urlop);
	},
	joinNavURL: function(nav) {
		var url = [];
		nav = nav.slice().reverse();

		for (var i = 0; i < nav.length; i++) {
			var url_part = nav[i].state('url_part');
			if (url_part){
				url.push(url_part);
			}
			//nav[i].setFullUrl(url.join(''));
		}
		return url.join('');
	},
	setURL: function(url, replace, urlop) {
		urlop = urlop || {};
		var _this = this;
		return this.sProp('cur_url', url, function(nv, ov) {
			if (!urlop.skip_url_change){
				_this.trigger('url-change', nv, ov || "", _this.getCurMapL(), replace || urlop.replace_url);
			}
			_this.trigger(
				'every-url-change',
				{
					url: nv,
					map_level: _this.getCurMapL()
				},
				{
					url: ov || "",
					map_level: _this.getPrevMampL()
				},
				replace
			);

		});
	},
	replaceURL: function() {
		this.setURL(this.joinNavURL(this.getTreeResidents(this.nav_tree)), true);
		return this;
	},

	clearShallow: function(lev, only_free){
		for (var i = this.levels.length - 1; i > lev.num; i--) {
			this.hideLevel(this.levels[i], false, only_free);
			
		}
	},
	sliceDeepUntil: function(num){
		var
			current_lev = this.getCurrentLevel(),
			target_lev;

		if (num < this.levels.length){
			for (var i = this.levels.length-1; i > num; i--){
				this.hideLevel(this.levels[i]);
			}
		}
		target_lev = this.getLevel(num);
		if (target_lev && target_lev != current_lev){
		//	throw new Error('fix nav!');
			this.setLevelPartActive(target_lev);
		}
	},
	clearCurrent: function() {
		var current_num = this.getActiveLevelNum();
		if (current_num != -1){
			for (var i = current_num; i >= 0; i--) {
				this.hideLevel(this.levels[i]);
				
			}
		}
	},
	startNewBrowse: function(){

		var just_started_zoomout = this.startChangesGrouping('zoom-out', true);
		
		this.clearCurrent();
		this.setLevelPartActive(this.getLevel(-1));
		if (just_started_zoomout){
			this.finishChangesGrouping('zoom-out');
		}
	}
	
});



BrowseMap.routePathByModels = function(start_md, pth_string, need_constr) {

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
		#/ds/vk/25325_2344446
		http://www.lastfm.ru/music/65daysofstatic/+similar
		*/
		var pth = pth_string.replace(/^\//, '').replace(/([^\/])\+/g, '$1 ')/*.replace(/^\//,'')*/.split('/');

		var cur_md = start_md;
		var result = cur_md;
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

				if (need_constr) {
					var Constr = cur_md.getSPIConstr(path_full_string);
					if (!Constr) {
						throw new Error('you must use supported path');
					} else {
						cur_md = Constr.prototype;
						result = Constr;
					}

				} else {
					var md = cur_md.getSPI(path_full_string);
					if (md){
						cur_md = md;
						result = md;
					} else {
						break;
					}
				}
				

			}


		}
		return result;
};










BrowseMap.Model = function() {};

var getSPOpts = function(md, sp_name) {
	var target = md[ 'sub_pa-' + sp_name] || md.sub_pa[sp_name];
	var parts = sp_name.split(':');


	return [
		{
			url_part: '/' + sp_name,
			nav_title: target.title || (target.getTitle && target.getTitle.call(md))
		},
		{
			simple_name: sp_name,
			name_spaced: parts[1]
		}];
};

var getInitData = function(md, common_opts) {
	var pre_instance_data = {};
				
	
	var params_from_parent = md.data_by_hp === true ? md.head_props : md.sub_pa_params;

	var data_parts = [
		params_from_parent,
		common_opts && common_opts[0]
	];

	for (var i = 0; i < data_parts.length; i++) {
		if (!data_parts[i]) {
			continue;
		}
		spv.cloneObj(pre_instance_data, data_parts[i]);
	}

	return pre_instance_data;
};

var getDeclrConstr = function(app, md, item) {
	if (typeof item == 'function') {
		return item;
	} else {
		return md.getConstrByPathTemplate(app, item);
	}
};

var getRightNestingName =function(md, nesting_name) {
	if (md.preview_nesting_source && nesting_name == 'preview_list') {
		nesting_name = md.preview_nesting_source;
	} else if (nesting_name == md.preview_mlist_name){
		nesting_name = md.main_list_name;
	}
	return nesting_name;
};


var getNestingConstr = function(app, md, nesting_name) {
	nesting_name = getRightNestingName(md, nesting_name);


	if (md[ 'nest_rqc-' + nesting_name ]) {
		var target = md[ 'nest_rqc-' + nesting_name ];
		if (Array.isArray(target)) {
			if (!target.constrs_array) {
				var result = [];
				var index = target[1];
				for (var prop in index) {
					if (!index.hasOwnProperty(prop)) {
						continue;
					} else {
						result.push( index[prop] );
					}
					
				}
				target.constrs_array = result;
			}
			
			return target.constrs_array;
		} else {
			return target;
		}
		
	} else if (md[ 'nest_posb-' + nesting_name ]) {
		return md[ 'nest_posb-' + nesting_name ];
	} else if (md[ 'nest-' + nesting_name]) {

		var declr = md[ 'nest-' + nesting_name];
		var items = declr[0];

		if (Array.isArray(items)) {
			var result = [];
			for (var i = 0; i < items.length; i++) {
				result.push(getDeclrConstr(app, md, items[i]));
			}
			return result;
		} else {
			return getDeclrConstr(app, md, items);
		}
		
	}
	
	
	
};


var getModelSources = function(app, md, cur) {
	var states_sources = [];
	var i;
	var states_list = cur.merged_states;
	var unfolded_states = new Array(states_list.length);
	for (i = 0; i < states_list.length; i++) {
		unfolded_states[i] = md.getNonComplexStatesList(states_list[i]);
	}

	unfolded_states = spv.collapseAll.apply(null, unfolded_states);
	
	for (i = 0; i < unfolded_states.length; i++) {
		var state_name = unfolded_states[i];
		var arr = md.getStateSources(state_name, app);
		if (arr) {
			states_sources.push(arr);
		}
		

	}
	states_sources = spv.collapseAll.apply(null, states_sources);

	var nestings_names_list = [];

	var nesting_name;
	for (nesting_name in cur.m_children.children_by_mn) {
		nestings_names_list.push(nesting_name);
	}
	for (nesting_name in cur.m_children.children) {
		nestings_names_list.push(nesting_name);
	}

	nestings_names_list = spv.collapseAll(nestings_names_list);

	var nesting_sources = [];
	for (i = 0; i < nestings_names_list.length; i++) {
		var source = md.getNestingSource(nestings_names_list[i], app);
		if (source) {
			nesting_sources.push(source);
		}
	}


	var all_nest_sources =[];

	for (nesting_name in cur.m_children.children) {
		var items = getNestingConstr(app, md, nesting_name);
		for (var space_name in cur.m_children.children[nesting_name]) {
			
			var constr_sources;
			if (!items) {
				continue;
			}
			if (Array.isArray(items)) {
				constr_sources = [];
				for (i = 0; i < items.length; i++) {
					var cur_sources = getModelSources(app, items[i].prototype, cur.m_children.children[nesting_name][space_name]);
					if (cur_sources.length) {
						constr_sources = constr_sources.concat(cur_sources);
					}
				}
			} else {
				constr_sources = getModelSources(app, items.prototype, cur.m_children.children[nesting_name][space_name]);
			}

			if (constr_sources) {
				all_nest_sources = all_nest_sources.concat(constr_sources);
			}
		}
		
	}





	/*
	a) итерируем по названиям гнезд,
		получаем список или один конструктор для нужного гнезда
		совмещаем данные

	б) итерируем по названиям гнезд
		получаем список или один конструктор для нужного гнезда
		вычленяем по имени модели только используемые конструкторы


	*/

	var full_sources_list = states_sources.concat(nesting_sources);
	if (all_nest_sources.length) {
		full_sources_list = full_sources_list.concat(all_nest_sources);
	}
	return  spv.collapseAll(full_sources_list);
};

var strucs_cache = {};

pv.HModel.extendTo(BrowseMap.Model, {
	init: function(opts, data) {
		this._super.apply(this, arguments);

		this.lists_list = null;
		this.lev = null;
		this.map_level_num = null;
		this.head_props = this.head_props || null;


		if (this.hp_bound && !data) {
			throw new Error('pass data arg!');
		} else {
			if (this.head_props) {
				console.log('already has head_props');
			} else if (this.hp_bound) {
				
				var complex_obj = {
					'--data--': null
				};
				if (this.map_parent.sub_pa_params) {
					spv.cloneObj(complex_obj, this.map_parent.sub_pa_params);
				}

				complex_obj['--data--'] = data;

				this.head_props = this.hp_bound(complex_obj);
			}
		}

		opts = opts || {};
		if (!this.skip_map_init){
			if (data) {
				if (data['url_part']){
					this.init_states['url_part'] = data['url_part'];
				}
				if (data['nav_title']){
					this.init_states['nav_title'] = data['nav_title'];
				}
			}
		}

		if (this.data_by_hp && typeof this.data_by_hp == 'function') {
			this.sub_pa_params = this.data_by_hp(data);
		}

		
		
		if (this.allow_data_init) {
			this.updateManyStates(data);
		}

		if (this.preview_nesting_source) {
			this.on('child_change-' + this.preview_nesting_source, function(e) {
				this.updateNesting('preview_list', e.value);
			});
		}
	},
	preview_nesting_source: 'lists_list',
	getSTRC: function() {
		return strucs_cache[this.constr_id];
	},
	handleViewingDataStructure: function(struc) {
		if (!strucs_cache[this.constr_id]) {
			strucs_cache[this.constr_id] = {};
			//console.log(struc);
			var result = {};
			for (var space_name in struc) {
				result[space_name] = getModelSources(this.app, this, struc[space_name]);
				//var cur = struc[space_name];
			}
			strucs_cache[this.constr_id] = result;
			//console.log(this.model_name, this.constr_id, result);
			
		}
		this.updateState('map_slice_view_sources', [this._network_source, strucs_cache[this.constr_id]]);
		return strucs_cache[this.constr_id];

	},
	getSPIConstr: function(sp_name) {
		var target = this['sub_pa-' + sp_name] || (this.sub_pa && this.sub_pa[sp_name]);
		if (target){
			return target.constr;
		} else if (this.subPager){
			var result = this.getSPC(decodeURIComponent(sp_name), sp_name);
			if (Array.isArray(result)) {
				return result[0];
			} else {
				return result;
			}
		}
	},
	getSPI: function(sp_name) {
		var instance;
		if (this.sub_pages && this.sub_pages[sp_name]){
			instance = this.sub_pages[sp_name];
		}
		var init_opts;
		if (!instance){
			var target = this['sub_pa-' + sp_name] || (this.sub_pa && this.sub_pa[sp_name]);
			if (target){
				

				/*
				hp_bound
				data_by_urlname
				data_by_hp

				берем данные из родителя
				накладываем стандартные данные 
				накладываем данные из урла
				*/

				var Constr = target.constr;

				var common_opts = getSPOpts(this, sp_name);
				

				
				var instance_data = getInitData(this, common_opts);
				var data_by_urlname = Constr.prototype.data_by_urlname && Constr.prototype.data_by_urlname(common_opts[1]);
				spv.cloneObj(instance_data, data_by_urlname);
				init_opts = [this.getSiOpts(), instance_data];
				instance = new Constr();

				this.sub_pages[sp_name] = instance;
			} else {
				if (this.subPager){
					var sub_page = this.subPager(decodeURIComponent(sp_name), sp_name);
					if (Array.isArray(sub_page)) {
						instance = sub_page[0];
						init_opts = [this.getSiOpts(), sub_page[1]];
					} else {
						instance = sub_page;
					}
				}
			}

			if (instance && init_opts){
				this.useMotivator(instance, function(instance) {
					instance.init.apply(instance, init_opts);
				});
			}
		}
		
		
		return instance;
	},
	preloadNestings: function(array) {
		//var full_list = [];
		for (var i = 0; i < array.length; i++) {
			var md = this.getNesting(array[i]);
			if (md) {
				md.preloadStart();
			}
			
		}
	},

	assignMapLev: function(lev){
		this.lev = lev;
		this.map_level_num = this.lev.num;
		return this;
	},
	requestPage: function() {
		this.showOnMap();
	},
	showOnMap: function() {
		this.app.showMOnMap(this);
	},
	getParentMapModel: function() {
		return this.map_parent;
	},
	canUnfreeze: function() {
		return this.lev && this.lev.canUse() && !this.lev.isOpened();
	},
	mlmDie: function(){
		return;
	},
	hideOnMap: function() {
		this.updateState('mp_show', false);
	},
	stackNav: function(stack_v){
		this.updateState('mp_stack', stack_v);
		return this;
	},
	zoomOut: function() {
		if (this.lev && (this.state('mp_stack') || (this.state('mp_show')) )){
			this.lev.zoomOut();
		}
	},
	setFullUrl: function(url) {
		this.updateState('mp_full_url ', url);
	},
	getTitle: function() {
		return this.state('nav_title');
	},
	onTitleChange: function(cb) {
		return this.on('vip_state_change-nav_title', cb, {skip_reg: true, immediately: true});
	},
	offTitleChange: function(cb) {
		return this.off('vip_state_change-nav_title', cb);
	},
	getURL: function() {
		return '';
	}
});




return BrowseMap;
});