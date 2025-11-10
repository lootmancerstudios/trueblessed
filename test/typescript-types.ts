/**
 * TypeScript Type Validation Test for Trueblessed
 *
 * This file tests that all trueblessed-specific TypeScript definitions
 * are correctly typed and provide proper type safety.
 *
 * Run with: npx tsc --noEmit test/typescript-types.ts
 */

import * as blessed from '../src/lib/reblessed';

// Test 1: IBlessedProgramOptions.truecolor
console.log('Test 1: truecolor option in screen creation');
const screenWithTruecolor = blessed.screen({
    smartCSR: true,
    truecolor: true  // Should have type completion and accept boolean
});

const screenWithoutTruecolor = blessed.screen({
    smartCSR: true,
    truecolor: false
});

const screenAutoDetect = blessed.screen({
    smartCSR: true,
    truecolor: undefined
});

const screenDefault = blessed.screen({
    smartCSR: true
    // truecolor is optional
});

// Test 2: BlessedProgram.hasTruecolor
console.log('Test 2: hasTruecolor property');
const hasTruecolor: boolean = screenWithTruecolor.program.hasTruecolor;
console.log(`Terminal supports truecolor: ${hasTruecolor}`);

// Test 3: Screen._rgbColors
console.log('Test 3: _rgbColors property');
const rgbColors: { [id: number]: { r: number; g: number; b: number } } =
    screenWithTruecolor._rgbColors;

// Should be able to access color by ID
if (rgbColors[256]) {
    const color = rgbColors[256];
    console.log(`Color 256: R=${color.r}, G=${color.g}, B=${color.b}`);
}

// Test 4: Screen._rgbColorId
console.log('Test 4: _rgbColorId property');
const colorId: number = screenWithTruecolor._rgbColorId;
console.log(`Next color ID: ${colorId}`);

// Test 5: Screen._allocRgbColor method
console.log('Test 5: _allocRgbColor method');
const id1: number = screenWithTruecolor._allocRgbColor(255, 87, 51);
const id2: number = screenWithTruecolor._allocRgbColor(255, 87, 51); // Should reuse
const id3: number = screenWithTruecolor._allocRgbColor(100, 200, 150); // New color

console.log(`Allocated color IDs: ${id1}, ${id2}, ${id3}`);
console.log(`ID1 === ID2: ${id1 === id2} (should be true - reused)`);
console.log(`ID1 !== ID3: ${id1 !== id3} (should be true - different color)`);

// Test 6: Hex color tags in content (runtime feature, type-safe string)
console.log('Test 6: Hex color tags in content');
const box = blessed.box({
    parent: screenWithTruecolor,
    content: '{#FF5733-fg}True 24-bit color!{/}',
    top: 'center',
    left: 'center',
    width: 'shrink',
    height: 'shrink',
    tags: true
});

// Test 7: RGB color in style (type-safe)
const boxWithRgbStyle = blessed.box({
    parent: screenWithTruecolor,
    content: 'Styled box',
    top: 0,
    left: 0,
    width: 20,
    height: 5,
    style: {
        fg: '#FF5733',  // Should accept hex string
        bg: '#3498DB'
    }
});

// Test 8: Type checking - these should cause errors if uncommented
// screenWithTruecolor.program.hasTruecolor = false; // Error: readonly property
// screenWithTruecolor._allocRgbColor('255', 87, 51); // Error: expects number
// screenWithTruecolor._allocRgbColor(255, 87); // Error: missing parameter

// Test 9: Access program properties through screen
console.log('Test 9: Program properties');
const program = screenWithTruecolor.program;
const isiTerm2: boolean = program.isiTerm2;
const isVTE: boolean = program.isVTE;
console.log(`iTerm2: ${isiTerm2}, VTE: ${isVTE}`);

// Test 10: Full example with truecolor
console.log('Test 10: Full truecolor example');
const demoScreen = blessed.screen({
    smartCSR: true,
    truecolor: true,
    title: 'Trueblessed TypeScript Demo'
});

demoScreen.title = 'Updated Title';

const demoBox = blessed.box({
    parent: demoScreen,
    top: 'center',
    left: 'center',
    width: 50,
    height: 10,
    content: [
        '{#FF6B6B-fg}Red text{/}',
        '{#4ECDC4-fg}Cyan text{/}',
        '{#45B7D1-fg}Blue text{/}',
        '{#FFA07A-fg}Orange text{/}',
        '{#98D8C8-fg}Green text{/}'
    ].join('\n'),
    tags: true,
    border: {
        type: 'line',
        fg: '#95E1D3'
    },
    style: {
        bg: '#2C3E50'
    }
});

// Quit on Escape, q, or Control-C
demoScreen.key(['escape', 'q', 'C-c'], () => {
    return process.exit(0);
});

demoBox.focus();
demoScreen.render();

console.log('✓ All TypeScript type checks passed!');
console.log('✓ Trueblessed types are working correctly');
