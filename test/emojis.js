var blessed = require('../')
  , screen;

screen = blessed.screen({
  dump: __dirname + '/logs/textarea.log',
  fullUnicode: true,
  warnings: true,
});

var box = blessed.box({
  parent: screen,
  style: {
    bg: 'blue'
  },
  height: 'half',
  width: 'half',
  top: 'center',
  left: 'center',
  tags: true,
  content: 'asdasd😀✨✨👨‍👨‍👧‍👧'
});


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
