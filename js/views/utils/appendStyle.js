define(function () {
'use strict';
return function appendStyle(style_text){
  //fixme - check volume ondomready
  var style_node = this.d.createElement('style');
    style_node.setAttribute('title', 'button_menu');
    style_node.setAttribute('type', 'text/css');

  if (!style_node.styleSheet){
    style_node.appendChild(this.d.createTextNode(style_text));
  } else{
    style_node.styleSheet.cssText = style_text;
  }

  this.d.documentElement.firstChild.appendChild(style_node);
};
});
