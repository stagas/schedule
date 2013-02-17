
/*!
 * Schedule
 * by stagas
 *
 * MIT
 */

/**
 * Module dependencies.
 */

var o = require('jquery')
var m = require('moment')
var Emitter = require('emitter')
var Configurable = require('configurable.js')
var Rect = require('./rect')
var Item = require('./item')
var utils = require('./utils')
var pad = utils.pad
var last = utils.last
var range = utils.range

/**
 * Exports.
 */

module.exports = Schedule

/**
 * Schedule class.
 *
 * @api public
 */

function Schedule () {
  this.settings = {
    days: 3
  , 'day format': 'dddd, Do MMMM YYYY'
  }

  this.el = o(require('./template'))
  this.head = this.el.find('thead')
  this.body = this.el.find('tbody')

  this.isVisible = false

  this.date = m.utc().startOf('day')

  this.days = []
  this.hours = []
  this.columns = []
  this.layers = []
  this.cells = []
  this.rows = []
  this.items = []

  this.currentLayer = null
  this.minuteStep = 10
  this.cache = {}

  this.select = this.createSelect()
  this.addListeners()
  this.enableControls()
}

Configurable(Schedule.prototype)
Emitter(Schedule.prototype)

/**
 * Show schedule in `el`.
 *
 * @param {Element} el
 * @return {Object} this
 * @api public
 */

Schedule.prototype.show = function (el) {
  this.isVisible = true
  this.refresh(true, true)
  o(el).append(this.el)
  return this
}

/**
 * Hide schedule.
 *
 * @return {Object} this
 * @api public
 */

Schedule.prototype.hide = function () {
  this.isVisible = false
  this.el.remove()
  return this
}

/**
 * Remove selection.
 *
 * @return {Object} this
 * @api public
 */

Schedule.prototype.deselect = function () {
  this.select.hide()
  return this
}

/**
 * Refresh schedule view.
 *
 * @param {Boolean} all
 * @param {Boolean} first
 * @return {Object} this
 * @api private
 */

Schedule.prototype.refresh = function (all, first) {
  var self = this
  if (!this.isVisible) return this
  if (all) {
    this.makeDays()
    this.makeColumns()
    if (first) this.makeHours()
    this.runAllLayers()
    if (first) setTimeout(this.makeItems.bind(this), 0)
    else this.makeItems()
  }
  return this
}

/**
 * Add DOM event listeners.
 *
 * @api private
 */

Schedule.prototype.addListeners = function () {
  var self = this

  this.on('change', function (item) {
    this.refresh(true)
  })

  // mouse button down

  this.el.on('mousedown', function (ev) {
    ev.preventDefault()
    if (!self.selecting && !self.isMousedown) {
      var xy = self.getXYByEvent(ev)
      if (!xy) return false

      self.mousePos = xy

      if (self.select.isVisible) {
        self.deselect()
      }

      self.select.start = xy
    }
    self.isMousedown = true
    return false
  })

  // mouse move

  this.el.on('mousemove', function (ev) {
    var xy = self.getXYByEvent(ev)
    if (!xy) return false

    self.mousePos = xy
    self.highlight(xy)

    // resizing item

    if (self.resizing) {
      if ('top'==self.resizing.resizing) {
        self.resizing.set(xy, self.resizing.b).draw()
      }
      if ('bottom'==self.resizing.resizing) {
        xy.x = self.resizing.a.x
        xy.y++
        self.resizing.set(self.resizing.a, xy).draw()
      }
      return false
    }

    // dragging item

    else if (self.dragging) {
      if ('top'==self.dragging.dragging) {
        var tb = {
          x: self.dragging.b.x+(xy.x-self.dragging.a.x)
        , y: self.dragging.b.y+(xy.y-self.dragging.a.y)
        }
        self.dragging.set(xy, tb).draw()
      }
    }

    // selecting

    else if (self.selecting
      || (self.isMousedown && Math.abs(xy.y - self.select.start.y) > 0)) {
      self.selecting = true
      self.select.stop = xy

      var a = self.select.start
      var b = self.select.stop

      var min = {}
      var max = {}
      min.x = Math.min(a.x,b.x)
      min.y = Math.min(a.y,b.y)
      max.x = Math.max(a.x,b.x)
      max.y = Math.max(a.y,b.y)

      self.select.set(min, max)
      self.select.show()
    }
  })

  // mouse button up

  this.el.on('mouseup', function (ev) {
    ev.preventDefault()
    self.isMousedown = false
    if (self.selecting) {
      self.selecting = false
      self.emit('select', self.select)
    }
    self.el.removeClass('resize-y')
    self.el.removeClass('move')
    if (self.resizing) self.resizing.emit('change')
    if (self.dragging) self.dragging.emit('change')
    self.resizing = false
    self.dragging = false
    return false
  })
}

