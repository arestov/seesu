var muansPack = function(){
	this.store = {}
};
createPrototype(muansPack, new eemiter(), {
	addMuans: function(mu_ans, name){
		this.store[name] = mu_ans;
	},
	isAvailable: function() {
		for (var a in this.store){
			if (!this.store[a].isAvailable()){
				return false;
			}
		}
		return true;
	},
	canSearchBy: function(msearch) {
		var can;
		if (this.isAvailable()){
			for (var a in this.store){
				if (this.store[a].canSearchBy(msearch)){
					return true;
				}
			}
		}	
	}
});


var muAns = function(msearch) {
	this.callParentMethod('init');
	this.msearch = msearch;
};
createPrototype(muAns, new eemiter(), {
	setSearch: function() {
		this.msearch = msearch;
	},
	busy: function(state) {
		this.progress = !!state;
	},
	isBusy: function() {
		return this.progress	
	},
	reject: function(non_fixable, only_others) {
		this.error = true;
		if (non_fixable){
			this.non_fixable = true
		} else {
			if (only_others){
				this.only_others = true;
			}
		}
		this.fin = true;
		this.busy(false);
		this.fire('fail', non_fixable, only_others);
	},
	resolve: function(files) {
		delete this.error;
		files = toRealArray(files);
		if (files.length){
			this.t = files;
		}
		this.fin = true;
		this.busy(false);
		this.fire('done', this.t);
	},
	done: function(cb){
		this.on('done', cb);
	},
	fail: function() {
		this.on('fail', cb);
	},
	isComplete: function() {
		return this.fin;
	},
	isAvailable: function() {
		return 	!this.error || !this.non_fixable
	},
	canSearchBy: function(msearch) {
		if (!this.isBusy()){
			if (this.isComplete()) {
				if (this.error){
					if (this.non_fixable){
						return false;
					} else {
						if (this.only_others){
							if (this.msearch == msearch){
								return false
							} else {
								return true
							}
						} else {
							return true;
						}
					}
				} else {
					return false;
				}
			} else {
				return true;
			}
		}
	}
});

var fileInTorrent = function(query, torrent_link){

}


var findTorrentMP3Song = function(song) {
	$.ajax({
		global: false,
		type: "GET",
		dataType: "jsonp",
		url: "http://ajax.googleapis.com/ajax/services/search/web?cx=001069742470440223270:ftotl-vgnbs",
		data: {
			v: "1.0",
			q: "allintext:" + song + '.mp3'
		},
		error:function(){
			console.log('google search requset error')
		},
		success: function(r){
			console.log(r);
			
		}
	});
};