#!/usr/bin/env node
/**
 * Test for truecolor (24-bit RGB) support
 * This should display a smooth gradient from pink to blue
 */

var blessed = require('../');

// Force truecolor mode
process.env.COLORTERM = 'truecolor';

var screen = blessed.screen({
  smartCSR: true,
  title: 'Truecolor Gradient Test'
});

var box = blessed.box({
  top: 'center',
  left: 'center',
  width: '80%',
  height: '80%',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'blue'
    }
  }
});

// Create a smooth gradient from pink (#EDA3CE) to blue (#79A1EB)
var startColor = { r: 237, g: 163, b: 206 }; // Pink
var endColor = { r: 121, g: 161, b: 235 }; // Blue

var lines = [];
var steps = 50;

lines.push('Truecolor Gradient Test\n');
lines.push('Should show smooth gradient from pink to blue\n');
lines.push('Truecolor enabled: ' + screen.program.hasTruecolor + '\n\n');

for (var i = 0; i < steps; i++) {
  var ratio = i / (steps - 1);
  var r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  var g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  var b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

  // Create hex color
  var hex = '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);

  // Use blessed tags
  lines.push('{' + hex + '-fg}████████████████{/} Step ' + i + ': ' + hex + ' RGB(' + r + ',' + g + ',' + b + ')');
}

lines.push('\n\nPress q to quit');

box.setContent(lines.join('\n'));

screen.append(box);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

box.focus();

screen.render();
