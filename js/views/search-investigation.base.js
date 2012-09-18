provoda.addPrototype("baseSectionButtonView", {
	createItem: function(){

		this.a = $('<button type="button"></button>').appendTo(this.c);
		this.text_span = $("<span></span>").appendTo(this.a);
		return this;
	},
	"stch-button_text": function(text){
		this.text_span.text(text);
	},
});


provoda.addPrototype("baseSuggestView", {
	createDetailes: function(){
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
		var that = this.md;
		this.a = $('<a></a>')
			.text(that.text_title)
			.appendTo(this.c);
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
				_this.md.view();
			});
		}
		
		return this;
	}
});

provoda.addPrototype("InvestigationView", {
	createDetailes: function(){
		this.createBase();
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}

		var array = this.getMdChild('section');


		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			var view = this.getFreeChildView(cur.model_name, cur);
			if (view){
				this.c.append(view.getA());
			}
		}
		this.requestAll();
	},
	state_change: {
		"mp-show": function(opts) {
			if (opts){
				if (!opts.transit){
					this.expand();
				}
				this.c.removeClass('hidden');
				
				if (!opts.closed){
					$(app_view.els.slider).addClass('show-search');
				}
			} else {
				this.blur();
				this.c.addClass('hidden');
			}
		},
		"mp-blured": function(state) {
			if (state){
				this.blur();
			} else {
				$(app_view.els.slider).addClass('show-search-results');
			}
		},
		"can-expand": function(state) {
			if (state){
				this.expand();
			}
		}
	},
	createBase: function() {
		this.c = $('<div class="search-results-container current-src"></div');
	},
	die: function() {
		this.blur();
		this._super();
	},
	blur: function() {
		$(app_view.els.slider).removeClass('show-search show-search-results');
	},
	prop_change: {
		enter_item: function(item){
			
		}
	},
	setViewport: function(vp){
		this.view_port = vp;
	},
	scrollTo: function(item){
		if (!item){return false;}
		if (!this.view_port || !this.view_port.node){return false;}

		var element = item.getC();
		var svp = this.view_port,
			scroll_c = svp.offset ?   $((svp.node[0] && svp.node[0].ownerDocument) || svp.node[0])   :   svp.node,
			scroll_top = scroll_c.scrollTop(), //top
			scrolling_viewport_height = svp.node.height(), //height
			scroll_bottom = scroll_top + scrolling_viewport_height; //bottom
		
		var node_position;
		if (svp.offset){
			node_position = element.offset().top;
		} else{
			node_position = element.position().top + scroll_top + this.c.parent().position().top;
		}

		var el_bottom = element.height() + node_position;

		var new_position;
		if ( el_bottom > scroll_bottom){
			new_position =  el_bottom - scrolling_viewport_height/2;
		} else if (el_bottom < scroll_top){
			new_position =  el_bottom - scrolling_viewport_height/2;
		}
		if (new_position){
			scroll_c.scrollTop(new_position);
		}
		
	}
});

provoda.addPrototype("searchSectionView", {
	createDetailes: function(){
		this.createCon();
		this.createHead();

		this.gc = this.header ? this.header.add(this.c) : this.c;
		this.orderChildren();
	},
	getC: function(){
		return this.gc;	
	},
	createHead: function(){
		if (this.head_text){
			this.header = $('<h4></h4>').hide().text(this.head_text);

		}
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
		changed: function(time){
			this.renderChildren();
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
					butn_th.before(this.message);
				} else{
					this.c.append(this.message);
				}
			} else {
				if (this.message){
					this.message.remove();
					delete this.message
				}
			}
		},
		'odd-section': function(state){
			if (state){
				this.c.addClass('odd-section')
			} else {
				this.c.removeClass('odd-section')
			}
		}
	},
	renderChildren: function(){
		this.orderChildren();
		this.requestAll();
	},
	orderChildren: function(){
		var _this = this;




		var button = this.getMdChild('button');

		
		if (button){
			var button_view = this.getFreeChildView('button', button);
			if (button_view){
				this.button_view = button_view;
				this.c.append(button_view.getA())
			}	
		}
	//	var butn_th = this.button_view && $(this.button_view.getT());

		var rendering_list = this.getMdChild('rendering_list');
		if (rendering_list){
			for (var i = 0; i < rendering_list.length; i++) {
				var cur = rendering_list[i];

				var cur_ui = this.getFreeChildView('item', cur);
				if (cur_ui){
					var ccon = cur_ui.getA();

					var prev_dom_hook = this.getPrevView(rendering_list, i);
					if (prev_dom_hook){
						$(prev_dom_hook).after(ccon);
					} else {
						this.c.prepend(ccon);
					}
				}

			}
			
		}
		
		
	}
});