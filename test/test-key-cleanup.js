#!/usr/bin/env node

/**
 * Test suite for key handler cleanup API
 * Verifies that screen.key() returns a cleanup function
 * and maintains backward compatibility with unkey()
 */

var assert = require('assert');
var blessed = require('../');

console.log('Testing key handler cleanup API...\n');

var testsPassed = 0;
var testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('\x1b[32m✓\x1b[0m ' + name);
    testsPassed++;
  } catch (err) {
    console.log('\x1b[31m✗\x1b[0m ' + name);
    console.log('  Error: ' + err.message);
    if (err.stack) {
      console.log('  Stack: ' + err.stack.split('\n').slice(1, 3).join('\n'));
    }
    testsFailed++;
  }
}

// Test 1: Return value is a function
test('key() returns a cleanup function', function() {
  var screen = blessed.screen({ smartCSR: true });
  var cleanup = screen.key(['a'], function() {});
  assert.strictEqual(typeof cleanup, 'function', 'Return value should be function');
  screen.destroy();
});

// Test 2: Cleanup function removes handler
test('cleanup() removes the handler', function() {
  var screen = blessed.screen({ smartCSR: true });
  var called = false;

  var cleanup = screen.key(['a'], function() { called = true; });

  // Simulate keypress before cleanup
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(called, true, 'Handler should be called');

  // Cleanup and verify handler removed
  called = false;
  cleanup();
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(called, false, 'Handler should NOT be called after cleanup');

  screen.destroy();
});

// Test 3: Multiple handlers can coexist
test('multiple handlers work independently', function() {
  var screen = blessed.screen({ smartCSR: true });
  var count1 = 0, count2 = 0;

  var cleanup1 = screen.key(['a'], function() { count1++; });
  var cleanup2 = screen.key(['a'], function() { count2++; });

  // Both should fire
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(count1, 1, 'Handler 1 called');
  assert.strictEqual(count2, 1, 'Handler 2 called');

  // Remove first handler
  cleanup1();
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(count1, 1, 'Handler 1 NOT called after cleanup');
  assert.strictEqual(count2, 2, 'Handler 2 still called');

  // Remove second handler
  cleanup2();
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(count1, 1, 'Handler 1 still NOT called');
  assert.strictEqual(count2, 2, 'Handler 2 NOT called after cleanup');

  screen.destroy();
});

// Test 4: Cleanup is idempotent
test('cleanup() can be called multiple times', function() {
  var screen = blessed.screen({ smartCSR: true });
  var cleanup = screen.key(['a'], function() {});

  cleanup();
  cleanup(); // Should not throw
  cleanup(); // Should not throw

  screen.destroy();
});

// Test 5: Multiple keys in one registration
test('cleanup removes all keys in registration', function() {
  var screen = blessed.screen({ smartCSR: true });
  var count = 0;

  var cleanup = screen.key(['a', 'b', 'c'], function() { count++; });

  // All keys should work
  screen.emit('key a', 'a', { name: 'a' });
  screen.emit('key b', 'b', { name: 'b' });
  screen.emit('key c', 'c', { name: 'c' });
  assert.strictEqual(count, 3, 'All keys work');

  // Cleanup should remove all
  cleanup();
  count = 0;
  screen.emit('key a', 'a', { name: 'a' });
  screen.emit('key b', 'b', { name: 'b' });
  screen.emit('key c', 'c', { name: 'c' });
  assert.strictEqual(count, 0, 'All keys removed');

  screen.destroy();
});

// Test 6: Backward compatibility - ignoring return value
test('backward compatibility - ignoring return value', function() {
  var screen = blessed.screen({ smartCSR: true });
  var called = false;

  var handler = function() { called = true; };

  // Old style - ignore return value
  screen.key(['a'], handler);

  // Should still work
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(called, true, 'Handler called');

  // Old style cleanup should still work
  called = false;
  screen.unkey(['a'], handler);
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(called, false, 'Handler removed via unkey()');

  screen.destroy();
});

