define(function() {
'use strict';

var targetPathNext = function(name) {
  return [
    name, {
      base: 'arg_nesting_next',
      map_values_list_to_target: true,
    },
  ]
}

return {
  '+passes': {
    'handleNesting:songs-list':  {
      to: {
        new_prev_cicled: targetPathNext('<< prev_cicled_by_number'),
        new_prev:  targetPathNext('<< prev_by_number'),
        new_number: targetPathNext('number'),
        new_next:  targetPathNext('<< next_by_number'),
        new_next_cicled:  targetPathNext('<< next_cicled_by_number'),
      },
      fn: function(data) {
        // var old = data.prev_value
        var list = data.next_value
        var result_mut = {
          new_prev_cicled: new Array(list.length),
          new_prev:  new Array(list.length),
          new_number: new Array(list.length),
          new_next:  new Array(list.length),
          new_next_cicled:  new Array(list.length),
        }

        for (var i = 0; i < list.length; i++) {
          var is_start = i === 0
          var is_end = (i + 1) === list.length

          var first = list[0];
          var last = list[list.length - 1];

          var prev = !is_start ? list[i - 1] : null;
          var prev_ci = prev || last
          var next = !is_end ? list[i + 1] : null;
          var next_ci = next || first

          result_mut.new_prev_cicled[i] = prev_ci
          result_mut.new_prev[i] = prev
          result_mut.new_number[i] = i
          result_mut.new_next[i] = next
          result_mut.new_next_cicled[i] = next_ci
        }

        return result_mut
      }
    },
  }
}
})
