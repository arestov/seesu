var commonMessagesStore = function(glob_store, store_name) {
	this.init();
	this.glob_store = glob_store;
	this.store_name = store_name;
};


provoda.Eventor.extendTo(commonMessagesStore, {
	markAsReaded: function(message) {
		var changed = this.glob_store.set(this.store_name, message);
		if (changed){
			this.trigger('read', message);
		}
	},
	getReadedMessages: function() {
		return this.glob_store.get(this.store_name);
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
		return this.store[space] || [];
	},
	getStore: function(name) {
		return this.cm_store[name] || (this.cm_store[name] = new commonMessagesStore(this, name));
	}
});




var PartsSwitcher = function() {};

provoda.Model.extendTo(PartsSwitcher, {
	init: function() {
		this._super();
		this.context_parts = {};
		this.active_part = null;
	},
	hideAll: function() {
		if (this.active_part){
			this.updateState('active_part', false);
			this.active_part.deacivate();
			this.active_part = null;
		}
	},
	hide: function(name){
		if (this.context_parts[name] === this.active_part){
			this.hideAll();
		}
	},
	addPart: function(model) {
		if (!this.context_parts[model.row_name]){
			this.context_parts[model.row_name] = model;
			this.addChild(model);

			var array = this.getChild('context_parts') || [];
			array.push(model);
			this.setChild('context_parts', array, true);

		}
	},
	getAllParts: function(){
		return this.context_parts;
	},
	switchPart: function(name) {
		if (this.context_parts[name] && this.context_parts[name] != this.active_part){
			if (this.active_part){
				this.active_part.deacivate();
			}
			this.active_part = this.context_parts[name];
			this.updateState('active_part', name);
			this.active_part.acivate();
			
	
		} else {
			this.hideAll();
		}
	}
});

var ActionsRowUI = function(){};
provoda.View.extendTo(ActionsRowUI, {
	createDetailes: function(){
		this.createBase();
	},
	'collch-context_parts': function(name, arr) {
		var _this = this;
		$.each(arr, function(i, el){
			var md_name = el.row_name;
			_this.getFreeChildView(md_name, el, 'main');
		});

		this.requestAll();
	},
	state_change: {
		active_part: function(nv, ov) {
			if (nv){
				this.row_context.removeClass('hidden');
				this.arrow.removeClass('hidden');
			} else {
				this.row_context.addClass('hidden');
			}
		}
	}
});



var BaseCRowUI = function(){};
provoda.View.extendTo(BaseCRowUI, {
	bindClick: function(){
		if (this.button){
			var md = this.md;
			this.button.click(function(){
				md.switchView();
			});
		}
	},
	getButtonPos: function(){
		var button_shift = this.button_shift || 0;
		return this.button.offset().left + (this.button.outerWidth()/2) + button_shift;
	},
	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
			var b_pos = this.getButtonPos();
			if (b_pos){
				var arrow = this.parent_view.arrow;
				arrow.css('left', b_pos - arrow.offsetParent().offset().left + 'px');
			}
			this.c.removeClass('hidden');
		} else {
			this.c.addClass('hidden');
		}
	}

});

var BaseCRow = function(){};
provoda.Model.extendTo(BaseCRow, {
	switchView: function(){
		this.actionsrow.switchPart(this.row_name);
	},
	hide: function(){
		this.actionsrow.hide(this.row_name);
	},
	deacivate: function(){
		this.updateState("active_view", false);
	},
	acivate: function(){
		this.updateState("active_view", true);
	}
});