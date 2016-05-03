define([], function () {
'use strict';

var abc = /\w/;
var curly_start = '{';
var curly_end = '}';

var newObject = function (parent) {
  return {
    keys: [],
    type: 'object',
    parent: parent,
    state: null
  };
};


var single_childed = {
  'object_key': true,
  'object_key_word': true,
};

var markContinued = function (reason_char, cur, state) {
  if (!cur) {
    return state;
  }
  if (cur.type == 'object') {
    if (reason_char === curly_end) {
      cur.state = 'key_complete';
    }

    state.uncompleted_item = cur;
    return state;
  }

  return state;
};

function completeItem(state, cur, reason_char) {
  if (!cur.parent || !single_childed[cur.parent.type]) {
    state.uncompleted_item = cur.parent;
    return markContinued(reason_char, state.uncompleted_item, state);
  }

  return completeItem(state, cur.parent, reason_char);
}

var checkChar = function(char, num, state) {
  var error = function (text) {
    return new Error(char + '  ' + num + ': ' + text);
  };
  var cur = state.uncompleted_item;
  switch ((cur && cur.type) || '') {
    case '': {
      switch (char) {
        case curly_start: {
          state.uncompleted_item = newObject(null);
          state.start = state.uncompleted_item;
          return state;
        }
      }
      throw error('cant start');
    }
    case 'object': {
      switch (cur.state) {
        case 'key_complete': {
          switch (char) {
            case ' ':
              return state;
            case ',': {
              cur.state = null;
              state.uncompleted_item = cur;
              return state;
            }
            case curly_end: {
              // object end:
              return completeItem(state, cur);
            }
          }
          throw error('expect `,` (comma) here');
        }
      }

      switch (char) {
        case ' ':
          return state;
        case curly_end: {
          // object end:
          return completeItem(state, cur);
        }
      }
      if (!abc.test(char)) {
        throw error();
      }

      // key:
      var item_KEY = {
        parent: cur,
        type: 'object_key',
        word: null,
        data: null,
      };

      var item_KEY_WORD = {
        parent: item_KEY,
        type: 'object_key_word',
        data: char,
        state: null,
      };

      item_KEY.word = item_KEY_WORD;

      state.uncompleted_item = item_KEY_WORD;

      cur.keys.push(item_KEY);
      return state;
    }
    case 'object_key_word': {
      switch (cur.state) {
        // word++
        // end of word by space
        // end of word by comma
        // value start
        case null: {
          switch (char) {
            case ' ': {
              cur.state = 'done';
              state.uncompleted_item = cur;
              return state;
            }
            case curly_end: {
              return completeItem(state, cur, char);
            }
            case ',': {
              return completeItem(state, cur, char);
            }
            case ':': {
              cur.state = 'wait_value';
              state.uncompleted_item = cur;
              return state;
            }
          }

          if (!abc.test(char)) {
            throw error('');
          }
          cur.data += char;
          return state;
        }
        case 'done': {
          switch (char) {
            case ' ': {
              // cur.state = 'done';
              return state;
            }
            case curly_end: {
              //object end
              return completeItem(state, cur, char);
            }
            case ',': {
              return completeItem(state, cur, char);
            }
            case ':': {
              cur.state = 'wait_value';
              state.uncompleted_item = cur;
              return state;
            }

          }
          throw error('');
        }
        case 'wait_value': {
          switch (char) {
            case ' ': {
              return state;
            }
            case curly_start: {
              state.uncompleted_item = newObject(cur);
              cur.parent.data = state.uncompleted_item;
              return state;
            }
          }

          if (!abc.test(char)) {
            throw error('');
          }

          var item_VALUE = {
            parent: cur,
            type: 'object_key_value',
            data: char
          };

          state.uncompleted_item = item_VALUE;
          cur.parent.data = state.uncompleted_item;
          return state;


          // start object value of key here!
        }
      }
      throw error();
    }
    case 'object_key_value': {
      switch (char) {
        case ',': {
          return completeItem(state, cur, char);
        }
        case curly_end: {
          return completeItem(state, cur, char);
        }
      }
      cur.data += char;
      return state;
    }
    case 'object_key': {
      // 1 - end
      // 2 - value
      // 3 - value_object
    }

    throw error();
  }
};

var parse = function (target_str) {
  var state = {
    uncompleted_item: null
  };


  var cur_state = state;
  for (var i = 0; i < target_str.length; i++) {
    cur_state = checkChar(target_str[i], i, cur_state);
  }
  return state && state.start;
};

return parse;
});
