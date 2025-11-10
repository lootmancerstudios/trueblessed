#!/usr/bin/env node
/**
 * Direct test of codeAttr function
 */

process.env.COLORTERM = 'truecolor';

var blessed = require('../');
var screen = blessed.screen({ smartCSR: true });

console.log('Truecolor enabled:', screen.program.hasTruecolor);
console.log('');

// Allocate some RGB colors
var pinkId = screen._allocRgbColor(237, 163, 206);
var blueId = screen._allocRgbColor(121, 161, 235);

console.log('Allocated pink RGB color with ID:', pinkId);
console.log('Allocated blue RGB color with ID:', blueId);
console.log('');

console.log('RGB colors map:');
console.log(screen._rgbColors);
console.log('');

// Create attributes with these colors
var flags = 0; // No flags
var pinkAttr = (flags << 18) | (pinkId << 9) | 0x1ff; // Pink fg, default bg
var blueAttr = (flags << 18) | (blueId << 9) | 0x1ff; // Blue fg, default bg

console.log('Pink attribute code:', pinkAttr.toString(16));
console.log('Blue attribute code:', blueAttr.toString(16));
console.log('');

// Test codeAttr
var pinkCode = screen.codeAttr(pinkAttr);
var blueCode = screen.codeAttr(blueAttr);

console.log('Pink ANSI code:', JSON.stringify(pinkCode));
console.log('Blue ANSI code:', JSON.stringify(blueCode));
console.log('');

// Expected output
console.log('Expected pink (24-bit):', JSON.stringify('\x1b[38;2;237;163;206m'));
console.log('Expected blue (24-bit):', JSON.stringify('\x1b[38;2;121;161;235m'));
console.log('');

// Check if correct
if (pinkCode === '\x1b[38;2;237;163;206m') {
  console.log('✓ Pink is correct - using 24-bit color!');
} else {
  console.log('✗ Pink is incorrect - not using 24-bit color');
}

if (blueCode === '\x1b[38;2;121;161;235m') {
  console.log('✓ Blue is correct - using 24-bit color!');
} else {
  console.log('✗ Blue is incorrect - not using 24-bit color');
}

screen.destroy();
