var requirejs = require('./nodejs/require-r-2.1.19.min.js');

requirejs.config({
	nodeRequire: typeof require !== 'undefined' && require,
	packages: [
		{
			name: 'pv',
			location: 'js/libs/provoda',
			main: 'provoda'
		}
	],
	paths: {
		//pv: 'js/libs/provoda/provoda',
		spv: 'js/libs/spv',
		su: 'js/seesu',
		jquery: 'js/common-libs/jquery-2.1.4.min',
		localizer: 'js/libs/localizer',
		cache_ajax: 'js/libs/cache_ajax',
		app_serv: "js/app_serv",
		hex_md5: 'js/common-libs/md5.min',
	},
	shim: {
		hex_md5: {
			exports: 'hex_md5'
		}
	},
	waitSeconds: typeof window !== 'undefined' && window.tizen && 0
});

requirejs(['su'], function() {
	
	//app thread;
});