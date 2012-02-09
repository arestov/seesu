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
			var c = (c = _this.getC()) && (c[0] || c);
			if (c && c.ownerDocument == dead_doc){
				_this.die();
			}
			
		};
		su.on('dom-die', onDOMDie);
		this.onDie(function() {
			su.off(onDOMDie);	
		});
	}
});