# trueblessed

#### If you'd like to request a feature, make a new issue

![trueblessed-stars](https://img.shields.io/github/stars/lootmancerstudios/trueblessed)
![trueblessed-forks](https://img.shields.io/github/forks/lootmancerstudios/trueblessed)
![trueblessed-license](https://img.shields.io/github/license/lootmancerstudios/trueblessed)
![trueblessed-issues](https://img.shields.io/github/issues/lootmancerstudios/trueblessed)

A curses-like library with a high level terminal interface API for node.js, featuring modern terminal capabilities and true 24-bit RGB color support.

![blessed](https://raw.githubusercontent.com/chjj/blessed/master/img/v0.1.0-3.gif)

Trueblessed builds upon the excellent work of blessed and its forks, adding modern terminal features including:
- **True 24-bit RGB color support** - Full truecolor rendering with `{#RRGGBB-fg}` and `{#RRGGBB-bg}` tags
- **Bracketed paste mode** - Detect and handle pasted content separately from typed input
- **TypeScript definitions** - Complete type safety for TypeScript projects
- **Modern terminal detection** - Auto-detection of truecolor support via COLORTERM and terminal capabilities

## Install

### From source

``` bash
git clone https://github.com/lootmancerstudios/trueblessed.git
cd trueblessed
npm install
npm run build
```

### Local development

``` bash
npm link
# Then in your project:
npm link trueblessed
```

## Example

This will render a box with line borders containing the text `'Hello world!'`,
perfectly centered horizontally and vertically.

**NOTE**: It is recommend you use either `smartCSR` or `fastCSR` as a
`trueblessed.screen` option. This will enable CSR when scrolling text in elements
or when manipulating lines.

``` js
const trueblessed = require('trueblessed');

// Create a screen object with truecolor support.
const screen = trueblessed.screen({
  smartCSR: true,
  truecolor: true  // Enable 24-bit RGB colors
});

screen.title = 'my window title';

// Create a box perfectly centered horizontally and vertically.
const box = trueblessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    content: 'Hello {bold}world{/bold}!',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'magenta',
        border: {
        fg: '#f0f0f0'
        },
        hover: {
        bg: 'green'
        }
    }
});

// Append our box to the screen.
screen.append(box);

// Add a png icon to the box
const icon = trueblessed.image({
    parent: box,
    top: 0,
    left: 0,
    type: 'overlay',
    width: 'shrink',
    height: 'shrink',
    file: __dirname + '/my-program-icon.png',
    search: false
});

// If our box is clicked, change the content.
box.on('click', (data) => {
    box.setContent('{center}Some different {red-fg}content{/red-fg}.{/center}');
    screen.render();
});

// If box is focused, handle `enter`/`return` and give us some more content.
box.key('enter', (ch, key) => {
    box.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
    box.setLine(1, 'bar');
    box.insertLine(1, 'foo');
    screen.render();
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    return process.exit(0);
});

// Focus our element.
box.focus();

// Render the screen.
screen.render();
```

## Bracketed Paste Mode

Trueblessed supports **bracketed paste mode**, which allows your application to distinguish between typed and pasted text. This enables security features, better UX, and special handling for pasted content.

### Why Use Bracketed Paste?

- **Security**: Prevent accidental execution of pasted commands
- **UX Enhancement**: Handle multiline paste differently (e.g., show preview, collapse to snippet)
- **Editor Features**: Disable auto-indent during paste, preserve formatting
- **Input Validation**: Different sanitization for pasted vs. typed content

### Enabling Paste Detection

```js
const screen = trueblessed.screen({
  smartCSR: true,
  bracketedPaste: true  // Enable paste detection
});

// Listen for paste events
screen.on('paste', (content) => {
  console.log('User pasted:', content);
  // content is the full pasted string (may include newlines, special chars, etc.)

  if (content.includes('\n')) {
    // Multiline paste - show preview dialog
    showPastePreview(content);
  } else {
    // Single line - insert directly
    input.value += content;
  }
});

// Keypress events still work for typed input
screen.on('keypress', (ch, key) => {
  // Only fires for TYPED input when bracketedPaste is enabled
  console.log('User typed:', ch);
});
```

### Behavior

When `bracketedPaste: true`:
- Paste markers (`\x1b[200~` and `\x1b[201~`) are detected
- Entire pasted content emits as a single `paste` event
- Individual `keypress` events are **not** fired for pasted characters
- `keypress` events **still fire** for typed characters

When `bracketedPaste: false` (default):
- Paste markers are stripped (backward compatible)
- Each pasted character fires an individual `keypress` event
- No indication that text was pasted vs. typed

### Security Features

Trueblessed includes built-in protection against paste-based attacks:

#### Size Limits

Configure maximum paste size to prevent memory exhaustion attacks:

```js
const screen = trueblessed.screen({
  bracketedPaste: true,
  maxPasteSize: 1024 * 1024  // 1MB limit (default: 10MB)
});

// Handle overflow events
screen.on('paste-overflow', (info) => {
  console.error('Paste rejected - too large:', info.attemptedSize, 'bytes');
  console.error('Maximum allowed:', info.maxSize, 'bytes');
  showErrorDialog('Pasted content exceeds size limit');
});
```

#### Timeout Protection

Prevent hanging on incomplete paste operations:

```js
const screen = trueblessed.screen({
  bracketedPaste: true,
  pasteTimeout: 10000  // 10 second timeout (default: 5000ms)
});

// Handle timeout events
screen.on('paste-timeout', (info) => {
  console.warn('Paste operation timed out after', info.elapsed, 'ms');
  console.warn('Partial content received:', info.buffer.length, 'bytes');
  showWarningDialog('Paste operation incomplete');
});
```

#### Error Boundaries

All event handlers are wrapped in try-catch blocks. Errors in your event handlers won't crash the library - they're silently caught to ensure reliability.

#### Security Defaults

- **Size limit**: 10MB (prevents memory exhaustion)
- **Timeout**: 5 seconds (prevents hanging)
- **Error isolation**: User handler errors are caught and ignored
- **Graceful degradation**: Legacy terminals fall back to keypress events

### Terminal Support

Bracketed paste mode is supported by most modern terminals:
- xterm
- iTerm2
- gnome-terminal
- konsole
- Terminal.app (macOS 10.11+)
- Windows Terminal
- Most VTE-based terminals

Legacy terminals without support will fall back to regular keypress events.

### Interactive Demo

Try the interactive paste demo:

```bash
node example/paste-test.js
```

This demo shows:
- Real-time event logging (keypress vs. paste)
- Multiline paste detection
- Character and line counts
- Visual distinction between typed and pasted input

### Advanced: Raw Paste Markers

For advanced use cases, you can access raw paste markers:

```js
const screen = trueblessed.screen({
  bracketedPaste: true,
  stripPasteMarkers: false  // Expose raw markers in keypress
});

screen.on('keypress', (ch, key) => {
  if (key.sequence === '\x1b[200~') {
    console.log('Paste start marker');
  } else if (key.sequence === '\x1b[201~') {
    console.log('Paste end marker');
  }
});
```

## Attribution

Trueblessed is a modern terminal interface library that continues the legacy of the blessed project.

**Project lineage:**
- **blessed** - Original high-level terminal interface library created by Christopher Jeffrey (2013-2015)
- **reblessed** - Fork by kenan238 (2021) adding various improvements and bug fixes
- **trueblessed** - Modern successor by LootMancerStudios (2025-present) focused on modern terminal features

This project builds upon the excellent foundation established by Christopher Jeffrey and the improvements contributed by kenan238. Trueblessed extends this work with modern terminal capabilities including true 24-bit RGB colors, bracketed paste mode security, streaming log updates, and comprehensive TypeScript support.

While trueblessed began as a fork of reblessed, it is now independently developed and maintained with a focus on bringing blessed's powerful TUI capabilities to modern terminal environments.

## Documentation

Go to the WIKI tab

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## New license

See `LICENSE.md`

## Original License

Copyright (c) 2013-2015, Christopher Jeffrey. (MIT License)

See LICENSE for more info.
