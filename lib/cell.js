
/**
 * Module dependencies.
 */

var o = require('jquery')

/**
 * Exports.
 */

module.exports = Cell

/**
 * Cell class.
 *
 * @param {Object} data
 * @param {Object} schedule
 * @api public
 */

function Cell (data, schedule) {
  this.schedule = schedule
  this.el = o('<td></td>')
  this.el.addClass('schedule-cell')
  this.el.addClass(data.class)
  this.col = data.col
  this.y = data.y
  this.x = data.x
}

/**
 * Get cell date.
 *
 * @return {Moment} date
 * @api public
 */

Cell.prototype.getDate = function () {
  return this.schedule.getDateByXY(this)
}
