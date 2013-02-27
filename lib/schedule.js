
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
var Item = require('./item')
var Cell = require('./cell')
var Row = require('./row')
var Day = require('./day')
var Layer = require('./layer')
var Select = require('./select')
var utils = require('./utils')
var pad = utils.pad
var last = utils.last
var range = utils.range
var flatten = utils.flatten

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
  this.settings = {}

  this.set('days', 3)
  this.set('day format', 'dddd, Do MMMM YYYY')
  this.set('cell min width', new Cell({}, this).el.css('min-width'))

  this.el = o(require('../template'))
  this.head = this.el.find('thead')
  this.body = this.el.find('tbody')

  this.clickLayer = o('<div class="schedule-invisible-layer schedule-click-layer"></div>')
  this.el.append(this.clickLayer)

  this.isVisible = false

  this.date = m.utc().startOf('day')

  this.days = []
  this.hours = []
  this.columns = []
  this.cells = []
  this.rows = []

  this.layers = []
  this.layerIndex = 0

  this.currentLayer = null
  this.minuteStep = 10
  this.cache = {}

  this.select = this.createSelect()
  this.addListeners()
  this.enableControls()
}

/**
 * Make configurable.
 */

Configurable(Schedule.prototype)

/**
 * Make emitter.
 */

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

  if (this.refreshing) {
    this.refreshing = Math.max(this.refreshing, !!all+!!first)
    return
  }

  this.refreshing = !!all+!!first

  function reallyRefresh () {
    this.el.find('.schedule-layer-top').removeClass('schedule-layer-top')
    this.layers[this.layerIndex].el.addClass('schedule-layer-top')
    if (this.refreshing>0) {
      this.makeDays()
      this.makeColumns()
      if (this.refreshing>1) this.makeHours()
      this.correctColumnWidth()
      this.runAllLayers()
      if (this.refreshing>1) setTimeout(this.makeItems.bind(this), 0)
      else this.makeItems()
    }
    else {
      this.makeItems()
    }
    this.refreshing = 0
  }
  reallyRefresh = reallyRefresh.bind(this)

  setTimeout(reallyRefresh, 0)

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

  this.el.on('mousedown', '.schedule-click-layer', function (ev) {
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
    self.el.removeClass('schedule-resize-y')
    self.el.removeClass('schedule-move')
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
  var ctrl = this.controls = this.el.find('.schedule-controls')

  var dateCtrl = ctrl.find('.schedule-date')
  dateCtrl.on('click', '.schedule-next', this.nextDay.bind(this))
  dateCtrl.on('click', '.schedule-prev', this.prevDay.bind(this))

  var numdaysCtrl = ctrl.find('.schedule-numdays')
  numdaysCtrl.on('click', '.schedule-plus', function () {
    self.inc('days')
    self.refresh(true, true)
  })
  numdaysCtrl.on('click', '.schedule-minus', function () {
    if (!self.dec('days')) self.set('days', 1)
    self.refresh(true, true)
  })

  var cycleCtrl = ctrl.find('.schedule-layers')
  cycleCtrl.on('click', '.schedule-cycle-layers', function () {
    self.cycleLayers()
    self.refresh()
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
  this.el.find('.schedule-highlight').removeClass('schedule-highlight')
  var cell = this.cells[xy.y][xy.x]
  var row = this.rows[xy.y]
  cell.el.addClass('schedule-highlight')
  row.el.addClass('schedule-highlight')
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
    self.el.addClass('schedule-resize-y')
  })

  item.on('drag', function () {
    self.dragging = item
    self.el.addClass('schedule-move')
  })

  item.on('change', function () {
    self.emit('change', item)
  })

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
  item.remove()
  return item
}

/**
 * Clear all layers.
 *
 * @return {Object} this
 * @api public
 */

Schedule.prototype.clear = function () {
  var flat = flatten(this.layers.map(function (el) { return el.items }))
  flat.forEach(function (item) {
    item.remove()
  })
  return this
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
 * Clear cache for a `day` or entire.
 *
 * @param {String} day
 * @return {Object} this
 * @api public
 */

Schedule.prototype.clearCache = function (day) {
  if (day) {
    delete this.cache[day]
    return this
  }
  this.cache = {}
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
 * @api private
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
  var row = this.head.find('.schedule-days')
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
  var cols = this.head.find('.schedule-cols')
  cols.html('')
  this.days.forEach(function (day, i) {
    this.columns.forEach(function (col) {
      var c = 'day-'+i+'-col-'+col.id
      var th = o('<th></th>')
      th.text(col.name)
      th.addClass('schedule-col')
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
          , class: i == cols.length-1 ? 'schedule-cell-last-col' : i == 0 ? 'schedule-cell-first-col' : ''
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
  flatten(this.layers.map(function (el) { return el.items })).forEach(function (item) {
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
 * Correct column width.
 *
 * @return {Object} this
 * @api private
 */

Schedule.prototype.correctColumnWidth = function () {
  var clen = this.columns.length
  var days = this.get('days')
  width = ((this.el.width()-52)-(clen*days*1)-1) / (clen*days)
  width = Math.max(width, this.get('cell min width'))
  var styleEl = o('<style>.schedule-cell{width:'+width+'px !important;min-width:'+width+'px !important;}</style>')
  o('body').append(styleEl)
  this.columnWidth = width
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
 * Create Select instance.
 *
 * @return {Select} select
 * @api private
 */

Schedule.prototype.createSelect = function () {
  var select = new Select(this)
  select.hide()
  select.schedule = this
  select.on('change', function () {
    var html = '<div class="schedule-range">'
      + select.range.from.format('H:mm')
      + ' - '
      + select.range.to.format('H:mm')
      + '</div>'
    select.rect.el.html(html)
  })
  return select
}
