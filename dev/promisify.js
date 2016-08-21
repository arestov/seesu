'use strict';

module.exports = function(func) {
  var ctx = this;
  return function () {
    var args = Array.from(arguments);

    return new Promise(function (resolve, reject) {
      args.push(function(err, result) {
        if (err) {
          return reject(err);
        }

        resolve(result);
      });
      func.apply(ctx, args)
    });
  };
};
