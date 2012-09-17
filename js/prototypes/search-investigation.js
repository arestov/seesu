(function(){
	"use strict";
	


	provoda.addPrototype("Investigation", {
		
		model_name: 'invstg',
		init: function() {
			this._super();
			this.names = {};
			this.enter_items = false;
			this.setChild('section', []);
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
			var sections_array = this.getChild('section');

			for (var i=0; i < sections_array.length; i++) {
				var cur = sections_array[i];
				
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
		loaded: function(q){
			if (!q || this.doesNeed(q)){
				this.trigger('stateChange', 'complete');
			}
			
		},
		remarkStyles: function(){
			var c = 0;
			var sections_array = this.getChild('section');
			for (var i=0; i < sections_array.length; i++) {
				var cur = sections_array[i];
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
			var sections_array = this.getChild('section');

			sections_array.push(s);
			this.setChild('section', sections_array, true);


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
					this.enter_item = item;
					//this.scrollTo(item);
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
