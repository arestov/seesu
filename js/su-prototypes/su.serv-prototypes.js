var suMapModel = function() {};

createPrototype(suMapModel, new mapLevelModel(), {
	regDOMDocChanges: function(cb) {
		this
			.on('mpl-attach', function() {
				suReady(function() {
					su.on('dom', cb);
				});
				
			})
			.on('mpl-detach', function() {
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
			_this.isAlive();
		};
		su.on('dom-die', onDOMDie);
		this.onDie(function() {
			su.off(onDOMDie);	
		});
	},
	getCNode: function(c) {
		return (c = this.getC()) && (typeof length != 'undefined' ? c[0] : c);
	},
	isAlive: function() {
		if (this.dead){
			return false;
		} else {
			if (this.getC()){
				var c = this.getCNode();
				if (c && getDefaultView(c.ownerDocument)){
					return true;
				} else {
					this.markAsDead();
					return false;
				}
			} else {
				return true;
			}
			
			
		}
	}
});