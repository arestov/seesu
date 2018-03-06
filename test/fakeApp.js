define(function(require) {
'use strict';

// var spv = require('spv');
// var app_serv = require('app_serv');
// var pv = require('pv');
// var $ = require('jquery');
// var LfmAuth = require('./LfmAuth');
var AppModel = require('js/models/AppModelBase');
// var comd = require('./models/comd');
// var StartPage = require('./models/StartPage');
// var VkAuth = require('./libs/VkAuth');
// var VkApi = require('./libs/VkApi');
// var initVk = require('./modules/initVk');
// var PlayerSeesu = require('./modules/PlayerSeesu');
// var cache_ajax = require('cache_ajax');
// var View = require('View');
// var localize_dict = require('js/libs/localizer');
// var route = require('./modules/route');
// var initAPIs = require('./initAPIs');
// var prepare = require('js/libs/provoda/structure/prepare');
// var SearchQueryModel = require('./models/SearchQueryModel');

var App = spv.inh(AppModel, {}, {});


return prepare(App);
});
