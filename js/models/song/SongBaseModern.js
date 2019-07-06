define(function() {
'use strict';

var failCheck = function(fail, self, other) {
  return fail ? other : self
}

var matched = function(ok, item, more) {
  return ok ? item : more
}

var oneNotArray = function(item) {
  if (Array.isArray(item)) {
    debugger;
    return item[0] || null
  }

  return item || null
}

var checkRepeat = function(no_repeat, next, next_circled) {
  return no_repeat ? oneNotArray(next) : oneNotArray(next_circled)
}

return {
  '+passes': {
    'handleState:mp_show': {
      to: {
        to_change: ['<< being_viewed_song << ^', {method: 'set_one'}],
      },
      fn: [
        ['<<<<', '<< being_viewed_song << ^'],
        function(data, self, current) {
          if (data.next_value) {
            return {
              to_change: self,
            }
          }

          if (current === self) {
            return {
              to_change: null,
            }
          }

          return {}
        }
      ]
    }
  },
  '+states': {
    'vis_neig_prev': [
      'compx', ['@modern_prev_possible'],
      oneNotArray,
    ],
    'vis_neig_next': [
      'compx', ['@modern_next_possible'],
      oneNotArray,
    ],
    'next_song': [
      'compx', ['^dont_rept_pl', '@modern_next_matched', '@modern_next_circled_matched'],
      checkRepeat
    ],
    'prev_song': [
      'compx', ['^dont_rept_pl', '@modern_prev_matched', '@modern_prev_matched_circled'],
      checkRepeat
    ]
  },
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

    modern_next_possible_preferred: [
      'compx', [
        '< dont_rept_pl <<< ^',
        '<< @one:modern_next_possible',
        '<< @one:modern_next_possible_circled',
      ],
      checkRepeat
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
