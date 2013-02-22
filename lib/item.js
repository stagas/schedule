
/**
 * Module dependencies.
 */

var o = require('jquery')
var Emitter = require('emitter')
var Rect = require('./rect')
var utils = require('./utils')
var merge = utils.merge

module.exports = Item

/**
 * Item class.
 *
 * @param {Object} data
 * @param {Schedule} schedule
 * @api public
 */

function Item (data, schedule) {
  merge(this, data)

  this.rect = new Rect()

  this.el = this.rect.el
  this.el.on('click', this.emit.bind(this, 'click'))
  this.el.on('mousedown', this.emit.bind(this, 'mousedown'))

  this.setRange(data.range)

  this.createEdges()

  this.layer.add(this)
}

/**
 * Inherit from Emitter.
 */

Emitter(Item.prototype)

/**
 * Set item position with coords
 * `a` (top-left) and `b` (bottom-right)
 *
 * @param {Object} a
 * @param {Object} b
 * @api public
 */

Item.prototype.set = function (a, b) {
  this.col = this.schedule.getColumn(a.x)
  this.setCoords(a, b)
  return this
}

/**
 * Create edges.
 *
 * @api private
 */

Item.prototype.createEdges = function () {
  var self = this

  if (false !== this.draggable) {
    var rt = o('<div class="schedule-resize-y schedule-edge-y schedule-edge-top"></div>')
    rt.on('mousedown', function () {
      self.dragging = 'top'
      self.emit('drag')
    })
    this.el.append(rt)
  }

  if (false !== this.resizable) {
    var rb = o('<div class="schedule-resize-y schedule-edge-y schedule-edge-bottom"></div>')
    rb.on('mousedown', function () {
      self.resizing = 'bottom'
      self.emit('resize-y')
    })
    this.el.append(rb)
  }
}

/**
 * Set coords.
 *
 * @param {Object} a
 * @param {Object} b
 * @api public
 */

Item.prototype.setCoords = function (a, b) {
  this.a = a
  this.b = b
  this.setRange({
    from: this.schedule.getDateByXY(a)
  , to: this.schedule.getDateByXY(b)
  })
}

/**
 * Set range.
 *
 * @param {Object} range
 * @api public
 */

Item.prototype.setRange = function (range) {
  this.range = range
  this.day = this.range.from.clone().startOf('day').format()
}

/**
 * Get coords.
 *
 * @return {Object} coords
 * @api public
 */

Item.prototype.getCoords = function () {
  var a = this.schedule.getXYByDateCol(this.range.from, this.col)
  var b = this.schedule.getXYByDateCol(this.range.to, this.col)
  if (!a || !b) return null
  return { a: a, b: b }
}

/**
 * Get draw coords.
 *
 * @return {Object} coords
 * @api public
 */

Item.prototype.getDrawCoords = function () {
  var a = this.schedule.getXYByDateCol(this.range.from, this.col)
  var b = this.schedule.getXYByDateCol(this.range.to.clone().subtract('minutes', this.schedule.minuteStep), this.col)
  if (!a || !b) return null
  return { a: a, b: b }
}

/**
 * Draw rectagle.
 *
 * @return {Object} this
 * @api public
 */

Item.prototype.draw = function () {
  var c = this.getDrawCoords()
  var a = this.schedule.getCellByXY(c.a)
  var b = this.schedule.getCellByXY(c.b)
  this.rect.set(a.el, b.el)
  return this
}

/**
 * Show.
 *
 * @return {Object} this
 * @api public
 */

Item.prototype.show = function () {
  this.rect.show()
  return this
}

/**
 * Hide.
 *
 * @return {Object} this
 * @api public
 */

Item.prototype.hide = function () {
  this.rect.hide()
  return this
}

/**
 * Remove from dom.
 *
 * @return {Object} this
 * @api public
 */

Item.prototype.remove = function () {
  this.layer.remove(this)
  this.rect.el.remove()
  return this
}
