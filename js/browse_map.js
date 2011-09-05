var big_map = {
	newMap: function(){
		this.current_map = new browseMap();
	},
	freezeCurrentMap: function(){
		this.freezed_map = this.current_map.freezeMapOfLevel(10);
	}	
};


var mapLevel = function(num, map, parent_levels, resident){
	this.num = num;
	this.map = map;
	this.parent_levels = parent_levels;
	this.context = {};
	if (resident){
		this.resident = new resident();
	}
	this.storage = {};
};
mapLevel.prototype = {
	setResident: function(resident){
		this.resident = resident;
	},
	D: function(key, value){
		if (!value){
			return this.storage[key];
		} else {
			this.storage[key] = value;
		}
	},
	getResident: function(){
		return this.resident;
	},
	getURL: function(){
		return this.url || '';
	},
	setURL: function(url){
		this.url = url || '';
	},
	testByURL: function(url){
		if (this.url == url){
			return this;
		}	
	},
	testByPlaylistPuppet: function(puppet){
		var pl = this.D('pl');
		if (pl && pl.compare(puppet)){
			return this;
		}
	},
	testByQuery: function(query){
		var pl = this.D('pl');
		if (pl && this.D('q') == query){
			return this;
		}	
	},
	getFullURL: function(){
		var u='';
		for (var i=0; i < this.parent_levels.length; i++) {
			u += this.parent_levels[i].getURL();
		};
		return u + this.getURL();
	},
	
	freeze: function(){
		return this.map.freezeMapOfLevel(this.num);
	},
	show: function(){
		if (this.resident){
			this.resident.show();
		} else{
			var ui = this.D('ui');
			if (ui && ui.show){
				ui.show();
			}
		}
		
	},
	hide: function(){
		if (this.resident){
			this.resident.hide();
		} else{
			var ui = this.D('ui');
			if (ui && ui.hide){
				ui.hide();
			}
		}
		
	},
	kill: function(){
		if (this.resident){
			this.resident.kill();
		} else{
			var ui = this.D('ui');
			if (ui && ui.remove){
				ui.remove();
			}
			var pl = this.D('pl');
			if (pl && pl.kill){
				pl.kill();
			}
		
		}
		delete this.map;
	}
	
};

function browseMap(){
	this.levels = [];
	//zoom levels
	
	// -1, not using, start page
	//0 - search results
	//1 - playlist page
	//today seesu has no deeper level
}
browseMap.prototype= {
	findURL: function(level, url, only_freezed, only_free){
		var f = this.levels[level] && this.levels[level].free != this.levels[level].freezed &&  this.levels[level].free;
		var fz = this.levels[level] && this.levels[level].freezed;
		return (!only_freezed && !!f && f.testByURL(url)) || (!only_free && !!fz && fz.testByURL(url));
	},
	findLevelOfPlaylist: function(level, puppet, only_freezed){
		var f = this.levels[level] && this.levels[level].free != this.levels[level].freezed &&  this.levels[level].free;
		var fz = this.levels[level] && this.levels[level].freezed;
		
		return (!only_freezed && !!f && f.testByPlaylistPuppet(puppet)) || (!!fz && fz.testByPlaylistPuppet(puppet));
	},
	findLevelOfSearchQuery: function(level, query){
		var f = this.levels[level] && this.levels[level].free != this.levels[level].freezed &&  this.levels[level].free;
		var fz = this.levels[level] && this.levels[level].freezed;
		
		return (!!f && f.testByQuery(query)) || (!!fz && fz.testByQuery(query));
	},
	getLevel: function(num){
		if (this.levels[num]){
			return this.levels[num].free || this.levels[num].freezed;
		} else{
			return false;// maybe better return this.getFreeLevel(num);
		}
	},
	getFreeLevel: function(num, skip_levels_above, resident){
		var _this = this;
		if (!this.levels[num]){
			this.levels[num] = {};
		}
		if (this.levels[num].free && this.levels[num].free != this.levels[num].freezed){
			//&& !this.levels[num].freezed
			return this.levels[num].free;
		} else{
			var parent_levels = (function(){
				var lvls = [];
				
				//from deep levels to top levels;
				
				for (var i = num-1; i > -1; i--){
					if (!skip_levels_above || i < num - skip_levels_above){
						lvls.push(_this.getLevel(i));
					}
				};
				
				return 	lvls;
			})();
			
			return this.levels[num].free = new mapLevel(num, this, parent_levels, resident);
		}
	},
	freezeMapOfLevel : function(num){
		var fresh_freeze = false;
		var l = (num < this.levels.length) ? num : (this.levels.length - 1);
		for (var i = l; i >= 0; i--){
			if (this.levels[i]){
				if (this.levels[i].free){
					if (this.levels[i].free != this.levels[i].freezed){
						if (this.levels[i].freezed){
							this.levels[i].freezed.kill();
							delete this.levels[i].freezed;
						}
						this.levels[i].freezed = this.levels[i].free;
						this.levels[i].freezed.freezed = true;
						fresh_freeze = true
					}	
				}
				delete this.levels[i].free;
			}
			
			
		};
		
		//clearing if have too much levels
		if (l < this.levels.length -1) {
			for (var i=0; i < this.levels.length; i++) {
				if (this.levels[i].free){
					this.levels[i].free.kill();
					delete this.levels[i].free
				}
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
		for (var i=0; i < this.levels.length; i++) {
			if (this.levels[i]){
				if (this.levels[i].freezed){
					this.levels[i].freezed.show();
				}
			}
		};
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
	sliceToLevel: function(num){
		if (num < this.levels.length){
			for (var i = this.levels.length-1; i > num; i--){
				this.hideLevel(i);
			};
		}
		
	}
	
}