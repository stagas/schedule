
var o = require('jquery')

/**
 * Exports.
 */

module.exports = Layer

/**
 * Layer class.
 *
 * @param {String} name
 * @param {Function} fn
 * @api public
 */

function Layer (name, fn) {
  this.name = name
  this.fn = fn
  this.el = o('<div></div>')
  this.el.addClass('schedule-layer')
  this.el.addClass(name)
  this.items = []
}

/**
 * Add item to layer.
 *
 * @param {Item} item
 * @api public
 */

Layer.prototype.add = function (item) {
  this.items.push(item)
  this.el.append(item.el)
}

/**
 * Remove item from layer.
 *
 * @param {Item} item
 * @return {Item} removed
 * @api public
 */

Layer.prototype.remove = function (item) {
  var idx = this.items.indexOf(item)
  return this.items.splice(idx, 1)[0]
}

/**
 * Iterate layer items.
 *
 * @param {Function} fn
 * @api public
 */

Layer.prototype.forEach = function (fn) {
  return this.items.slice().forEach(fn)
}