// Test 7: unkey() and cleanup() both work
test('both unkey() and cleanup() work correctly', function() {
  var screen = blessed.screen({ smartCSR: true });
  var count1 = 0, count2 = 0;

  var handler1 = function() { count1++; };
  var handler2 = function() { count2++; };

  var cleanup1 = screen.key(['a'], handler1);
  screen.key(['a'], handler2); // No cleanup captured

  // Both fire
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(count1, 1);
  assert.strictEqual(count2, 1);

  // Remove via cleanup()
  cleanup1();
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(count1, 1, 'cleanup() removed handler1');
  assert.strictEqual(count2, 2, 'handler2 still works');

  // Remove via unkey()
  screen.unkey(['a'], handler2);
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(count2, 2, 'unkey() removed handler2');

  screen.destroy();
});

// Test 8: Cleanup with anonymous functions
test('cleanup works with anonymous functions', function() {
  var screen = blessed.screen({ smartCSR: true });
  var called = false;

  // This is the power of the new API - can clean up anonymous functions!
  var cleanup = screen.key(['a'], function() { called = true; });

  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(called, true, 'Anonymous handler called');

  called = false;
  cleanup();
  screen.emit('key a', 'a', { name: 'a' });
  assert.strictEqual(called, false, 'Anonymous handler removed');

  screen.destroy();
});

// Test 9: String vs Array key formats
test('cleanup works with string and array key formats', function() {
  var screen = blessed.screen({ smartCSR: true });
  var count1 = 0, count2 = 0;

  // String format
  var cleanup1 = screen.key('a,b', function() { count1++; });

  // Array format
  var cleanup2 = screen.key(['c', 'd'], function() { count2++; });

  screen.emit('key a', 'a', { name: 'a' });
  screen.emit('key b', 'b', { name: 'b' });
  screen.emit('key c', 'c', { name: 'c' });
  screen.emit('key d', 'd', { name: 'd' });

  assert.strictEqual(count1, 2, 'String format works');
  assert.strictEqual(count2, 2, 'Array format works');

  cleanup1();
  cleanup2();

  count1 = 0;
  count2 = 0;

  screen.emit('key a', 'a', { name: 'a' });
  screen.emit('key b', 'b', { name: 'b' });
  screen.emit('key c', 'c', { name: 'c' });
  screen.emit('key d', 'd', { name: 'd' });

  assert.strictEqual(count1, 0, 'String format cleanup works');
  assert.strictEqual(count2, 0, 'Array format cleanup works');

  screen.destroy();
});

// Test 10: Collecting cleanups pattern
test('collecting multiple cleanups pattern', function() {
  var screen = blessed.screen({ smartCSR: true });
  var cleanups = [];
  var counts = [0, 0, 0];

  cleanups.push(screen.key(['a'], function() { counts[0]++; }));
  cleanups.push(screen.key(['b'], function() { counts[1]++; }));
  cleanups.push(screen.key(['c'], function() { counts[2]++; }));

  // All work
  screen.emit('key a', 'a', { name: 'a' });
  screen.emit('key b', 'b', { name: 'b' });
  screen.emit('key c', 'c', { name: 'c' });
  assert.deepStrictEqual(counts, [1, 1, 1], 'All handlers work');

  // Clean up all at once
  cleanups.forEach(function(cleanup) { cleanup(); });
  counts = [0, 0, 0];

  screen.emit('key a', 'a', { name: 'a' });
  screen.emit('key b', 'b', { name: 'b' });
  screen.emit('key c', 'c', { name: 'c' });
  assert.deepStrictEqual(counts, [0, 0, 0], 'All handlers cleaned up');

  screen.destroy();
});

console.log('\n' + '='.repeat(50));
console.log('Results: ' + testsPassed + ' passed, ' + testsFailed + ' failed');
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('\n\x1b[32m✓ All tests passed!\x1b[0m\n');
  process.exit(0);
}
