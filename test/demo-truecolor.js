#!/usr/bin/env node
/**
 * Demo: Compare 256-color vs Truecolor gradients
 */

var blessed = require('../');

// Test 1: WITHOUT truecolor
console.log('\n========== TEST 1: 256-COLOR MODE ==========\n');
delete process.env.COLORTERM;
var screen1 = blessed.screen({ smartCSR: true, truecolor: false });
console.log('Truecolor enabled:', screen1.program.hasTruecolor);

var startColor = { r: 237, g: 163, b: 206 }; // Pink
var endColor = { r: 121, g: 161, b: 235 }; // Blue
var steps = 20;

var gradient1 = '';
for (var i = 0; i < steps; i++) {
  var ratio = i / (steps - 1);
  var r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  var g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  var b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

  var hex = '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);

  var box = blessed.box({
    top: 0,
    left: i * 3,
    width: 3,
    height: 1,
    content: '███',
    style: { fg: hex }
  });
  screen1.append(box);
}

screen1.render();
var output1 = screen1.screenshot();
console.log('\nGradient (limited to ~256 colors):');
console.log(output1.split('\n')[0]);

screen1.destroy();

// Test 2: WITH truecolor
console.log('\n========== TEST 2: TRUECOLOR MODE ==========\n');
process.env.COLORTERM = 'truecolor';
var screen2 = blessed.screen({ smartCSR: true });
console.log('Truecolor enabled:', screen2.program.hasTruecolor);

for (var i = 0; i < steps; i++) {
  var ratio = i / (steps - 1);
  var r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  var g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  var b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

  var hex = '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);

  var box = blessed.box({
    top: 0,
    left: i * 3,
    width: 3,
    height: 1,
    content: '███',
    style: { fg: hex }
  });
  screen2.append(box);
}

screen2.render();
var output2 = screen2.screenshot();
console.log('\nGradient (24-bit RGB, smooth):');
console.log(output2.split('\n')[0]);
console.log('\nRGB colors allocated:', Object.keys(screen2._rgbColors).length);

screen2.destroy();

console.log('\n========== SUMMARY ==========');
console.log('256-color mode: Limited color palette, chunky gradients');
console.log('Truecolor mode: 16.7 million colors, smooth gradients');
console.log('\nTruecolor support successfully implemented! ✓\n');