/**
 * Enable controls.
 *
 * @api private
 */

Schedule.prototype.enableControls = function () {
  var self = this
  var ctrl = this.controls = this.el.find('.controls')

  var dateCtrl = ctrl.find('.date')
  dateCtrl.on('click', '.next', this.nextDay.bind(this))
  dateCtrl.on('click', '.prev', this.prevDay.bind(this))

  var numdaysCtrl = ctrl.find('.numdays')
  numdaysCtrl.on('click', '.plus', function () {
    self.inc('days')
    self.refresh(true, true)
  })
  numdaysCtrl.on('click', '.minus', function () {
    if (!self.dec('days')) self.set('days', 1)
    self.refresh(true, true)
  })
}

/**
 * Highlight line and cell.
 *
 * @param {Object} xy
 * @return {Object} this
 * @api private
 */

Schedule.prototype.highlight = function (xy) {
  this.el.find('.highlight').removeClass('highlight')
  var cell = this.cells[xy.y][xy.x]
  var row = this.rows[xy.y]
  cell.el.addClass('highlight')
  row.el.addClass('highlight')
  return this
}

/**
 * Next day.
 *
 * @return {Object} this
 * @api public
 */

Schedule.prototype.nextDay = function () {
  this.date.add('days', 1)
  return this.refresh(true)
}

/**
 * Previous day.
 *
 * @return {Object} this
 * @api public
 */

Schedule.prototype.prevDay = function () {
  this.date.subtract('days', 1)
  return this.refresh(true)
}

/**
 * Creates and adds item.
 *
 * @param {Object} data
 * @api public
 */

Schedule.prototype.addItem = function (data) {
  var self = this

  var item = new Item(data)

  item.schedule = this

  item.on('click', function () {
    self.emit('click', item)
  })

  item.on('resize-y', function () {
    self.resizing = item
    self.el.addClass('resize-y')
  })

  item.on('drag', function () {
    self.dragging = item
    self.el.addClass('move')
  })

  item.on('change', function () {
    self.emit('change', item)
  })

  this.items = this.items || []

  if (!~this.items.indexOf(item)) {
    this.items.push(item)
  }

  return item
}

/**
 * Remove item.
 *
 * @param {Item} item
 * @return {Item} item
 * @api public
 */

Schedule.prototype.removeItem = function (item) {
  var idx = this.items.indexOf(item)
  if (~idx) {
    this.items.splice(idx, 1)[0].remove()
  }
}

/**
 * Add a layer `name` with fetch
 * function `fn`.
 *
 * @param {String} name
 * @param {Function} fn
 * @return {Object} layer
 * @api public
 */

Schedule.prototype.addLayer = function (name, fn) {
  var layer = new Layer(name, fn)
  this.el.append(layer.el)
  this.layers.push(layer)
  this.layers[layer.name] = layer
  return layer
}

/**
 * Set the topmost layer.
 *
 * @param {Number|String} n
 * @return {Object} this
 * @api public
 */

Schedule.prototype.setLayer = function (n) {
  this.layerIndex = 'number' == typeof n
    ? n
    : this.layers.indexOf(this.layers[n])
  return this.refresh()
}

/**
 * Cycle through layers.
 *
 * @return {Object} this
 * @api public
 */

Schedule.prototype.cycleLayers = function () {
  this.layerIndex++
  if (this.layerIndex >= this.layers.length) this.layerIndex = 0
  return this.refresh()
}

/**
 * Run layers for a `date`.
 *
 * @param {Date} date
 * @return {Object} this
 * @api private
 */

Schedule.prototype.runLayers = function (date) {
  var self = this
  this.layers.forEach(function (layer) {
    layer.fn.call(this, date, function (ev) {
      ev.layer = layer
      return this.addItem(ev)
    }.bind(this))
  }, this)
  return true
}

/**
 * Run layers for all days.
 *
 * @return {Object} this
 * @api private
 */

Schedule.prototype.runAllLayers = function () {
  this.eachDay(function (date) {
    var f = date.format()
    this.cache[f] = this.cache[f] || this.runLayers(date)
  })
  return this
}

/**
 * Add a column named `name` of id `id`.
 *
 * @param {String} id
 * @param {String} name
 * @api public
 */

Schedule.prototype.addColumn = function (id, name) {
  this.columns.push({ id: id, name: name })
  return this.refresh(true)
}

/**
 * Get column from `x` position.
 *
 * @param {Number} x
 * @return {Object} column
 * @api public
 */

