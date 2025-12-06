var blessed = require('../')
  , screen;

screen = blessed.screen({
  dump: __dirname + '/logs/bigtext.log',
  smartCSR: true,
  warnings: true
});

var box = blessed.box({
  parent: screen,
  scrollable: true,
  keys: true,
  vi: true,
  alwaysScroll: true,
  border: 'line',
  fch: ' ',
  ch: '\u2592',
  style: {
    fg: 'red',
    bg: 'blue',
    bold: false
  },
});

var button = blessed.button({
  parent: box,
  content: 'Click\nme!',
  shrink: true,
  mouse: true,
  border: 'line',
  style: {
    fg: 'red',
    bg: 'blue'
  },
  //height: 3,
  //bottom: 6,
});

var button1 = blessed.button({
  parent: box,
  content: 'Click\nme!',
  shrink: true,
  mouse: true,
  border: 'line',
  style: {
    fg: 'red',
    bg: 'blue'
  },
  bottom: 6,
});
var button2 = blessed.button({
  parent: box,
  content: 'Click\nme!',
  shrink: true,
  mouse: true,
  border: 'line',
  style: {
    fg: 'red',
    bg: 'blue'
  },
  bottom: 3,
});
var button3 = blessed.button({
  parent: box,
  content: 'Click\nme!',
  shrink: true,
  mouse: true,
  border: 'line',
  style: {
    fg: 'red',
    bg: 'blue'
  },
  bottom: 0,
});
var button4 = blessed.button({
  parent: box,
  content: 'Click\nme!',
  shrink: true,
  mouse: true,
  border: 'line',
  style: {
    fg: 'red',
    bg: 'blue'
  },
  bottom: -3,
});

screen.key('q', function() {
  return screen.destroy();
});

screen.render();

