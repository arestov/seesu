define(function() {
'use strict';

var failCheck = function(fail, self, other) {
  return fail ? other : self
}

var matched = function(ok, item, more) {
  return ok ? item : more
}



return {
  '+nests': {
    // next possible
    flow_next_possible: [
      'compx',
      [ '< has_none_files_to_play', '<<<<', '<< @one:next_by_number.flow_next_possible'],
      failCheck,
    ],
    modern_next_possible: [
      'compx', ['<< @one:next_by_number.flow_next_possible'],
    ],
    modern_next_matched: [
      'compx', [
        '< @one:playable < modern_next_possible',
        '<< @one:modern_next_possible',
        '<< @one:modern_next_possible.modern_next_matched'],
      matched,
    ],

    // next possible circled
    flow_next_possible_circled: [
      'compx',
      [ '< has_none_files_to_play', '<<<<', '<< @one:next_cicled_by_number.flow_next_possible_circled'],
      failCheck,
    ],
    modern_next_possible_circled: [
      'compx', ['<< @one:next_cicled_by_number.flow_next_possible_circled'],
    ],
    modern_next_circled_matched: [
      'compx', [
        '< @one:playable < modern_next_possible_circled',
        '<< @one:modern_next_possible_circled',
        '<< @one:modern_next_possible_circled.modern_next_circled_matched'],
      matched,
    ],

    // prev possible
    flow_prev_possible: [
      'compx',
      [ '< has_none_files_to_play', '<<<<', '<< @one:prev_by_number.flow_prev_possible'],
      failCheck,
    ],
    modern_prev_possible: [
      'compx', ['<< @one:prev_by_number.flow_prev_possible'],
    ],
    modern_prev_matched: [
      'compx', [
        '< @one:playable < modern_prev_possible',
        '<< @one:modern_prev_possible',
        '<< @one:modern_prev_possible.modern_prev_matched'],
      matched,
    ],

    // prev possible circled
    flow_prev_possible_circled: [
      'compx',
      [ '< has_none_files_to_play', '<<<<', '<< @one:prev_cicled_by_number.flow_prev_possible_circled'],
      failCheck,
    ],
    modern_prev_possible_circled: [
      'compx', ['<< @one:prev_cicled_by_number.flow_prev_possible_circled'],
    ],
    modern_prev_matched_circled: [
      'compx', [
        '< @one:playable < modern_prev_possible_circled',
        '<< @one:modern_prev_possible_circled',
        '<< @one:modern_prev_possible_circled.modern_prev_matched_circled'],
      matched,
    ],
  }
}
})
