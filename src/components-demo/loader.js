requirejs.config({
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
		view_serv: "js/views/modules/view_serv",
		env: "js/env",
		hex_md5: 'js/common-libs/md5.min',
	},
	shim: {
		hex_md5: {
			exports: 'hex_md5'
		}
	},
	waitSeconds: window.tizen && 0
});


requirejs(['jquery', 'pv'], function($, pv) {
	$(function() {
		var samples = $('#ui-samples');
		
	});
});
