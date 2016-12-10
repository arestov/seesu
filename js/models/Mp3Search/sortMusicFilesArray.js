define(function (require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var pvState = pv.state;
var QMI = require('./QMI');
var getQueryString = QMI.getQueryString;

function calcSumm(arr) {
  var summ = 0;
  for (var i = 0; i < arr.length; i++) {
    summ += arr[i];
  }
  return summ;
}

function getAvg(arr) {
  if (!arr || !arr.length) {
    return;
  }
  return calcSumm(arr)/arr.length;
}

var getAverageDurations = function(mu_array, time_limit, qmi_index){
	var r = {};
	var filtr = function(value){
		if (value && value > time_limit){
			return true;
		}
	};
	for (var a in qmi_index){
		var durs = spv.filter(spv.filter(qmi_index[a], 'duration', filtr), "duration");
		r[a] = getAvg(durs);
	}
	return r;
};

 function sortMusicFilesArray(mp3_search, music_list, msq, time_limit) {
  var searches_pr = pvState(mp3_search, 'searches_pr');

  var query_string = getQueryString(msq);
  time_limit = time_limit || 30000;

  var field_name = ['query_match_index', query_string.replace(/\./gi, '')];
  var qmi_index = spv.makeIndexByField(music_list, field_name);
  var average_durs = getAverageDurations(music_list, time_limit, qmi_index);

  music_list.sort(function(a, b){
    return spv.sortByRules(a, b, [
      // qmi
      function(item) {
        var value = spv.getTargetField(item, field_name);
        if (value === -1){
          return Infinity;
        } else {
          return value;
        }
      },
      // search name order
      {
        field: function(item) {
          if (item.from && searches_pr.hasOwnProperty(item.from) ) {
            return searches_pr[item.from];
          } else {
            return -1000;
          }
        },
        reverse: true
      },
      // time diff
      function(item){

        var average_dur = average_durs[spv.getTargetField(item, field_name)];
        if (average_dur){
          if (item.duration && item.duration > time_limit){
            return Math.abs(average_dur - item.duration);
          } else {
            return average_dur * 1000;
          }
        } else {
          return Infinity;
        }
      }
    ]);
  });
}

sortMusicFilesArray.getAvg = getAvg;

return sortMusicFilesArray;
});
