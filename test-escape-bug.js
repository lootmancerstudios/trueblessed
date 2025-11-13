#!/usr/bin/env node

// Test to verify ESC key is being treated as partial paste marker

var blessed = require('./');

console.log('Testing ESC key handling with bracketedPaste enabled...\n');

var screen = blessed.screen({
  smartCSR: true,
  bracketedPaste: true
});

var counter = 0;

screen.on('keypress', function(ch, key) {
  if (!key) return;

  counter++;
  console.log(`[${counter}] keypress: ch="${ch}", key.name="${key.name}", key.sequence="${key.sequence.split('').map(c => c.charCodeAt(0).toString(16)).join(' ')}"`);

  if (key.name === 'escape') {
    console.log('  --> ESC detected!');
  }

  if (counter >= 5) {
    console.log('\nTest complete. Press Ctrl+C to exit.');
  }
});

screen.key(['C-c'], function() {
  return process.exit(0);
});

console.log('Instructions:');
console.log('1. Press ESC key');
console.log('2. Press any letter (e.g., "a")');
console.log('3. Watch the console output\n');
console.log('Expected bug behavior:');
console.log('- First ESC press: no keypress event');
console.log('- Second keypress: both ESC and the character arrive together\n');
console.log('---\n');

screen.render();
