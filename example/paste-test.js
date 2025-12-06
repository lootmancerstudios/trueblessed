#!/usr/bin/env node

/**
 * example/paste-test.js - Interactive Bracketed Paste Mode Demo
 *
 * This demo shows how bracketed paste mode works in trueblessed.
 * Try pasting text to see the paste event in action!
 *
 * Usage: node example/paste-test.js
 */

var blessed = require('../');

// Create screen with bracketed paste enabled
var screen = blessed.screen({
  smartCSR: true,
  bracketedPaste: true,
  title: 'Bracketed Paste Demo',
  fullUnicode: true
});

// Header box
var header = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '{center}{bold}Bracketed Paste Mode Demo{/bold}{/center}\n' +
           '{center}Press Ctrl+C to exit  |  Type or Paste to see events{/center}',
  tags: true,
  style: {
    fg: 'white',
    bg: 'blue',
    bold: true
  }
});

// Instructions box
var instructions = blessed.box({
  parent: screen,
  top: 3,
  left: 0,
  width: '50%',
  height: 8,
  content: '{bold}How It Works:{/bold}\n\n' +
           '• Type single characters → keypress events\n' +
           '• Paste text (Cmd/Ctrl+V) → paste event\n' +
           '• Multiline paste detected automatically\n' +
           '• Watch the event log on the right!\n\n' +
           '{yellow-fg}This enables smart paste handling{/}',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'cyan'
    }
  }
});

// Event log box
var eventLog = blessed.log({
  parent: screen,
  top: 3,
  left: '50%',
  width: '50%',
  height: 8,
  label: ' Event Log ',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'green'
    }
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    bg: 'green'
  }
});

var eventCount = {
  keypress: 0,
  paste: 0
};

// Last paste info box
var lastPasteBox = blessed.box({
  parent: screen,
  top: 11,
  left: 0,
  width: '100%',
  height: 6,
  label: ' Last Paste Details ',
  content: '{center}(no paste yet - try pasting something!){/center}',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'magenta'
    }
  }
});

// Statistics box (bottom)
var stats = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '',
  tags: true,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

function updateStats() {
  stats.setContent(
    '{center}' +
    '{cyan-fg}Total Keypress Events:{/} {bold}' + eventCount.keypress + '{/bold}  |  ' +
    '{green-fg}Total Paste Events:{/} {bold}' + eventCount.paste + '{/bold}' +
    '{/center}'
  );
  screen.render();
}

// Handle keypress events (from typed input)
screen.on('keypress', function(ch, key) {
  if (!key) return;

  // Skip control keys
  if (key.name === 'escape' || key.full === 'C-c') return;

  eventCount.keypress++;
  var displayCh = ch && ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) < 127 ? ch : '<' + key.name + '>';
  eventLog.log('{cyan-fg}[KEY #{/}' + eventCount.keypress + '{cyan-fg}]{/} ' + displayCh);
  updateStats();
});

// Handle paste events
screen.on('paste', function(content) {
  eventCount.paste++;

  var lines = content.split('\n');
  var preview = content.length > 50 ? content.substring(0, 47) + '...' : content;
  var displayPreview = preview.replace(/\n/g, '\\n').replace(/\t/g, '\\t');

  eventLog.log('{green-fg}{bold}[PASTE #{/}' + eventCount.paste + '{green-fg}{bold}]{/bold}{/} ' +
               content.length + ' chars, ' + lines.length + ' line(s)');

  // Update last paste info box
  var info = '';
  if (lines.length === 1) {
    info = '{center}{bold}Single-line paste:{/bold}{/center}\n';
  } else {
    info = '{center}{bold}{yellow-fg}Multi-line paste detected!{/}{/bold}{/center}\n';
  }

  info += '{center}Length: {bold}' + content.length + '{/bold} characters{/center}\n';
  info += '{center}Lines: {bold}' + lines.length + '{/bold}{/center}\n';

  if (content.length > 40) {
    var previewShort = content.substring(0, 40).replace(/\n/g, '↵');
    info += '{center}Preview: "' + previewShort + '..."{/center}';
  } else {
    var contentDisplay = content.replace(/\n/g, '↵');
    info += '{center}Content: "' + contentDisplay + '"{/center}';
  }

  lastPasteBox.setContent(info);
  updateStats();
});

// Quit on Ctrl-C
screen.key(['C-c'], function() {
  return process.exit(0);
});

// Initial render
// Note: Event listeners are automatically set up when we call screen.on()
// No need to focus - the screen is the root element
eventLog.log('{yellow-fg}=== Bracketed Paste Mode Active ==={/}');
eventLog.log('{gray-fg}Waiting for keyboard/paste input...{/}');
eventLog.log('');
updateStats();
screen.render();
