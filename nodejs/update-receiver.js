(function() {
	"use strict";
	var request = require('./updater_libs/node_modules/request'),
	fs = require('fs'),
	rm = require('./updater_libs/node_modules/rimraf'),
	path = require('path'),
	Zip = require('./updater_libs/node_modules/adm-zip');


	//var appPath = path.dirname(process.execPath);
	var appPath = process.cwd();

	var handleZip = function( tempZipFilePath, usedPackageKey ) {
		var installDir = path.join( appPath, usedPackageKey );
		var zip = new Zip( tempZipFilePath );
		zip.extractAllTo(installDir, true);
		require( installDir );
	};

	var packageKey = 'install-pack';
	var getUpdatePackage = function(packageUrl, userAppVersion, cursomPackageKey) {
		//console.log('requesting ' + packageUrl);

		var usedPackageKey = cursomPackageKey || packageKey;

		var tempZipFilePath = path.join( appPath, usedPackageKey + '.zip' );

		var requestStream = request( packageUrl );

		var writeStream = fs.createWriteStream( tempZipFilePath );
		requestStream.pipe( writeStream );


		writeStream.on('finish', function() {
			//console.log('writed');
			handleZip( tempZipFilePath, usedPackageKey );
		});

	};

	

	module.exports = getUpdatePackage;
	
})();