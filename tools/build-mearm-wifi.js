#!/usr/bin/env node
// Builds the browser UI for the MeArm WiFi firmware (https://github.com/mimeindustries/MeArm-Wifi).
//
// Output (default dist/mearm-wifi/, or the folder given with --out):
//   web.h   the main page, favicon, base.css/js and BuiltinUI.css/js as PROGMEM byte arrays, compiled
//           into the firmware. Replaces examples/MeArm-WiFi/web.h in the MeArm-Wifi repo.
//   data/   the apps served from the board's LittleFS filesystem under /a/. Replaces
//           examples/MeArm-WiFi/data/ and is uploaded with "Upload LittleFS to Pico/ESP8266/ESP32".
//
// Usage:
//   npm run build:mearm-wifi
//   npm run build:mearm-wifi -- --out ../MeArm-Wifi/examples/MeArm-WiFi

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { minify } = require('terser');
const sass = require('sass');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// ---------------------------------------------------------------------------------------------------------------
// What goes where. Each JS bundle is the listed files joined in order, so later files can use globals from
// earlier ones (and from base.js, which every page loads first).

// Files compiled into the firmware via web.h. Served by the board's web server at these paths.
const FIRMWARE_FILES = [
  { name: '/index.html', mime: 'text/html', html: 'mearm-wifi/index.html' },
  { name: '/favicon.ico', mime: 'image/x-icon', copy: 'mearm-wifi/favicon.ico' },
  { name: '/base.css.gz', mime: 'text/css', scss: [
    'app-framework/nouislider.scss',
    'app-framework/main.scss'
  ]},
  { name: '/base.js.gz', mime: 'application/javascript', js: [
    'general/polyfills.min.js',
    'app-framework/l10n.js',
    'app-framework/en.js',
    'general/base.js',
    'device-libs/mimedevice.js',
    'device-libs/mearm.js',
    'app-framework/menus/nanomodal.min.js',
    'app-framework/menus/MainMenu.js',
    'app-framework/menus/FullscreenMenu.js',
    'app-framework/menus/SaveMenu.js',
    'app-framework/menus/ConfigMenu.js',
    'app-framework/menus/ConnMenu.js',
    'app-framework/menus/AppsMenu.js',
    'app-framework/FileSaver.min.js',
    'app-framework/persist.js',
    'app-framework/mime-conn.js'
  ]},
  { name: '/BuiltinUI.css.gz', mime: 'text/css', scss: ['builtin-ui/BuiltinUI.scss'] },
  { name: '/BuiltinUI.js.gz', mime: 'application/javascript', js: [
    'builtin-ui/DraggableList.js',
    'builtin-ui/BuiltinUI.js',
    'mearm-wifi/apps/builtin.js'
  ]}
];

// Files for the LittleFS image (the sketch's data/ folder). Served at /a/<name> without the .gz.
const DATA_FILES = [
  { name: 'apps.json', copy: 'mearm-wifi/apps.json' },

  // Apps listed in apps.json, loaded by index.html as /a/<id>.js
  { name: 'blockly.js.gz', js: [
    'blockly/blockly_compressed.js',
    'blockly/blocks_compressed.js',
    'blockly/javascript_compressed.js',
    'blockly/msg/js/en.js',
    'blockly/mearm-blockly.js',
    'blockly/mearm-blocks.js',
    'mearm-wifi/apps/blockly.js'
  ]},
  { name: 'javascript.js.gz', js: ['mearm-wifi/apps/javascript.js'] },
  { name: 'python.js.gz', js: [
    'python/skulpt/skulpt.min.js',
    'python/skulpt/skulpt-stdlib.js',
    'mearm-wifi/apps/python.js'
  ]},
  { name: 'snap.js.gz', js: [
    'snap/morphic.js',
    'snap/locale.js',
    'snap/widgets.js',
    'snap/blocks.js',
    'snap/threads.js',
    'snap/objects-mearm.js',
    'snap/gui.js',
    'snap/paint.js',
    'snap/lists.js',
    'snap/byob.js',
    'snap/xml.js',
    'snap/store.js',
    'snap/cloud.js',
    'snap/sha512.js',
    'snap/mearm-snap.js',
    'mearm-wifi/apps/snap.js'
  ]},

  // Shared by the JavaScript and Python apps
  { name: 'editor.js.gz', js: [
    'editor/ace-src-min-noconflict/ace.js',
    'editor/ace-src-min-noconflict/ext-error_marker.js',
    'editor/ace-src-min-noconflict/theme-xcode.js',
    'editor/editor.js'
  ]},
  { name: 'editor.css.gz', scss: ['editor/editor.scss'] },
  { name: 'js-mode.js.gz', js: ['editor/ace-src-min-noconflict/mode-javascript.js'] },
  { name: 'worker-javascript.js.gz', js: ['editor/ace-src-min-noconflict/worker-javascript.js'] },
  { name: 'py-mode.js.gz', js: ['editor/ace-src-min-noconflict/mode-python.js'] },

  // Loaded by the Snap! app
  { name: 'remote.css.gz', scss: ['remote/main.scss'] },
  { name: 'snap/snap_logo_sm.png', copy: 'snap/assets/snap_logo_sm.png' },
  { name: 'snap/click.wav', copy: 'snap/assets/click.wav' },

  // Blockly media
  ...['sprites.png', 'click.mp3', 'delete.mp3', 'disconnect.wav', 'handopen.cur', 'handclosed.cur', 'handdelete.cur']
    .map((f) => ({ name: 'bm/' + f, copy: 'blockly/media/' + f }))
];

