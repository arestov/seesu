'use strict';
const path = require('path');
const promisify = require('./promisify');
const postcss = require('postcss');
const glob = promisify(require('glob'));
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);
const parseSelector = require('CSSwhat');
const stringifyCSS = require('./stringifyCSS');
const keyBy = require('lodash/keyBy');
const groupBy = require('lodash/groupBy');
const forEach = require('lodash/forEach');
const get = require('lodash/get');
const uniq = require('lodash/uniq');
const includes = require('lodash/includes');

const getStruc = require('./pvstruc');
const parseHTML = promisify(require('./sax-precise'));
const selectHTML = require('./sax-precise').select;

const html_files = glob("../src/**/*.html");
const css_files = glob("../css/**/*.css");

const global_classes = keyBy([
  'complex-page',
  'inactive-page',
  'full-page',
  'page-scheme',
  'can_be_animated',
  'map_animating',
  'show-zoom-to-track'
]);

const extend = (elem) => {
  if (!elem.attribs['pv-class']) {
    return;
  }

  return {
    'pv-class': getStruc(elem.attribs['pv-class'])
  }
};

const checkAttribute = (next, data) => {
  if (data.action !== 'element' || data.name !== 'class') {
    return;
  }
  return function (elem) {
    if (!elem.extended || !elem.extended['pv-class']) {
      return false;
    }
    return elem.extended['pv-class'].hasOwnProperty(data.value) && next(elem);
  }
};

const select_options = {
  checkAttribute: checkAttribute,
}

const showError = function (err) {
  console.log(err);
  console.log(err.stack)
};

const wrapHTML = function (data) {
  if (!data.startsWith('<!DOCTYPE')) {
    return `<div>${data}</div>`
  }

  return data;
};

html_files.then(function (files) {
    // console.log(files);
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.
  }, showError);

const html_parsed = html_files
  .then(list => Promise.all(list.map(path =>
    readFile(path)
      .then(file => parseHTML(wrapHTML(file.toString()), {extend: extend}))
      .then(root => ({
        path: path,
        root: root
      }))
  )));

// html_parsed.then(list => console.log(list[0]), showError);

/*


parse(file.contents.toString(), {}, function(err, root) {
var styles = parse.select('style', root);

*/

const css_parsed = css_files.then((list) => Promise.all(
  list.map(
    (path) => readFile(path)
    .then((file) => postcss.parse(file))
    .then((css_root) => {
      let rules = [];
      css_root.walkRules(rule => {
        rules.push(rule);
      });

      return {
        css_root: css_root,
        path: path,
        rules: rules,
      }
    })
  )
));

const getParsedSelector = (selector) => {
  let parsed;
  let result;
  try {
    result = parseSelector(selector);
    parsed = result && result[0];
  } catch (e) {
    // console.log(e);
    // console.log(e.stack);
    // console.log(selector);
    return;
  }

  if (!result) {
    console.log('no res', selector, result);
  }

  return parsed;
}


const getMatches = (selector, htmls) => {
  let matched = [];

  htmls.forEach(html => {
    try {
      const ok = selectHTML(selector, html.root, select_options);
      if (!ok.length) {
        return;
      }
      matched = matched.concat([{
        wrap: html,
        matched: ok
      }]);
    } catch (e) {
      if (selector.includes(':')) {
        return;
      }
      // console.log(rule);
      console.log(selector, ':');
      console.log('ERROR', e);
      console.log(e.stack);
      // console.log(path);
      // console.log(rule.source.input.from )
      // console.log(rule.source.start )
      // console.log(parsed);

      // console.log(html.path)
      // console.log()
    }

  });

  return matched;
}

const findMatches = (path, rule, htmls) => {
  if (rule.parent && rule.parent.name === 'keyframes') {
    return;
  }
  rule.selectors.forEach(selector => {

    const parsed = getParsedSelector(selector);

    console.log(selector);
    console.log(parsed);
    console.log('\n');


    let matched = [];

    htmls.forEach(html => {

      try {
        matched = matched.concat(selectHTML(selector, html.root, select_options));
      } catch (e) {
        if (selector.includes(':')) {
          return;
        }
        // console.log(rule);
        console.log('ERROR', e);
        console.log(selector);
        console.log(path);
        console.log(rule.source.input.from )
        console.log(rule.source.start )
        console.log(parsed);

        // console.log(html.path)
        // console.log()
      }

    });

    if (!matched.length) {
      return;
    }

    console.log(selector, matched.length);

    // .select('head', root);
  });
  /*

  expect list with matches:
  full, start, end

  */


};

// css_parsed.then((list) => console.log('sss', list))

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

const isClassPart = (cur) =>
  cur.action === 'element' && cur.name === 'class' && cur.type === 'attribute';

const hasClass = (parsed_array) => {
  for (var i = 0; i < parsed_array.length; i++) {
    const cur = parsed_array[i];
    if (isClassPart(cur)) {
      return true;
    }
  }
};

const selectWithClass = (groups) => {
  return groups.find(hasClass);
};

const isNested = (part) => {
  return part.type === 'descendant' || part.type === 'child';
}

