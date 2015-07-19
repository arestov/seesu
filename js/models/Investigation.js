define(['pv', 'spv'],function(pv, spv){
	"use strict";
	pv.addPrototype("Investigation", {
		model_name: 'invstg',
		init: function(opts) {
			this._super.apply(this, arguments);
			this.names = {};
			this.enter_items = false;
			this.setInactiveAll();
			pv.update(this, 'url_part', this.getURL());

			this.on('child_change-section', function(e) {
				this.names = {};
				if (e.value) {
					for (var i = 0; i < e.value.length; i++) {
						this.names[ e.value[i].model_name ] = e.value[i];
					}
				}
				this.changeQuery(this.q, true);
			});

		},
		addCallback: function(event_name, func){
			this.on(event_name, func);
		},
		changeResultsCounter: function(){
			var rc = 0;
			var sections_array = this.getNesting('section') || [];
			for (var i = 0; i < sections_array.length; i++) {
				rc += sections_array[i].r.length;
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
			var sections_array = this.getNesting('section') || [];

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
			var sections_array = this.getNesting('section') || [];
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

		bindItemsView: function(){
			var r = this.getAllItems(true);
			r = spv.filter(r, 'binvstg', true).not;
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
			for (var i = 0; i < r.length; i++) {
				var el = r[i];
				el.serial_number = i;
			}
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
		selectEnterItemAbove: function(){
			var ci = (this.enter_item && this.enter_item.serial_number) || 0,
				ni = (ci ? ci : this.enter_items.length) - 1,
				t = this.enter_items[ni];
			this.setItemForEnter(t);
			this.selected_inum = ni;
		},
		selectEnterItemBelow: function(){
			var ci = (this.enter_item && this.enter_item.serial_number) || 0,
				ni = (ci + 1 < this.enter_items.length) ? ci + 1 : 0,
				t = this.enter_items[ni];
			this.setItemForEnter(t);
			this.selected_inum = ni;
		},
		getAllItems: function(no_button){
			var r = [];
			var sections_array = this.getNesting('section') || [];
			for (var i=0; i < sections_array.length; i++) {
				var cur = sections_array[i];
				var items = cur.getItems(no_button);
				if (items.length){
					r = r.concat(items);
				}
			}
			return r;
		},
		changeQuery: function(q, force){
			if (this.q != q || force){
				this.stopRequests();
				if (this.getTitleString){
					pv.update(this, 'nav_title', this.getTitleString(q));
				}
				this.loaded();
				this.setItemForEnter();
				var sections_array = this.getNesting('section') || [];
				for (var i=0; i < sections_array.length; i++) {
					sections_array[i].changeQuery(q);
				}
				this.q = q;
				
				delete this.selected_inum;
				pv.update(this, 'query', q);
				this.changeResultsCounter();
				this.doEverythingForQuery();
				pv.update(this, 'url_part', this.getURL());
			}
			
		},
		query_regexp: /\ ?\%query\%\ ?/
	});
	pv.addPrototype("BaseSectionButton", {
		setText: function(text){
			pv.update(this, 'button_text', text);
		},
		show: function(){
			pv.update(this, 'disabled', false);
		},
		hide: function(){
			pv.update(this, 'disabled', true);
			this.setInactive();
		}
	});

	

	pv.addPrototype("BaseSuggest", {
		setActive: function(){
			pv.update(this, 'active', true);
		},
		setInactive: function(){
			pv.update(this, 'active', false);
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

	
	var searchResults = function(query, prepared, valueOf){
		if (query){
			this.query = query;
		}
		if (prepared){
			this.append(prepared, valueOf);
		}
	};
	searchResults.prototype = [];
	spv.cloneObj(searchResults.prototype, {
		setQuery: function(q){
			this.query=q;
		},
		doesContain: spv.doesContain,
		add: function(target, valueOf){
			if (this.doesContain(target, valueOf) == -1){
				target.q = this.query;
				return this.push(target);
			} else{
				return false;
			}
		},
		append: function(array, valueOf){
			for (var i=0; i < array.length; i++) {
				this.add(array[i], valueOf);
				
			}
		}
	});

	
	pv.addPrototype("SearchSection", {
		init: function(opts){
			this._super.apply(this, arguments);
			this.app = opts && opts.app;
			this.map_parent = opts && opts.map_parent;
			this.edges_list = [];
			this.rendering_list = [];

			
			var map_parent = opts.map_parent;
			opts = null;
			this
				.on('items-change', function(results){
					map_parent.refreshEnterItems();
					if (results){
						map_parent.changeResultsCounter();
					}
					map_parent.bindItemsView();
				})
				.on('state_change-active', function(){
					map_parent.remarkStyles();
				})
				.on('requests', function(array){
					map_parent.addRequests(array);
				}, {immediately: true});
		},
		appendResults: function(arr, render, no_more_results) {
			var r = [];
			for (var i = 0; i < arr.length; i++) {
				var item = new this.resItem(arr[i]);
				item.invstg = this.invstg;
				r.push(item);
			}

			this.r.append(r);
			if (render){
				this.renderSuggests(no_more_results);
			}
			return this;
		},
		setActive: function(){
			pv.update(this, 'active', true);
		},
		setInactive: function(){
			
			pv.update(this, 'active', false);
		},
		loading: function(){
			pv.update(this, 'loading', true);
		},
		loaded: function(){
			pv.update(this, 'loading', false);
		},
		markOdd: function(remove){
			pv.update(this, 'odd_section', !remove);
		},
		getItems: function(no_button){
			var r = [].concat(this.rendering_list);
			if (!no_button && this.button && !this.button.state('disabled')){
				r.push(this.button);
			}
			return r;
		},
		hideButton: function(){
			if (this.button){
				this.button.hide();

			}
		},
		showButton: function(){
			if (this.button){
				this.button.show();
			}
		},
		setButtonText: function(have_results, q){
			if (this.button && this.getButtonText){
				this.button.setText(this.getButtonText(have_results, q));
			}
			
		},
		doesNeed: function(q){
			return q == (this.r && this.r.query);
		},
		changeQuery: function(q){
			if (!q && !this.no_results_text){
				this.setInactive();
			}
			this.loaded();
			this.removeOldResults();
			pv.update(this, 'no_results_text', false);
			
			
			this.r = new searchResults(q);
			this.rendering_list = [];
			this.edges_list = [];
			pv.update(this, 'query', q);
			this.setButtonText(false, q);
			this.showButton();
			this.trigger('items-change');
			return this;
		},
		removeOldResults: function(){
			for (var i = 0; i < this.rendering_list.length; i++) {
				this.rendering_list[i].die();
			}
			pv.updateNesting(this, 'rendering_list', []);
			
		},
		renderSuggests: function(no_more_results, preview){

			
			var slice = preview && !this.edges_list.length,
				last_rendered = this.edges_list && this.edges_list[this.edges_list.length-1],
				start = (last_rendered) || 0,
				end   = (slice && Math.min(this.r.length, start + 5)) || this.r.length;
			
			if (this.r.length){
				for (var i=start; i < end; i++) {
					this.rendering_list.push(this.r[i]);
				}
				this.edges_list.push(end);
			} else{
				if (no_more_results){
					if (this.no_results_text){
						pv.update(this, 'no_results_text', this.no_results_text);
						this.hideButton();
					} else{
						this.setInactive();
					}
					
					
				}
			}

			for (var i = 0; i < this.edges_list.length; i++) {
				
				var cur = this.rendering_list[this.edges_list[i]];
				if (cur){
					pv.update(cur, 'bordered', true);
				}
				
			}

			pv.update(this, 'no_more_results', no_more_results);
			pv.update(this, 'preview', preview);
			pv.updateNesting(this, 'rendering_list', this.rendering_list);
			pv.update(this, 'changed', new Date());

			this.setButtonText(!!this.r.length, this.r.query);
			this.trigger('items-change', this.r.length);
			return this;
		}
	});
return {testdata: true};
});



