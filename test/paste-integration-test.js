#!/usr/bin/env node

/**
 * Integration test for paste functionality
 * Tests the full event flow from input through to screen
 */

var blessed = require('../');
var assert = require('assert');

console.log('Running paste integration test...\n');

// Create a simple mock streams
var Stream = require('stream');

var mockInput = new Stream.Readable();
mockInput._read = function() {};
mockInput.isTTY = true;
mockInput.setRawMode = function() { return this; };
mockInput.resume = function() { return this; };
mockInput.pause = function() { return this; };

var mockOutput = new Stream.Writable();
mockOutput._write = function(chunk, encoding, callback) { callback(); };
mockOutput.isTTY = true;
mockOutput.columns = 80;
mockOutput.rows = 24;

// Create screen with bracketed paste enabled
var screen = blessed.screen({
  input: mockInput,
  output: mockOutput,
  smartCSR: true,
  bracketedPaste: true
});

console.log('✓ Screen created with bracketedPaste enabled');
console.log('✓ Program has bracketedPaste option:', screen.program.options.bracketedPaste);
console.log('✓ Input stream has _pasteEnabled:', mockInput._pasteEnabled);

// Track events
var events = {
  keypress: [],
  paste: []
};

// Add event listeners to screen
screen.on('keypress', function(ch, key) {
  if (!key) return;
  events.keypress.push({ ch: ch, key: key });
  console.log('  [KEYPRESS] ch=' + (ch || 'undefined') + ', name=' + key.name);
});

screen.on('paste', function(content) {
  events.paste.push(content);
  console.log('  [PASTE] content="' + content + '" (' + content.length + ' chars)');
});

console.log('✓ Event listeners registered\n');

// Test 1: Typed character
console.log('Test 1: Simulating typed character "a"');
console.log('  Emitting data event on input...');
mockInput.emit('data', Buffer.from('a'));

setTimeout(function() {
  console.log('  Received events:', events);
  assert.equal(events.keypress.length, 1, 'Should have 1 keypress event');
  assert.equal(events.keypress[0].ch, 'a', 'Character should be "a"');
  console.log('✓ Typed character generated keypress event\n');

  // Test 2: Simple paste
  console.log('Test 2: Simulating paste "hello world"');
  mockInput.emit('data', Buffer.from('\x1b[200~hello world\x1b[201~'));

  setTimeout(function() {
    assert.equal(events.paste.length, 1, 'Should have 1 paste event');
    assert.equal(events.paste[0], 'hello world', 'Content should be "hello world"');
    assert.equal(events.keypress.length, 1, 'Should still have only 1 keypress (no keypresses for pasted chars)');
    console.log('✓ Pasted content generated single paste event\n');

    // Test 3: Multiline paste
    console.log('Test 3: Simulating multiline paste');
    mockInput.emit('data', Buffer.from('\x1b[200~line1\nline2\nline3\x1b[201~'));

    setTimeout(function() {
      assert.equal(events.paste.length, 2, 'Should have 2 paste events total');
      assert.equal(events.paste[1], 'line1\nline2\nline3', 'Multiline content preserved');
      console.log('✓ Multiline paste preserved newlines\n');

      // Test 4: Another typed character after paste
      console.log('Test 4: Simulating typed character "b" after paste');
      mockInput.emit('data', Buffer.from('b'));

      setTimeout(function() {
        assert.equal(events.keypress.length, 2, 'Should have 2 keypress events total');
        assert.equal(events.keypress[1].ch, 'b', 'Second character should be "b"');
        console.log('✓ Typing after paste works correctly\n');

        // Cleanup
        screen.destroy();
        console.log('✓ Screen destroyed cleanly');

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL INTEGRATION TESTS PASSED!');
        console.log('='.repeat(60));
        console.log('\nEvent Summary:');
        console.log('  • Keypress events: ' + events.keypress.length);
        console.log('  • Paste events: ' + events.paste.length);
        console.log('\nThe paste functionality is working correctly!');
        console.log('Flow: Terminal → Input → Keys.js → Program → Screen → App');
        process.exit(0);
      }, 50);
    }, 50);
  }, 50);
}, 50);