const pseudos = keyBy(['active', 'hover', 'after', 'focus']);

const isPseudo = (part) => {
  if (part.type === 'pseudo' && pseudos[part.name]) {
    return true;
  }
}

const withoutGlobalAndPseudo = (parsed) => {
  if (!parsed) {
    return;
  }

  return parsed.reduce((result, part, i) => {
    if (isClassPart(part) && global_classes[part.value]) {
      return result;
    }

    if (isPseudo(part)) {
      return result;
    }

    if (isNested(part) && (!result.length || isNested(result[result.length - 1]))) {
      return result;
    }

    result.push(part);

    return result;
  }, []);
  //
};

const getCombo = (selector) => {
  const raw = getParsedSelector(selector);
  const full = withoutGlobalAndPseudo(raw);

  if (!full) {
    return;
  }

  const groups = getGroups(full);

  const start = selectWithClass(groups);
  const end = selectWithClass(groups.slice().reverse());

  const fullString = stringifyCSS([full]);

  return {
    original: {
      string: selector,
      parsed: raw
    },
    full: {
      string: fullString,
      parsed: full
    },
    start: {
      string: start && stringifyCSS([start]),
      parsed: start,
    },
    end: end !== start && {
      string: end && stringifyCSS([end]),
      parsed: end,
    },
    each_part_at_end: end !== start && end.filter(part => isClassPart(part)).map(part => {
      return {
        string: stringifyCSS([[part]]),
        parsed: [part],
      };
    })
  }
};

const findClassPart = (parsed_array) => {
  let part_start = 0;
  let has_match = false;
  for (var i = 0; i < parsed_array.length; i++) {
    parsed_array[i]
  }



/*
action: "element"
ignoreCase: false
name: "class"
type: "attribute"
*/

  // 'child'
  // 'descendant'
};

const all_selectors = css_parsed.then(list => {
  return list.reduce((result, item) => {
    const rule = item.rule;

    return item.rules.reduce((result, rule) => {
      if (rule.parent && rule.parent.name === 'keyframes') {
        return result;
      }

      return rule.selectors.reduce((result, selector, i) => {
        result.push({
          num: i,
          // selector: selector,
          rule: rule,
          file: item.path,
          wrap: item,
          selector: getCombo(selector)
        });
        return result;
      }, result);
    }, result);
    // const

  }, []);
});

function getFiles(matches, item) {
  return matches.map(item => {
    const name = path.parse(item.wrap.path).name;
    if (name !== 'index') {
      return name;
    }

    const with_parent = path.parse(
      path.relative(path.join(item.wrap.path, '../..'), item.wrap.path)
    );


    return `${with_parent.dir}/${with_parent.name}`;
  }).sort();
}

const hasMatches = (item, place) => get(item, ['files', place, 'length']);

const exactMatch = (item) => {
  const full = item.files.full || [];
  const end = item.files.end || [];
  const each_part_at_end = item.files.each_part_at_end || [];
  const start = item.files.start || [];

  if (full.length === 1) {
    return full;
  }

  if (each_part_at_end.length === 1) {
    return each_part_at_end;
  }

  const combinations = start.filter(file_name => item.files.index_each_end[file_name]);

  if (combinations.length === 1) {
    return start;
  }



  // if ((start.length === 1 || !start.length) && hasMatches(item, 'each_part_at_end') === 1) {
  //   return true;
  // }

  // if (!start && end === 1) {
  //   return true;
  // }

  // if (start.length === 1 && hasMatches(item, 'each_part_at_end') === 1) {
  //   return true;
  // }


};


