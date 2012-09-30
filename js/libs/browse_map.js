var
	browseMap,
	mapLevelModel;

(function() {
"use strict";

var mapLevel = function(num, parent_levels, resident, map){
	this.num = num;
	this.map = map;
	this.parent_levels = parent_levels;
	if (resident){
		this.setResident(resident);
		resident.assignMapLev(this);
		resident.trigger('mpl-attach');
	}
	return this;
};

Class.extendTo(mapLevel, {
	setResident: function(resident){
		this.resident = resident;
	},
	getResident: function(){
		return this.resident;
	},
	matchURL: function(url){
		return this.url && this.url == url;
	},
	getParentLev: function(){
		return this.parent_levels[0] || ((this.num > -1) && this.map.levels[-1].free);
	},
	show: function(opts){
		var o = opts || {};
		o.closed = this.closed;
		if (!opts.zoom_out){
			var parent = this.getParentLev();
			if (parent){
				parent.resident.blur();
			}
		}
		
		this.resident.show(o);
	},
	hide: function(){
		this.resident.hide();
	},
	die: function(){
		this.resident.mlmDie();
		this.resident.trigger('mpl-detach');
		delete this.map;
	},
	_sliceTM: function(transit, url_restoring){ //private alike
		var aycocha = this.map.isCollectingChanges();
		if (!aycocha){
			this.map.startChangesCollecting();
		}
		



		//this.map.clearShallow(this);
		this.map.sliceDeepUntil(this.num, true, transit, url_restoring);

		if (!aycocha){
			this.map.finishChangesCollecting();
		}
	},
	zoomOut: function() {
		//this.map.clearShallow(this);
		this._sliceTM();
	},
	sliceTillMe: function(transit, url_restoring){
		this._sliceTM(transit, url_restoring);
	},
	freeze: function(){
		if (this.isOpened()){
			this.map.freezeMapOfLevel(this.num);
		}
		
	},
	getResurrectedClone: function(){
		var current = this;
		while (current.clone && !current.canUse()) {
			current = current.clone;
			this.clone = current;
		}
		if (current.canUse()){
			return current;
		} else{
			return null;
		}
	},
	canUse: function(){
		return !!this.map;	
	},
	isOpened: function(){
		return !!this.map && !this.closed;
	}
	
});


browseMap = function (){};

provoda.Eventor.extendTo(browseMap, {
	init: function(maleres){
		this._super();
		this.levels = [];
		if (!maleres){
			throw new Error('give me 0 index level (start screen)');
		}
		this.mainLevelResident = maleres;
		this.changes_collection = [];
		//zoom levels
		
		// -1, start page
		//0 - search results
		//1 - playlist page
		//today seesu has no deeper level
		return this;
	},
	isCollectingChanges: function() {
		return this.collecting_changes;
	},
	startChangesCollecting: function() {
		if (this.collecting_changes){
			throw new Error('already collecting');
		} else {
			this.collecting_changes = true;
			
		}
	},
	finishChangesCollecting: function() {
		if (!this.collecting_changes){
			throw new Error('none to finish');
		} else {
			this.collecting_changes = false;
			this.emitChanges();
		}
	},
	addChange: function(change) {
		this.changes_collection.push(change);
		if (!this.collecting_changes){
			this.emitChanges();
		}
	},
	emitChanges: function() {
		if (this.changes_collection.length){
			this.trigger('changes', this.changes_collection);
			this.changes_collection = [];
		}
		
	},
	makeMainLevel: function(){
		this.setLevelPartActive(this.getFreeLevel(-1, false, this.mainLevelResident), {userwant: true});
		return this;
	},
	getLevel: function(num){
		if (this.levels[num]){
			return this.levels[num].free || this.levels[num].freezed;
		} else{
			return false;// maybe better return this.getFreeLevel(num);
		}
	},
	getActiveLevelNum: function(){
		return this.current_level_num;
	},
	setLevelPartActive: function(lp, opts){
		opts = opts || {};
		lp.show(opts);
		if (opts.userwant && !opts.transit){
			this.updateNav(lp, opts.url_restoring);
		}
		
		this.current_level_num = lp.num;
	},
	resurrectLevel: function(lev, transit, url_restoring){
		var nlev = lev.clone = this._goDeeper(true, lev.getResident(), transit, url_restoring);
		return nlev;
	},
	_goDeeper: function(orealy, resident, transit, url_restoring){
		var cl = this.getActiveLevelNum();
		if (orealy){

			//this.sliceDeepUntil(cl, false, true);
		}  else{
			//this.sliceDeepUntil(-1, false, true);
			this.clearCurrent();
		}
		cl = this.getFreeLevel(orealy ? cl + 1 : 0, orealy, resident);
		this.setLevelPartActive(cl, {userwant: true, transit: transit, url_restoring: url_restoring});
		
		return cl;
		
	},
	goDeeper: function(orealy, resident){
		return this._goDeeper(orealy, resident);
	},
	createLevel: function(num, parent_levels, resident){
		return new mapLevel(num, parent_levels, resident, this);
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
	getFreeLevel: function(num, save_parents, resident){//goDeeper
		if (!this.levels[num]){
			this.levels[num] = {};
		}
		if (this.levels[num].free && this.levels[num].free != this.levels[num].freezed){
			return this.levels[num].free;
		} else{
			var parent_levels = save_parents ? this.getCurrentShallowLevelsAsParents(num) : [];
			return this.levels[num].free = this.createLevel(num, parent_levels, resident);
		}
	},
	freezeMapOfLevel : function(num){
		var
			i,
			fresh_freeze = false,
			l = Math.min(num, this.levels.length - 1);

		for (i = l; i >= 0; i--){
			if (this.levels[i]){
				if (this.levels[i].free){
					if (this.levels[i].free != this.levels[i].freezed){
						if (this.levels[i].freezed){ //removing old freezed
							this.levels[i].freezed.die();
							delete this.levels[i].freezed;
						}
						this.levels[i].freezed = this.levels[i].free;
						this.levels[i].freezed.closed = true;
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
		return fresh_freeze;
	},
	findDeepestActiveFreezed: function() {
		var
			target,
			f_lvs = $filter(this.levels, 'freezed'),
			current_lev = this.getLevel(this.getActiveLevelNum()),
			active_tree = [current_lev].concat(current_lev.parent_levels);

		for (var i = 0; i < active_tree.length; i++) {
			if (f_lvs.indexOf(active_tree[i]) != -1){
				target = active_tree[i];
				break;
			}
			
		}
		return target;

	},
	restoreFreezed: function(transit, url_restoring){
		//this.hideMap();
		var defzactv = this.findDeepestActiveFreezed();
		var f_lvs = $filter(this.levels, 'freezed');

		if (defzactv){
			this.clearShallow(defzactv, true);
		} else {
			this.hideMap(true);
		}

		var dfa_pos = defzactv ? f_lvs.indexOf(defzactv) : 0;

		for (var i=dfa_pos; i < f_lvs.length; i++) {
			this.setLevelPartActive(f_lvs[i], {
				userwant: (i == f_lvs.length - 1), 
				transit: transit, 
				url_restoring: url_restoring
			});
		}

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
	updateNav: function(tl, url_restoring){
		var lvls = [tl].concat(tl.parent_levels);
		//if (tl != this.getLevel(-1)){
		//	lvls.push(this.getLevel(-1));
		//}
		//if (tl){
			tl.resident.stackNav(false);
	//	}
		

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
		this.setNavTree(lvls, url_restoring);
	},
	setNavTree: function(tree, url_restoring) {
		var old_tree = this.nav_tree;
		if (old_tree){
			this.old_nav_tree = old_tree;
		}
		this.nav_tree = tree;
		var 
			url_changed = this.setCurrentURL(tree, old_tree, url_restoring),
			title_changed = this.setCurrentNav(tree, old_tree, url_restoring);
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
				!!url_restoring, title_changed);
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
		return n && $filter(n, 'resident');
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
	refreshTitle: function(s_num) {
		this.setTitle(this.joinNavTitle(this.getTitleNav(this.nav_tree)));
		return this;
	},
	setCurrentURL: function(new_tree, old_tree, url_restoring) {
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
				old_tree[i].off('url-change', this.onNavUrlChange); //unbind
			}
		}

		new_tree = this.getTreeResidents(new_tree);
		for (i = 0; i < new_tree.length; i++) {
			new_tree[i].on('url-change', this.onNavUrlChange);
		}
		return this.setURL(this.joinNavURL(new_tree), false, url_restoring);
	},
	joinNavURL: function(nav) {
		var url = [];
		nav = nav.slice().reverse();

		for (var i = 0; i < nav.length; i++) {
			var url_part = nav[i].getURL();
			if (url_part){
				url.push(url_part);
			}
			nav[i].setFullUrl(url.join(''));
		}
		return url.join('');
	},
	setURL: function(url, replace, url_restoring) {
		var _this = this;
		return this.sProp('cur_url', url, function(nv, ov) {
			if (!url_restoring){
				_this.trigger('url-change', nv, ov || "", _this.getCurMapL(), replace);
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
	replaceURL: function(s_num) {
		this.setURL(this.joinNavURL(this.getTreeResidents(this.nav_tree)), true);
		return this;
	},

	clearShallow: function(lev, only_free){
	//	var exept_levels = [].concat(lev, lev.parent_levels);
	//		exept_levels.reverse();


		for (var i = this.levels.length - 1; i > lev.num; i--) {
			this.hideLevel(this.levels[i], false, only_free);
			
		}
			/*

		for (var i = this.levels.length - 1; i >= 0; i--) {
			this.levels[i]
		}*/
		
	//	for (var i=0; i < this.levels.length; i++) {
	//		var cur = this.levels[i];
	//		this.hideLevel(cur, exept_levels[i], only_free);
	//	}
	},
	sliceDeepUntil: function(num, fullhouse, transit, url_restoring){
		var
			current_lev = this.getLevel(this.getActiveLevelNum()),
			target_lev;

		if (num < this.levels.length){
			for (var i = this.levels.length-1; i > num; i--){
				this.hideLevel(this.levels[i]);
			}
		}
		target_lev = this.getLevel(num);
		if (target_lev && target_lev != current_lev){
		//	throw new Error('fix nav!');
			this.setLevelPartActive(target_lev, {userwant: fullhouse, transit: transit, url_restoring: url_restoring, zoom_out: true});
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
	startNewBrowse: function(url_restoring){
		this.clearCurrent();
		this.setLevelPartActive(this.getLevel(-1), {
			userwant: true, 
			transit: false, 
			url_restoring: url_restoring
		});
		/*var
			current_lev = this.getLevel(this.getActiveLevelNum()),
			current_levs = [current_lev].concat(current_lev.parent_levels);

*/
		//this.sliceDeepUntil(-1, true, false, url_restoring);
	}
	
});
mapLevelModel = function() {};

provoda.Model.extendTo(mapLevelModel, {
	assignMapLev: function(lev){
		this.lev = lev;
		this.map_level_num = this.lev.num;
		if (this.onMapLevAssign){
			this.onMapLevAssign();
		}
		return this;	
	},
	mlmDie: function(){
		this.die();
		this.lev.map.addChange({
			target: this,
			type: 'die'
		});
	},
	hide: function() {
		this.updateState('mp-show', false);
		this.lev.map.addChange({
			target: this,
			type: 'hide'
		});
		return this;
	},
	show: function(opts) {
		this.focus();
		this.updateState('mp-show', opts || true);
		this.lev.map.addChange({
			target: this,
			type: 'show'
		});
		return this;
	},
	blur: function() {
		//this.stackNav(false);
		this.updateState('mp-has-focus', false);
		this.lev.map.addChange({
			target: this,
			type: 'blur'
		});
		return this;
	},
	focus: function() {
	//	this.stackNav(false);
		this.updateState('mp-has-focus', true);
		this.lev.map.addChange({
			target: this,
			type: 'focus'
		});
		return this;
	},
	stackNav: function(stack_v){
		this.updateState('mp-stack', stack_v);
		return this;
	},
	zoomOut: function() {
		if (this.lev && (this.state('mp-stack') || (this.state('mp-show')) )){
			this.lev.zoomOut();
		}
	},
	setFullUrl: function(url) {
		this.updateState('mp-full-url', url);
	},
	getTitle: function() {
		return this.state('nav-title');
	},
	onTitleChange: function(cb) {
		return this.on('state-change.nav-title', cb);
	},
	offTitleChange: function(cb) {
		return this.off('state-change.nav-title', cb);
	},
	getURL: function() {
		return '';	
	}
});
})();