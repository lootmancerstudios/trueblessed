/**
 * Trueblessed TypeScript Example
 *
 * This example demonstrates how to use trueblessed with TypeScript,
 * showcasing the 24-bit RGB color support with full type safety.
 *
 * To run this example:
 *   1. Compile: npx tsc example/truecolor-typescript.ts --outDir example/build
 *   2. Run: node example/build/truecolor-typescript.js
 *
 * Or use ts-node:
 *   npx ts-node example/truecolor-typescript.ts
 */

import * as blessed from '../src/lib/reblessed';
import { Widgets } from '../src/lib/reblessed';

// Create a screen with truecolor support enabled
const screen = blessed.screen({
    smartCSR: true,
    truecolor: true,  // TypeScript knows this is a valid option
    title: 'Trueblessed TypeScript Demo - 24-bit RGB Colors'
});

// TypeScript knows about hasTruecolor property
console.log(`Terminal supports truecolor: ${screen.program.hasTruecolor}`);

// Create a title box with gradient colors
const titleBox = blessed.box({
    parent: screen,
    top: 0,
    left: 'center',
    width: 60,
    height: 3,
    content: '{center}{bold}Trueblessed - True 24-bit RGB Colors{/bold}{/center}',
    tags: true,
    style: {
        fg: '#FFFFFF',
        bg: '#6A5ACD'
    }
});

// Color palette demonstration
const paletteBox = blessed.box({
    parent: screen,
    top: 4,
    left: 2,
    width: 56,
    height: 12,
    label: ' RGB Color Palette ',
    border: {
        type: 'line',
        fg: '#00CED1'
    },
    content: [
        '{#FF6B6B-bg} {/} {#FF6B6B-fg}#FF6B6B{/} - Pastel Red',
        '{#4ECDC4-bg} {/} {#4ECDC4-fg}#4ECDC4{/} - Turquoise',
        '{#45B7D1-bg} {/} {#45B7D1-fg}#45B7D1{/} - Sky Blue',
        '{#FFA07A-bg} {/} {#FFA07A-fg}#FFA07A{/} - Light Salmon',
        '{#98D8C8-bg} {/} {#98D8C8-fg}#98D8C8{/} - Pearl Aqua',
        '{#F7DC6F-bg} {/} {#F7DC6F-fg}#F7DC6F{/} - Cream Yellow',
        '{#BB8FCE-bg} {/} {#BB8FCE-fg}#BB8FCE{/} - Lavender',
        '{#85C1E2-bg} {/} {#85C1E2-fg}#85C1E2{/} - Baby Blue',
        '',
        'Press {bold}q{/bold} or {bold}Esc{/bold} to quit'
    ].join('\n'),
    tags: true,
    padding: {
        left: 1,
        right: 1
    }
});

// Gradient demonstration
const gradientBox = blessed.box({
    parent: screen,
    top: 4,
    left: 60,
    width: 40,
    height: 12,
    label: ' Gradient Demo ',
    border: {
        type: 'line',
        fg: '#FF69B4'
    },
    tags: true,
    padding: {
        left: 1,
        right: 1
    }
});

// Generate a color gradient
function generateGradient(startColor: string, endColor: string, steps: number): string[] {
    const start = {
        r: parseInt(startColor.slice(1, 3), 16),
        g: parseInt(startColor.slice(3, 5), 16),
        b: parseInt(startColor.slice(5, 7), 16)
    };
    const end = {
        r: parseInt(endColor.slice(1, 3), 16),
        g: parseInt(endColor.slice(3, 5), 16),
        b: parseInt(endColor.slice(5, 7), 16)
    };

    const gradient: string[] = [];
    for (let i = 0; i < steps; i++) {
        const r = Math.round(start.r + (end.r - start.r) * i / (steps - 1));
        const g = Math.round(start.g + (end.g - start.g) * i / (steps - 1));
        const b = Math.round(start.b + (end.b - start.b) * i / (steps - 1));
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        gradient.push(hex);
    }
    return gradient;
}

// Create gradient visualization
const gradient = generateGradient('#FF1744', '#00E5FF', 8);
const gradientContent = gradient.map(color => `{${color}-bg}    {/} ${color}`).join('\n');
gradientBox.setContent(gradientContent);

// Info box showing TypeScript features
const infoBox = blessed.box({
    parent: screen,
    top: 17,
    left: 2,
    width: 98,
    height: 6,
    label: ' TypeScript Features ',
    border: {
        type: 'line',
        fg: '#32CD32'
    },
    content: [
        '{bold}✓{/bold} Full type safety with TypeScript definitions',
        '{bold}✓{/bold} Auto-completion for truecolor options and properties',
        '{bold}✓{/bold} Type-checked RGB color allocation',
        '{bold}✓{/bold} Intellisense for all blessed/trueblessed APIs'
    ].join('\n'),
    tags: true,
    padding: {
        left: 1,
        right: 1
    }
});

// Status bar
const statusBar = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ` Truecolor: ${screen.program.hasTruecolor ? 'ENABLED' : 'DISABLED'} | Terminal: ${screen.program.terminal || 'unknown'} | Press 'c' for color info`,
    style: {
        fg: '#FFFFFF',
        bg: '#34495E'
    }
});

// Handle 'c' key to show internal color allocation
screen.key('c', () => {
    const colorCount = Object.keys(screen._rgbColors).length;
    const nextId = screen._rgbColorId;

    const colorInfoBox = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: 60,
        height: 10,
        label: ' Color Allocation Info ',
        border: {
            type: 'line',
            fg: '#FFD700'
        },
        content: [
            `{bold}RGB Colors Allocated:{/bold} ${colorCount}`,
            `{bold}Next Color ID:{/bold} ${nextId}`,
            '',
            '{bold}Allocated Colors:{/bold}',
            ...Object.keys(screen._rgbColors).slice(0, 3).map(id => {
                const rgb = screen._rgbColors[parseInt(id)];
                return `  ID ${id}: R=${rgb.r} G=${rgb.g} B=${rgb.b}`;
            }),
            '',
            'Press any key to close'
        ].join('\n'),
        tags: true,
        padding: {
            left: 2,
            right: 2
        },
        style: {
            bg: '#2C3E50'
        }
    });

    screen.render();

    screen.onceKey(['escape', 'return', 'enter'], () => {
        colorInfoBox.detach();
        screen.render();
    });

    colorInfoBox.focus();
});

// Quit on Escape, q, or Control-C
screen.key(['escape', 'q', 'C-c'], () => {
    return process.exit(0);
});

// Focus and render
paletteBox.focus();
screen.render();
