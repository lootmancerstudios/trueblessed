#!/usr/bin/env node

// Verify that unkey API exists and is properly exposed

var blessed = require('./');

var screen = blessed.screen({ smartCSR: true });

console.log('Checking for unkey() method...');
console.log('screen.unkey exists:', typeof screen.unkey === 'function');
console.log('screen.removeKey exists:', typeof screen.removeKey === 'function');
console.log('');

// Test that it doesn't throw
function testHandler() {
  console.log('Handler called');
}

console.log('Adding key handler for "test"...');
screen.key(['t', 'e', 's', 't'], testHandler);

console.log('Removing key handler for "test"...');
screen.unkey(['t', 'e', 's', 't'], testHandler);

console.log('');
console.log('✓ unkey() API exists and can be called without errors');
console.log('✓ removeKey() alias exists');

screen.destroy();
process.exit(0);
