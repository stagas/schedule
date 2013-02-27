  - [Schedule()](#schedule)
  - [Schedule.show()](#scheduleshowelelement)
  - [Schedule.hide()](#schedulehide)
  - [Schedule.deselect()](#scheduledeselect)
  - [Schedule.nextDay()](#schedulenextday)
  - [Schedule.prevDay()](#scheduleprevday)
  - [Schedule.addItem()](#scheduleadditemdataobject)
  - [Schedule.removeItem()](#scheduleremoveitemitemitem)
  - [Schedule.clear()](#scheduleclear)
  - [Schedule.addLayer()](#scheduleaddlayernamestringfnfunction)
  - [Schedule.setLayer()](#schedulesetlayernnumberstring)
  - [Schedule.cycleLayers()](#schedulecyclelayers)
  - [Schedule.clearCache()](#scheduleclearcachedaystring)
  - [Schedule.addColumn()](#scheduleaddcolumnidstringnamestring)
  - [Schedule.hasColumn()](#schedulehascolumnidstring)
  - [Schedule.eachDay()](#scheduleeachdayfnfunction)
  - [Schedule.eachCell()](#scheduleeachcellfnfunctionrowfnfunction)

## Schedule()

  Schedule class.

## Schedule.show(el:Element)

  Show schedule in `el`.

## Schedule.hide()

  Hide schedule.

## Schedule.deselect()

  Remove selection.

## Schedule.nextDay()

  Next day.

## Schedule.prevDay()

  Previous day.

## Schedule.addItem(data:Object)

  Creates and adds item.

## Schedule.removeItem(item:Item)

  Remove item.

## Schedule.clear()

  Clear all layers.

## Schedule.addLayer(name:String, fn:Function)

  Add a layer `name` with fetch
  function `fn`.

## Schedule.setLayer(n:Number|String)

  Set the topmost layer.

## Schedule.cycleLayers()

  Cycle through layers.

## Schedule.clearCache(day:String)

  Clear cache for a `day` or entire.

## Schedule.addColumn(id:String, name:String)

  Add a column named `name` of id `id`.

## Schedule.hasColumn(id:String)

  Check if schedule has column `id`.

## Schedule.eachDay(fn:Function)

  Iterate each visible day.

## Schedule.eachCell(fn:Function, rowfn:Function)

  Iterate each cell.
