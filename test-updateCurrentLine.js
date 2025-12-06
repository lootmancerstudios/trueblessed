#!/usr/bin/env node

/**
 * Test script for updateCurrentLine, deleteLastLine, and replaceLastLine methods
 *
 * This demonstrates streaming output where partial lines update progressively
 */

var blessed = require('./index.js');

// Create screen
var screen = blessed.screen({
  smartCSR: true,
  title: 'Log updateCurrentLine Test'
});

// Create logger
var logger = blessed.log({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '90%',
  height: '90%',
  border: {
    type: 'line'
  },
  tags: true,
  label: ' {bold}updateCurrentLine() Test{/bold} ',
  scrollback: 100,
  scrollOnInput: false
});

// Key bindings
screen.key(['escape', 'q', 'C-c'], function() {
  return process.exit(0);
});

// Test sequence
var step = 0;
var testInterval;

function runTest() {
  if (step === 0) {
    logger.log('{cyan-fg}Test 1: Progressive download indicator{/}');
    logger.log('Starting download...');
    step++;
  } else if (step >= 1 && step <= 10) {
    // Update same line with progress
    var percent = step * 10;
    logger.updateCurrentLine('Downloading: ' + percent + '% {green-fg}' + '█'.repeat(percent / 5) + '{/}');
    step++;
  } else if (step === 11) {
    logger.log('Download complete!');
    logger.log('');
    step++;
  } else if (step === 12) {
    logger.log('{cyan-fg}Test 2: Streaming AI response (simulated){/}');
    logger.log(''); // Start with blank line for partial content
    step++;
  } else if (step >= 13 && step <= 20) {
    // Simulate streaming text chunks
    var texts = [
      'This is',
      'This is a',
      'This is a long',
      'This is a long paragraph',
      'This is a long paragraph that',
      'This is a long paragraph that updates',
      'This is a long paragraph that updates progressively',
      'This is a long paragraph that updates progressively {gray-fg}▌{/}'
    ];
    if (step - 13 < texts.length) {
      logger.updateCurrentLine(texts[step - 13]);
    }
    step++;
  } else if (step === 21) {
    // Commit the final line
    logger.log('This is a long paragraph that updates progressively without duplicates!');
    logger.log('');
    step++;
  } else if (step === 22) {
    logger.log('{cyan-fg}Test 3: Replace last line{/}');
    logger.log('Temporary message...');
    step++;
  } else if (step === 23) {
    logger.replaceLastLine('{green-fg}✓ Replaced with success message!{/}');
    logger.log('');
    step++;
  } else if (step === 24) {
    logger.log('{cyan-fg}Test 4: Delete last line{/}');
    logger.log('This line will be deleted...');
    step++;
  } else if (step === 25) {
    logger.deleteLastLine();
    logger.log('{yellow-fg}Previous line deleted!{/}');
    logger.log('');
    step++;
  } else if (step === 26) {
    logger.log('{green-fg}{bold}All tests complete!{/}{/}');
    logger.log('{gray-fg}Press q or ESC to exit{/}');
    clearInterval(testInterval);
  }

  screen.render();
}

// Run tests with animation
logger.log('{bold}Starting tests...{/}');
logger.log('');
screen.render();

testInterval = setInterval(runTest, 200);
