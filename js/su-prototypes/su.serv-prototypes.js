var suMapModel = function() {};

mapLevelModel.extendTo(suMapModel, {
	regDOMDocChanges: function(cb) {
		this
			.on('mpl-attach', function() {
				jsLoadComplete(function() {
					su.on('dom', cb);
				});
				
			})
			.on('mpl-detach', function() {
				jsLoadComplete(function() {
					su.off('dom', cb);
				});
			});
	}
});



var suServView = function() {};

servView.extendTo(suServView, {
	init: function() {
		this._super();

		var _this = this;
		var onDOMDie = function(currend_doc, dead_doc) {
			_this.isAlive();
		};
		su.on('dom-die', onDOMDie);
		this.onDie(function() {
			su.off(onDOMDie);	
		});
	},
	getCNode: function(c) {
		return (c = this.getC()) && (typeof length != 'undefined' ? c[0] : c);
	},
	isAlive: function() {
		if (this.dead){
			return false;
		} else {
			if (this.getC()){
				var c = this.getCNode();
				if (c && getDefaultView(c.ownerDocument)){
					return true;
				} else {
					this.markAsDead();
					return false;
				}
			} else {
				return true;
			}
			
			
		}
	}
});

var gMessagesStore = function(set, get) {
	this.sset = set;
	this.sget = get;
	this.store = this.sget() || {};
	this.cm_store = {};
};

Class.extendTo(gMessagesStore, {
	set: function(space, message) {
		this.store[space] = this.store[space] || [];
		if ( this.store[space].indexOf(message) == -1 ){
			this.store[space].push(message);
			this.sset(this.store);
			return true;
		}
	},
	get: function(space) {
		return this.store[space];
	},
	getStore: function(name) {
		return this.cm_store || (this.cm_store = new commonMessagesStore(this, name));
	}
});

var commonMessagesStore = function(glob_store, store_name) {
	this.callParentMethod('init');
	this.glob_store = glob_store;
	this.store_name = store_name;
};


eemiter.extendTo(commonMessagesStore, {
	markAsReaded: function(message) {
		var changed = this.glob_store.set(this.store_name, message);
		if (changed){
			this.fire('read', message);
		}
	},
	getReadedMessages: function() {
		return this.glob_store.get(this.store_name);
	}
});



