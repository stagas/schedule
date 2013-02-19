
/**
 * Module dependencies.
 */

var o = require('jquery')

/**
 * Exports.
 */

module.exports = Day

/**
 * Day class.
 *
 * @param {String} format
 * @param {Moment} date
 * @param {Number} cols
 * @api public
 */

function Day (format, date, cols) {
  this.date = date
  this.el = o('<th></th>')
  this.el.addClass('schedule-day')
  this.el.attr('colspan', cols)
  this.el.html(date.format(format))
}
