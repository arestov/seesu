define(['provoda', 'spv'], function(provoda, spv) {
"use strict";
var MapLevel = function(num, parent_levels, resident, map){
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
	show: function(opts){
		this.map.addChange({
			type: 'move-view',
			target: this.resident.getMDReplacer(),
			value: opts
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
		delete this.map;
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

provoda.Eventor.extendTo(BrowseMap, {
	init: function(maleres){
		this._super();
		this.levels = [];
		if (!maleres){
			throw new Error('give me 0 index level (start screen)');
		}
		this.mainLevelResident = maleres;


		this.cha_counter = 0;
		this.chans_coll = [];

		return this;
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
			},
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
			delete this.changes_group;
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
					cur.value = {
						userwant: true
					};
					this.updateNav(cur.target.getMD().lev, opts);
				} else {
					cur.value = {
						userwant: false,
						transit: true
					};
				}
			}


			this.trigger('changes', {
				array: this.chans_coll,
				anid: this.cha_counter
			});
			this.chans_coll = [];
			this.chans_coll.anid = ++this.cha_counter;
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
		lp.show({});
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
							delete this.levels[i].freezed;
						}
						this.levels[i].freezed = this.levels[i].free;
						this.levels[i].freezed.markAsFreezed();
						fresh_freeze = true;
					}
				}
				delete this.levels[i].free;
			}
			
			
		}

		
		//clearing if have too much levels !?!?!??!?!?!
		if (l + 1 < this.levels.length -1) {
			for (i= l + 1; i < this.levels.length; i++) {
				if (this.levels[i].freezed){
					this.levels[i].freezed.die();
					delete this.levels[i].freezed;
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
			delete lev.free;
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
	sProp: function(name, nv, cb) {
		if (this[name] != nv){
			var ov = this[name];
			this[name] = nv;
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
				old_tree[i].off('state-change.url_part', this.onNavUrlChange); //unbind
			}
		}

		new_tree = this.getTreeResidents(new_tree);
		for (i = 0; i < new_tree.length; i++) {
			new_tree[i].on('state-change.url_part', this.onNavUrlChange, {
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

BrowseMap.Model = function() {};

provoda.HModel.extendTo(BrowseMap.Model, {
	init: function(opts) {
		this._super(opts);
		opts = opts || {};
		if (!this.skip_map_init){
			if (opts.nav_opts){
				if (opts.nav_opts['url_part']){
					this.init_states['url_part'] = opts.nav_opts['url_part'];
				}
				if (opts.nav_opts['nav_title']){
					this.init_states['nav_title'] = opts.nav_opts['nav_title'];
				}
			}
		}
	},
	getSPOpts: function(name) {
		var parts = name.split(':');
		var obj = {
			url_part: '/' + name,
			simple_name: name,
			name_spaced: parts[1]
		};
		var target = this.sub_pa[name];
		var title = target.title || (target.getTitle && target.getTitle.call(this));
		if (title){
			obj['nav_title'] = title;
		}
		return obj;
	},
	findSPbyURLPart: function(name) {
		return this.getSPI(name, true);
	},
	getSPI: function(name, init) {
		var instance;

		if (this.sub_pages[name]){
			instance = this.sub_pages[name];

		}
		if (!instance){
			var target = this.sub_pa && this.sub_pa[name];
			if (target){
				var Constr = target.constr || target.getConstr.call(this);
				instance = new Constr();

				instance.init_opts = [spv.cloneObj({
					map_parent: this,
					app: this.app
				}, {
					nav_opts: this.getSPOpts(name)
				})];
				if (this.sub_pa_params){
					instance.init_opts.push(this.sub_pa_params);
				}

				this.sub_pages[name] = instance;
			} else {
				if (this.subPager){

					instance = this.subPager(decodeURIComponent(name), name);
				}
			}
		}
		
		if (instance && init){
			instance.initOnce();
		}
		return instance;
	},
	initListedModels: function(array) {
		this.lists_list = array;
		this.initSubPages(this.lists_list);
		this.updateNesting('lists_list', this.lists_list);
		this.updateNesting('preview_list', this.lists_list);
		this.bindChildrenPreload();
	},
	initSubPages: function(array) {
		for (var i = 0; i < array.length; i++) {
			var instance = this.getSPI(array[i]);
			instance.initOnce();
			array[i] = instance;
		}
	},
	initItems: function(lists_list, opts, params) {
		for (var i = 0; i < lists_list.length; i++) {
			lists_list[i].init(opts, params);
		}
	},
	bindChildrenPreload: function(array) {
		var lists_list = array || this.lists_list;
		this.on('vip-state-change.mp_show', function(e) {
			if (e.value && e.value.userwant){
				for (var i = 0; i < lists_list.length; i++) {
					var cur = lists_list[i];
					if (cur.preloadStart){
						cur.preloadStart();
					}

				}
			}
		});
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
		return this.on('vip-state-change.nav_title', cb, {skip_reg: true, immediately: true});
	},
	offTitleChange: function(cb) {
		return this.off('vip-state-change.nav_title', cb);
	},
	getURL: function() {
		return '';
	}
});
return BrowseMap;
});