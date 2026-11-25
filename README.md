Mime Device JS Library
======================

A collection of libraries used for building the browser based apps for MeArm and Mirobot
Installing
----------

    npm install

The old Grunt plugins declare conflicting peer dependencies, so `.npmrc` sets `legacy-peer-deps`.

Building the robot UIs
----------------------

    npm run build:mearm-wifi
    npm run build:mirobot

These build the browser UI that each robot's WiFi firmware serves, into `dist/<target>/`:

| Target | Firmware | Sketch folder |
|--------|----------|---------------|
| `mearm-wifi` | [MeArm-Wifi](https://github.com/mimeindustries/MeArm-Wifi) | `examples/MeArm-WiFi` |
| `mirobot` | [mirobot-arduino](https://github.com/mimeindustries/mirobot-arduino) (v3) | `examples/firmware-v3` |

Each build has:

- `web.h`: the main page, favicon, `base.css/js` and the built-in drag and drop UI (`BuiltinUI.css/js`), gzipped
  and written as PROGMEM byte arrays. It replaces the sketch's `web.h` and is compiled into the firmware.
- `data/`: the apps (Blockly, JavaScript, Python, Snap!, and on Mirobot also Point & Click and Remote Control),
  the code editor, `apps.json` and media. It replaces the sketch's `data/` folder and is uploaded to the board's
  filesystem.

To write straight into a firmware checkout (existing files are overwritten, others are left alone):

    npm run build:mearm-wifi -- --out ../MeArm-Wifi/examples/MeArm-WiFi
    npm run build:mirobot -- --out ../mirobot-arduino/examples/firmware-v3

Which source files go into each output file is set at the top of `tools/build-ui.js`. The parts specific to each
robot are in `src/mearm-wifi/` and `src/mirobot/`: `index.html`, `apps.json`, and in `apps/` the start-up code
for each app (the `init()` function that `index.html` calls once the app's script has loaded).
