
/**
 * Module dependencies.
 */

var o = require('jquery')

/**
 * Exports.
 */

module.exports = Rect

/**
 * Rect class.
 *
 * @api public
 */

function Rect () {
  this.el = o('<div class="rect"></div>')
}

/**
 * Set rectangle top-left to `a` and
 * bottom-left to `b`.
 *
 * @param {Object} a
 * @param {Object} b
 * @api public
 */

Rect.prototype.set = function (a, b) {
  this.a = a
  this.b = b
  this.pos = a.offset()
  var bo = b.offset()
  bo.left += b.outerWidth()-4
  bo.top += b.outerHeight()-4
  this.size = {
    width: bo.left - this.pos.left
  , height: bo.top - this.pos.top
  }
  this.el.css({
    left: this.pos.left
  , top: this.pos.top
  , width: this.size.width
  , height: this.size.height
  })
}

/**
 * Show.
 *
 * @api public
 */

Rect.prototype.show = function (el) {
  this.el.css({ display: 'block' })
}

/**
 * Hide.
 *
 * @api public
 */

Rect.prototype.hide = function () {
  this.el.css({ display: 'none' })
}
