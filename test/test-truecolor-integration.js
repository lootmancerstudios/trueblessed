#!/usr/bin/env node
/**
 * Integration test for truecolor support with blessed screen/elements
 */

// Force truecolor mode
process.env.COLORTERM = 'truecolor';

var blessed = require('../');

console.log('Creating screen with truecolor support...\n');

var screen = blessed.screen({
  smartCSR: true,
  dump: false,
  log: '/tmp/blessed-truecolor-test.log'
});

console.log('Screen created');
console.log('Truecolor enabled:', screen.program.hasTruecolor);
console.log('');

// Create elements with RGB colors
var box1 = blessed.box({
  top: 0,
  left: 0,
  width: 30,
  height: 3,
  content: 'Box 1: Pink #EDA3CE',
  style: {
    fg: '#EDA3CE', // Pink - should use truecolor
    bg: 'black'
  }
});

var box2 = blessed.box({
  top: 3,
  left: 0,
  width: 30,
  height: 3,
  content: 'Box 2: Blue #79A1EB',
  style: {
    fg: '#79A1EB', // Blue - should use truecolor
    bg: 'black'
  }
});

var box3 = blessed.box({
  top: 6,
  left: 0,
  width: 30,
  height: 3,
  content: 'Box 3: RGB(200,100,50)',
  style: {
    fg: [200, 100, 50], // Orange - array format
    bg: 'black'
  }
});

screen.append(box1);
screen.append(box2);
screen.append(box3);

// Test gradient box
var gradientBox = blessed.box({
  top: 10,
  left: 0,
  width: 60,
  height: 12,
  tags: true,
  content: '',
  border: {
    type: 'line'
  }
});

// Create gradient content
var lines = ['Gradient Test (50 colors):'];
var startColor = { r: 237, g: 163, b: 206 }; // Pink
var endColor = { r: 121, g: 161, b: 235 }; // Blue
var steps = 50;

var gradientLine = '';
for (var i = 0; i < steps; i++) {
  var ratio = i / (steps - 1);
  var r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  var g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  var b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

  var hex = '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);

  gradientLine += '{' + hex + '-fg}█{/}';
}

lines.push('');
lines.push(gradientLine);
lines.push('');
lines.push('Colors allocated: ' + Object.keys(screen._rgbColors).length);
lines.push('');
lines.push('Press q to quit');

gradientBox.setContent(lines.join('\n'));
screen.append(gradientBox);

// Render and check output
screen.render();

console.log('Screen rendered');
console.log('RGB colors allocated:', Object.keys(screen._rgbColors).length);

// Show some of the allocated colors
var count = 0;
for (var id in screen._rgbColors) {
  if (count++ < 5) {
    var rgb = screen._rgbColors[id];
    console.log('  Color ID', id, ':', 'RGB(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')');
  }
}

console.log('  ... and', Object.keys(screen._rgbColors).length - 5, 'more');
console.log('');

// Quit after a moment
setTimeout(function() {
  screen.destroy();
  console.log('\nTest complete! Check the visual output above.');
  console.log('If truecolor is working, you should see smooth gradients.');
  process.exit(0);
}, 500);
