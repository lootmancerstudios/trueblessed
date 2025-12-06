#!/usr/bin/env node

// Test that unkey() works to remove key handlers

var blessed = require('./');

var screen = blessed.screen({
  smartCSR: true
});

var box = blessed.box({
  top: 'center',
  left: 'center',
  width: '80%',
  height: '80%',
  content: 'Testing unkey() functionality\n\n' +
           'Press "a" - should log message\n' +
           'Press "r" - removes the "a" handler\n' +
           'Press "a" again - should NOT log message\n' +
           'Press "q" to quit',
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

screen.append(box);

var messages = [];

function log(msg) {
  messages.push(msg);
  updateDisplay();
}

function updateDisplay() {
  var content = 'Testing unkey() functionality\n\n' +
                'Press "a" - should log message\n' +
                'Press "r" - removes the "a" handler\n' +
                'Press "a" again - should NOT log message\n' +
                'Press "q" to quit\n\n' +
                '--- Event Log ---\n' +
                messages.join('\n');
  box.setContent(content);
  screen.render();
}

// Define handler as named function so we can remove it
function aHandler(ch, key) {
  log('[Handler A] Key "a" pressed!');
}

// Add the handler
screen.key(['a'], aHandler);
log('[SETUP] Handler for "a" added');

// Add removal handler
screen.key(['r'], function(ch, key) {
  screen.unkey(['a'], aHandler);
  log('[REMOVE] Handler for "a" removed using unkey()');
});

// Add quit handler
screen.key(['q', 'C-c'], function() {
  process.exit(0);
});

screen.render();
