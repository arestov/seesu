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
}
browseMap.prototype= {
	getFreeLevel: function(num){
		if (!this.levels[num]){
			this.levels[num] = {};
		}
		if (this.levels[num].active && this.levels[num].free != this.levels[num].freezed){
			//&& !this.levels[num].freezed
			return this.levels[num].free;
		} else{
			return this.levels[num].free = {
				map: this
				freeze: function(){
					return this.map.freezeMapOfLevel(num);
				},
				kill: function(){
					
				}
				
			};
		}
	},
	freezeMapOfLevel : function(num){
		var l = (num < this.levels.length) ? num : (this.levels.length - 1);
		for (var i = l; i >= 0; i--){
			if (this.levels[i].free){
				if (this.levels[i].free != this.levels[i].freezed){
					if (this.levels[i].freezed){
						this.levels[i].freezed.kill();
					}
					this.levels[i].freezed = this.levels[i].free;
				}	
			}
			delete this.levels[i].free;
			
		};
		return this;
	},
	hideLevel: function(i){
		if (this.levels[i]){
			if(this.levels[i].freezed && this.levels[i].freezed.ui && this.levels[i].freezed.ui.hide){
				this.levels[i].freezed.ui.hide();
			}
			if(this.levels[i].free){
				this.levels[i].free.kill();
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
			for (var i = this.levels.length; i > num; i--){
				this.hideLevel(i);
			};
		}
		
	},
	
	getSearchResultsContainer: function(){
		var c = this.getLevel(0);
		if (c.ui){
			return c.ui;
		} else{
			return c.ui = new searchResultsUI();
		}
	},
	
	
	getPlaylistContainer: function(){
		var c = this.getLevel(1);
		if (c.ui){
			return c.ui;
		} else{
			return c.ui = new playlistUI();
		}
	}
}