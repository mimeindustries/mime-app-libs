Mime Device JS Library
======================

A collection of libraries used for building the browser based apps for MeArm and Mirobot
Installing
----------

    npm install

The old Grunt plugins declare conflicting peer dependencies, so `.npmrc` sets `legacy-peer-deps`.

Building the MeArm WiFi UI
--------------------------

    npm run build:mearm-wifi

This builds the browser UI served by the [MeArm WiFi firmware](https://github.com/mimeindustries/MeArm-Wifi)
into `dist/mearm-wifi/`:

- `web.h`: the main page, favicon, `base.css/js` and the built-in drag and drop UI (`BuiltinUI.css/js`), gzipped
  and written as PROGMEM byte arrays. It replaces `examples/MeArm-WiFi/web.h` and is compiled into the firmware.
- `data/`: the apps (Blockly, JavaScript, Python, Snap!), the code editor, `apps.json` and the Blockly media.
  It replaces `examples/MeArm-WiFi/data/` and goes onto the board with the LittleFS upload.

To write straight into a MeArm-Wifi checkout (existing files are overwritten, others are left alone):

    npm run build:mearm-wifi -- --out ../MeArm-Wifi/examples/MeArm-WiFi

Which source files go into each output file is listed at the top of `tools/build-mearm-wifi.js`. The parts
specific to MeArm WiFi are in `src/mearm-wifi/`: `index.html`, `favicon.ico`, `apps.json`, and in `apps/` the
start-up code for each app (the `init()` function that `index.html` calls once the app's script has loaded).