// Files that are already minified are joined as they are.
const PREMINIFIED = /(\.min\.js|_compressed\.js)$|ace-src-min-noconflict\//;

const TERSER_OPTIONS = {
  // Each file is a plain script whose top-level names are shared with the other files, so they must not be
  // renamed. keep_fnames/keep_classnames because Snap! and the device libs look things up by function name.
  compress: { passes: 1 },
  mangle: true,
  keep_fnames: true,
  keep_classnames: true,
  format: { comments: false }
};

// ---------------------------------------------------------------------------------------------------------------

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const customOut = outIndex !== -1;
if (customOut && !args[outIndex + 1]) {
  console.error('--out needs a folder');
  process.exit(1);
}
const OUT = customOut ? path.resolve(args[outIndex + 1]) : path.join(ROOT, 'dist', 'mearm-wifi');

const srcPath = (rel) => path.join(SRC, rel);
const read = (rel) => fs.readFileSync(srcPath(rel));

async function buildJs(files) {
  const parts = [];
  for (const rel of files) {
    const code = read(rel).toString('utf8');
    if (PREMINIFIED.test(rel)) {
      parts.push(code);
      continue;
    }
    try {
      const result = await minify({ [rel]: code }, TERSER_OPTIONS);
      parts.push(result.code);
    } catch (e) {
      throw new Error('Minifying ' + rel + ' failed: ' + e.message + (e.line ? ' (line ' + e.line + ')' : ''));
    }
  }
  // The semicolon guards against a file that doesn't end in one, and the newline before it against a file that
  // ends in a line comment
  return Buffer.from(parts.join('\n;\n') + '\n', 'utf8');
}

function buildCss(files) {
  const css = files.map((rel) => sass.compile(srcPath(rel), {
    style: 'compressed',
    loadPaths: [path.dirname(srcPath(rel))],
    silenceDeprecations: ['import', 'global-builtin', 'slash-div'],
    quietDeps: true
  }).css);
  return Buffer.from(css.join('\n'), 'utf8');
}

function buildHtml(rel) {
  // Strip the indentation between tags. The inline script is left as written.
  const html = read(rel).toString('utf8').replace(/>\s*\n\s*</g, '><');
  return Buffer.from(html, 'utf8');
}

async function build(entry) {
  let content;
  if (entry.js) content = await buildJs(entry.js);
  else if (entry.scss) content = buildCss(entry.scss);
  else if (entry.html) content = buildHtml(entry.html);
  else content = read(entry.copy);

  if (entry.name.endsWith('.gz')) {
    content = zlib.gzipSync(content, { level: 9 });
  }
  return content;
}

// Same layout as the web.h shipped in MeArm-Wifi, which the firmware includes and serves from webFiles[].
function webHeader(files) {
  const varName = (name) => name.replace(/^\//, '').replace(/[^A-Za-z0-9_]/g, '_');
  let out = '#ifdef ESP8266\n\n#include <lib/webFiles.h>\n\n';
  for (const f of files) {
    const bytes = Array.from(f.content, (b) => '0x' + b.toString(16)).join(',');
    out += 'const uint8_t ' + varName(f.name) + '[] PROGMEM = { ' + bytes + ' };\n';
  }
  out += 't_webfiles webFiles[] = {\n';
  out += files.map((f) => '  {.filename = "' + f.name + '", .mime = "' + f.mime + '", .len = ' + f.content.length +
    ', .content = &' + varName(f.name) + '[0]}').join(',\n');
  out += '};\nuint8_t webFileCount = ' + files.length + ';\n\n#endif\n';
  return out;
}

const kb = (n) => (n / 1024).toFixed(1).padStart(8) + ' KB';

async function main() {
  if (!customOut) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });

  console.log('Firmware files (web.h):');
  const firmware = [];
  for (const entry of FIRMWARE_FILES) {
    const content = await build(entry);
    firmware.push({ name: entry.name, mime: entry.mime, content });
    console.log(kb(content.length) + '  ' + entry.name);
  }
  fs.writeFileSync(path.join(OUT, 'web.h'), webHeader(firmware));
  const firmwareTotal = firmware.reduce((n, f) => n + f.content.length, 0);
  console.log(kb(firmwareTotal) + '  total\n');

  console.log('Filesystem files (data/):');
  let dataTotal = 0;
  for (const entry of DATA_FILES) {
    const content = await build(entry);
    const dest = path.join(OUT, 'data', entry.name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
    dataTotal += content.length;
    console.log(kb(content.length) + '  ' + entry.name);
  }
  console.log(kb(dataTotal) + '  total\n');

  console.log('Written to ' + path.relative(process.cwd(), OUT) + '/');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
