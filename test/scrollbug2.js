var blessed = require('../')
  , screen;

screen = blessed.screen({
  dump: __dirname + '/logs/textarea.log',
  fullUnicode: true,
  warnings: true,
});

var box = blessed.form({
  parent: screen,
  style: {
    bg: 'blue'
  },
  height: 'half',
  width: 'half',
  top: 'center',
  left: 'center',
  tags: true,
  scrollable: true,
  keys: true,
});

for (let i = 0; i < 30; i++) {
  var b = blessed.button({
    parent: box,
    //content: 'Click me!',
    content: i.toString(),
    shrink: true,
    mouse: true,
    // border: 'line',
    style: {
      fg: 'red',
      bg: 'blue',
      focus: {
        bg: 'red'
      }
    },
    //height: 3,
    top: i
  });
}

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();