var FnInstance = function(fn, el, device){
  this.fn = fn;
  this.el = el;
  this.device = device;
  this.parent = false;
  this.children = [];
}

FnInstance.prototype = {
  run: function(children){
    var self = this;
    if(self.fn){
      // This is a function
      self.fn.run(self, self.device, function(state){ self.updateState(state)});
    }else{
      // This is the root container
      for(var i in self.children){
        self.children[i].run();
      }
    }
  },
  updateState: function(state){
    if(state === 'started'){
      this.el.classList.add('active');
    }else if(state === 'complete'){
      this.el.classList.remove('active');
    }
    if(this.parent && this.parent.el){
      this.parent.updateState(state);
    }
  },
  addChild: function(child){
    child.parent = this;
    this.children.push(child);
  },
  args: function(){
    var self = this;
    var args ={}
    if(this.fn){
      for(var key in this.fn.content){
        var item = this.fn.content[key];
        if(typeof item === 'object'){
          args[item.name] = self.el.querySelector('[name='+ item.name + ']').value;
        }
      };
    }
    return args;
  },
  toObject: function(){
    var out = {
      fn: this.fn ? this.fn.name : 'root',
      parent: this.fn ? this.fn.type === 'parent' : true,
      args: this.args(),
      children: []
    }
    if(this.children.length){
      out.children = this.children.map(function(c){ return c.toObject(); });
    }
    return out;
  }
}

var BuiltinUI = function(el, device, disableLocalstorage, functions){
  var self = this;
  this.functions = functions;
  this.el = qs(el);
  this.device = device;
  this.fns = {};
  this.paused = false;
  this.following = false;
  this.colliding = false;
  this.store = !disableLocalstorage;
  this.init();

  for(var i=0; i<this.functions.length; i++){
    self.fns[this.functions[i].name] = this.functions[i];
  };
}

