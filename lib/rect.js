
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
  this.el = o('<div class="schedule-rect"></div>')
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
  this.pos = a.position()
  var bo = b.position()
  var w = b[0].getBoundingClientRect().width
  this.size = {
    width: bo.left + w - 4 - this.pos.left
  , height: bo.top + 1 - this.pos.top
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
