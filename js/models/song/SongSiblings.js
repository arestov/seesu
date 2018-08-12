define(function(require) {
"use strict";
var Model = require('pv/Model');
var spv = require('spv');
var pvState = require('pv/state');
var updateNesting = require('pv/updateNesting')

// prev_visible - possible_list
// next_visible - possible_list
// next_possbile (для приортетной загрузки) (possible_list_circled)
// next_confident confident_list


// next_possible = next_song.next_possible_to_use
// next_possible_to_use = self || next_possible

// next_confident = next_possible.next_confident_to_use
// next_confident_to_use = self || next_confident


// forward_confident

return spv.inh(Model, {}, {
  'nest_sel-possible_list': {
    from: '^^>songs-list',
    where: {
      '>can-use-as-neighbour': [['=', 'boolean'], [true]]
    }
  },

  'stch-@possible_list': function(target, _, __, source) {
    if (!source.items || !source.items.length) {
      return;
    }


    var next = [];
    var prev = [];

    var num = pvState(target, 'index_num');
    for (var i = 0; i < source.items.length; i++) {
      var cur = source.items[i]
      var cur_num = pvState(cur, 'index_num');
      if (cur_num < num) {
        prev.push(cur)
      }
      if (cur_num > num) {
        next.push(cur);
      }
    }



    var circled = next.concat(prev);

    prev.reverse();

    updateNesting(target, 'next_visible_song', next && next[0])
    updateNesting(target, 'prev_visible_song', prev && prev[0])
    updateNesting(target, 'next_possible_song', circled && circled[0])
  },
  'nest_sel-confident_list': {
    from: '^^>songs-list',
    where: {
      '>playable': [['=', 'boolean'], [true]]
    }
  },
  'stch-@confident_list': function(target, _, __, source) {
    if (!source.items || !source.items.length) {
      return;
    }


    var next = [];
    var prev = [];

    var num = pvState(target, 'index_num');
    for (var i = 0; i < source.items.length; i++) {
      var cur = source.items[i]
      var cur_num = pvState(cur, 'index_num');
      if (cur_num < num) {
        prev.push(cur)
      }
      if (cur_num > num) {
        next.push(cur);
      }
    }

    var circled = next.concat(prev);

    updateNesting(target, 'next_confident_song', circled && circled[0])
  },
  '+states': {
    'index_num': [
      'compx', ['^index_num']
    ],
    'check': [
      'compx',
      ['n'],
      function(n) {
        console.log('SongSiblings', n)
      }
    ]
  }
});
})
