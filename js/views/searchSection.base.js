provoda.addPrototype("searchSectionView", {
	createDetailes: function(){
		this.createCon();
		this.createHead();
		this.button = this.md.button;

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
				var butn_th = this.button && this.button.getThing();
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

		if (this.button){
			var bui = this.button.getFreeView(this);
			if (bui){
				var bunc = $(bui.getA());
				this.c.append(bunc)
			//	.appendTo(this.c);
				this.addChild(bui);
			}
			var butn_th = this.button.getThing();
		}
		
		var rendering_list = this.md.rendering_list;
		var last_rendered = this.md.edges_list;
		if (rendering_list){
			for (var i = 0; i < rendering_list.length; i++) {

				var cur_ui = rendering_list[i].getFreeView(this);
				if (cur_ui){
					this.addChild(cur_ui);
					var ccon = cur_ui.getA();
					if (butn_th){
						butn_th.before(ccon);
					} else{
						this.c.append(ccon);
					}
				}

			};
			for (var i = 0; i < last_rendered.length; i++) {
				
				var cur = rendering_list[last_rendered[i]];
				if (cur){
					cur.updateState('bordered', true)
				}
				
			};
		}
		
		
	}
});