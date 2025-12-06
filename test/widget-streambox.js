var blessed = require('../')
  , screen;
const { read } = require('fs');
const Stream = require("stream");

screen = blessed.screen({
  dump: __dirname + '/logs/textarea.log',
  fullUnicode: true,
  warnings: true
});

var box = blessed.streambox({
  parent: screen,
  style: {
    bg: 'blue'
  },
  height: 'half',
  width: 'half',
  top: 'center',
  left: 'center',
  tags: true,
  stream: new Stream.Readable(),
});

box.stream.push('Hello streams!');

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
