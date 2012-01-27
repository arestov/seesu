

var investigationUI = function(invstg){
	this.callParentMethod('init')
	this.invstg = invstg;
	this.createBase();

	this.setStates(invstg.states);
};

createPrototype(investigationUI, new servView(), {
	appendChildren: function(){
		for (var i = 0; i < this.invstg.sections.length; i++) {
			var cur_ui = this.invstg.sections[i].getFreeView();
			if (cur_ui){
				this.c.append(cur_ui.getC());
				cur_ui.appended()
			}
		};
	},
	state_change: {
		"mp-show": function(opts) {
			var sli = $(su.ui.els.slider);
			if (opts){
				this.c.removeClass('hidden');
				sli.addClass('show-search-results')
				if (!opts.closed){
					sli.addClass('show-search')
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
				
			}
		}
	},
	createBase: function() {
		this.c = $('<div class="search-results-container current-src"></div');
	},
	die: function() {
		this.blur();
		this.callParentMethod('die');	
	},
	blur: function() {
		$(su.ui.els.slider).removeClass('show-search show-search-results')
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
		if (!this.view_port || !this.view_port.node){return false}

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



investigation = function(init, searchf){
	this.callParentMethod('init')

	this.sections = [];
	this.names = {};
	this.enter_items = false;
	
	if (init){
		init.call(this);
	}
	this.searchf = searchf;

	this.setInactiveAll();
};


createPrototype(investigation, new mapLevelModel(), {
	ui_constr: {
		main: function(){
			return new investigationUI(this);
		},
		nav: function() {
			return new investgNavUI(this);
		}
	},
	onMapLevAssign: function() {
		if (su.ui.els.searchres){
			var child_ui = this.getFreeView();
			if (child_ui){
				su.ui.els.searchres.append(child_ui.getC());
				child_ui.appended();
			}
		}
		if (su.ui.views.nav.daddy){
			var child_ui = this.getFreeView('nav');
			if (child_ui){
				su.ui.views.nav.daddy.append(child_ui.getC());
				child_ui.appended();
			}
		}
	},
	state_change: {
		"mp-show": function(opts) {
			if (opts){
				if (opts.userwant){
					su.track_page('search results');
				}
				su.ui.search_el = this;
			}
			
			
		}
	},
	addCallback: function(event_name, func){
		this.on(event_name, func);
	},
	changeResultsCounter: function(){
		var rc = 0;
		for (var i = 0; i < this.sections.length; i++) {
			rc += this.sections[i].r.length;
		};
		this.fire('resultsChanged', rc);
	},

	die: function(){
		this.callParentMethod('die');
		this.stopRequests();
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
			
			
		};	
	},
	doesNeed: function(q){
		return q == this.q;
	},
	loading:function(){
		this.fire('stateChange', 'loading');
	},
	loaded: function(){
		this.fire('stateChange', 'complete');
	},
	remarkStyles: function(){
		var c = 0;
		for (var i=0; i < this.sections.length; i++) {
			var cur = this.sections[i];
			if (!cur.nos){
				cur.markOdd( !cur.state('active') || !(++c % 2 == 0) );
			}
		};	
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
			r[i].on('view',seiaclck).binvstg = true

		};
	},
	refreshEnterItems: function(){
		var r = this.getAllItems();
		$.each(r, function(i, el){
			el.serial_number = i;
		})
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
				delete this.enter_item
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
		};
		return r;
	},
	getURL: function() {
		return '?q=' + (this.q || '');	
	},
	scratchResults: function(q){
		if (this.q != q){
			this.stopRequests();
			this.updateState('nav-title', this.getTitleString(q));
			this.loaded();
			this.setItemForEnter();
			for (var i=0; i < this.sections.length; i++) {
				this.sections[i].scratchResults(q);
			};
			this.q = q;
			
			delete this.selected_inum;
			this.changeResultsCounter();
			this.doEverythingForQuery();
			this.fire('url-change')//fixme; place before changing ui!?
		}
		
	},
	query_regexp: /\ ?\%query\%\ ?/,
	getTitleString: function(text){
		var original = localize('Search-resuls')
		
		if (text){
			return original.replace(this.query_regexp, ' «' + text + '» ').replace(/^\ |\ $/gi, '');
		} else{
			var usual_text = original.replace(this.query_regexp, '');
			var cap = usual_text.charAt(0).toLocaleUpperCase();
			return cap + usual_text.slice(1);
		}
	}
});


var searchResults = function(query, prepared, valueOf){
		if (query){
			this.query = query;
		}
		if (prepared){
			this.append(prepared, valueOf);
		};
	};
	searchResults.prototype = new Array();
	cloneObj(searchResults.prototype, {
		setQuery: function(q){
			this.query=q;
		},
		doesContain: doesContain,
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
				
			};
		}
	});


var baseSuggestUI = function(){};
createPrototype(baseSuggestUI, new servView(), {
	init: function(sugg){
		this.callParentMethod('init');
		if (sugg){
			this.sugg = sugg;
		}
		
		this.createBase();
		if (this.createItem){
			this
				.createItem()
				.bindClick();
		};
		this.setModel(sugg)
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
				this.c.removeClass('hidden')
			} else {
				this.c.addClass('hidden')
			}
		}
	},
	createBase: function(){
		this.c = $("<li class='suggest'></li>");
		return this;
	},
	bindClick: function(){
		if (this.a){
			var _this = this;
			this.a.click(function(){
				_this.sugg.view();
			});
		}
		
		return this;
	}
});


var baseSuggest = function(){};
createPrototype(baseSuggest, new servModel(), {
	setActive: function(){
		this.updateState('active', true);
	},
	setInactive: function(){
		this.updateState('active', false);
	},
	view: function(){
		if (this.onView){
			this.onView();
		}
		this.fire('view');
	}
});









var baseSectionButtonUI = function(sugg){
	this.callParentMethod('init', sugg);
};
createPrototype(baseSectionButtonUI, new baseSuggestUI(), {
	state_change:  cloneObj({
		button_text: function(text){
			this.a.find('span').text(text);	
		}
	}, baseSuggestUI.prototype.state_change),
	createItem: function(){
		this.a = $('<button type="button"><span></span></button>').appendTo(this.c);
		return this;
	}
});

var baseSectionButton = function(){
	this.callParentMethod('init');
}
createPrototype(baseSectionButton, new baseSuggest(), {
	ui_constr: function(){
		return new baseSectionButtonUI(this);
	},
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

/*
var baseSuggest = function(){};
	baseSuggest.prototype = {
		setActive: function(){
			if (this.ui){
				this.ui.a.addClass('active');
			}
		},
		setInactive: function(){
			if (this.ui){
				this.ui.a.removeClass('active');
			}
		},
		getC: function(){
			return this.ui && this.ui.c;
		},
		render: function(q, bordered, createItemCon){
			if (!this.ui){
				var item_parent = (createItemCon && createItemCon()) || $("<li class='suggest'></li>");
				var item_itself = this.createItem(q, item_parent);

				if (bordered){
					item_parent.addClass('searched-bordered')
				}
				if (item_itself){
					item_parent.append(item_itself);
				}
				this.ui = {
					a: item_itself,
					c: item_parent
				};
				
				return item_parent;
			}
			
		}
	};*/