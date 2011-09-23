

var mapLevel = function(num, map, parent_levels, resident, getNavData){
	var _this = this;
	this.num = num;
	this.map = map;
	this.parent_levels = parent_levels;
	this.getNavData = getNavData;
	this.storage = {};
	
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
	historyStep: function(){
		navi.set(this.getFullURL(), this.history_data);
	},
	setTitle: function(text){
		if (this.getNav()){
			this.getNav().text(text);
		}
		this.title = text;
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
	buildResident: function(){
		this.resident = new this.residentC(this.storage);
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
	setURL: function(url, make_history_step, data){
		this.url = url || '';
		this.history_data = data;
		if (make_history_step){
			this.historyStep();
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
	testByPlaylistPuppet: function(puppet){
		var pl = this.getResident() && this.getResident().D && this.getResident().D('pl');
		if (pl && pl.compare(puppet)){
			return this;
		}
	},
	testByQuery: function(query){
		var pl = this.getResident() && this.getResident().D && this.getResident().D('pl');
		if (pl && this.D('q') == query){
			return this;
		}	
	},
	getFullURL: function(){
		var u='';
		for (var i = this.parent_levels.length - 1; i >= 0; i--){
			u += this.parent_levels[i].getURL();
		};
		return u + this.getURL();
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
	kill: function(){
		this.getResident().kill();
		if (this.getNav()){
			this.getNav().kill();
		}
		delete this.map;
	},
	_sliceTM: function(make_history_step, transit){ //private alike
		this.map.sliceToLevel(this.num, true, transit, make_history_step);	
	},
	sliceTillMe: function(transit){
		this._sliceTM(false, transit);
	},
	freeze: function(){
		this.map.freezeMapOfLevel(this.num);
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
	goShallow: function(to){ //up!
		this.sliceToLevel(to.num, true);
	},
	goDeeper: function(orealy, resident){
		var cl = this.getActiveLevelNum();
		if (orealy){
			this.sliceToLevel(cl, false, true);
		}  else{
			this.sliceToLevel(-1, false, true);
		}
		cl = this.getFreeLevel(orealy ? cl + 1 : 0, orealy, resident);
		this.setLevelPartActive(cl, {userwant: true});
		return cl;
		
	},
	getFreeLevel: function(num, save_parents, resident){//goDeeper
		var _this = this;
		if (!this.levels[num]){
			this.levels[num] = {};
		}
		if (this.levels[num].free && this.levels[num].free != this.levels[num].freezed){
			return this.levels[num].free;
		} else{
			var parent_levels = (function(){
				var lvls = [];
				
				//from deep levels to top levels;
				if (save_parents){
					for (var i = Math.min(_this.levels.length, num) - 1; i > -1; i--){
						lvls.push(_this.getLevel(i));
					};
				}
				return 	lvls;
			})();
			
			return this.levels[num].free = new mapLevel(num, this, parent_levels, resident, this.getNavData);
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
							this.levels[i].freezed.kill();
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
					this.levels[i].freezed.kill();
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
	hideLevel: function(i){
		if (this.levels[i]){
			if (this.levels[i].freezed){ 
				this.levels[i].freezed.hide();
			}
			if (this.levels[i].free){
				this.levels[i].free.kill();
				delete this.levels[i].free;
			}
		}
	},
	hideMap: function(){
		for (var i=0; i < this.levels.length; i++) {
			this.hideLevel(i);
		};
	},
	updateNav: function(tl){
		var lvls = [].concat(tl.parent_levels);
		if (tl != this.getLevel(-1)){
			lvls.push(this.getLevel(-1));
		}
		lvls.reverse();
		tl.getNav().setInactive();
		
		var prev = lvls.pop();
		if (prev){
			prev.getNav().setActive(lvls.length);
		}
		if (lvls.length){
			while (lvls.length){
				lvls.pop().getNav().stack( lvls.length == 0 ? 'bottom' : 'middle');
			}
		}
		
	},
	sliceToLevel: function(num, fullhouse, transit, make_history_step){
		if (num < this.levels.length){
			for (var i = this.levels.length-1; i > num; i--){
				this.hideLevel(i);
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
		this.sliceToLevel(-1, true, false, make_history_step);
	}
	
}