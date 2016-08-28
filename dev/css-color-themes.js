'use strict';
const postcss = require('postcss');
const extractor = require('css-color-extractor');
const includes = require('lodash/includes');

var propertyTransformers = {
    'background':    'background-color',
    'border':        'border-color',
    'border-top':    'border-top-color',
    'border-right':  'border-right-color',
    'border-bottom': 'border-bottom-color',
    'border-left':   'border-left-color',
    'outline':       'outline-color'
};

function transformProperty(decl, colors) {
    if (typeof propertyTransformers[decl.prop] === 'undefined') {
        return;
    }

    if (colors.length === 1) {
        decl.prop = propertyTransformers[decl.prop];
        decl.value = colors[0];
    }
}

function processDecl(decl) {
    var colors = extractor.fromDecl(decl);
    if (!colors.length) {
      return;
    }

    if (colors.length === 1 && (colors[0] === '0')) {
      // colors[0] === 'transparent'
      return;
    }

    if (includes(colors, '0')) {
      // console.log(decl.prop, decl.value);
    }

    let copy = decl.clone();

    decl.value = colors.reduce((result, color) => {
      if (color === '0') {
        return result;
      }
      return result.replace(color, 'transparent');
    }, decl.value);

    if (propertyTransformers.hasOwnProperty(copy.prop)) {
      copy.prop = propertyTransformers[decl.prop];
      copy.value = colors[colors.length - 1];

    }




    return copy;
    // if (colors.length === 0) {
    //     decl.remove();
    // } else {
    //     transformProperty(decl, colors);
    // }
}

// function processRule(rule) {
//     rule.each(processDecl);
//
//     if (rule.nodes.length === 0) {
//         rule.remove();
//     }
// }

// function processAtrule(atrule) {
//     switch (atrule.name) {
//         case 'media':
//             atrule.each(processNode);
//
//             if (atrule.nodes.length === 0) {
//                 atrule.remove();
//             }
//
//             break;
//         // @TODO deal with other types of atrules
//         default:
//             atrule.remove();
//             break;
//     }
// }
//
// function processNode(node) {
//     switch (node.type) {
//         case 'atrule':
//             processAtrule(node);
//             break;
//         case 'rule':
//             processRule(node);
//             break;
//         default:
//             node.remove();
//             break;
//     }
// }

function separate(file) {
  const css_root = postcss.parse(file);
  const to_do = [];

  css_root.walkRules(rule => {
    if (rule.type !== 'rule') {
      return;
    }

    let copied = [];

    rule.each((decl => {
      const result = processDecl(decl);
      if (result) {
        copied.push(result);
      }
    }));

    if (!copied.length) {
      return;
    }



    to_do.push({
      rule: rule,
      copied: copied
    });
    // console.log(rule)
  });


  to_do.forEach((item) => {
    const rule = item.rule;
    const copied = item.copied;

    const color_rule = rule.cloneAfter({nodes: []});

    color_rule.each(decl => decl.remove());
    color_rule.append(copied);
    color_rule.selector = color_rule.selector.replace(/(^|[^,\s][^,]+)+/gi, function (m) {
      if (m.startsWith('.theme--')) {
        return m;
      }
      const name = 'dark';

      return `.theme--${name} ${m}`;
    });
    // console.log(color_rule.selector)
  })

  return css_root;
}

module.exports = separate;
