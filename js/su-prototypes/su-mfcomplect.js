var mfComplect = function() {
	
};
createPrototype(mfComplect, new servModel(), {
	
});



var mfСorUI = function(mf_cor) {
	this.callParentMethod('init');
	this.createBase();
	this.setModel(mf_cor);
};
createPrototype(mfСorUI, new servView(), {
	createBase: function() {
		this.c = $('<div></div>')
	}
});


var mfСor = function() {
	this.callParentMethod('init');
};
createPrototype(mfСor, new servModel(), {
	ui_constr: function() {
		return new mfСorUI(this);
	},
	setSem: function(sem) {
		this.sem  = sem;
	}
});

/*

this.fire('got-results')

this.fire('got-result')

this.fire('error')


this.fire('got-nothing')

в процессе

завершен



имеет результаты

0 результатов


имеет ошибку

 непоправимую ошибку

 ошибку поправимую кем угодно
 ошибку поправимую только несамостоятельно


*/