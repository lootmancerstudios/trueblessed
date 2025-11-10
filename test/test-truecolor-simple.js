#!/usr/bin/env node
/**
 * Simple test for truecolor (24-bit RGB) support
 * This outputs raw ANSI codes to verify truecolor is working
 */

// Force truecolor mode
process.env.COLORTERM = 'truecolor';

var Program = require('../src/lib/program');
var colors = require('../src/lib/colors');

var program = new Program({
  output: process.stdout,
  input: process.stdin
});

console.log('Truecolor enabled:', program.hasTruecolor);
console.log('');

// Test 1: Direct ANSI codes
console.log('Test 1: Direct 24-bit ANSI codes');
console.log('\x1b[38;2;237;163;206mPink text (RGB 237,163,206)\x1b[0m');
console.log('\x1b[38;2;121;161;235mBlue text (RGB 121,161,235)\x1b[0m');
console.log('');

// Test 2: Color helper functions
console.log('Test 2: colors.toRGB()');
var pinkRgb = colors.toRGB('#EDA3CE');
console.log('  Pink hex #EDA3CE ->', pinkRgb);

var blueRgb = colors.toRGB([121, 161, 235]);
console.log('  Blue array [121,161,235] ->', blueRgb);
console.log('');

// Test 3: Gradient
console.log('Test 3: Smooth gradient (should show many distinct colors)');
var startColor = { r: 237, g: 163, b: 206 }; // Pink
var endColor = { r: 121, g: 161, b: 235 }; // Blue
var steps = 50;

for (var i = 0; i < steps; i++) {
  var ratio = i / (steps - 1);
  var r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  var g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  var b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

  // Output with 24-bit color
  var code = '\x1b[38;2;' + r + ';' + g + ';' + b + 'm';
  process.stdout.write(code + '█');
}
console.log('\x1b[0m');
console.log('');

console.log('Test complete!');
