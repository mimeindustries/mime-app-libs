// Mirobot start-up code for the Python app (/a/python.js).
// Runs on top of Skulpt (src/python/skulpt), whose stdlib includes the `mirobot` module.
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('/a/editor.css', 'css', function(res){
    loadFile('/a/editor.js', 'js', function(res){
      loadFile('/a/py-mode.js', 'js', function(res){
        qs('#app').innerHTML =
          '<pre id="editor">from mirobot import Mirobot\n' +
          '\n' +
          'mirobot = Mirobot()\n' +
          '\n' +
          'def draw_square():\n' +
          '    for i in range(4):\n' +
          '        mirobot.forward(100)\n' +
          '        mirobot.right(90)\n' +
          '        \n' +
          'draw_square()\n' +
          '\n' +
          '</pre>' +
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

        var editor = new Editor('editor', 'controlBar', 'python');

        // Python's input() shows a modal dialog
        Sk.inputfun = function(promptText){
          var el = document.createElement('div');
          el.id = 'inputModal';
          if(promptText){
            var p = document.createElement('p');
            p.innerHTML = promptText;
            el.appendChild(p);
          }
          var input = document.createElement('input');
          input.type = 'text';
          el.appendChild(input);
          return new Promise(function(resolve){
            nanoModal(el, {
              autoRemove: true,
              buttons: [{
                text: 'Cancel',
                primary: false,
                handler: function(modal){
                  modal.hide();
                  resolve('');
                }
              }, {
                text: 'OK',
                primary: true,
                handler: function(modal){
                  var val = document.querySelector('#inputModal input').value;
                  modal.hide();
                  resolve(val);
                }
              }]
            }).show();
          });
        };

        editor.setDevice(window.mirobot);

        // Lets the Stop button abort a running program
        var interruptHandler = function(susp){
          if(Sk.hardInterrupt === true){
            throw new Sk.builtin.BaseException('aborted execution');
          }
          return null;
        };

        editor.onRun(function(prog){
          var outf = function(text){
            if(/^\s+$/g.test(text)) return;
            editor.printToConsole(text);
            console.log('Python: ' + text);
          };
          Sk.configure({
            output: outf,
            read: function(x){
              if(Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined){
                throw "File not found: '" + x + "'";
              }
              return Sk.builtinFiles.files[x];
            }
          });
          // The Python mirobot module talks to the robot through this global
          window.__mirobot__ = window.mirobot;
          Sk.hardInterrupt = false;
          Sk.misceval.asyncToPromise(function(){
            return Sk.importMainWithBody('<stdin>', false, prog, true);
          }, { '*': interruptHandler }).then(function(){
            editor.completeHandler();
          }).catch(function(e){
            editor.completeHandler();
            outf(e.toString());
          });
        });

        editor.onStop(function(){
          Sk.hardInterrupt = true;
        });

        if(hasLocalStorage()){
          new SaveMenu('#menu', {
            saveHandler: function(){ return editor.saveProgram(); },
            loadHandler: function(prog){ return editor.loadProgram(prog); },
            clearHandler: function(){ return editor.clearProgram(); },
            namespace: 'python',
            fileType: 'js'
          });
        }
      });
    });
  });
};
