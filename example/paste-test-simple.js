#!/usr/bin/env node

/**
 * Simple bracketed paste demo - shows events in real-time
 */

var blessed = require('../');

var screen = blessed.screen({
  smartCSR: true,
  bracketedPaste: true,
  fullUnicode: true
});

var log = blessed.log({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%-1',
  border: 'line',
  tags: true,
  label: ' Paste Event Log (type or paste to see events) ',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    bg: 'blue'
  }
});

var status = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  tags: true,
  style: {
    bg: 'blue',
    fg: 'white'
  }
});

var keypressCount = 0;
var pasteCount = 0;

function updateStatus() {
  status.setContent(
    ' {bold}Keypress:{/bold} ' + keypressCount +
    '  {bold}Paste:{/bold} ' + pasteCount +
    '  {bold}Press Ctrl-C to exit{/bold}'
  );
  screen.render();
}

// Listen to screen events
screen.on('keypress', function(ch, key) {
  if (!key) return;

  // Skip control keys we use for exit
  if (key.name === 'escape' || key.full === 'C-c') return;

  keypressCount++;
  var display = ch || ('<' + key.name + '>');
  log.log('{cyan-fg}[KEYPRESS #{/}' + keypressCount + '{cyan-fg}]{/} ' + display);
  updateStatus();
});

screen.on('paste', function(content) {
  pasteCount++;
  var lines = content.split('\n');
  var preview = content.length > 80 ? content.substring(0, 77) + '...' : content;
  preview = preview.replace(/\n/g, '\\n');

  log.log('{green-fg}{bold}[PASTE #{/}' + pasteCount + '{green-fg}{bold}]{/bold}{/} ' +
          content.length + ' chars, ' + lines.length + ' line(s)');
  log.log('{gray-fg}  Content: "' + preview + '"{/}');
  updateStatus();
});

// Log that we're ready
log.log('{yellow-fg}=== Bracketed Paste Mode Active ==={/}');
log.log('{gray-fg}Try typing characters and pasting text...{/}');
log.log('');

screen.key(['C-c'], function() {
  process.exit(0);
});

updateStatus();
screen.render();
