/**
 * keys.js - emit key presses
 * Copyright (c) 2010-2015, Joyent, Inc. and other contributors (MIT License)
 * https://github.com/chjj/blessed
 */

// Originally taken from the node.js tree:
//
// Copyright Joyent, Inc. and other Node contributors. All rights reserved.
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

var EventEmitter = require('events').EventEmitter;

// NOTE: node <=v0.8.x has no EventEmitter.listenerCount
// Oh god
function listenerCount(stream, event) {
  return EventEmitter.listenerCount
    ? EventEmitter.listenerCount(stream, event)
    : stream.listeners(event).length;
}

/**
 * accepts a readable Stream instance and makes it emit "keypress" events
 */

function emitKeypressEvents(stream, options) {
  // Handle options update if already initialized
  if (stream._keypressDecoder) {
    if (options) {
      // Update paste options if they were provided
      stream._pasteEnabled = options.bracketedPaste || false;
      stream._stripPasteMarkers = options.stripPasteMarkers !== false;
      stream._maxPasteSize = options.maxPasteSize || (10 * 1024 * 1024); // 10MB default
      stream._pasteTimeout = options.pasteTimeout || 5000; // 5 seconds default
    }
    return;
  }

  var StringDecoder = require('string_decoder').StringDecoder; // lazy load
  stream._keypressDecoder = new StringDecoder('utf8');

  // Initialize paste state tracking
  options = options || {};
  stream._pasteEnabled = options.bracketedPaste || false;
  stream._stripPasteMarkers = options.stripPasteMarkers !== false; // default true
  stream._maxPasteSize = options.maxPasteSize || (10 * 1024 * 1024); // 10MB default
  stream._pasteTimeout = options.pasteTimeout || 5000; // 5 seconds default
  stream._pasteMode = false;
  stream._pasteBuffer = '';
  stream._pasteBufferSize = 0;
  stream._pasteStartTime = 0;
  stream._pasteTimer = null;
  stream._partialSequence = ''; // For handling split escape sequences

  // Helper function to reset paste state
  stream._resetPasteState = function() {
    if (stream._pasteTimer) {
      clearTimeout(stream._pasteTimer);
      stream._pasteTimer = null;
    }
    stream._pasteMode = false;
    stream._pasteBuffer = '';
    stream._pasteBufferSize = 0;
    stream._pasteStartTime = 0;
  };

  function onData(b) {
    // Always process data if paste is enabled or if there are keypress listeners
    if (stream._pasteEnabled || listenerCount(stream, 'keypress') > 0 || listenerCount(stream, 'paste') > 0) {
      var r = stream._keypressDecoder.write(b);
      if (r) emitKeys(stream, r);
    } else {
      // Nobody's watching anyway
      stream.removeListener('data', onData);
      stream.on('newListener', onNewListener);
    }
  }

  function onNewListener(event) {
    if (event === 'keypress' || event === 'paste') {
      stream.on('data', onData);
      stream.removeListener('newListener', onNewListener);
    }
  }

  // If paste is enabled, always set up the data listener
  if (stream._pasteEnabled || listenerCount(stream, 'keypress') > 0 || listenerCount(stream, 'paste') > 0) {
    stream.on('data', onData);
  } else {
    stream.on('newListener', onNewListener);
  }
}
exports.emitKeypressEvents = emitKeypressEvents;

/*
  Some patterns seen in terminal key escape codes, derived from combos seen
  at http://www.midnight-commander.org/browser/lib/tty/key.c

  ESC letter
  ESC [ letter
  ESC [ modifier letter
  ESC [ 1 ; modifier letter
  ESC [ num char
  ESC [ num ; modifier char
  ESC O letter
  ESC O modifier letter
  ESC O 1 ; modifier letter
  ESC N letter
  ESC [ [ num ; modifier char
  ESC [ [ 1 ; modifier letter
  ESC ESC [ num char
  ESC ESC O letter

  - char is usually ~ but $ and ^ also happen with rxvt
  - modifier is 1 +
                (shift     * 1) +
                (left_alt  * 2) +
                (ctrl      * 4) +
                (right_alt * 8)
  - two leading ESCs apparently mean the same as one leading ESC
*/

