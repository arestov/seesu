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
    return item[0] || null
  }

  return item || null
}

var checkRepeat = function(no_repeat, next, next_circled) {
  return no_repeat ? oneNotArray(next) : oneNotArray(next_circled)
}

var buildFlow = function(name_next_base, name_flow, name_possbile, name_matched) {
  var name_flow_helper = '<< @one:' + name_next_base + '.' + name_flow

  var mut_result = {}

  mut_result[name_flow] = [
    'compx',
    [ '< has_none_files_to_play', '<<<<', name_flow_helper],
    failCheck,
  ]

  mut_result[name_possbile] = [
    'compx', [name_flow_helper],
  ]

  mut_result[name_matched] = [
    'compx', [
      '< @one:playable < ' + name_possbile,
      '<< @one:' + name_possbile,
      '<< @one:' + name_possbile + '.modern_next_matched'],
    matched,
  ]

  return mut_result
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
  '+nests': Object.assign({},
    {
      'vis_neig_prev': [
        'compx', ['<< @one:modern_prev_possible'],
      ],
      'vis_neig_next': [
        'compx', ['<< @one:modern_next_possible'],
      ],
    },


    // next possible
    buildFlow('next_by_number', 'flow_next_possible', 'modern_next_possible', 'modern_next_matched'),

    // next possible circled
    buildFlow('next_cicled_by_number', 'flow_next_possible_circled', 'modern_next_possible_circled', 'modern_next_circled_matched'), {

    modern_next_possible_preferred: [
      'compx', [
        '< dont_rept_pl <<< ^',
        '<< @one:modern_next_possible',
        '<< @one:modern_next_possible_circled',
      ],
      checkRepeat
    ]},

    // prev possible
    buildFlow('prev_by_number', 'flow_prev_possible', 'modern_prev_possible', 'modern_prev_matched'),

    // prev possible circled
    buildFlow('prev_cicled_by_number', 'flow_prev_possible_circled', 'modern_prev_possible_circled', 'modern_prev_matched_circled')

)}
})
