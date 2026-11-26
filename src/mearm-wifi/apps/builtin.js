// MeArm-WiFi start-up code for the built-in drag and drop UI (BuiltinUI.js).
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('BuiltinUI.css', 'css', function(res){
    if(!res) return;

    var ui = new BuiltinUI('#app', mearm, true, [
      {
        name: 'move',
        type: 'child',
        content: {
          str: 'Turn [[servo]] to [[angle]] degrees',
          servo: {
            name: 'servo',
            input: 'option',
            default: 'base',
            values: ['Base', 'Right', 'Left', 'Grip']
          },
          angle: {
            name: 'angle',
            input: 'number',
            default: 25
          }
        },
        run: function(node, mearm, cb){
          mearm['move' + node.args().servo + 'To'](node.args().angle, cb);
        }
      },
      {
        name: 'opengrip',
        type: 'child',
        content: { str: 'Open Grip' },
        run: function(node, mearm, cb){
          console.log('Open Grip');
          mearm.openGrip(cb);
        }
      },
      {
        name: 'closegrip',
        type: 'child',
        content: { str: 'Close Grip' },
        run: function(node, mearm, cb){
          console.log('Close Grip');
          mearm.closeGrip(cb);
        }
      },
      {
        name: 'repeat',
        type: 'parent',
        content: {
          str: 'Repeat [[count]] times',
          count: {
            name: 'count',
            input: 'number',
            default: 2
          }
        },
        run: function(node, mearm, cb){
          for(var i = 0; i < node.args().count; i++){
            for(var j = 0; j < node.children.length; j++){
              node.children[j].run();
            }
          }
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
