/**
 * log.js - log element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var util = require('util');

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = require('./node');
var ScrollableText = require('./scrollabletext');

/**
 * Log
 */

function Log(options) {
  var self = this;

  if (!(this instanceof Node)) {
    return new Log(options);
  }

  options = options || {};

  ScrollableText.call(this, options);

  this.scrollback = options.scrollback != null
    ? options.scrollback
    : Infinity;
  this.scrollOnInput = options.scrollOnInput;

  this.on('set content', function() {
    if (!self._userScrolled || self.scrollOnInput) {
      nextTick(function() {
        self.setScrollPerc(100);
        self._userScrolled = false;
        self.screen.render();
      });
    }
  });
}

Log.prototype.__proto__ = ScrollableText.prototype;

Log.prototype.type = 'log';

Log.prototype.log =
Log.prototype.add = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === 'object') {
    args[0] = util.inspect(args[0], true, 20, true);
  }
  var text = util.format.apply(util, args);
  this.emit('log', text);
  var ret = this.pushLine(text);
  if (this._clines.fake.length > this.scrollback) {
    this.shiftLine(Math.max(this._clines.fake.length - this.scrollback, this.scrollback / 3) | 0);
  }
  return ret;
};

Log.prototype._scroll = Log.prototype.scroll;
Log.prototype.scroll = function(offset, always) {
  if (offset === 0) return this._scroll(offset, always);
  this._userScrolled = true;
  var ret = this._scroll(offset, always);
  if (this.getScrollPerc() === 100) {
    this._userScrolled = false;
  }
  return ret;
};

/**
 * Update the current (last) line in-place
 * Useful for streaming output where partial lines update progressively
 *
 * Example:
 *   logger.log('Starting download...');
 *   logger.updateCurrentLine('Downloading: 50%');  // Replaces "Starting download..."
 *   logger.updateCurrentLine('Downloading: 100%'); // Replaces "Downloading: 50%"
 *   logger.log('Done!');                           // Commits "Downloading: 100%", adds new line
 *
 * @param {string} text - The new text for the current line
 * @returns {*} - Result from setLine
 */
Log.prototype.updateCurrentLine = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === 'object') {
    args[0] = util.inspect(args[0], true, 20, true);
  }
  var text = util.format.apply(util, args);

  // If no lines exist, create the first one
  if (!this._clines || !this._clines.fake || this._clines.fake.length === 0) {
    return this.pushLine(text);
  }

  // Update the last line
  var lastIndex = this._clines.fake.length - 1;
  this.emit('update line', lastIndex, text);
  return this.setLine(lastIndex, text);
};

/**
 * Delete the last line from the log
 * Useful for removing placeholder/working lines
 *
 * @param {number} n - Number of lines to delete (default: 1)
 * @returns {*} - Result from popLine
 */
Log.prototype.deleteLastLine = function(n) {
  n = n || 1;
  if (!this._clines || !this._clines.fake || this._clines.fake.length === 0) {
    return;
  }
  this.emit('delete line', this._clines.fake.length - 1, n);
  return this.popLine(n);
};

/**
 * Replace the last line with new text
 * Alias for updateCurrentLine for semantic clarity
 *
 * @param {string} text - The new text to replace the last line
 * @returns {*} - Result from updateCurrentLine
 */
Log.prototype.replaceLastLine = function() {
  return this.updateCurrentLine.apply(this, arguments);
};

/**
 * Expose
 */

module.exports = Log;
