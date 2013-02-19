#!/usr/bin/env node

var dir = require('fs').readdirSync
var join = require('path').join
var exec = require('child_process').exec

var root = join(__dirname, '..')
var lib = join(root, 'lib')
var docs = join(root, 'docs')
var files = dir(lib)
var index = join(root, 'index.md')

var series = []

function run (s) {
  if (s) s(run)
  else series.length && run(series.shift())
}
/*
function move () {
  exec('mv '+index+' '+join(root, 'docs/index.md'), function () {
    console.log('done!')
  })
}
*/
files.forEach(function (f) {
  var p = join(lib, f)
  var d = join(docs, f).split('.').slice(0,-1)
  d.push('md')
  d = d.join('.')
  series.push(function (next) {
    exec('dox -a < '+p+' > '+d, function () {
      next()
    })
  })
})

//series.push(move)

run()