Promise.all([all_selectors, html_parsed]).then(args => {
  const list = args[0];
  const htmls = args[1];

  const htmls_index = keyBy(htmls, 'path');
  // console.log(Object.keys(htmls_index));
  console.log('htmls: ', htmls.length)
  //
  // console.log(htmls_index['../src/html-imports/pages/page-search.html']);


  const result = list
    .filter(item => item.selector)
    .map(item => {
      item.matches = {
        full: getMatches(item.selector.full.string, htmls),
        start: getMatches(item.selector.start.string, htmls),
        end: getMatches(item.selector.end.string, htmls),
        each_part_at_end: item.selector.each_part_at_end &&
          item.selector.each_part_at_end.map(part => getMatches(part.string, htmls)).filter(matches => matches.length)
      };
      return item;
    })
    .map(item => {
      const full = getFiles(item.matches.full, item);
      const end = item.matches.end && getFiles(item.matches.end, item);
      const each_part_at_end = item.matches.each_part_at_end &&
        item.matches.each_part_at_end.map(part => getFiles(part, item));


      const all = [].concat(full, end, each_part_at_end && each_part_at_end.reduce((res, item) =>  {
        if (!item) {
          return res;
        }
        res = res.concat(item);
        return res;
      }, [])).filter(item => item);


      item.files = {
        full: uniq(full),
        start: item.matches.start && uniq(getFiles(item.matches.start, item)),
        end: uniq(end),
        each_part_at_end: uniq(each_part_at_end),
        index_each_end: keyBy(each_part_at_end),
        index_all: keyBy(all)
      };
      return item;
    });

  const fileKey = item => (
    exactMatch(item).join()
    // get(item, 'files.full.0') || get(item, 'files.start.0') || get(item, 'files.end.0') || get(item, 'files.each_part_at_end.0')
  )

  const some_result = result
    .filter(item => [item.matches.start, item.matches.full, item.matches.end].some(item => item.length))
    .filter(item => exactMatch(item))
    .filter(item => {
      if (fileKey(item) === 'src/index') {
        return false;
      }
      return true;
    });


  const grouped = groupBy(some_result, fileKey);
  forEach(grouped, (array, html_chunk_name) => {


    const by_css_file = groupBy(array, 'file');


    console.log(`${Object.keys(by_css_file).length}(${array.length}) in ${html_chunk_name}`);
    forEach(by_css_file, (items, css_file_name) => {
      console.log(css_file_name);
      forEach(items, logItem);
    });
    console.log('');
    console.log('');
  });

  console.log(`${Object.keys(grouped).length} components`);
  console.log('');
  console.log('');
  // forEach
  //



  // logFile(result, '../css/master.css');

  result
  .filter(item => !item.selector || item.selector.full.parsed.some(isClassPart))
  .filter(item => {


    const full = item.files.full || [];
    const start = item.files.start || [];
    const end = item.files.end || [];
    const each_part_at_end = item.files.each_part_at_end || [];

    if (!full.length && !each_part_at_end.length && !start.length) {
      return true;
    }
  })
  .forEach(logItem)



}).catch(showError);

function logItem(item) {
  console.log('   ',
    item.files.start.length,
    item.files.full.length,
    item.files.end.length,
    item.selector.full.string,

    item.selector.full.string !== item.selector.original.string
      ? `(${item.selector.original.string})`
      : ''
  );



  // if (item.selector.original.parsed.length !== item.selector.full.parsed.length) {
  //   console.log(item.selector.full.parsed)
  // }
}

function showSelector(result, selector) {
  const index = groupBy(result, 'selector.full.string');
  console.log(index[selector]);
}


function sepFile(result, css_file, html_chunk_name) {

  const css_file_by_matches = groupBy(result, 'file')[css_file].filter(item => exactMatch(item)).reduce((index, item) => {
    var keys = item.files.index_all;
    forEach(keys, key => {
      if (!index[key]) {
        index[key] = [];
      }
      index[key].push(item);
    });

    return index;
  }, {});


  const moved = postcss.root();

  const array = css_file_by_matches[html_chunk_name];
  const original = array[0].rule.parent;

  array.forEach(item => {
    const rule = item.rule;

    if (rule.mark) {
      return;
    }

    // rule.prepend(postcss.comment({ text: `<<move to '${html_chunk_name}.html'>>` }));
    const parent = rule.parent;

    if (!rule || !rule.parent) {
      console.log(rule)
    }


    rule.mark = true;
    parent.removeChild(rule);
    moved.append(rule.clone());
    moved.append({ text: '\n' });
  });


  return {
    original: original.toString(),
    moved: moved.toString()
  }

  return

  // postcss.stringify(array[0].rule.parent);
}

function logFile(result, css_file) {
  const css_file_by_matches = groupBy(result, 'file')[css_file].filter(item => !exactMatch(item)).reduce((index, item) => {
    var keys = item.files.index_all;
    forEach(keys, key => {
      if (!index[key]) {
        index[key] = [];
      }
      index[key].push(item);
    });

    return index;
  }, {});

  console.log(css_file)
  forEach(css_file_by_matches, (items, match_name) => {
    console.log(' ', match_name);
    forEach(items, logItem);
    console.log('');
  });

}


function helpDead(result) {
  const no_matches = result
    .filter(item => {
      if (
        hasMatches(item, 'start') ||
        hasMatches(item, 'full') ||
        hasMatches(item, 'end') ||
        hasMatches(item, 'each_part_at_end')
      ) {
        return false;
      }

      return true;
    });

  console.log('DEAD CODE!?');

  forEach(groupBy(no_matches, 'file'), (array, file) => {
    console.log(file);
    array.forEach(item => {
      console.log('  ', item.selector.full.string);
    })
  })
}
//
// all_selectors.then(list => {
//   // const index = indexBy();
//
// })

// оценка используемости названия класса
// оценка использования  в html классов селектора


// all_selectors.then(list => console.log(list.map(item => item.selector))).catch(showError);

// Promise.all([css_parsed, html_parsed]).then(args => {
//   const list = args[0];
//   const htmls = args[1];
//   return list.map(item => {
//     if (!item || !item.rules) {
//       console.log('no rules', item && Object.keys(item))
//       return;
//
//     }
//
//     return item.rules.map(rule => {
//       return findMatches(item.path, rule, htmls);
//     });
//   });
// }).catch(showError);



// css_parsed.then((list) => console.log(list[0].rules[0]))

//
// node_glob("../src/**/*.html", function (err, res) {
//   console.log(err, res);
// })
