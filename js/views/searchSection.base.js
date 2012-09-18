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