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
