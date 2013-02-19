
/**
 * Module dependencies.
 */

var o = require('jquery')
var utils = require('./utils')
var pad = utils.pad

/**
 * Exports.
 */

module.exports = Row

/**
 * Row class.
 *
 * @param {Number} h
 * @param {Number} m
 * @param {Number} step
 * @api public
 */

function Row (h, m, step) {
  var html = ''
  this.el = o('<tr></tr>')
  this.el.addClass('schedule-row')
  this.el.addClass(0 == m ? 'schedule-row-s1' : 30 == m ? 'schedule-row-s2' : 'schedule-row-s3')
  this.el.addClass(60 == m+step ? 'schedule-row-s1-next' : 30 == m+step ? 'schedule-row-s2-next' : 'schedule-row-s3-next')
  this.h = h
  this.m = m
  html += '<td class="schedule-time">'
        + '<div class="schedule-time-outer">'
        + '<div class="schedule-time-inner">'
        + this
        + '</div></div></td>'
  this.el.html(html)
}

/**
 * Cast to string.
 *
 * @return {String} row
 * @api public
 */

Row.prototype.toString = function () {
  return this.h+':'+pad(this.m,2)
}

/**
 * Add a cell to the row.
 *
 * @param {Cell} cell
 * @api public
 */

Row.prototype.add = function (cell) {
  this.el.append(cell.el)
}
