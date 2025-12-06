# Trueblessed Changelog

## [Unreleased]

### Added

- **Bracketed Paste Mode Support**: Applications can now detect and handle pasted content separately from typed input
  - New `bracketedPaste` option for `screen` and `program` constructors
  - New `paste` event fires when content is pasted, providing the full pasted string
  - Keypress events are suppressed during paste when `bracketedPaste: true`
  - Typed input still fires keypress events normally
  - Optional `stripPasteMarkers` option for advanced use cases
  - **Production-ready security features**:
    - `maxPasteSize` option with configurable size limits (default: 10MB) to prevent memory exhaustion
    - `pasteTimeout` option with configurable timeouts (default: 5 seconds) to prevent hanging
    - `paste-overflow` event emitted when paste exceeds size limit
    - `paste-timeout` event emitted when paste operation times out
    - Error boundaries around all event emissions - user handler errors won't crash the library
  - Fully backward compatible - disabled by default
  - Terminal support: xterm, iTerm2, gnome-terminal, konsole, Terminal.app, Windows Terminal, and most modern terminals
  - See README.md "Bracketed Paste Mode" section for usage examples
  - Interactive demo: `node example/paste-test.js`
  - Comprehensive test suite: `node test/paste.js` (21 tests including security tests)

### Technical Details

- Modified `src/lib/keys.js`: Added paste marker detection (`\x1b[200~` and `\x1b[201~`)
  - Implemented size limit enforcement with byte-accurate tracking
  - Added timeout protection with automatic state reset
  - Wrapped all event emissions in try-catch blocks for error isolation
  - Fixed conditional logic for paste detection (production hardening)
- Modified `src/lib/program.js`: Enabled bracketed paste mode via `\x1b[?2004h` escape sequence
  - Added event forwarding for `paste-overflow` and `paste-timeout` events
  - Pass security options (`maxPasteSize`, `pasteTimeout`) to input stream
  - Cleanup event listeners on destroy
- Modified `src/lib/widgets/screen.js`: Forwarded paste events from program to screen
  - Pass security options through to Program constructor
- Added TypeScript definitions for all paste-related options and events
  - `bracketedPaste`, `stripPasteMarkers`, `maxPasteSize`, `pasteTimeout` options
  - `paste`, `paste-overflow`, `paste-timeout` event types with full type safety
  - `IPasteOverflowInfo` and `IPasteTimeoutInfo` interfaces

### Use Cases

- **Security**: Prevent accidental execution of pasted commands
- **UX Enhancement**: Handle multiline paste differently (show preview, collapse to snippet widget)
- **Editor Features**: Disable auto-indent during paste, preserve clipboard formatting
- **Input Validation**: Apply different sanitization rules for pasted vs. typed content

## Previous Versions

### v0.3.0 - True 24-bit RGB Color Support

- Added true 24-bit RGB (truecolor) support
- Auto-detection via COLORTERM environment variable
- Hex color tags: `{#RRGGBB-fg}` and `{#RRGGBB-bg}`
- TypeScript definitions included

### v0.2.2 - Reblessed

- Based on blessed with various improvements and bug fixes
- <https://github.com/kenan238/reblessed/compare/v0.1.85...v0.2.00>
