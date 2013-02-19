
/**
 * Module dependencies.
 */

var o = require('jquery')
var Rect = require('./rect')
var Emitter = require('emitter')

/**
 * Exports.
 */

module.exports = Select

/**
 * Select class.
 *
 * @param {Schedule} schedule
 * @api public
 */

function Select (schedule) {
  this.schedule = schedule
  this.isVisible = false
  this.range = {}
  this.rect = new Rect()
  this.rect.el.addClass('schedule-select')
  o(schedule.el).append(this.rect.el)
}

/**
 * Inherit from Emitter.
 */

Emitter(Select.prototype)

/**
 * Show.
 *
 * @api public
 */

Select.prototype.show = function () {
  this.rect.show()
  this.isVisible = true
}

/**
 * Hide.
 *
 * @api public
 */

Select.prototype.hide = function () {
  this.rect.hide()
  this.isVisible = false
}

/**
 * Set coords to `a` and `b`.
 *
 * @param {Object} a
 * @param {Object} b
 * @api public
 */

Select.prototype.set = function (a, b) {
  this.a = this.schedule.getCellByXY(a)
  this.b = this.schedule.getCellByXY(b)

  this.range = {}
  this.range.from = this.a.getDate()
  this.range.to = this.b.getDate().clone().add('minutes', this.schedule.minuteStep)

  this.rect.set(this.a.el, this.b.el)

  this.emit('change')

  return this
}