// Regexes used for ansi escape code splitting
var metaKeyCodeReAnywhere = /(?:\x1b)([a-zA-Z0-9])/;
var metaKeyCodeRe = new RegExp('^' + metaKeyCodeReAnywhere.source + '$');
var functionKeyCodeReAnywhere = new RegExp('(?:\x1b+)(O|N|\\[|\\[\\[)(?:' + [
  '(\\d+)(?:;(\\d+))?([~^$])',
  '(?:M([@ #!a`])(.)(.))', // mouse
  '(?:1;)?(\\d+)?([a-zA-Z])'
].join('|') + ')');
var functionKeyCodeRe = new RegExp('^' + functionKeyCodeReAnywhere.source);
var escapeCodeReAnywhere = new RegExp([
  functionKeyCodeReAnywhere.source, metaKeyCodeReAnywhere.source, /\x1b./.source
].join('|'));

function emitKeys(stream, s) {
  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === undefined) {
      s[0] -= 128;
      s = '\x1b' + s.toString(stream.encoding || 'utf-8');
    } else {
      s = s.toString(stream.encoding || 'utf-8');
    }
  }

  if (isMouse(s))
    return;

  // Handle bracketed paste mode
  if (stream._pasteEnabled) {
    // DEBUG: Log input
    if (process.env.DEBUG_PASTE) {
      console.log('[PASTE DEBUG] Input s:', JSON.stringify(s), 'hex:', s.split('').map(c => c.charCodeAt(0).toString(16)).join(' '));
    }

    // Combine with any partial sequence from previous buffer
    if (stream._partialSequence) {
      if (process.env.DEBUG_PASTE) {
        console.log('[PASTE DEBUG] Restoring partial:', JSON.stringify(stream._partialSequence));
      }
      s = stream._partialSequence + s;
      stream._partialSequence = '';
    }

    // Check for partial paste marker at end of buffer
    // This handles the case where \x1b[200~ or \x1b[201~ is split across buffers
    // IMPORTANT: Only match sequences that are SPECIFICALLY the start of paste markers:
    //   \x1b[2    - could be \x1b[200~ or \x1b[201~
    //   \x1b[20   - could be \x1b[200~ or \x1b[201~
    //   \x1b[200  - partial paste start marker
    //   \x1b[201  - partial paste end marker
    // DO NOT match:
    //   \x1b      - standalone ESC key
    //   \x1b[     - could be arrow keys, F-keys, etc. (not paste-specific)
    var partialPasteMarker = /(\x1b\[20[01]?|\x1b\[2)$/.exec(s);
    if (partialPasteMarker) {
      if (process.env.DEBUG_PASTE) {
        console.log('[PASTE DEBUG] Detected partial marker:', JSON.stringify(partialPasteMarker[1]), '- STORING FOR NEXT INPUT');
      }
      stream._partialSequence = partialPasteMarker[1];
      s = s.slice(0, partialPasteMarker.index);
      if (process.env.DEBUG_PASTE) {
        console.log('[PASTE DEBUG] Remaining s after removing partial:', JSON.stringify(s));
      }
    }

    // Detect paste start marker: \x1b[200~
    var pasteStartIndex = s.indexOf('\x1b[200~');
    if (pasteStartIndex !== -1) {
      // Process any data before the paste marker
      if (pasteStartIndex > 0) {
        var before = s.slice(0, pasteStartIndex);
        emitKeysNoPaste(stream, before);
      }

      // Enter paste mode
      stream._pasteMode = true;
      stream._pasteBuffer = '';
      stream._pasteBufferSize = 0;
      stream._pasteStartTime = Date.now();

      // Start timeout timer to prevent hanging on incomplete paste
      stream._pasteTimer = setTimeout(function() {
        if (stream._pasteMode) {
          // Timeout - emit warning and reset
          try {
            stream.emit('paste-timeout', {
              buffer: stream._pasteBuffer,
              size: stream._pasteBufferSize,
              elapsed: Date.now() - stream._pasteStartTime
            });
          } catch (err) {
            // Silently ignore errors in user event handlers
          }
          stream._resetPasteState();
        }
      }, stream._pasteTimeout);

      // Remove the marker and continue with remaining data
      s = s.slice(pasteStartIndex + 6); // 6 = length of '\x1b[200~'
    }

    // Detect paste end marker: \x1b[201~
    var pasteEndIndex = s.indexOf('\x1b[201~');
    if (pasteEndIndex !== -1) {
      if (stream._pasteMode) {
        // Add content before end marker to buffer
        var chunk = s.slice(0, pasteEndIndex);
        var chunkSize = Buffer.byteLength(chunk, 'utf8');

        // Check if adding this chunk would exceed size limit
        if (stream._pasteBufferSize + chunkSize > stream._maxPasteSize) {
          // Size limit exceeded - emit error and reset
          try {
            stream.emit('paste-overflow', {
              currentSize: stream._pasteBufferSize,
              attemptedSize: stream._pasteBufferSize + chunkSize,
              maxSize: stream._maxPasteSize
            });
          } catch (err) {
            // Silently ignore errors in user event handlers
          }
          stream._resetPasteState();

          // Process remaining data after paste marker
          var after = s.slice(pasteEndIndex + 6);
          if (after) {
            emitKeysNoPaste(stream, after);
          }
          return;
        }

        stream._pasteBuffer += chunk;
        stream._pasteBufferSize += chunkSize;

        // Clear timeout timer
        if (stream._pasteTimer) {
          clearTimeout(stream._pasteTimer);
          stream._pasteTimer = null;
        }

        // Emit paste event with error boundary
        if (stream._pasteEnabled) {
          try {
            stream.emit('paste', stream._pasteBuffer);
          } catch (err) {
            // Silently ignore errors in user event handlers
            // The paste still completes successfully
          }
        }

        // Exit paste mode and reset state
        stream._pasteMode = false;
        stream._pasteBuffer = '';
        stream._pasteBufferSize = 0;
        stream._pasteStartTime = 0;

        // Process any remaining data after paste marker
        var after = s.slice(pasteEndIndex + 6); // 6 = length of '\x1b[201~'
        if (after) {
          emitKeysNoPaste(stream, after);
        }
        return;
      } else {
        // End marker without start - just strip it if configured
        if (stream._stripPasteMarkers) {
          var beforeEnd = s.slice(0, pasteEndIndex);
          var afterEnd = s.slice(pasteEndIndex + 6);
          s = beforeEnd + afterEnd;
        }
      }
    }

    // If we're in paste mode, buffer the content
    if (stream._pasteMode) {
      var chunkSize = Buffer.byteLength(s, 'utf8');

      // Check if adding this chunk would exceed size limit
      if (stream._pasteBufferSize + chunkSize > stream._maxPasteSize) {
        // Size limit exceeded - emit error and reset
        try {
          stream.emit('paste-overflow', {
            currentSize: stream._pasteBufferSize,
            attemptedSize: stream._pasteBufferSize + chunkSize,
            maxSize: stream._maxPasteSize
          });
        } catch (err) {
          // Silently ignore errors in user event handlers
        }
        stream._resetPasteState();
        return;
      }

      stream._pasteBuffer += s;
      stream._pasteBufferSize += chunkSize;

      // Don't emit keypress events during paste when paste is enabled
      if (stream._pasteEnabled) {
        return;
      }
      // If paste is not enabled but we're in paste mode (marker detected),
      // fall through to normal key processing
    }
  }

  emitKeysNoPaste(stream, s);
}

// Helper function to emit keypresses without paste handling
// This is the original emitKeys logic extracted to avoid recursion issues
function emitKeysNoPaste(stream, s) {
  var buffer = [];
  var match;
  while (match = escapeCodeReAnywhere.exec(s)) {
    buffer = buffer.concat(s.slice(0, match.index).split(''));
    buffer.push(match[0]);
    s = s.slice(match.index + match[0].length);
  }
  buffer = buffer.concat(s.split(''));

  buffer.forEach(function(s) {
    var ch,
        key = {
          sequence: s,
          name: undefined,
          ctrl: false,
          meta: false,
          shift: false
        },
        parts;

    if (s === '\r') {
      // carriage return
      key.name = 'return';

    } else if (s === '\n') {
      // enter, should have been called linefeed
      key.name = 'enter';
      // linefeed
      // key.name = 'linefeed';

    } else if (s === '\t') {
      // tab
      key.name = 'tab';

    } else if (s === '\b' || s === '\x7f' ||
               s === '\x1b\x7f' || s === '\x1b\b') {
      // backspace or ctrl+h
      key.name = 'backspace';
      key.meta = (s.charAt(0) === '\x1b');

    } else if (s === '\x1b' || s === '\x1b\x1b') {
      // escape key
      key.name = 'escape';
      key.meta = (s.length === 2);

    } else if (s === ' ' || s === '\x1b ') {
      key.name = 'space';
      key.meta = (s.length === 2);

    } else if (s.length === 1 && s <= '\x1a') {
      // ctrl+letter
      key.name = String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
      key.ctrl = true;

    } else if (s.length === 1 && s >= 'a' && s <= 'z') {
      // lowercase letter
      key.name = s;

    } else if (s.length === 1 && s >= 'A' && s <= 'Z') {
      // shift+letter
      key.name = s.toLowerCase();
      key.shift = true;

    } else if (parts = metaKeyCodeRe.exec(s)) {
      // meta+character key
      key.name = parts[1].toLowerCase();
      key.meta = true;
      key.shift = /^[A-Z]$/.test(parts[1]);

    } else if (parts = functionKeyCodeRe.exec(s)) {
      // ansi escape sequence

      // reassemble the key code leaving out leading \x1b's,
      // the modifier key bitflag and any meaningless "1;" sequence
      var code = (parts[1] || '') + (parts[2] || '') +
                 (parts[4] || '') + (parts[9] || ''),
          modifier = (parts[3] || parts[8] || 1) - 1;

      // Parse the key modifier
      key.ctrl = !!(modifier & 4);
      key.meta = !!(modifier & 10);
      key.shift = !!(modifier & 1);
      key.code = code;

      // Parse the key itself
      switch (code) {
        /* xterm/gnome ESC O letter */
        case 'OP': key.name = 'f1'; break;
        case 'OQ': key.name = 'f2'; break;
        case 'OR': key.name = 'f3'; break;
        case 'OS': key.name = 'f4'; break;

        /* xterm/rxvt ESC [ number ~ */
        case '[11~': key.name = 'f1'; break;
        case '[12~': key.name = 'f2'; break;
        case '[13~': key.name = 'f3'; break;
        case '[14~': key.name = 'f4'; break;

        /* from Cygwin and used in libuv */
        case '[[A': key.name = 'f1'; break;
        case '[[B': key.name = 'f2'; break;
        case '[[C': key.name = 'f3'; break;
        case '[[D': key.name = 'f4'; break;
        case '[[E': key.name = 'f5'; break;

        /* common */
        case '[15~': key.name = 'f5'; break;
        case '[17~': key.name = 'f6'; break;
        case '[18~': key.name = 'f7'; break;
        case '[19~': key.name = 'f8'; break;
        case '[20~': key.name = 'f9'; break;
        case '[21~': key.name = 'f10'; break;
        case '[23~': key.name = 'f11'; break;
        case '[24~': key.name = 'f12'; break;

        /* xterm ESC [ letter */
        case '[A': key.name = 'up'; break;
        case '[B': key.name = 'down'; break;
        case '[C': key.name = 'right'; break;
        case '[D': key.name = 'left'; break;
        case '[E': key.name = 'clear'; break;
        case '[F': key.name = 'end'; break;
        case '[H': key.name = 'home'; break;

        /* xterm/gnome ESC O letter */
        case 'OA': key.name = 'up'; break;
        case 'OB': key.name = 'down'; break;
        case 'OC': key.name = 'right'; break;
        case 'OD': key.name = 'left'; break;
        case 'OE': key.name = 'clear'; break;
        case 'OF': key.name = 'end'; break;
        case 'OH': key.name = 'home'; break;

        /* xterm/rxvt ESC [ number ~ */
        case '[1~': key.name = 'home'; break;
        case '[2~': key.name = 'insert'; break;
        case '[3~': key.name = 'delete'; break;
        case '[4~': key.name = 'end'; break;
        case '[5~': key.name = 'pageup'; break;
        case '[6~': key.name = 'pagedown'; break;

        /* putty */
        case '[[5~': key.name = 'pageup'; break;
        case '[[6~': key.name = 'pagedown'; break;

        /* rxvt */
        case '[7~': key.name = 'home'; break;
        case '[8~': key.name = 'end'; break;

        /* rxvt keys with modifiers */
        case '[a': key.name = 'up'; key.shift = true; break;
        case '[b': key.name = 'down'; key.shift = true; break;
        case '[c': key.name = 'right'; key.shift = true; break;
        case '[d': key.name = 'left'; key.shift = true; break;
        case '[e': key.name = 'clear'; key.shift = true; break;

        case '[2$': key.name = 'insert'; key.shift = true; break;
        case '[3$': key.name = 'delete'; key.shift = true; break;
        case '[5$': key.name = 'pageup'; key.shift = true; break;
        case '[6$': key.name = 'pagedown'; key.shift = true; break;
        case '[7$': key.name = 'home'; key.shift = true; break;
        case '[8$': key.name = 'end'; key.shift = true; break;

        case 'Oa': key.name = 'up'; key.ctrl = true; break;
        case 'Ob': key.name = 'down'; key.ctrl = true; break;
        case 'Oc': key.name = 'right'; key.ctrl = true; break;
        case 'Od': key.name = 'left'; key.ctrl = true; break;
        case 'Oe': key.name = 'clear'; key.ctrl = true; break;

        case '[2^': key.name = 'insert'; key.ctrl = true; break;
        case '[3^': key.name = 'delete'; key.ctrl = true; break;
        case '[5^': key.name = 'pageup'; key.ctrl = true; break;
        case '[6^': key.name = 'pagedown'; key.ctrl = true; break;
        case '[7^': key.name = 'home'; key.ctrl = true; break;
        case '[8^': key.name = 'end'; key.ctrl = true; break;

        /* misc. */
        case '[Z': key.name = 'tab'; key.shift = true; break;
        default: key.name = 'undefined'; break;

      }
    }

    // Don't emit a key if no name was found
    if (key.name === undefined)
      key = undefined;

    if (s.length === 1)
      ch = s;

    if (key || ch) {
      stream.emit('keypress', ch, key);
      // if (key && key.name === 'return') {
      //   var nkey = {};
      //   Object.keys(key).forEach(function(k) {
      //     nkey[k] = key[k];
      //   });
      //   nkey.name = 'enter';
      //   stream.emit('keypress', ch, nkey);
      // }
    }
  });
}

function isMouse(s) {
  var regex1 = /\x1b\[M/;
  var regex2 = /\x1b\[M([\x00\u0020-\uffff]{3})/;
  var regex3 = /\x1b\[(\d+;\d+;\d+)M/;
  var regex4 = /\x1b\[<(\d+;\d+;\d+)([mM])/;
  var regex5 = /\x1b\[<(\d+;\d+;\d+;\d+)&w/;
  var regex6 = /\x1b\[24([0135])~\[(\d+),(\d+)\]\r/;
  var regex7 = /\x1b\[(O|I)/;
  
  return regex1.test(s)
      || regex2.test(s)
      || regex3.test(s)
      || regex4.test(s)
      || regex5.test(s)
      || regex6.test(s)
      || regex7.test(s);
}
