define(function(require) {
'use strict';
var cloneObj = require('spv').cloneObj
/*

pass: {
  'created_song': {
    dest: ['/playlists/:playlist_name/@songs_list', {
      method: 'at_start' || 'at_end' || 'set_one' || 'replace' || 'at_index' || 'move_to',
      model: Model,
    }],
    calc: [
      ['dep1', 'dep2', 'dep3'],
      function(data, dep1, dep2, dep3) {
        return []
      }
    ]
  },
}


=====


pass: {
    'nesting:some_nesting': {
        dest: {
            'next': ['selected', { // we can declare multiple targets. next and prev are nicknames. only to use it in answer/return

                // target prop wil set target to next value of `some_nesting`
                // `selected` is state name
                // so `selected` will be changed to new value of `some_nesting`
                target: 'subject_next',

                // so: selected prop of next nesting:some_nesting can be setted by using `next` in answer
            }],
            'prev': ['selected', {
                // `target` prop wil set target to prev value of `some_nesting`
  // so `selected` will be changed to old value of `some_nesting`
  target: 'subject_prev',
            }]
        },
        calc: function(data) {
            return {
                next: true, // Исполнитель должен проверить hasOwnProperty()
                prev: false,
            }
        }
    },

}



pass: {
    "hardcode": {
        dest: "__hard_update__",
        calc: function(data) {
            return {
                86828597952: {prop: value},
            }
        }
    }
}

*/

var getDest = function(dest) {
  return {
    type: '',
    path: '',
    method: '',
  }
}

function PassDcl(name, data) {
  this.pass_name = name;

  var dest = data.from;
  // var

  var calc = data.calc;
  this.handleFn = calc;
}

return function checkPass(self, props) {
  if (!props['+pass']) {
    return;
  }

  var _cur_passes = self._cur_passes || {};
  var more_pass = props['+pass'];

  var extended = cloneObj({}, _cur_passes);

  for (var name in more_pass) {
    var cur = new PassDcl(name, more_pass[name]);
    extended[name] = cur;
  }

  self._cur_passes = extended;
  return true;
}
})
