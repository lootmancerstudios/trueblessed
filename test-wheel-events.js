#!/usr/bin/env node

// Test to understand what events fire when mouse wheel scrolls

var blessed = require('./');

var screen = blessed.screen({
  smartCSR: true,
  mouse: true,  // Enable mouse events
});

var eventLog = [];

function log(msg) {
  eventLog.push('[' + new Date().toISOString().split('T')[1].slice(0,-1) + '] ' + msg);
  updateDisplay();
}

// Create a display box for event log
var display = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  content: 'Scroll mouse wheel and watch events...\nPress Ctrl+C to exit',
  tags: true,
  scrollable: true,
});

screen.append(display);

function updateDisplay() {
  var content = 'Scroll mouse wheel and watch events...\nPress Ctrl+C to exit\n\n';
  content += eventLog.slice(-30).join('\n');
  display.setContent(content);
  screen.render();
}

// Listen to ALL possible events
screen.on('mouse', function(data) {
  log('[SCREEN MOUSE] action:' + data.action + ' button:' + data.button);
});

screen.on('wheelup', function(data) {
  log('[SCREEN WHEELUP]');
});

screen.on('wheeldown', function(data) {
  log('[SCREEN WHEELDOWN]');
});

screen.on('keypress', function(ch, key) {
  if (!key) return;
  log('[SCREEN KEYPRESS] name:' + key.name + ' full:' + key.full);
});

screen.key(['up'], function(ch, key) {
  log('[SCREEN KEY UP] triggered');
});

screen.key(['down'], function(ch, key) {
  log('[SCREEN KEY DOWN] triggered');
});

screen.key(['C-c'], function() {
  process.exit(0);
});

screen.render();

console.log('\n=== WHEEL EVENT TEST ===');
console.log('Scroll your mouse wheel and observe what events fire.');
console.log('We want to see if wheel events trigger arrow key handlers.');
console.log('========================\n');
