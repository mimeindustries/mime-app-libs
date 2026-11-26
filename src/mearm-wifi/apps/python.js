// MeArm-WiFi start-up code for the Python app (/a/python.js).
// Runs on top of Skulpt (src/python/skulpt), whose stdlib includes the `mearm` module.
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('/a/editor.css', 'css', function(res){
    loadFile('/a/editor.js', 'js', function(res){
      loadFile('/a/py-mode.js', 'js', function(res){
        // The help text is the same as the JavaScript app's, as it is in the shipped firmware
        qs('#app').innerHTML = '<pre id="editor">' +
          'from mearm import Mearm\n' +
          '\n' +
          'm = Mearm()\n' +
          '\n' +
          'def wave_arm(times):\n' +
          '    for i in range(times):\n' +
          '        m.moveRightTo(85)\n' +
          '        m.moveLeftTo(0)\n' +
          '        m.moveBaseTo(85)\n' +
          '        m.openGrip()\n' +
          '        m.closeGrip()\n' +
          '        m.moveBaseTo(-85)\n' +
          '        m.moveRightTo(20)\n' +
          '        m.moveBaseTo(0)\n' +
          '        m.openGrip()\n' +
          '        m.closeGrip()\n' +
          '        m.moveRightTo(85)\n' +
          '        m.moveLeftTo(0)\n' +
          '\n' +
          'wave_arm(1)\n' +
          '\n' +
          '</pre>' +
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

        editor.setDevice(window.mearm);

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
          // The Python mearm module talks to the arm through this global
          window.__mearm__ = window.mearm;
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
