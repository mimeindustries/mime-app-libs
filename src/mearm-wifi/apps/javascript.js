// MeArm-WiFi start-up code for the JavaScript app (/a/javascript.js).
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('/a/editor.css', 'css', function(res){
    loadFile('/a/editor.js', 'js', function(res){
      loadFile('/a/js-mode.js', 'js', function(res){
        var setup = '<pre id="editor">' +
          'function wave_arm(times) {\n' +
          '    var i;\n' +
          '    for (i = 0; i < times; i++) {\n' +
          '        mearm.moveRightTo(85);\n' +
          '        mearm.moveLeftTo(0);\n' +
          '        mearm.moveBaseTo(85);\n' +
          '        mearm.openGrip();\n' +
          '        mearm.closeGrip();\n' +
          '        mearm.moveBaseTo(-85);\n' +
          '        mearm.moveRightTo(20);\n' +
          '        mearm.moveBaseTo(0);\n' +
          '        mearm.openGrip();\n' +
          '        mearm.closeGrip();\n' +
          '        mearm.moveRightTo(85);\n' +
          '        mearm.moveLeftTo(0);\n' +
          '    }\n' +
          '}\n' +
          '\n' +
          'wave_arm(1);</pre>' +
          '<button id="helpButton" data-l10n=":show-help">Show help</button>' +
          '<div id="help">' +
          '  <h2 data-l10n=":js-help-title">Controlling MeArm with Javascript</h2>' +
          '  <p data-l10n=":js-help-intro">Use these simple commands to get started controlling MeArm:</p>' +
          '  <ul>' +
          '    <li><em>mearm.openGrip()</em> - <span data-l10n=":js-openGrip-help">open the grip</span></li>' +
          '    <li><em>mearm.closeGrip()</em> - <span data-l10n=":js-closeGrip-help">close the grip</span></li>' +
          '    <li><em>mearm.moveBaseTo(angle)</em> - <span data-l10n=":js-moveBaseTo-help">turn the base to the angle</span></li>' +
          '    <li><em>mearm.moveRightTo(angle)</em> - <span data-l10n=":js-moveRightTo-help">turn the right part to the angle</span></li>' +
          '    <li><em>mearm.moveLeftTo(angle)</em> - <span data-l10n=":js-moveLeftTo-help">turn the left part to the angle</span></li>' +
          '    <li><em>mearm.moveGripTo(angle)</em> - <span data-l10n=":js-moveGripTo-help">turn the grip to the angle</span></li>' +
          '  </ul>' +
          '</div>' +
          '<div id="controlBar">' +
          '<button class="run">&#9654; <span data-l10n=":run">Run</span></button>' +
          '<button class="pause" style="display:none;">&#10074;&#10074; <span data-l10n=":pause">Pause</span></button>' +
          '<button class="stop">&#9724; <span data-l10n=":stop">Stop</span></button>' +
          '<button class="clear">&#10006; <span data-l10n=":clear">Clear</span></button>' +
          '</div>';
        qs('#app').innerHTML = setup;

        // Ace runs JavaScript syntax checking in a worker loaded from here (data/worker-javascript.js)
        ace.config.set('workerPath', '/a/');

        var editor = new Editor('editor', 'controlBar', 'javascript');
        editor.setDevice(window.mearm);

        editor.onRun(function(prog){
          'use strict';
          // Shadow the global console so that program output also goes to the editor's console
          var mirobot = window.mirobot;
          var console = {
            log: function(text){
              editor.printToConsole(text);
              window.console.log('Javascript: ' + text);
            }
          };
          try {
            eval(prog);
          } catch(e) {
            console.log(e);
          }
          editor.completeHandler();
        });

        if(hasLocalStorage()){
          var saveMenu = new SaveMenu('#menu', {
            saveHandler: function(){ return editor.saveProgram(); },
            loadHandler: function(prog){ return editor.loadProgram(prog); },
            clearHandler: function(){ return editor.clearProgram(); },
            namespace: 'javascript',
            fileType: 'js'
          });
        }
      });
    });
  });
};
