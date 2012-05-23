(function(){
	"use strict";
	provoda.addPrototype("InvestigationView",{
		init: function(md){
			this.md = this.invstg = md;
			this._super();
			this.createBase();
			this.setStates(md.states);
		},
		expand: function(){
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			for (var i = 0; i < this.md.sections.length; i++) {
				var cur_ui = this.md.sections[i].getFreeView();
				if (cur_ui){
					this.addChild(cur_ui);
					this.c.append(cur_ui.getC());
					cur_ui.appended(this);

				}
			}
		},
		state_change: {
			"mp-show": function(opts) {
				if (opts){
					if (!opts.transit){
						this.expand();
					}
					this.c.removeClass('hidden');
					
					if (!opts.closed){
						$(su.ui.els.slider).addClass('show-search');
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
					$(su.ui.els.slider).addClass('show-search-results');
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
			$(su.ui.els.slider).removeClass('show-search show-search-results');
		},
		prop_change: {
			enter_item: function(item){
				this.scrollTo(item);
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


	provoda.addPrototype("Investigation", {
		init: function() {
			this._super();
			this.sections = [];
			this.names = {};
			this.enter_items = false;
			this.setInactiveAll();
		},
		page_name: "search results",
		addCallback: function(event_name, func){
			this.on(event_name, func);
		},
		changeResultsCounter: function(){
			var rc = 0;
			for (var i = 0; i < this.sections.length; i++) {
				rc += this.sections[i].r.length;
			}
			this.trigger('resultsChanged', rc);
		},
		doEverythingForQuery: function(){
			this.searchf.call(this);
		},
		g: function(name){
			return this.names[name];
		},
		_changeActiveStatus: function(remove, except){
			except = except && this.g(except);
			for (var i=0; i < this.sections.length; i++) {
				var cur = this.sections[i];
				
				if ((!except || cur != except) && !remove){
					cur.setActive();
				} else{
					cur.setInactive();
				}
				
				
			}
		},
		doesNeed: function(q){
			return q == this.q;
		},
		loading:function(){
			this.trigger('stateChange', 'loading');
		},
		loaded: function(){
			this.trigger('stateChange', 'complete');
		},
		remarkStyles: function(){
			var c = 0;
			for (var i=0; i < this.sections.length; i++) {
				var cur = this.sections[i];
				if (!cur.nos){
					cur.markOdd( !cur.state('active') || !(++c % 2 == 0) );
				}
			}
		},
		setActiveAll: function(except){
			this._changeActiveStatus(false, except);
		},
		setInactiveAll: function(except){
			this._changeActiveStatus(true, except);
		},
		addSection: function(name, s){
			var _this = this;
			s
				.on('items-change', function(results){
					_this.refreshEnterItems();
					if (results){
						_this.changeResultsCounter();
					}
					_this.bindItemsView();
				})
				.on('state-change', function(state){
					_this.remarkStyles();
				})
				.on('request', function(rq){
					_this.addRequest(rq);
				});

			this.sections.push(s);


			this.names[name] = s;
			return s;
		},
		bindItemsView: function(){
			var r = this.getAllItems(true);
			r = $filter(r, 'binvstg', true).not;
			var _this = this;

			var seiaclck = function(){
				_this.setItemForEnter(this);
			};

			for (var i = 0; i < r.length; i++) {
				r[i].on('view',seiaclck).binvstg = true;

			}
		},
		refreshEnterItems: function(){
			var r = this.getAllItems();
			$.each(r, function(i, el){
				el.serial_number = i;
			});
			this.enter_items = r;
			this.setItemForEnter(r[this.selected_inum || 0]);
		},
		pressEnter: function(){
			if (this.enter_item){
				this.enter_item.view();
			}
		},
		setItemForEnter: function(item){
			if (this.enter_item != item){
				if (this.enter_item){
					this.enter_item.setInactive();
					delete this.enter_item;
				}
				if (item){
					this.updateProp('enter_item', item);
					this.enter_item.setActive();
				}
			}
			
		},
		selectEnterItemBelow: function(){
			var ci = (this.enter_item && this.enter_item.serial_number) || 0,
				ni = (ci ? ci : this.enter_items.length) - 1,
				t = this.enter_items[ni];
			this.setItemForEnter(t);
			this.selected_inum = ni;
		},
		selectEnterItemAbove: function(){
			var ci = (this.enter_item && this.enter_item.serial_number) || 0,
				ni = (ci + 1 < this.enter_items.length) ? ci + 1 : 0,
				t = this.enter_items[ni];
			this.setItemForEnter(t);
			this.selected_inum = ni;
		},
		getAllItems: function(no_button){
			var r = [];
			for (var i=0; i < this.sections.length; i++) {
				var cur = this.sections[i];
				var items = cur.getItems(no_button);
				if (items.length){
					r = r.concat(items);
				}
			}
			return r;
		},
		getURL: function() {
			return '?q=' + (this.q || '');
		},
		changeQuery: function(q){
			if (this.q != q){
				this.stopRequests();
				if (this.getTitleString){
					this.updateState('nav-title', this.getTitleString(q));
				}
				this.loaded();
				this.setItemForEnter();
				for (var i=0; i < this.sections.length; i++) {
					this.sections[i].changeQuery(q);
				}
				this.q = q;
				
				delete this.selected_inum;
				this.updateState('query', q);
				this.changeResultsCounter();
				this.doEverythingForQuery();
				this.trigger('url-change');//fixme; place before changing ui!?
			}
			
		},
		query_regexp: /\ ?\%query\%\ ?/
	});
	provoda.addPrototype("baseSectionButton", {
		setText: function(text){
			this.updateState('button_text', text);
		},
		show: function(){
			this.updateState('disabled', false);
		},
		hide: function(){
			this.updateState('disabled', true);
			this.setInactive();
		}
	});

	provoda.addPrototype("baseSectionButtonView", {
		createItem: function(){

			this.a = $('<button type="button"></button>').appendTo(this.c);
			this.text_span = $("<span></span>").appendTo(this.a);
			return this;
		}
	});


	provoda.addPrototype("baseSuggestView", {
		init: function(md){
			this._super();
			if (md){
				this.md = md;
			}
			
			this.createBase();
			if (this.createItem){
				this
					.createItem()
					.bindClick();
			}
			this.setModel(md);
		},
		state_change: {
			active: function(state){
				if (this.a){
					if (state){
						this.a.addClass('active');
					} else {
						this.a.removeClass('active');
					}
				}
				
			},
			bordered: function(state){
				if (state){
					this.c.addClass('searched-bordered');
				} else {
					this.c.removeClass('searched-bordered');
				}
			},
			disabled: function(state){
				if (!state){
					this.c.removeClass('hidden');
				} else {
					this.c.addClass('hidden');
				}
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

	provoda.addPrototype("baseSuggest", {
		setActive: function(){
			this.updateState('active', true);
		},
		setInactive: function(){
			this.updateState('active', false);
		},
		getTitle: function(){
			return this.valueOf();
		},
		view: function(){
			if (this.onView){
				this.onView();
			}
			this.trigger('view');
		}
	});


})();