Schedule.prototype.getColumn = function (x) {
  return this.columns[x % this.columns.length]
}

/**
 * Get XY rowcell from a DOM event.
 *
 * @param {Event} ev
 * @return {Object} xy
 * @api private
 */

Schedule.prototype.getXYByEvent = function (ev) {
  var cells = this.cells
  var rows = this.rows
  var h = cells[0][0].el.outerHeight(true)
  var w = cells[0][0].el.outerWidth(true)
  var offset = this.el.find('tbody').offset()
  var xy = {
    x: Math.floor((ev.pageX-offset.left-50) / w)
  , y: Math.floor((ev.pageY-offset.top) / h)
  }
  if ( xy.x < 0 || xy.y < 0
    || xy.x >= cells[0].length
    || xy.y >= cells.length) return false
  else return xy
}

/**
 * Get a XY by date and column.
 *
 * @param {Moment} date
 * @param {Object} col
 * @return {Object} xy
 * @api private
 */

Schedule.prototype.getXYByDateCol = function (date, col) {
  var d = date.clone()
  d.minutes(Math.ceil(d.minutes()/this.minuteStep)*this.minuteStep)
  if (d < this.date || d > last(this.days).date.clone().endOf('day')) return null
  var x = 0
  for (var i=0, len=this.columns.length; i<len; i++) {
    if (col.id === this.columns[i].id) {
      x = i
      break
    }
  }
  var diff = Math.floor( (date.clone().startOf('day') - this.date) / 1000 / 60 / 60 / 24 )
  x += this.columns.length * diff
  var y = this.hours.indexOf(d.format('H:mm'))
  var res = {
    x: ~x ? x : 0
  , y: ~y ? y : ((22-7)*(60/this.minuteStep))
  }
  return res
}

/**
 * Get cell by XY.
 *
 * @param {Object} xy
 * @return {Cell} cell
 * @api private
 */

Schedule.prototype.getCellByXY = function (xy) {
  return this.cells[xy.y][xy.x]
}

/**
 * Get date by XY.
 *
 * @param {Object} xy
 * @return {Moment} date
 * @api private
 */

Schedule.prototype.getDateByXY = function (xy) {
  var d = this.date.clone()
  d.add('days', Math.floor(xy.x / this.columns.length))
  d.add('hours', 7)
  d.add('minutes', xy.y * this.minuteStep)
  return d
}

/**
 * Create/update days.
 *
 * @return {Object} this
 * @api private
 */

Schedule.prototype.makeDays = function () {
  var row = this.head.find('tr.days')
  var days = this.days
  var cols = this.columns.length
  var format = this.get('day format')

  days.forEach(function (day) {
    day.el.remove()
  })

  days.length = 0

  this.eachDay(function (date) {
    var day = new Day(format, date, cols)
    days.push(day)
    row.append(day.el)
  })

  return this
}

/**
 * Create/update columns.
 *
 * @return {Object} this
 * @api private
 */

Schedule.prototype.makeColumns = function () {
  var cols = this.head.find('.cols')
  cols.html('')
  this.days.forEach(function (day, i) {
    this.columns.forEach(function (col) {
      var c = 'day-'+i+'-col-'+col.id
      var th = o('<th></th>')
      th.text(col.name)
      th.addClass('col')
      th.addClass(c)
      cols.append(th)
    }, this)
  }, this)
  return this
}

/**
 * Create hours.
 *
 * @return {Object} this
 * @api private
 */

Schedule.prototype.makeHours = function () {
  var self = this
  var step = this.minuteStep

  var rows = this.rows = []
  var cells = this.cells = []
  var hours = this.hours = []

  var y = 0
  range(7,22).forEach(function (h) {
    range(0,60,step).forEach(function (m) {
      var x = 0

      rows[y] = new Row(h,m,step)
      hours.push(''+rows[y])

      cells[y] = []

      this.eachDay(function (date) {
        this.columns.forEach(function (col, i, cols) {
          var cell = new Cell({
            x: x
          , y: y
          , col: col
          , class: i == cols.length-1 ? 'last-col' : i == 0 ? 'first-col' : ''
          }, self)
          cells[y][x] = cell
          rows[y].add(cell)
          x++
        })
      })
      y++
    }, this)
  }, this)

  this.body.html('')

  rows.forEach(function (row) {
    this.body.append(row.el)
  }, this)

  return this
}

/**
 * Create/update items.
 *
 * @return {Object} this
 * @api private
 */

