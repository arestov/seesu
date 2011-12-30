var searchSectionUI = function(seasc){
	servView.prototype.init.call(this);
	this.seasc = seasc;


	this.createUIc(true);
	this.header = this.ucreator.createHead(this.si.head);
	this.gc = this.header.add(this.c);


};

searchSectionUI.prototype = new servView();

cloneObj(searchSectionUI.prototype, {
	constructor: searchSectionUI,
	state_change: {
		active: function(state){
			if (state){
				this.c.addClass('active-section');
				this.header.show();
			} else {
				this.c.removeClass('active-section');
				this.header.hide();
			}
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
	}
});


var searchSection = function(sectionInfo, ui, stateChange, newResultsWereRendered, addRequest){
	servModel.prototype.init.call(this);

	var _this = this;
	
	this.si = sectionInfo;
	this.nos = this.si.nos;
	if (this.si.button && this.si.buttonClick){
		this.button_allowed = true;
	}

	this.ucreator = ui.ucreator;
	if (stateChange){this.stateChange = stateChange;}
	if (newResultsWereRendered){this.nRWR = newResultsWereRendered;}
	
	this.addRequest = addRequest;

	this.addView(new searchSectionUI(this));
};

searchSection.prototype = new servModel();

cloneObj(searchSection.prototype, {
	constructor: searchSection,
	getItemConstructor: function(){
		return this.si && this.si.resItem;
	},
	setActive: function(){
		this.updateState('active', true);
		if (this.stateChange){this.stateChange(true);}
	},
	setInactive: function(){
		this.updateState('active', false);
		if (this.stateChange){this.stateChange(false);}
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
});