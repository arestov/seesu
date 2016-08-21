'use strict';

const w = require("CSSwhat")
const getGroups = (parsed_array) => {
  let result = [];
  let cur_start = 0;
  for (var i = 0; i < parsed_array.length; i++) {
    let cur = parsed_array[i];
    if (cur.type !== 'descendant' && cur.type !== 'child') {
      continue;
    }
    result.push(parsed_array.slice(cur_start, i));
    cur_start = i + 1;
  }

  result.push(parsed_array.slice(cur_start, i));

  return result;
}


console.log(getGroups(w('span div')[0]))
