#!/usr/bin/env node

var blessed = require('./');

var screen = blessed.screen({
  smartCSR: true,
  bracketedPaste: true  // This is the key setting
});

var eventLog = [];

function log(msg) {
  eventLog.push(`[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${msg}`);
  updateLog();
}

// Simulate silvermage: screen-level keypress handler (like silvermage's input handler)
screen.on('keypress', function(ch, key) {
  if (!key) {
    log('[SCREEN KEYPRESS] ch: ' + ch + ', key: null');
    return;
  }
  log('[SCREEN KEYPRESS] ch: ' + ch + ', key.name: ' + key.name + ', key.full: ' + key.full);

  // This is like silvermage's input character handler
  if (ch && !key.ctrl && !key.meta) {
    log('[SCREEN] Would add character to input: ' + ch);
  }
});

// Create a log box to show events
var logBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '50%',
  content: 'Event Log:',
  border: 'line',
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    inverse: true
  }
});

function updateLog() {
  logBox.setContent('Event Log:\n' + eventLog.slice(-10).join('\n'));
  screen.render();
}

// Create a modal box (like silvermage's help/model/provider modals)
var modal = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: 50,
  height: 10,
  content: '{bold}{cyan-fg}Modal Test{/}\n\nPress ESC to close\nType a character after closing',
  border: 'line',
  tags: true,
  keys: true,
  vi: true,
  hidden: true,
  style: {
    border: {
      fg: 'cyan'
    }
  }
});

// Track modal state
var modalVisible = true;

// Modal's keypress handler
modal.on('keypress', function(ch, key) {
  if (!key) return;
  log('[MODAL KEYPRESS] ch: ' + ch + ', key.name: ' + key.name);
});

// Modal's ESC handler
modal.key(['escape'], function() {
  log('[MODAL] ESC handler triggered - hiding modal');
  modal.hide();
  modalVisible = false;
  screen.render();
});

// Show modal after 1 second
setTimeout(function() {
  log('[TEST] Showing modal...');
  modal.show();
  modal.focus();
  modalVisible = true;
  screen.render();

  log('[TEST] Modal visible. Press ESC to close, then type a character.');
}, 1000);

screen.key(['C-c'], function() {
  log('[TEST] Ctrl+C pressed - exiting');
  return process.exit(0);
});

screen.render();
