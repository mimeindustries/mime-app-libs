// Mirobot start-up code for the built-in drag and drop UI (BuiltinUI.js).
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('BuiltinUI.css', 'css', function(res){
    if(!res) return;

    var ui = new BuiltinUI('#app', mirobot, true, [
      {
        name: 'move',
        type: 'child',
        content: {
          str: l(':move-cmd'),
          direction: {
            name: 'direction',
            input: 'option',
            default: 'forward',
            values: ['forward', 'back']
          },
          distance: {
            name: 'distance',
            input: 'number',
            default: 100
          }
        },
        run: function(node, mirobot, cb){
          mirobot.move(node.args().direction, node.args().distance, cb);
        }
      },
      {
        name: 'turn',
        type: 'child',
        content: {
          str: l(':turn-cmd'),
          direction: {
            name: 'direction',
            input: 'option',
            default: 'left',
            values: ['left', 'right']
          },
          angle: {
            name: 'angle',
            input: 'number',
            default: 90
          }
        },
        run: function(node, mirobot, cb){
          mirobot.turn(node.args().direction, node.args().angle, cb);
        }
      },
      {
        name: 'penup',
        type: 'child',
        content: { str: l(':penup-cmd') },
        run: function(node, mirobot, cb){
          mirobot.penup(cb);
        }
      },
      {
        name: 'pendown',
        type: 'child',
        content: { str: l(':pendown-cmd') },
        run: function(node, mirobot, cb){
          mirobot.pendown(cb);
        }
      },
      {
        name: 'repeat',
        type: 'parent',
        content: {
          str: l(':repeat-cmd'),
          count: {
            name: 'count',
            input: 'number',
            default: 2
          }
        },
        run: function(node, mirobot, cb){
          for(var i = 0; i < node.args().count; i++){
            for(var j = 0; j < node.children.length; j++){
              node.children[j].run();
            }
          }
        }
      },
      {
        name: 'beep',
        type: 'child',
        content: {
          str: l(':beep-cmd'),
          duration: {
            name: 'duration',
            input: 'number',
            default: 0.5
          }
        },
        run: function(node, mirobot, cb){
          // duration is in seconds, beep takes milliseconds
          mirobot.beep(1000 * node.args().duration, cb);
        }
      }
    ]);

    if(hasLocalStorage()){
      new SaveMenu('#menu', {
        saveHandler: function(){ return ui.saveProgram(); },
        loadHandler: function(prog){ return ui.loadProgram(prog); },
        clearHandler: function(){ return ui.clearProgram(); },
        namespace: 'default'
      });
    }
  });
};
