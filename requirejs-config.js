var requirejs = require('./nodejs/require-r-2.2.0.min.js');

requirejs.config({
	nodeRequire: require,
  paths: {
		jquery: '../js/common-libs/jquery-2.1.4.min',
		angbo: '../js/libs/provoda/StatementsAngularParser.min',
    'js': '../js'
	},
	map: {
		'*': {
			su: 'js/seesu',

			pv: 'js/libs/provoda/provoda',
			View: 'js/libs/provoda/View',

			spv: 'js/libs/spv',
			app_serv: "js/app_serv",
			localizer: 'js/libs/localizer',
			view_serv: "js/views/modules/view_serv",
			cache_ajax: 'js/libs/cache_ajax',
			env: "js/env",

			hex_md5: 'js/common-libs/md5',
			'Promise': 'js/common-libs/Promise-3.1.0.mod'
		}
	},
	// packages: [
	// 	{
	// 		name: 'pv',
	// 		location: 'js/libs/provoda',
	// 		main: 'provoda'
	// 	}
	// ],
  // baseUrl: __dirname,
	// paths: {
	// 	pv: 'js/libs/provoda/provoda',
	// 	spv: 'js/libs/spv',
	// 	su: 'js/seesu',
	// 	angbo: 'js/libs/provoda/StatementsAngularParser.min',
	// 	jquery: 'js/common-libs/jquery-2.1.4.min',
	// 	localizer: 'js/libs/localizer',
	// 	cache_ajax: 'js/libs/cache_ajax',
	// 	app_serv: "js/app_serv",
	// 	env: "js/env",
	// 	hex_md5: 'js/common-libs/md5.min',
	// },
	// shim: {
	// 	hex_md5: {
	// 		exports: 'hex_md5'
	// 	}
	// },
	waitSeconds: typeof window !== 'undefined' && window.tizen && 0
});

module.exports = requirejs;
