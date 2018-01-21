var promisify = require('util').promisify;
var fs = require('fs');
var readFile = promisify(fs.readFile);
var parse = promisify(require('../sax-precise'))

var examCSS = require('./exam-css');
var examHTML = require('./exam-html');

var processor = require('postcss-selector-parser')();

var testPath = '../../src/html-imports/album_preview-big.html';

// console.log(path.resolve(testPath))
var parsed = readFile(testPath, 'utf8')
.then(function(data) {
  return parse(data, {});
});

parsed
.then(function(root) {
  return Promise.all([examCSS(root), examHTML(root)]);
})
.then(function(values) {
  var cls_css = values[0];
  var cls_html = values[1];
  var css_parsed = cls_css.map(parseRule);

  checkCSS(css_parsed, cls_html);
  checkHTML(css_parsed, cls_html)
  // check html for global
  // check css for global (not used)
})
.catch(function(err) {
  console.error(err);
});

var getHTMLIndex = function(cls_html) {
  var all_indexes = cls_html.map(function(item) {
    return item.class_index;
  });

  all_indexes.unshift({})
  return Object.assign.apply(null, all_indexes);
}

var getCSSIndex = function(css_parsed) {
  var result = {};
  css_parsed.forEach(function(rule){
    rule.parsed_selector.forEach(function(part) {
      if (part.type !== 'class') {
        return;
      }
      result[part.value] = part.value;
    })

  });
  return result;
}

function parseRule(rule) {
  var parsed_selector = processor.astSync(rule.selector).nodes[0].nodes;
  console.log(parsed_selector);
  return {
    rule: rule,
    parsed_selector: parsed_selector,
  };
}

function checkCSS(css_parsed, cls_html) {
  var html_index = getHTMLIndex(cls_html)
  console.log('CSS:');

  css_parsed.forEach(function(parsed){
    parsed.parsed_selector.forEach(function(part) {
      if (part.type !== 'class') {
        return;
      }

      // console.log("index[part.value]", index[part.value])

      if (!html_index[part.value]) {
        console.warn(part.value, '\t', parsed.rule.selector);
      } else {
        // console.log("ok", part.value);
      }

    })

  });
}

function checkHTML(css_parsed, cls_html) {
  var index = getCSSIndex(css_parsed);

  console.log(index);

  console.log('HTML:');

  cls_html.forEach(function(item) {
    item.full_list.forEach(function(class_name) {
      if (!index[class_name]) {
        console.log(class_name);
      }
    })
  });
}
