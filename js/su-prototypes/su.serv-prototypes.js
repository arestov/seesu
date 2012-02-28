var suMapModel = function() {};

mapLevelModel.extendTo(suMapModel, {
	regDOMDocChanges: function(cb) {
		this
			.on('mpl-attach', function() {
				jsLoadComplete(function() {
					su.on('dom', cb);
				});
				
			})
			.on('mpl-detach', function() {
				jsLoadComplete(function() {
					su.off('dom', cb);
				});
			});
	}
});



var suServView = function() {};

servView.extendTo(suServView, {
	init: function() {
		this._super();

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