BuiltinUI.prototype = {
  prog:null,
  setDevice: function(device){
    this.device = device;
    this.initDevice();
  },
  initDevice: function(){
    if(typeof this.device === 'undefined') return;
    var self = this;
    this.device.addEventListener('programComplete', function(){ self.progCompleteHandler() });
    this.device.addEventListener('readyStateChange', function(){ self.updateDeviceState() });
    this.updateDeviceState();
  },
  init: function(){
    var self = this;
    var adjustment;
    this.el.classList.add('editor');
    // Sizing and scrolling are handled by BuiltinUI.scss
    this.el.innerHTML = this.mainUI;
    this.trackHeaderHeight();

    this.runner = qs('.editor .run');
    this.pause = qs('.editor .pause');
    this.stop = qs('.editor .stop');
    this.clear = qs('.editor .clear');
    this.runner.addEventListener('click', function(e){self.runProgram()});
    this.pause.addEventListener('click', function(e){self.pauseProgram()});
    this.stop.addEventListener('click', function(e){self.stopProgram()});
    this.clear.addEventListener('click', function(e){self.clearProgram()});
    
    this.initDevice();

    this.addFunctions();
    this.resumeProgram();
  },
  updateDeviceState: function(){
    if(this.device.ready()){
      this.el.classList.add('ready');
      this.el.classList.remove('notReady');
    }else{
      this.el.classList.remove('ready');
      this.el.classList.add('notReady');
    }
  },
  supportsLocalStorage: function(){
    try {
      localStorage.setItem('test', true);
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  },
  saveProgram: function(){
    var prog = new FnInstance(null, null, null);
    this.generate(qs('.editor ol.program'), prog);
    return JSON.stringify(prog.toObject());
  },
  loadProgram: function(input){
    this.clearProgram();
    var prog = JSON.parse(input);
    if(prog.fn === 'root' && prog.children && prog.children.length > 0){
      this.instantiateProgram(prog.children, document.querySelectorAll('.editor .program')[0]);
      this.showHints();
      this.sortLists();
    }
  },
  storeProgram: function(){
    if(this.supportsLocalStorage() && this.store){
      localStorage['device.currentProgram'] = this.saveProgram();
    }
  },
  resumeProgram: function(){
    if(this.supportsLocalStorage() && localStorage['device.currentProgram'] && this.store){
      this.loadProgram(localStorage['device.currentProgram'])
    }
  },
  instantiateProgram: function(fns, el){
    var self = this;
    if(fns && fns.length){
      for(var i = 0; i< fns.length; i++){
        var newEl = document.querySelectorAll('.functionList .fn-' + fns[i].fn)[0].cloneNode(true);
        el.appendChild(newEl);
        for(var arg in fns[i].args){
          if(fns[i].args.hasOwnProperty(arg)){
            var input = newEl.querySelector("[name='" + arg + "']");
            input.value = fns[i].args[arg];
          }
        }
        self.checkForChanges(newEl);
        new DraggableList(newEl, {
          target: 'ol.program',
          placeholder: '<li class="placeholder"/>',
          copy: false,
          ondrag: function(){self.showHints()},
          onchange: function(){self.storeProgram(); self.sortLists();}
        });
        if(fns[i].parent){
          this.instantiateProgram(fns[i].children, newEl.getElementsByTagName('ol')[0]);
        }
      }
    }
  },
  // The page header is fixed and its height varies: on a phone the menu wraps onto its own row.
  // Publish its height as --header-height so the editor can sit just below it and fill the rest.
  trackHeaderHeight: function(){
    var header = document.getElementById('header');
    if(!header) return;
    var update = function(){
      document.documentElement.style.setProperty('--header-height', header.getBoundingClientRect().height + 'px');
    };
    update();
    if(window.ResizeObserver){
      new ResizeObserver(update).observe(header);
    }else{
      window.addEventListener('resize', update);
    }
  },
  progCompleteHandler: function(e){
    this.runner.style.display = '';
    this.pause.style.display = 'none';
  },
  // Show each list's "drag here" hint only while the list is empty. Each list's hint is in its own
  // last item, li.end; nested lists (inside Repeat) have their own.
  showHints: function(){
    var lists = this.el.querySelectorAll('.programWrapper ol');
    for(var i=0; i< lists.length; i++){
      var end = null, blocks = 0;
      for(var j=0; j< lists[i].children.length; j++){
        var child = lists[i].children[j];
        if(child.classList.contains('end')){
          end = child;
        }else if(!child.classList.contains('dragged')){
          blocks++;
        }
      }
      if(end){
        end.querySelector('.hint').style.display = (blocks === 0 ? 'block' : 'none');
      }
    };
  },
  sortLists: function(){
    var ends = this.el.querySelectorAll('.programWrapper li.end')
    for(var i=0; i< ends.length; i++){
      ends[i].parentNode.appendChild(ends[i]);
    };
  },
  checkForChanges: function(elem){
    var self = this;
    var inputs = elem.querySelectorAll('input, select');
    for(var i=0; i< inputs.length; i++){
      inputs[i].addEventListener('change', function(){ self.storeProgram();});
    };
  },
  generateInput: function(conf){
    if(conf.input === 'number'){
      return '<input type="number" size="4" name="' + conf.name + '" value="' + conf.default + '" />';
    }else if(conf.input === 'option'){
      var select = '<select name="'+ conf.name +'">';
      for(var j in conf.values){
        select += '<option value="' + conf.values[j] + '"';
        if(conf.default === conf.values[j]){
          select += 'selected="selected"';
        }
        select += '>' + conf.values[j] + '</option>';
      }
      select += '</select>';
      return select;
    }
  },
  addFunctions: function(){
    var self = this;
    for(var i=0; i< this.functions.length; i++){
      f = self.functions[i];
      var fn = '<li class="function fn-' + f.name + ' draggable" data-fntype="' + f.name + '">';
      var content = f.content.str;
      var re = /\[\[([^\ ]*)\]\]/g; 
      while ((m = re.exec(content)) !== null) {
          if (m.index === re.lastIndex) {
              re.lastIndex++;
          }
          content = content.replace('[[' + m[1] + ']]', self.generateInput(f.content[m[1]]));
      }
      fn += content;
      
      if(f.type === 'parent'){
        fn += '<ol><li class="end"><div class="hint">Drag functions into here!</div></li></li></ol>';
      }
      fn += '</li>';
      qs('.editor .functionList').innerHTML += fn;
    };
    new DraggableList(qsa('.functionList li.draggable'), {
      target: 'ol.program',
      placeholder: '<li class="placeholder"/>',
      copy: true,
      ondrag: function(){self.showHints()},
      onchange: function(){self.storeProgram(); self.sortLists();},
      onaddelem: function(elem){self.checkForChanges(elem);}
    });
  },
  runProgram: function(){
    if(!this.device.ready()) return;
    if(this.following || this.colliding || !this.device){ return; }
    if(this.paused){
      this.device.resume();
    }else{
      this.prog = new FnInstance(null, null, null);
      this.generate(qs('.editor ol.program'), this.prog);
      this.prog.run()
    }
    this.pause.style.display = '';
    this.runner.style.display = 'none';
    this.paused = false;
  },
  pauseProgram: function(){
    if(!this.device.ready()) return;
    var self = this;
    this.paused = true;
    if(!this.device){ return; }
    this.device.pause(function(){
      self.runner.style.display = '';
      self.pause.style.display = 'none';
    });
  },
  stopProgram: function(cb){
    if(!this.device.ready()) return;
    var self = this;
    if(!this.device){ return; }
    this.device.stop(function(){
      self.runner.style.display = '';
      self.pause.style.display = 'none';
      self.paused = false;
      self.colliding = false;
      self.following = false;
      cb && cb();
    });
  },
  move: function(servo, angle){
  
  },
  clearProgram: function(){
    this.stopProgram();
    var fns = qsa('.editor ol.program li.function')
    for(var i=0; i<fns.length; i++){
      remove(fns[i]);
    }
    this.storeProgram();
    this.showHints();
  },
  generate: function(el, parent){
    var self = this;
    for(var i=0; i<el.childNodes.length; i++){
      var e = el.childNodes[i];
      if(e.nodeName.toLowerCase() === 'li' && e.className.match(/function/) && e.dataset.fntype){
        var fn = self.fns[e.dataset.fntype];
        var inst = new FnInstance(fn, e, self.device);
        parent.addChild(inst);
        if(fn.type === 'parent'){
          var children = e.childNodes;
          for(var j = 0; j< children.length; j++){
            if(children[j].nodeName.toLowerCase() === 'ol'){
              self.generate(children[j], inst);
            }
          }
        }
      }
    };
  }
}

BuiltinUI.prototype.mainUI = '\
<div class="left container">\
  <h2>Toolbox</h2>\
  <ol class="functionList"></ol>\
</div>\
<div class="right container">\
  <h2>Program</h2>\
  <div class="programWrapper">\
    <ol class="program" id="program">\
      <li class="end"><div class="hint">Drag functions here, or double-tap one to add it</div></li>\
    </ol>\
  </div>\
  <div class="buttons">\
<button class="run">&#9654; Run</button>\
<button class="pause" style="display:none;">&#10074;&#10074; Pause</button>\
<button class="stop">&#9724; Stop</button>\
<button class="clear">&#10006; Clear</button>\
  </div>\
</div>\
';