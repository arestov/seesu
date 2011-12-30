var investigationUI = function(invstg, view_port){
	servView.prototype.init.call(this);

	this.invstg = invstg;
	this.c = $('<div class="search-results-container current-src"></div');
	this.view_port = view_port;
};
investigationUI.prototype = new servView();

cloneObj(investigationUI.prototype, {
	constructor: investigationUI,
	appendChildren: function(){

		for (var i = 0; i < this.invstg.sections.length; i++) {
			var cur = this.invstg.sections[i];
			this.c.append(cur.gc);
		};
		console.log('bu!')
	},
	prop_change: {
		enter_item: function(item){
			this.scrollTo(item);
		}
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
	servModel.prototype.init.call(this);

	this.sections = [];
	this.names = {};
	this.enter_items = false;
	
	if (init){
		init.call(this);
	}
	this.searchf = searchf;

	this.setInactiveAll();
};
investigation.prototype = new servModel();

cloneObj(investigation.prototype, {
	constructor: investigation,
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
	setSectionsSamplesCreators: function(seUnitsCreator){
		this.seUnitsCreator = seUnitsCreator;
	},
	die: function(){
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
				cur.markOdd(cur.hidden || !(++c % 2 == 0));
			}
		};	
	},
	setActiveAll: function(except){
		this._changeActiveStatus(false, except);
	},
	setInactiveAll: function(except){
		this._changeActiveStatus(true, except);
	},
	addSection: function(name, sectionInfo){
		var _this = this;
		var s = new searchSection(sectionInfo, {
			ucreator: this.seUnitsCreator
		}, function(state){
			_this.remarkStyles();
		}, function(has_results){
			_this.refreshEnterItems();
			if (has_results){
				_this.changeResultsCounter();
			}
			
		}, function(rq){
			_this.addRequest(rq);
		});
		this.sections.push(s);


		this.names[name] = s;
		return s;
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
			this.enter_item.click();
		}
	},
	setItemForEnter: function(item){
		if (this.enter_item){
			this.enter_item.setInactive();
			delete this.enter_item
		}
		if (item){
			this.updateProp('enter_item', item);
			this.enter_item.setActive();
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
	getAllItems: function(){
		var r = [];
		for (var i=0; i < this.sections.length; i++) {
			var cur = this.sections[i];
			var items = cur.getItems();
			if (items.length){
				r = r.concat(items);
			}
		};
		return r;
	},
	scratchResults: function(q){
		if (this.q != q){
			this.stopRequests();
			this.loaded();
			this.setItemForEnter();
			for (var i=0; i < this.sections.length; i++) {
				this.sections[i].scratchResults(q);
			};
			this.q = q;
			
			delete this.selected_inum;
			this.changeResultsCounter();
			this.doEverythingForQuery()
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
	};