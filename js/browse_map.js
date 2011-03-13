var big_map = {
	newMap: function(){
		this.current_map = new browseMap();
	},
	freezeCurrentMap: function(){
		this.freezed_map = this.current_map.freezeMapOfLevel(10);
	},
	
}

function browseMap(){
	this.levels = [];
	// -1, not using, start page
	//0 - search results
	//1 - playlist page
	//today seesu has no deeper level
}
browseMap.prototype= {
	getLevel: function(num){
		if (this.levels[num]){
			return this.levels[num].free || this.levels[num].freezed;
		} else{
			return false;// maybe better return this.getFreeLevel(num);
		}
	},
	getFreeLevel: function(num){
		var _this = this;
		if (!this.levels[num]){
			this.levels[num] = {};
		}
		if (this.levels[num].free && this.levels[num].free != this.levels[num].freezed){
			//&& !this.levels[num].freezed
			return this.levels[num].free;
		} else{
			return this.levels[num].free = {
				context:{},
				map: this,
				freeze: function(){
					return this.map.freezeMapOfLevel(num);
				},
				kill: function(){
					if(this.ui && this.ui.remove){
						this.ui.remove();
					}
				}
				
			};
		}
	},
	freezeMapOfLevel : function(num){
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
					}	
				}
				delete this.levels[i].free;
			}
			
			
		};
		return this;
	},
	restoreFreezed: function(){
		this.hideMap();
		for (var i=0; i < this.levels.length; i++) {
			if (this.levels[i]){
				if(this.levels[i].freezed && this.levels[i].freezed.ui && this.levels[i].freezed.ui.show){
					this.levels[i].freezed.ui.show();
				}
			}
		};
	},
	hideLevel: function(i){
		if (this.levels[i]){
			if(this.levels[i].freezed && this.levels[i].freezed.ui && this.levels[i].freezed.ui.hide){
				this.levels[i].freezed.ui.hide();
			}
			if(this.levels[i].free){
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