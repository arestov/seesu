const path = require('path');
const promisify = require('./promisify');
const separate = require('./css-color-themes');

const parseHTMLRAW = require('./sax-precise');
const selectHTML = parseHTMLRAW.select;
const stringifyHTML = parseHTMLRAW.stringify;
const parseHTML = promisify(parseHTMLRAW);

const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);

const glob = promisify(require('glob'));


//
// parse.stringify(root)

const showError = function (err) {
  console.log(err);
  console.log(err.stack)
};


const html_files = glob("../src/**/*.html");
const css_files = glob("../css/**/*.css");

const wrapHTML = function (data) {
  if (!data.startsWith('<!DOCTYPE')) {
    return `<div><!--temp wrap-->${data}</div>`
  }

  return data;
};


const wrap_start = '<div><!--temp wrap-->'.length;
const wrap_end = '</div>'.length;
const unwrapHTML = function (data) {
  if (!data.startsWith('<div><!--temp wrap-->')) {
    return data;
  }

  return data.slice(wrap_start, data.length - wrap_end);
}


const html_parsed = html_files
  .then(list => Promise.all(list.map(path =>
    readFile(path)
      .then(file => parseHTML(wrapHTML(file.toString()), {}))
      // .then(root => ({
      //   path: path,
      //   root: root
      // }))
      .then(root => {
        const styles = selectHTML('style', root);
        if (!styles.length) {
          return;
        }

        styles.forEach(style => {
          style.children.forEach(node => {
            node.data = separate(node.data).toString();
          });
        });

        return writeFile(path, unwrapHTML(stringifyHTML(root)));
      })
  )))

  .catch(showError);;

// const css_parsed = css_files.then((list) => Promise.all(
//   list.map(
//     (path, i) =>
//       readFile(path)
//         .then((file) => postcss.parse(file))
//         .then((css_root) => {
//           return writeFile(path, separate(css_root).toString());
//         })
//   )
// )).catch(showError);
