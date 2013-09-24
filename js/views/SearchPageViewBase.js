define(['provoda', 'jquery'], function(provoda, $) {
"use strict";


provoda.addPrototype("baseSectionButtonView", {
	dom_rp: true,
	createItem: function(){
		this.dom_related_props = this.dom_related_props || [];
		this.a = $('<button type="button"></button>').appendTo(this.c);
		this.text_span = $("<span></span>").appendTo(this.a);
		this.dom_related_props.push('a', 'text_span');
		return this;
	},
	"stch-button_text": function(text){
		this.text_span.text(text);
	}
});


provoda.addPrototype("baseSuggestView", {
	dom_rp: true,
	createDetails: function(){
		this.createBase();
		if (this.createItem){
			this
				.createItem()
				.bindClick();
		}

	},
	'stch-active': function(state){
		if (this.a){
			if (state){
				this.a.addClass('active');
			} else {
				this.a.removeClass('active');
			}
		}
		if (this.autoscroll && state){
			var active_invstg = this.parent_view.parent_view.state('mp_show');
			if (active_invstg && !active_invstg.transit){
				this.root_view.scrollTo(this);
			}
		}
		
	},
	'stch-bordered': function(state){
		if (state){
			this.c.addClass('searched-bordered');
		} else {
			this.c.removeClass('searched-bordered');
		}
	},
	'stch-disabled': function(state){
		if (!state){
			this.c.removeClass('hidden');
		} else {
			this.c.addClass('hidden');
		}
	},
	createItem: function() {
		var that = this.mpx.md;
		this.a = $('<a></a>')
			.text(that.text_title)
			.appendTo(this.c);
		this.dom_related_props.push('a');
		return this;
	},
	createBase: function(){
		this.c = $("<li class='suggest'></li>");
		return this;
	},
	bindClick: function(){
		if (this.a){
			var _this = this;
			this.c.click(function(){
				_this.RPCLegacy('view');
			});
			this.addWayPoint(this.c);
		}
		
		return this;
	}
});

provoda.addPrototype("InvestigationView", {
	expand: function(){
		var array;
		if (this.expanded){
			return;
		} else {
			array = this.getMdChild('section');
			if (!array){
				return;
			}
			this.expanded = true;
		}
	

		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			var view = this.getFreeChildView({name: cur.model_name}, cur);
			if (view){
				this.c.append(view.getA());
			}
		}
		this.requestAll();
	},
	state_change: {
		"mp_show": function(opts) {
			if (opts){
				if (!opts.transit){
					this.expand();
				}
			} else {

			}
			this.c.toggleClass('hidden', !opts);
		},
		"can_expand": function(state) {
			if (state){
				this.expand();
			}
		},
		vis_must_be_expanded: function(state) {
			if (state){
				this.expand();
			}
		}
	},
	createBase: function() {
		this.c = $('<div class="search_results-block"></div');
	},
	die: function() {
		this._super();
	}
});

provoda.addPrototype("searchSectionView", {
	dom_rp: true,
	createDetails: function(){
		this.createCon();
		this.createHead();

		this.gc = this.header ? this.header.add(this.c) : this.c;
		this.dom_related_props.push('gs', 'header', 'message');
	},
	getC: function(){
		return this.gc;
	},
	'stch-section_title': function(state) {
		if (this.header){
			this.header.text(state);
		}
		
	},
	createHead: function(){
		this.header = $('<h4></h4>').hide();
	},
	createCon: function(){
		this.c = $('<ul></ul>');
		if (this.c_class){
			this.c.addClass(this.c_class);
		}
	},
	state_change: {
		active: function(state){
			if (state){
				this.c.addClass('active-section');
				if (this.header){
					this.header.show();
				}
				
			} else {
				this.c.removeClass('active-section');
				if (this.header){
					this.header.hide();
				}
				
			}
		},
		loading: function(state){
			if (this.header){
				if (state){
					this.header.addClass('loading');
				} else {
					this.header.removeClass('loading');
				}
			}
			
		},
		no_results_text: function(text){
			if (text) {
				if (this.message){
					this.message.remove();
				}
				this.message = $('<li></li>').text(text);
				var butn_th = this.button_view && this.button_view.getT();
				if (butn_th){
					$(butn_th).before(this.message);
				} else{
					this.c.append(this.message);
				}
			} else {
				if (this.message){
					this.message.remove();
					delete this.message;
				}
			}
		},
		'odd_section': function(state){
			if (state){
				this.c.addClass('odd_section');
			} else {
				this.c.removeClass('odd_section');
			}
		}
	},
	'collch-rendering_list': function(name, array) {
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];

			var cur_ui = this.getFreeChildView({name: 'item'}, cur);
			if (cur_ui){
				var ccon = cur_ui.getA();

				var prev_dom_hook = this.getPrevView(array, i);
				if (prev_dom_hook){
					$(prev_dom_hook).after(ccon);
				} else {
					this.c.prepend(ccon);
				}
			}

		}
		this.requestAll();
	},
	'collch-button': function(name, md) {
		var view = this.getFreeChildView({name: name}, md);
		if (view){
			this.button_view = view;
			this.c.append(view.getA());
		}
		this.requestAll();
	}
});

return {};
});
