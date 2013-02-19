
/**
 * Left pad a string `s`
 * with length `len`
 * using `x` (defaults to `0`)
 *
 * @param {String} s
 * @param {Number} len
 * @param {String} x
 * @return {String} padded
 * @api public
 */

function pad (s, len, x) {
  var str = ''
  s = ''+s
  if (len <= s.length) return s.substr(0,len)
  x = x == null ? '0' : x
  for (var i=len-s.length; i--;) str += x
  str += s
  return str
}

exports.pad = pad

/**
 * Create a array using range
 * starting on `s` ending on `e`
 * by `step`.
 *
 * @param {Number} s
 * @param {Number} e
 * @param {Number} step
 * @return {Array} range
 * @api public
 */

function range (s, e, step) {
  var arr = []
  step = step || 1
  for (var i=s; i<e; i+=step) {
    arr.push(i)
  }
  return arr
}

exports.range = range

/**
 * Merge object `s` to `t`.
 *
 * @param {Object} t
 * @param {Object} s
 * @api private
 */

function merge (t, s) {
  for (var k in s) {
    t[k] = s[k]
  }
}

exports.merge = merge

/**
 * Get last element of array `arr`.
 *
 * @param {Array} arr
 * @return {Mixed} element
 * @api private
 */

function last (arr) {
  return arr[arr.length-1]
}

exports.last = last
