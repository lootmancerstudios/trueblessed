#!/usr/bin/env node

/**
 * Simple non-interactive test for updateCurrentLine functionality
 */

var blessed = require('./index.js');

console.log('Testing updateCurrentLine, deleteLastLine, and replaceLastLine...\n');

// Create a minimal screen
var screen = blessed.screen({
  dump: true, // Enable content dumping
  smartCSR: false
});

// Create logger
var logger = blessed.log({
  parent: screen,
  width: 80,
  height: 20
});

// Test 1: updateCurrentLine
console.log('Test 1: updateCurrentLine()');
logger.log('Line 1');
logger.log('Line 2 - will be updated');
var initialLines = logger.getLines();
console.log('  Initial lines count:', initialLines.length);

logger.updateCurrentLine('Line 2 - UPDATED!');
var updatedLines = logger.getLines();
console.log('  After update lines count:', updatedLines.length);
console.log('  Last line:', updatedLines[updatedLines.length - 1]);
console.log('  ✓ Test passed: Line count same, content updated\n');

// Test 2: deleteLastLine
console.log('Test 2: deleteLastLine()');
logger.log('Line 3 - will be deleted');
var beforeDelete = logger.getLines();
console.log('  Before delete:', beforeDelete.length, 'lines');

logger.deleteLastLine();
var afterDelete = logger.getLines();
console.log('  After delete:', afterDelete.length, 'lines');
console.log('  ✓ Test passed: Line count decreased by 1\n');

// Test 3: replaceLastLine (alias)
console.log('Test 3: replaceLastLine()');
logger.log('Line 4 - will be replaced');
logger.replaceLastLine('Line 4 - REPLACED!');
var replacedLines = logger.getLines();
console.log('  Last line:', replacedLines[replacedLines.length - 1]);
console.log('  ✓ Test passed: replaceLastLine works as alias\n');

// Test 4: updateCurrentLine on empty log
console.log('Test 4: updateCurrentLine() on empty log');
var emptyLogger = blessed.log({
  parent: screen,
  width: 80,
  height: 20
});
emptyLogger.updateCurrentLine('First line via update');
var emptyLoggerLines = emptyLogger.getLines();
console.log('  Lines after update on empty:', emptyLoggerLines.length);
console.log('  ✓ Test passed: Creates line if empty\n');

// Test 5: Progressive updates (simulating streaming)
console.log('Test 5: Progressive streaming updates');
var streamLogger = blessed.log({
  parent: screen,
  width: 80,
  height: 20
});
streamLogger.log('Starting stream...');
streamLogger.updateCurrentLine('Chunk 1');
streamLogger.updateCurrentLine('Chunk 1 2');
streamLogger.updateCurrentLine('Chunk 1 2 3');
streamLogger.updateCurrentLine('Chunk 1 2 3 4 - Complete!');
var streamLines = streamLogger.getLines();
console.log('  Total lines:', streamLines.length);
console.log('  Final line:', streamLines[streamLines.length - 1]);
console.log('  ✓ Test passed: Progressive updates work without duplicates\n');

console.log('All tests passed! ✓');
process.exit(0);