Schedule.prototype.makeItems = function () {
  this.items.forEach(function (item) {
    if ( item.range.from < this.date
      || item.range.from > last(this.days).date.clone().endOf('day')) {
      item.hide()
    }
    else {
      var co = item.getCoords()
      if (!co) return
      item.set(co.a, co.b)
      item.draw().show()
    }
  }, this)
  return this
}

/**
 * Iterate each visible day.
 *
 * @param {Function} fn
 * @return {Object} this
 * @api public
 */

Schedule.prototype.eachDay = function (fn) {
  for (var i=0; i<this.settings.days; i++) {
    var date = this.date.clone().add('days', i)
    var df = date.format()
    fn.call(this, date, i)
  }
  return this
}

/**
 * Iterate each cell.
 *
 * @param {Function} fn
 * @param {Function} rowfn
 * @return {Object} this
 * @api public
 */

Schedule.prototype.eachCell = function (fn, rowfn) {
  var rows = this.rows
  var cells = this.cells

  var height = this.body.find('tr').length
  var width = this.columns.length * this.days.length

  for (var y=0; y<height; y++) {
    if (rowfn) rowfn.call(this, rows[y], y)

    cells[y] = cells[y] || []

    for (var x=0; x<width; x++) {
      fn.call(this, cells[y][x], y, x, { x: x, y: y })
    }
  }

  return this
}

/**
 * Create selection rectangle.
 *
 * @return {Rect} selection
 * @api private
 */

Schedule.prototype.createSelect = function () {
  var select = this.select = new Select(this)
  select.hide()
  select.schedule = this
  select.on('change', function () {
    var html = '<div class="range">'
      + select.range.from.format('H:mm')
      + ' - '
      + select.range.to.format('H:mm')
      + '</div>'
    select.rect.el.html(html)
  })
  return select
}

/**
 * Select class.
 *
 * @param {Schedule} schedule
 * @api private
 */

function Select (schedule) {
  this.schedule = schedule
  this.isVisible = false
  this.range = {}
  this.rect = new Rect()
  this.rect.el.addClass('select')
  o(schedule.el).append(this.rect.el)
}

/**
 * Inherit from Emitter.
 */

Emitter(Select.prototype)

/**
 * Show.
 *
 * @api private
 */

Select.prototype.show = function () {
  this.rect.show()
  this.isVisible = true
}

/**
 * Hide.
 *
 * @api private
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
 * @api private
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

/**
 * Day class.
 *
 * @param {String} format
 * @param {Moment} date
 * @param {Number} cols
 * @api private
 */

function Day (format, date, cols) {
  this.date = date
  this.el = o('<th></th>')
  this.el.addClass('day')
  this.el.attr('colspan', cols)
  this.el.html(date.format(format))
}

/**
 * Row class.
 *
 * @param {Number} h
 * @param {Number} m
 * @param {Number} step
 * @api private
 */

function Row (h, m, step) {
  var html = ''
  this.el = o('<tr></tr>')
  this.el.addClass('row')
  this.el.addClass(0 == m ? 's1' : 30 == m ? 's2' : 's3')
  this.el.addClass(60 == m+step ? 's1-next' : 30 == m+step ? 's2-next' : 's3-next')
  this.h = h
  this.m = m
  html += '<td class="time">'
        + '<div class="time-outer">'
        + '<div class="time-inner">'
        + this
        + '</div></div></td>'
  this.el.html(html)
}

/**
 * Cast to string.
 *
 * @return {String} row
 * @api private
 */

Row.prototype.toString = function () {
  return this.h+':'+pad(this.m,2)
}

/**
 * Add a cell to the row.
 *
 * @param {Cell} cell
 * @api private
 */

Row.prototype.add = function (cell) {
  this.el.append(cell.el)
}

/**
 * Cell class.
 *
 * @param {Object} data
 * @param {Object} schedule
 * @api private
 */

function Cell (data, schedule) {
  this.schedule = schedule
  this.el = o('<td></td>')
  this.el.addClass('cell')
  this.el.addClass(data.class)
  this.col = data.col
  this.y = data.y
  this.x = data.x
}

/**
 * Get cell date.
 *
 * @return {Moment} date
 * @api private
 */

Cell.prototype.getDate = function () {
  return this.schedule.getDateByXY(this)
}

/**
 * Layer class.
 *
 * @param {String} name
 * @param {Function} fn
 * @api private
 */

function Layer (name, fn) {
  this.name = name
  this.fn = fn
  this.el = o('<div></div>')
  this.el.addClass('layer')
  this.el.addClass(name)
  this.items = []
}

/**
 * Add item to layer.
 *
 * @param {Item} item
 * @api private
 */

Layer.prototype.add = function (item) {
  this.items.push(item)
  this.el.append(item.el)
}
