var suMapModel = function() {};

createPrototype(suMapModel, new mapLevelModel(), {
	regDOMDocChanges: function(cb) {
		this
			.on('mpl-attach', function() {
				suReady(function() {
					su.on('dom', cb);
				});
				
			})
			.on('mpl-dettach', function() {
				suReady(function() {
					su.off('dom', cb);
				});
			});
	}
});



var suServView = function() {};
createPrototype(suServView, new servView(), {
	init: function() {
		this.callParentMethod('init');

		var _this = this;
		var onDOMDie = function(currend_doc, dead_doc) {
			var c = _this.getCNode();
			if (c && c.ownerDocument == dead_doc){
				_this.die();
			}
			
		};
		su.on('dom-die', onDOMDie);
		this.onDie(function() {
			su.off(onDOMDie);	
		});
	},
	getCNode: function(c) {
		return (c = this.getC()) && (c[0] || c);
	},
	isAlive: function() {
		if (this.dead){
			return false;
		} else {
			var c = this.getCNode();
			if (c){
				if (c.ownerDocument.defaultView){
					return true;
				} else {
					this.die();
					return false;
				}
			} else {
				return true;
			}
			
		}
	}
});