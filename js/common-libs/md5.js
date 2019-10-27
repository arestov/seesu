define(function(){
'use strict';

return true &&
(function(g) {
  if (typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node !== 'undefined') {
    var crypto = require('crypto');
    var nodeMd5 = function(string) {
      return crypto.createHash('md5').update(string).digest('hex');
    };
    return nodeMd5
  }

  var $0 = [], // result
    $1 = [], // tail
    $2 = [], // blocks
    $3 = [], // s1
    $4 = ("0123456789abcdef").split(""), // hex
    $5 = [], // s2
    $6 = [], // state
    $7 = false, // is state created
    $8 = 0, // len_cache
    $9 = 0, // len
    BUF = [];

  // use Int32Array if defined
  if(g.Int32Array) {
    $1 = new Int32Array(16);
    $2 = new Int32Array(16);
    $3 = new Int32Array(4);
    $5 = new Int32Array(4);
    $6 = new Int32Array(4);
    BUF = new Int32Array(4);
  }else{
    var i;
    for(i = 0;i < 16;i++) $1[i] = $2[i] = 0;
    for(i = 0;i < 4;i++) $3[i] = $5[i] = $6[i] = BUF[i] = 0;
  }

  // fill s1
  $3[0] = 128;
  $3[1] = 32768;
  $3[2] = 8388608;
  $3[3] = -2147483648;

  // fill s2
  $5[0] = 0;
  $5[1] = 8;
  $5[2] = 16;
  $5[3] = 24;

  function encode(s) {
    var utf = "",
      enc = "",
      start = 0,
      end = 0;

    for(var i = 0, j = s.length;i < j;i++) {
      var c = s.charCodeAt(i);

      if(c < 128) {
        end++;
        continue;
      }else if(c < 2048)
        enc = String.fromCharCode((c >> 6) | 192, (c & 63) | 128);
      else
        enc = String.fromCharCode((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);

      if(end > start)
        utf += s.slice(start, end);

      utf += enc;
      start = end = i + 1;
    }

    if(end > start)
      utf += s.slice(start, j);

    return utf;
  }

  function md5_update(s) {
    var i, I;

    s += "";
    $7 = false;
    $8 = $9 = s.length;

    if($9 > 63) {
      getBlocks(s.substring(0, 64));
      md5cycle($2);
      $7 = true;

      for(i = 128;i <= $9;i += 64) {
        getBlocks(s.substring(i - 64, i));
        md5cycleAdd($2);
      }

      s = s.substring(i - 64);
      $9 = s.length;
    }

    $1[0] = $1[1] = $1[2] = $1[3] =
    $1[4] = $1[5] = $1[6] = $1[7] =
    $1[8] = $1[9] = $1[10] = $1[11] =
    $1[12] = $1[13] = $1[14] = $1[15] = 0;

    for(i = 0;i < $9;i++) {
      I = i & 3;
      if(I === 0)
        $1[i >> 2] = s.charCodeAt(i);
      else
        $1[i >> 2] |= s.charCodeAt(i) << $5[I];
    }
    $1[i >> 2] |= $3[i & 3];

    if(i > 55) {
      if($7) md5cycleAdd($1);
      else {
        md5cycle($1);
        $7 = true;
      }

      return md5cycleAdd([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, $8 << 3, 0]);
    }

    $1[14] = $8 << 3;

    if($7) md5cycleAdd($1);
    else md5cycle($1);
  }

  function getBlocks(s) {
    for(var i = 16;i--;) {
      var I = i << 2;
      $2[i] = s.charCodeAt(I) + (s.charCodeAt(I + 1) << 8) + (s.charCodeAt(I + 2) << 16) + (s.charCodeAt(I + 3) << 24);
    }
  }

  function md5(data, ascii, arrayOutput) {
    md5_update(ascii ? data : encode(data));

    var tmp = $6[0];$0[1] = $4[tmp & 15];
    $0[0] = $4[(tmp >>= 4) & 15];
    $0[3] = $4[(tmp >>= 4) & 15];
    $0[2] = $4[(tmp >>= 4) & 15];
    $0[5] = $4[(tmp >>= 4) & 15];
    $0[4] = $4[(tmp >>= 4) & 15];
    $0[7] = $4[(tmp >>= 4) & 15];
    $0[6] = $4[(tmp >>= 4) & 15];

    tmp = $6[1];$0[9] = $4[tmp & 15];
    $0[8] = $4[(tmp >>= 4) & 15];
    $0[11] = $4[(tmp >>= 4) & 15];
    $0[10] = $4[(tmp >>= 4) & 15];
    $0[13] = $4[(tmp >>= 4) & 15];
    $0[12] = $4[(tmp >>= 4) & 15];
    $0[15] = $4[(tmp >>= 4) & 15];
    $0[14] = $4[(tmp >>= 4) & 15];

    tmp = $6[2];$0[17] = $4[tmp & 15];
    $0[16] = $4[(tmp >>= 4) & 15];
    $0[19] = $4[(tmp >>= 4) & 15];
    $0[18] = $4[(tmp >>= 4) & 15];
    $0[21] = $4[(tmp >>= 4) & 15];
    $0[20] = $4[(tmp >>= 4) & 15];
    $0[23] = $4[(tmp >>= 4) & 15];
    $0[22] = $4[(tmp >>= 4) & 15];

    tmp = $6[3];$0[25] = $4[tmp & 15];
    $0[24] = $4[(tmp >>= 4) & 15];
    $0[27] = $4[(tmp >>= 4) & 15];
    $0[26] = $4[(tmp >>= 4) & 15];
    $0[29] = $4[(tmp >>= 4) & 15];
    $0[28] = $4[(tmp >>= 4) & 15];
    $0[31] = $4[(tmp >>= 4) & 15];
    $0[30] = $4[(tmp >>= 4) & 15];

    return arrayOutput ? $0 : $0.join("");
  }

  function R(q, a, b, x, s1, s2, t) {
    a += q + x + t;
    return ((a << s1 | a >>> s2) + b) << 0;
  }

  function md5cycle(k) {
    md5_rounds(0, 0, 0, 0, k);

    $6[0] = (BUF[0] + 1732584193) << 0;
    $6[1] = (BUF[1] - 271733879) << 0;
    $6[2] = (BUF[2] - 1732584194) << 0;
    $6[3] = (BUF[3] + 271733878) << 0;
  }

  function md5cycleAdd(k) {
    md5_rounds($6[0], $6[1], $6[2], $6[3], k);

    $6[0] = (BUF[0] + $6[0]) << 0;
    $6[1] = (BUF[1] + $6[1]) << 0;
    $6[2] = (BUF[2] + $6[2]) << 0;
    $6[3] = (BUF[3] + $6[3]) << 0;
  }

  function md5_rounds(a, b, c, d, k) {
    var bc, da;

    if($7) {
      a = R(((c ^ d) & b) ^ d, a, b, k[0], 7, 25, -680876936);
      d = R(((b ^ c) & a) ^ c, d, a, k[1], 12, 20, -389564586);
      c = R(((a ^ b) & d) ^ b, c, d, k[2], 17, 15, 606105819);
      b = R(((d ^ a) & c) ^ a, b, c, k[3], 22, 10, -1044525330);
    }else{
      a = k[0] - 680876937;
      a = ((a << 7 | a >>> 25) - 271733879) << 0;
      d = k[1] - 117830708 + ((2004318071 & a) ^ -1732584194);
      d = ((d << 12 | d >>> 20) + a) << 0;
      c = k[2] - 1126478375 + (((a ^ -271733879) & d) ^ -271733879);
      c = ((c << 17 | c >>> 15) + d) << 0;
      b = k[3] - 1316259209 + (((d ^ a) & c) ^ a);
      b = ((b << 22 | b >>> 10) + c) << 0;
    }

    a = R(((c ^ d) & b) ^ d, a, b, k[4], 7, 25, -176418897);
    d = R(((b ^ c) & a) ^ c, d, a, k[5], 12, 20, 1200080426);
    c = R(((a ^ b) & d) ^ b, c, d, k[6], 17, 15, -1473231341);
    b = R(((d ^ a) & c) ^ a, b, c, k[7], 22, 10, -45705983);
    a = R(((c ^ d) & b) ^ d, a, b, k[8], 7, 25, 1770035416);
    d = R(((b ^ c) & a) ^ c, d, a, k[9], 12, 20, -1958414417);
    c = R(((a ^ b) & d) ^ b, c, d, k[10], 17, 15, -42063);
    b = R(((d ^ a) & c) ^ a, b, c, k[11], 22, 10, -1990404162);
    a = R(((c ^ d) & b) ^ d, a, b, k[12], 7, 25, 1804603682);
    d = R(((b ^ c) & a) ^ c, d, a, k[13], 12, 20, -40341101);
    c = R(((a ^ b) & d) ^ b, c, d, k[14], 17, 15, -1502002290);
    b = R(((d ^ a) & c) ^ a, b, c, k[15], 22, 10, 1236535329);

    a = R(((b ^ c) & d) ^ c, a, b, k[1], 5, 27, -165796510);
    d = R(((a ^ b) & c) ^ b, d, a, k[6], 9, 23, -1069501632);
    c = R(((d ^ a) & b) ^ a, c, d, k[11], 14, 18, 643717713);
    b = R(((c ^ d) & a) ^ d, b, c, k[0], 20, 12, -373897302);
    a = R(((b ^ c) & d) ^ c, a, b, k[5], 5, 27, -701558691);
    d = R(((a ^ b) & c) ^ b, d, a, k[10], 9, 23, 38016083);
    c = R(((d ^ a) & b) ^ a, c, d, k[15], 14, 18, -660478335);
    b = R(((c ^ d) & a) ^ d, b, c, k[4], 20, 12, -405537848);
    a = R(((b ^ c) & d) ^ c, a, b, k[9], 5, 27, 568446438);
    d = R(((a ^ b) & c) ^ b, d, a, k[14], 9, 23, -1019803690);
    c = R(((d ^ a) & b) ^ a, c, d, k[3], 14, 18, -187363961);
    b = R(((c ^ d) & a) ^ d, b, c, k[8], 20, 12, 1163531501);
    a = R(((b ^ c) & d) ^ c, a, b, k[13], 5, 27, -1444681467);
    d = R(((a ^ b) & c) ^ b, d, a, k[2], 9, 23, -51403784);
    c = R(((d ^ a) & b) ^ a, c, d, k[7], 14, 18, 1735328473);
    b = R(((c ^ d) & a) ^ d, b, c, k[12], 20, 12, -1926607734);

    bc = b ^ c;
    a = R(bc ^ d, a, b, k[5], 4, 28, -378558);
    d = R(bc ^ a, d, a, k[8], 11, 21, -2022574463);
    da = d ^ a;
    c = R(da ^ b, c, d, k[11], 16, 16, 1839030562);
    b = R(da ^ c, b, c, k[14], 23, 9, -35309556);
    bc = b ^ c;
    a = R(bc ^ d, a, b, k[1], 4, 28, -1530992060);
    d = R(bc ^ a, d, a, k[4], 11, 21, 1272893353);
    da = d ^ a;
    c = R(da ^ b, c, d, k[7], 16, 16, -155497632);
    b = R(da ^ c, b, c, k[10], 23, 9, -1094730640);
    bc = b ^ c;
    a = R(bc ^ d, a, b, k[13], 4, 28, 681279174);
    d = R(bc ^ a, d, a, k[0], 11, 21, -358537222);
    da = d ^ a;
    c = R(da ^ b, c, d, k[3], 16, 16, -722521979);
    b = R(da ^ c, b, c, k[6], 23, 9, 76029189);
    bc = b ^ c;
    a = R(bc ^ d, a, b, k[9], 4, 28, -640364487);
    d = R(bc ^ a, d, a, k[12], 11, 21, -421815835);
    da = d ^ a;
    c = R(da ^ b, c, d, k[15], 16, 16, 530742520);
    b = R(da ^ c, b, c, k[2], 23, 9, -995338651);

    a = R(c ^ (b | ~d), a, b, k[0], 6, 26, -198630844);
    d = R(b ^ (a | ~c), d, a, k[7], 10, 22, 1126891415);
    c = R(a ^ (d | ~b), c, d, k[14], 15, 17, -1416354905);
    b = R(d ^ (c | ~a), b, c, k[5], 21, 11, -57434055);
    a = R(c ^ (b | ~d), a, b, k[12], 6, 26, 1700485571);
    d = R(b ^ (a | ~c), d, a, k[3], 10, 22, -1894986606);
    c = R(a ^ (d | ~b), c, d, k[10], 15, 17, -1051523);
    b = R(d ^ (c | ~a), b, c, k[1], 21, 11, -2054922799);
    a = R(c ^ (b | ~d), a, b, k[8], 6, 26, 1873313359);
    d = R(b ^ (a | ~c), d, a, k[15], 10, 22, -30611744);
    c = R(a ^ (d | ~b), c, d, k[6], 15, 17, -1560198380);
    b = R(d ^ (c | ~a), b, c, k[13], 21, 11, 1309151649);
    a = R(c ^ (b | ~d), a, b, k[4], 6, 26, -145523070);
    d = R(b ^ (a | ~c), d, a, k[11], 10, 22, -1120210379);
    c = R(a ^ (d | ~b), c, d, k[2], 15, 17, 718787259);
    b = R(d ^ (c | ~a), b, c, k[9], 21, 11, -343485551);

    BUF[0] = a;
    BUF[1] = b;
    BUF[2] = c;
    BUF[3] = d;
  }

  return md5
})(typeof global !== 'undefined' ? global: (this || window));

})
