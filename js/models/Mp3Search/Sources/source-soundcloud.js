define(function (require) {
'use strict';
var pv = require('pv');
var QueryBase = require('./QueryBase');
var createSource = require('./createSource');
var getQMSongIndex = require('../QMI').getQMSongIndex;
var parseScTrack = require('js/modules/declr_parsers').soundcloud.parseTrack;

var Query = pv.behavior({
  'nest_req-files': [
    [
      function (r, _1, _2, api) {
        if (!r || !r.length) {return;}
        var msq = this.head.msq;
        var result = [];
        for (var i = 0; i < r.length; i++) {
          if (!r[i]) {continue;}
          var file = parseScTrack(r[i], msq, api.key);

          var qmi = getQMSongIndex(msq, file);
          if (qmi == -1) {continue;}

          result.push(file);
        }

        return result;
      }
    ],
    ['sc_api', [
      ['msq'],
      function(api, opts, msq) {
    		return api.get('tracks', {
          filter:'streamable,downloadable',
          q: msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || '')),
          limit: 30,
          offset: 0,
        }, opts);
      }
    ]]
  ],
}, QueryBase);

return pv.behavior({
  'compx-ready': [[], function () {
    return true;
  }],
}, createSource(Query, 'http://soundcloud.com/pages/dmca_policy'));
});
