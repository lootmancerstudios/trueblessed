#!/usr/bin/env node

// Test the partial paste marker regex to verify the bug

console.log('Testing partial paste marker regex...\n');

// OLD (buggy) regex
var oldRegex = /(\x1b|\x1b\[|\x1b\[2|\x1b\[20|\x1b\[200)$/;

// NEW (fixed) regex
var newRegex = /(\x1b\[20[01]?|\x1b\[2)$/;

var partialPasteMarkerRegex = newRegex;

var testCases = [
  { input: '\x1b', desc: 'ESC key', shouldBuffer: false, reason: 'Standalone ESC key' },
  { input: '\x1b[A', desc: 'Arrow Up', shouldBuffer: false, reason: 'Complete arrow key sequence' },
  { input: '\x1b[B', desc: 'Arrow Down', shouldBuffer: false, reason: 'Complete arrow key sequence' },
  { input: '\x1b[C', desc: 'Arrow Right', shouldBuffer: false, reason: 'Complete arrow key sequence' },
  { input: '\x1b[D', desc: 'Arrow Left', shouldBuffer: false, reason: 'Complete arrow key sequence' },
  { input: 'a', desc: 'Letter "a"', shouldBuffer: false, reason: 'Regular character' },
  { input: '\x1b[200~', desc: 'Paste start marker (complete)', shouldBuffer: false, reason: 'Complete paste marker' },
  { input: '\x1b[201~', desc: 'Paste end marker (complete)', shouldBuffer: false, reason: 'Complete paste marker' },
  { input: 'hello\x1b', desc: 'Text ending with ESC', shouldBuffer: false, reason: 'ESC at end (not partial paste)' },
  { input: 'hello\x1b[', desc: 'Text ending with ESC[', shouldBuffer: false, reason: 'ESC[ could be many sequences' },
  { input: 'hello\x1b[2', desc: 'Text ending with ESC[2 (ambiguous)', shouldBuffer: true, reason: 'Could be \\x1b[2~ (Insert) or \\x1b[200~ (Paste)' },
  { input: 'hello\x1b[20', desc: 'Text ending with ESC[20', shouldBuffer: true, reason: 'Likely partial paste marker' },
  { input: 'hello\x1b[200', desc: 'Text ending with ESC[200', shouldBuffer: true, reason: 'Definitely partial paste start' },
  { input: 'hello\x1b[201', desc: 'Text ending with ESC[201', shouldBuffer: true, reason: 'Definitely partial paste end' },
];

console.log('=== OLD REGEX (BUGGY) ===');
console.log('Pattern: ' + oldRegex + '\n');

testCases.forEach(function(testCase) {
  var match = oldRegex.exec(testCase.input);

  console.log('Input: "' + testCase.desc + '"');
  console.log('  Hex: ' + testCase.input.split('').map(function(c) {
    return c.charCodeAt(0).toString(16).padStart(2, '0');
  }).join(' '));
  console.log('  Expected: ' + (testCase.shouldBuffer ? 'Should buffer' : 'Should NOT buffer') + ' - ' + testCase.reason);

  if (match) {
    if (!testCase.shouldBuffer) {
      console.log('  ✗ MATCHED (stored as partial) - ⚠️  BUG!');
    } else {
      console.log('  ✓ MATCHED (stored as partial) - OK');
    }
  } else {
    if (testCase.shouldBuffer) {
      console.log('  ✗ No match - ⚠️  MISSING!');
    } else {
      console.log('  ✓ No match - OK');
    }
  }

  console.log('');
});

console.log('\n=== NEW REGEX (FIXED) ===');
console.log('Pattern: ' + newRegex + '\n');

var passCount = 0;
var failCount = 0;

testCases.forEach(function(testCase) {
  var match = newRegex.exec(testCase.input);

  console.log('Input: "' + testCase.desc + '"');
  console.log('  Hex: ' + testCase.input.split('').map(function(c) {
    return c.charCodeAt(0).toString(16).padStart(2, '0');
  }).join(' '));
  console.log('  Expected: ' + (testCase.shouldBuffer ? 'Should buffer' : 'Should NOT buffer') + ' - ' + testCase.reason);

  var passed = false;
  if (match) {
    if (testCase.shouldBuffer) {
      console.log('  ✓ MATCHED (stored as partial) - CORRECT!');
      passed = true;
    } else {
      console.log('  ✗ MATCHED (stored as partial) - ⚠️  BUG!');
    }
  } else {
    if (!testCase.shouldBuffer) {
      console.log('  ✓ No match (processed immediately) - CORRECT!');
      passed = true;
    } else {
      console.log('  ✗ No match - ⚠️  MISSING!');
    }
  }

  if (passed) {
    passCount++;
  } else {
    failCount++;
  }

  console.log('');
});

console.log('=== RESULTS ===');
console.log('Passed: ' + passCount + '/' + testCases.length);
console.log('Failed: ' + failCount + '/' + testCases.length);
console.log('');

console.log('\n=== PROBLEM ===');
console.log('The regex /(\x1b|\x1b\[|\x1b\[2|\x1b\[20|\x1b\[200)$/ matches ANY escape');
console.log('sequence that MIGHT be the start of \\x1b[200~ (paste start marker).');
console.log('');
console.log('This includes:');
console.log('  • \\x1b (ESC key)');
console.log('  • \\x1b[ (start of arrow keys and other sequences)');
console.log('');
console.log('When ESC is pressed:');
console.log('  1. First press: \\x1b is stored as _partialSequence (not processed)');
console.log('  2. Next press: Combined with previous \\x1b (both processed together)');
console.log('');
console.log('=== SOLUTION ===');
console.log('The regex needs to be more specific. It should only buffer sequences');
console.log('that are ACTUALLY the start of \\x1b[200~ or \\x1b[201~, not just any');
console.log('escape sequence.');
console.log('');
console.log('We need to distinguish between:');
console.log('  • \\x1b[200~ (paste start)  vs  \\x1b (ESC key)');
console.log('  • \\x1b[201~ (paste end)    vs  \\x1b[ (arrow keys, etc)');
console.log('');
console.log('Options:');
console.log('  1. Only buffer if followed by specific characters (2, 0)');
console.log('  2. Use a timeout to detect when \\x1b is standalone vs part of sequence');
console.log('  3. Check if next character after \\x1b[ is "2" before buffering');
