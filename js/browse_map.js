

var mapLevel = function(num, parent_levels, resident, map, getNavData, data){
	var _this = this;
	this.num = num;
	this.map = map;
	this.parent_levels = parent_levels;
	this.getNavData = getNavData;
	this.storage = {};
	if (typeof data == 'object'){
		cloneObj(this.storage, data);
	}
	
	if (resident){
		this.setResidentC(resident);
		this.buildResident();
	}
	
};
mapLevel.prototype = {
	D: function(key, value){
		if (!arguments.hasOwnProperty('1')){
			return this.storage[key];
		} else {
			this.storage[key] = value;
			if (this.getResident() && this.getResident().handleData){
				this.getResident().handleData(key, value);
			}
			return value;
		}
	},
	historyStep: function(old, replace){
		if (replace && old){
			navi.replace(this.getFullURL(old), this.getFullURL(), this)
		} else {
			navi.set(this.getFullURL(), this);
		}
		
	},
	setTitle: function(text){
		if (this.getNav()){
			this.getNav().text(text || "");
		}
		this.title = text || "";
	},
	getNav: function(){
		
		if (this.nav && (!this.nav.canUse || this.nav.canUse())){
			return this.nav;
		} else{
			return this.buildNav();
		}
	},
	buildNav: function(){
		var _this = this;
		this.nav = this.getResident().nav();
		this.nav.render(this.getNavData());
		this.nav.setClickCb(function(stacked){
			if (stacked){
				_this._sliceTM(true);
			}	
		});
		if (this.title){
			this.nav.text(this.title);
		}
		return this.nav;
	},
	setResidentC: function(residentC){
		this.residentC = residentC;
	},
	getResidentC: function(){
		return 	this.residentC;
	},
	buildResident: function(){
		this.resident = (new this.residentC(this.storage)).setLev(this);
		if (this.resident.render && this.parent_levels[0]){
			this.resident.render(this.parent_levels[0].getResident());
		}
		return this.resident;
	},
	getResident: function(){
		if (this.resident && (!this.resident.canUse || this.resident.canUse())) {
			return this.resident;
		} else{
			return this.buildResident();
		}
		return this.resident;
	},
	getURL: function(){
		return this.url || '';
	},
	setURL: function(url, make_history_step){
		var old_url = this.url || false;
		this.url = url || '';
		if (make_history_step){
			this.historyStep(old_url, !!old_url);
		}
	},
	matchURL: function(url){
		return this.url && this.url == url;
	},
	testByURL: function(url){
		if (this.url == url){
			return this;
		}	
	},
	getFullURL: function(url){
		var u='';
		for (var i = this.parent_levels.length - 1; i >= 0; i--){
			u += this.parent_levels[i].getURL();
		};
		return u + (url || this.getURL());
	},
	show: function(opts){
		var o = opts || {};
		o.closed = this.closed;
		this.getResident().show(o);
		if (this.getNav()){
			//this.nav.show();
		}
		
	},
	hide: function(){
		this.getResident().hide();
		if (this.getNav()){
			this.getNav().hide();
		}
		
	},
	die: function(){
		this.getResident().die();
		if (this.getNav()){
			this.getNav().die();
		}
		delete this.map;
	},
	_sliceTM: function(make_history_step, transit){ //private alike
		this.map.clearShallow(this);
		this.map.sliceDeepUntil(this.num, true, transit, make_history_step);	
	},
	sliceTillMe: function(transit){
		this._sliceTM(false, transit);
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
			this.clone = current
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
	
};


function browseMap(mainLevelResident, getNavData){
	
	this.levels = [];
	this.getNavData = getNavData;
	this.mainLevelResident = mainLevelResident;
	
	//zoom levels
	
	// -1, start page
	//0 - search results
	//1 - playlist page
	//today seesu has no deeper level
}
browseMap.prototype= {
	makeMainLevel: function(){
		this.setLevelPartActive(this.getFreeLevel(-1, false, this.mainLevelResident), {userwant: true});
	},
	getBothPartOfLevel: function(level_num){
		return {
			fr: this.levels[level_num] && this.levels[level_num].free != this.levels[level_num].freezed &&  this.levels[level_num].free,
			fz: this.levels[level_num] && this.levels[level_num].freezed 
		};
	},
	matchSketelon: function(skel){
		var dizmiss = {
			fr: false,
			fz: false
		};
		for (var i=0; i < skel.length; i++) {
			if (skel[i].p){
				var bilev = this.getBothPartOfLevel(i);
				if (!dizmiss.fr && bilev.fr && bilev.fr.matchURL(skel[i].p)){
					skel[i].s.fr = bilev.fr;
				} else{
					dizmiss.fr = true;
				}
				
				if (!dizmiss.fz && bilev.fz && bilev.fz.matchURL(skel[i].p)){
					skel[i].s.fz = bilev.fz;
				} else{
					dizmiss.fz = true;
				}
			} else {
				//dizmiss.fz = dizmiss.fr = true;
			}
				
		};	
		return skel;
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
		if (opts.userwant){
			this.updateNav(lp);
		}
		
		this.current_level_num = lp.num;
	},
	resurrectLevel: function(lev, set_active){
		var nlev = lev.clone = this._goDeeper(true, lev.getResidentC(), lev.storage);
			nlev.setURL(lev.getURL());
			nlev.setTitle(lev.title);
		
		if (set_active){
			this.setLevelPartActive(nlev, {userwant: true});
		}
		return nlev;
	},
	goShallow: function(to){ //up!
		this.sliceDeepUntil(to.num, true);
	},
	_goDeeper: function(orealy, resident, storage){
		var cl = this.getActiveLevelNum();
		if (orealy){
			this.sliceDeepUntil(cl, false, true);
		}  else{
			this.sliceDeepUntil(-1, false, true);
		}
		cl = this.getFreeLevel(orealy ? cl + 1 : 0, orealy, resident, storage);
		this.setLevelPartActive(cl, {userwant: true});
		return cl;
		
	},
	goDeeper: function(orealy, resident){
		return this._goDeeper(orealy, resident);
	},
	createLevel: function(num, parent_levels, resident, storage){
		return new mapLevel(num, parent_levels, resident, this, this.getNavData, storage);
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
		return 	lvls;
	},
	getFreeLevel: function(num, save_parents, resident, storage){//goDeeper
		var _this = this;
		if (!this.levels[num]){
			this.levels[num] = {};
		}
		if (this.levels[num].free && this.levels[num].free != this.levels[num].freezed){
			return this.levels[num].free;
		} else{
			var parent_levels = save_parents ? this.getCurrentShallowLevelsAsParents(num) : [];
			return this.levels[num].free = this.createLevel(num, parent_levels, resident, storage);
		}
	},
	freezeMapOfLevel : function(num){
		var fresh_freeze = false;
		var l = Math.min(num, this.levels.length - 1);
		for (var i = l; i >= 0; i--){
			if (this.levels[i]){
				if (this.levels[i].free){
					if (this.levels[i].free != this.levels[i].freezed){
						if (this.levels[i].freezed){ //removing old freezed
							this.levels[i].freezed.die();
							delete this.levels[i].freezed;
						}
						this.levels[i].freezed = this.levels[i].free;
						this.levels[i].freezed.closed = true;
						fresh_freeze = true
					}	
				}
				delete this.levels[i].free;
			}
			
			
		};
		
		//clearing if have too much levels !?!?!??!?!?!
		if (l + 1 < this.levels.length -1) {
			for (var i= l + 1; i < this.levels.length; i++) {
				if (this.levels[i].freezed){
					this.levels[i].freezed.die();
					delete this.levels[i].freezed
				}
				
			};
		}
		return fresh_freeze;
	},
	restoreFreezed: function(){
		this.hideMap();
		var f_lvs = $filter(this.levels, 'freezed');
		for (var i=0; i < f_lvs.length; i++) {
			this.setLevelPartActive(f_lvs[i], {userwant: (i == f_lvs.length - 1)});
		};
		/*
		for (var i=0; i < this.levels.length; i++) {
			var cur = this.levels[i]
			if (cur){
				if (cur.freezed){
					this.setLevelPartActive(cur.freezed, {userwant: true});
					r.push(cur.freezed)
				}
			}
		};
		
		!!!! bb, r
		console.log(bb);
		console.log(r);
		*/
	},
	hideLevel: function(lev, exept){
		if (lev){
			if (lev.freezed && lev.freezed != exept){ 
				lev.freezed.hide();
			}
			if (lev.free && lev.free != exept){
				lev.free.die();
				delete lev.free;
			}
		}
	},
	hideMap: function(){
		for (var i=0; i < this.levels.length; i++) {
			this.hideLevel(this.levels[i]);
		};
	},
	updateNav: function(tl){
		var big_title = [],
			updateTitle = function(){
				var bt = [];
				for (var i=0; i < big_title.length; i++) {
					var title = big_title[i].getNav().getTitle();
					if (title){
						bt.push(title)
					}
				};
				su.ui.setTitle(bt.join(' ← '));
			},
			pushTitle = function(lev){
				big_title.push(lev);
				lev.getNav().onTitleChange(function(){
					updateTitle();
				});
			};
		
			
		var lvls = [].concat(tl.parent_levels);
		if (tl != this.getLevel(-1)){
			lvls.push(this.getLevel(-1));
		}
		lvls.reverse();
		
		
		tl.getNav().setInactive();
		pushTitle(tl);
		
		
		var prev = lvls.pop();
		if (prev){
			prev.getNav().setActive(lvls.length);
			pushTitle(prev);
		}
		if (lvls.length){
			while (lvls.length){
				lvls.pop().getNav().stack( lvls.length == 0 ? 'bottom' : 'middle');
			}
		}
		updateTitle();
		
		
		
	},
	clearShallow: function(lev){
		var exept_levels = [].concat(lev, lev.parent_levels);
			exept_levels.reverse();
		
		for (var i=0; i < this.levels.length; i++) {
			var cur = this.levels[i];
			
			
			this.hideLevel(cur, exept_levels[i]);
		};
	},
	sliceDeepUntil: function(num, fullhouse, transit, make_history_step){
		if (num < this.levels.length){
			for (var i = this.levels.length-1; i > num; i--){
				this.hideLevel(this.levels[i]);
			};
		}
		num = this.getLevel(num);
		if (num){
			this.setLevelPartActive(num, {userwant: fullhouse, transit: transit});
			if (make_history_step){
				num.historyStep();
			}
		}
	},
	startNewBrowse: function(make_history_step){
		this.sliceDeepUntil(-1, true, false, make_history_step);
	}
	
}