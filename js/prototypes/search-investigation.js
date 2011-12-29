var investigationUI = function(){
	this.c = $('<div class="search-results-container current-src"></div');

};
investigationUI.prototype = new servView();

cloneObj(investigationUI.prototype, {
	constructor: investigationUI
});

investigation = function(c, init, searchf, stateChange, view_port){
	this.constructor.prototype.init.call(this);

	this.c = c;
	this.view_port = view_port;

	this.sections = [];
	this.names = {};
	this.enter_items = false;
	
	if (init){
		init.call(this);
	}
	this.searchf = searchf;
	if (stateChange){
		this.stateChange = stateChange;
	}

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
		
	},
	doesNeed: function(q){
		return q == this.q;
	},
	loading:function(){
		if (this.stateChange){
			this.stateChange('loading');
		}
		
	},
	loaded: function(){
		if (this.stateChange){
			this.stateChange('complete');
		}
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
			c: this.c,
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
			this.enter_item = item;
			this.enter_item.setActive();
			
		}
	},
	selectEnterItemBelow: function(){
		var ci = (this.enter_item && this.enter_item.serial_number) || 0,
			ni = (ci ? ci : this.enter_items.length) - 1,
			t = this.enter_items[ni];
		this.setItemForEnter(t);
		this.scrollTo(t)
		this.selected_inum = ni;
	},
	selectEnterItemAbove: function(){
		var ci = (this.enter_item && this.enter_item.serial_number) || 0,
			ni = (ci + 1 < this.enter_items.length) ? ci + 1 : 0,
			t = this.enter_items[ni];
		this.setItemForEnter(t);
		this.scrollTo(t)
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

var searchSection = function(sectionInfo, ui, stateChange, newResultsWereRendered, addRequest){
	var _this = this;
	
	this.si = sectionInfo;
	this.nos = this.si.nos;
	if (this.si.button && this.si.buttonClick){
		this.button_allowed = true;
	}

	this.ucreator = ui.ucreator;
	if (stateChange){this.stateChange = stateChange;}
	if (newResultsWereRendered){this.nRWR = newResultsWereRendered;}
	ui.c.append(this.createUIc(true));
	this.header = this.ucreator.createHead(this.si.head).appendTo(ui.c);
	this.c.before(this.header);
	this.addRequest = addRequest;
};

searchSection.prototype = {
	getItemConstructor: function(){
		return this.si && this.si.resItem;
	},
	addRequest: function(){
		
	},
	setActive: function(){
		if (this.hidden){
			this.c.addClass('active-section');
			this.header.show();
			delete this.hidden;
			if (this.stateChange){this.stateChange(true);}
		}
	},
	loading: function(){
		this.header.addClass('loading');	
	},
	loaded: function(){
		this.header.removeClass('loading');	
	},
	markOdd: function(remove){
		this.c[ remove ? 'removeClass' : 'addClass']('odd-section');
	},
	setInactive: function(){
		if (!this.hidden){
			this.c.removeClass('active-section');
			this.header.hide();
			this.hidden = true;
			if (this.stateChange){this.stateChange(false);}
		}	
	},
	getItems: function(){
		var r = $filter(this.r, 'click', function(value){return !!value});
		r = $filter(r, 'ui', function(value){return !!value});
		if (this.button_allowed && !this.button_hidden){
			r.push(this.button_obj);
		}
		return r;
	},
	hideButton: function(){
		if (this.button_allowed && !this.button_hidden){
			this.buttonc.hide();
			this.button_hidden = true;
			if (this.nRWR){this.nRWR();}
		}
	},
	showButton: function(){
		if (this.button_allowed && this.button_hidden){
			this.buttonc.show();
			this.button_hidden = false;
			if (this.nRWR){this.nRWR();}
		}
	},
	createUIc: function(with_button){
		this.c = this.ucreator.createRsCon();
		if (!this.nos){
			this.c.addClass('sugg-section')
		}
		
		if (this.si.cclass){
			this.c.addClass(this.si.cclass);
		}
		if (this.si.cid){
			this.c.attr('id', this.si.cid)
		}
		
		
		if (this.button_allowed && with_button){
			
		
			this.button = this.si.button().clone();
			var _this = this;
			this.button.click(function(e){
				_this.si.buttonClick.call(this, e, _this);
			})
			
			this.button_text = this.button.find('span');
			
			this.buttonc = this.ucreator.createItemCon().append(this.button).appendTo(this.c);
			this.button_obj = {
				node: this.button,
				setActive: function(){
					this.node.addClass('active')
				},
				setInactive: function(){
					this.node.removeClass('active')
				},
				c: this.buttonc,
				getC: function(){
					return this.c;	
				},
				click: function(){
					_this.si.buttonClick(false, _this)
				}
			}
			
		}
		return this.c;
	},
	setButtonText: function(have_results, q){
		if (this.button_allowed && this.si.getButtonText){
			this.button_text.text(this.si.getButtonText(have_results, q));
		}
		
	},
	doesNeed: function(q){
		return q == (this.r && this.r.query);
	},
	scratchResults: function(q){
		if (!q && !this.si.no_results_text){
			this.setInactive();
		}
		this.loaded();
		this.removeOldResults();
		if (this.message){
			this.message.remove();
			delete this.message
		}
		
		this.r = new searchResults(q);
		this.setButtonText(false, q);
		this.showButton();
		if (this.nRWR){this.nRWR();}
	},
	removeOldResults: function(){
		if (this.r){
			$.each(this.r, function(i, el){
				if (el.ui){
					el.ui.c.remove();
					delete el.ui;
				}
			});
		}
		
	},
	renderSuggests: function(no_more_results, preview){
	
		var _this = this;
		
		var slice = preview && !this.r.last_rendered_length,
			start = 0,
			end   = start + 5;
			
		if (this.r.length){
			var l = (slice && Math.min(end, this.r.length)) || this.r.length;
			for (var i=0; i < l; i++) {
				var bordered = this.r.last_rendered_length && (i == this.r.last_rendered_length);
				var resel = this.r[i].render(_this.r.query, bordered, this.ucreator && this.ucreator.createItemCon);
				if (resel){
					if (this.button_allowed){
						this.buttonc.before(resel);
					} else{
						this.c.append(resel);
					}
				}
				
			};
			this.r.last_rendered_length = l;
			
			this.setButtonText(true, this.r.query);
			if (this.nRWR){this.nRWR(true);}
			
		} else{
			if (no_more_results){
				if (this.si.no_results_text){
					this.message = this.ucreator.createItemCon().text(this.si.no_results_text);
					if (this.button_allowed){
						this.hideButton();
						this.buttonc.before(this.message);
					} else{
						this.c.append(this.message);
					}
				} else{
					this.setInactive();
				}
				
				
			}
			if (this.nRWR){this.nRWR();}
		}
		
	
			
		return this.r.length && this.r[0].ui.a;
	}
};

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