// Mirobot start-up code for the JavaScript app (/a/javascript.js).
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('/a/editor.css', 'css', function(res){
    loadFile('/a/editor.js', 'js', function(res){
      loadFile('/a/js-mode.js', 'js', function(res){
        qs('#app').innerHTML =
          '<pre id="editor">function draw_polygon(sides) {\n' +
          '    var i;\n' +
          '    for (i = 0; i < sides; i++) {\n' +
          '        var angle = 360/sides;\n' +
          '        mirobot.left(angle);\n' +
          '        mirobot.forward(100);\n' +
          '    }\n' +
          '}\n' +
          '\n' +
          'mirobot.pendown();\n' +
          'draw_polygon(5);\n' +
          'mirobot.penup();</pre>' +
          '<button id="helpButton" data-l10n=":show-help">Show help</button>' +
          '<div id="help">' +
          '  <h2 data-l10n=":js-help-title">Controlling Mirobot with Javascript</h2>' +
          '  <p data-l10n=":js-help-intro">Use these simple commands to get started controlling Mirobot:</p>' +
          '  <ul>' +
          '    <li><em>mirobot.forward(100)</em> - <span data-l10n=":js-forward-help">move 100 mm forward</span></li>' +
          '    <li><em>mirobot.back(100)</em> - <span data-l10n=":js-back-help">move 100mm back</span></li>' +
          '    <li><em>mirobot.left(90)</em> - <span data-l10n=":js-left-help">turn 90 degrees to the left</span></li>' +
          '    <li><em>mirobot.right(90)</em> - <span data-l10n=":js-right-help">turn 90 degrees to the right</span></li>' +
          '    <li><em>mirobot.penup()</em> - <span data-l10n=":js-penup-help">lift the pen up</span></li>' +
          '    <li><em>mirobot.pendown()</em> - <span data-l10n=":js-pendown-help">lower the pen to draw</span></li>' +
          '    <li><em>mirobot.beep()</em> - <span data-l10n=":js-beep-help">make it beep</span></li>' +
          '  </ul></div>' +
          '<div id="controlBar"><button class="run">&#9654; <span data-l10n=":run">Run</span></button>' +
          '<button class="pause" style="display:none;">&#10074;&#10074; <span data-l10n=":pause">Pause</span></button>' +
          '<button class="stop">&#9724; <span data-l10n=":stop">Stop</span></button>' +
          '<button class="clear">&#10006; <span data-l10n=":clear">Clear</span></button>' +
          '</div>';

        // Ace runs JavaScript syntax checking in a worker loaded from here (data/worker-javascript.js)
        ace.config.set('workerPath', '/a/');

        var editor = new Editor('editor', 'controlBar', 'javascript');
        editor.setDevice(window.mirobot);

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
          new SaveMenu('#menu', {
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
