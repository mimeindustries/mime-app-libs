// MeArm-WiFi start-up code for the built-in drag and drop UI (BuiltinUI.js).
// index.html calls init() once this file has loaded.

// Keep an angle inside a joint's limits (from the arm's getLimits). Returns
// the angle unchanged if the limits aren't known yet.
var clampToRange = function(servo, angle){
  var r = mearm.jointRange(servo);
  angle = Number(angle);
  if(!r || isNaN(angle)) return angle;
  return Math.min(Math.max(angle, r.min), r.max);
};

// Make the "Turn [servo] to [angle] degrees" blocks range-aware: show the
// selected joint's limits next to the angle, mark an out-of-range angle red
// while it's typed, and pull it back inside the limits when the field is left.
var setUpAngleRanges = function(app){
  var blocks = function(){ return app.querySelectorAll('.fn-move'); };
  var parts = function(block){
    return {
      servo: block.querySelector("select[name='servo']"),
      angle: block.querySelector("input[name='angle']"),
      hint: block.querySelector('.rangeHint')
    };
  };

  var outOfRange = function(p){
    var r = mearm.jointRange(p.servo.value), v = Number(p.angle.value);
    return !!r && (p.angle.value === '' || isNaN(v) || v < r.min || v > r.max);
  };

  // Show the range and set the number field's limits (its arrows stop there)
  var refresh = function(block){
    var p = parts(block);
    if(!p.servo || !p.angle) return;
    if(!p.hint){
      p.hint = document.createElement('span');
      p.hint.className = 'rangeHint';
      block.insertBefore(p.hint, p.angle.nextSibling);
    }
    var r = mearm.jointRange(p.servo.value);
    var text = r ? '(' + r.min + '\u2013' + r.max + '\u00b0)' : '';
    // Only touch the text when it changes: the MutationObserver below would
    // otherwise see every rewrite and call refresh again, forever
    if(p.hint.textContent !== text) p.hint.textContent = text;
    if(r){
      p.angle.min = r.min;
      p.angle.max = r.max;
    }else{
      p.angle.removeAttribute('min');
      p.angle.removeAttribute('max');
    }
    p.angle.classList.toggle('outOfRange', outOfRange(p));
  };

  var refreshAll = function(){
    var b = blocks();
    for(var i = 0; i < b.length; i++) refresh(b[i]);
  };

  // Pull the angle back inside the limits, and save the program if it changed
  var clamp = function(block){
    var p = parts(block);
    if(!outOfRange(p)) return;
    var r = mearm.jointRange(p.servo.value);
    var v = Number(p.angle.value);
    p.angle.value = (p.angle.value === '' || isNaN(v)) ? Math.round((r.min + r.max) / 2) : (v < r.min ? r.min : r.max);
    p.angle.classList.remove('outOfRange');
    p.angle.classList.add('clamped');
    setTimeout(function(){ p.angle.classList.remove('clamped'); }, 900);
    p.angle.dispatchEvent(new Event('change', {bubbles: true}));
  };

  var blockOf = function(el){
    while(el && el !== app){
      if(el.classList && el.classList.contains('fn-move')) return el;
      el = el.parentNode;
    }
    return null;
  };

  app.addEventListener('input', function(e){
    var b = blockOf(e.target);
    if(b && e.target.name === 'angle') refresh(b);
  });
  app.addEventListener('change', function(e){
    var b = blockOf(e.target);
    if(!b) return;
    if(e.target.name === 'servo') refresh(b);
    if(e.target.name === 'angle') clamp(b);
  });

  // New blocks (dragged from the toolbox, or a loaded program) and new limits
  new MutationObserver(refreshAll).observe(app, {childList: true, subtree: true});
  mearm.addEventListener('limitsChange', refreshAll);
  refreshAll();
};

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
          var servo = node.args().servo;
          mearm['move' + servo + 'To'](clampToRange(servo, node.args().angle), cb);
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

    setUpAngleRanges(document.querySelector('#app'));

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
