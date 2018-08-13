var test = require('ava');

var requirejs = require('../../requirejs-config');
var spv = requirejs('spv');
var pv = requirejs('pv');
var Model = requirejs('pv/Model');
var pvUpdate = requirejs('pv/update');
var pvState = requirejs('pv/state');
var getNesting = requirejs('pv/getNesting');
var BrowseMap = requirejs('js/libs/BrowseMap');


var init = requirejs('test/init');

var waitFlow = require('../waitFlow');

var fakeInterface = require('../fakeInterface');

test("state loaded", (t) => {

  var StartPage = spv.inh(BrowseMap.Model, {}, {
    zero_map_level: true,
    req_map: [
      [
        ['bio'],
        function parse(data) {
          return [data && data.bio];
        },
        ['#fake', [
          ['someid'],
          function(api, opts, msq) {
            return api.get('profiles/' + 55, {}, opts);
          }
        ]]
      ]

    ],
    '+states': {
      'number': [
        'compx',
        [],
        function() {
          return  49588;
        }
      ]
    }
  });

  var app = init({
    'api-fake': function () {
      return fakeInterface();
    },
    'chi-start__page': StartPage,
    checkActingRequestsPriority: function() {

    }
  }, function(self) {
    self.all_queues = [];
    self.start_page = self.initChi('start__page');

  }).app_model;

  return waitFlow(app).then((app) => {
    return app.start_page.requestState('bio').then(function() {
      return waitFlow(app);
    });
  }).then(function (app) {
    t.is('was born', pvState(app.start_page, 'bio'));
  })

});
