SaveMenu = function(el, conf){
  var self = this;
  var container = document.querySelector(el);
  container.insertAdjacentHTML('beforeend', '<div id="save" class="menuItem hidden"><i class="icon icon-floppy"></i></div>');
  this.el = container.querySelector('#save');
  this.persister = new Persister(conf);
  this.persister.subscribe(function(){self.handleUpdate();});
  this.init();
  this.persister.init();
}

SaveMenu.prototype.createMenuItem = function(text, cb){
  var li = document.createElement('li');
  li.innerHTML = text;
  li.addEventListener('click', cb);
  return li
}

SaveMenu.prototype.updateFileMenu = function(menu){
  var self = this;
  var progs_ul = menu.querySelector('ul#progs')
  if(progs_ul) progs_ul.innerHTML = '';

  this.persister.fileList(function(files){
    files.map(function(f){
      progs_ul.appendChild(self.createMenuItem(f, function(){ self.openProgram(f);}));
    });
  });
}

SaveMenu.prototype.setSaveFilename = function(name){
  var title = this.el.querySelector('#menu .title');
  if(name){
    title.innerHTML = '['+name+']';
  }else{
    title.innerHTML = '';
  }
}

SaveMenu.prototype.handleUpdate = function(){
  this.setSaveFilename(this.persister.currentProgram);
  this.updateFileMenu(document.getElementById('save'));
}

SaveMenu.prototype.init = function(){
  var self = this;
  var wrap = document.createElement('div');
  wrap.className = 'wrapper';
  this.el.appendChild(wrap);
  var menu = document.createElement('ul');
  menu.id="saveMenu";
  menu.className="subMenu";
  menu.appendChild(this.createMenuItem(l(':save', 'Save') + ' <span class="title"></span>', function(){ self.saveHandler();}));
  menu.appendChild(this.createMenuItem(l(':save-as', 'Save as') + '...', function(){ self.saveAsHandler();}));
  menu.appendChild(this.createMenuItem(l(':new-prog', 'New program'), function(){ self.newHandler();}));
  menu.appendChild(this.createMenuItem(l(':delete-prog', 'Delete program'), function(){ self.deleteHandler();}));
  menu.appendChild(this.createMenuItem(l(':download', 'Download current program'), function(){ self.downloadHandler();}));
  var uploader = document.createElement('input');
  uploader.type = 'file';
  uploader.id = "uploader";
  wrap.appendChild(uploader);
  uploader.addEventListener('change', function(e){ self.uploadFileHandler(e) }, false);
  menu.appendChild(this.createMenuItem(l(':upload', 'Upload program'), function(){ self.uploadHandler();}));
  
  var progs_li = document.createElement('li');
  progs_li.innerHTML = l(':open', 'Open program') + ':';
  progs_li.className = 'inactive';
  menu.appendChild(progs_li);
  wrap.appendChild(menu);
  
  var progs_ul = document.createElement('ul');
  progs_ul.id = 'progs';
  progs_ul.className = 'subMenu';
  menu.appendChild(progs_ul);

  new MainMenu(this.el);
  this.el.classList.remove('hidden');

  window.addEventListener("keydown", function(e){ self.handleKeyboard(e);}, false);
}

SaveMenu.prototype.handleKeyboard = function(e){
  if(e.keyCode === 83 && e.metaKey){
    this.saveHandler();
    e.preventDefault();
    return false;
  }
}

SaveMenu.prototype.saveHandler = function(){
  if(this.persister.currentProgram){
    this.persister.save();
  }else{
    this.saveAsHandler();
  }
}

SaveMenu.prototype.saveAsModal = function(){
  var el = document.createElement('div');
  el.id = "saveAsModal";
  var p = document.createElement('p');
  p.innerHTML = l(':choose-name', 'Choose the file name');
  el.appendChild(p);
  var input = document.createElement('input');
  input.type = "text"
  el.appendChild(input);
  return el
}

SaveMenu.prototype.saveAsHandler = function(){
  var self = this;
  var modal = nanoModal(this.saveAsModal(), {
    autoRemove: true,
    buttons: [
      {
        text: "Cancel",
        handler: "hide",
        primary: false
      },
      {
        text: "Save",
        primary: true,
        handler: function(modal) {
          var filename = document.querySelector("#saveAsModal input").value;
          if(filename && filename !== ''){
            self.persister.exists(filename, function(exists){
              if(exists){
                modal.hide();
                nanoModal(l(':exists', 'Error, file already exists with this name'), {autoRemove: true}).show().onHide(modal.show);
              }else{
                self.persister.saveAs(filename);
                modal.hide();
              }
            })
          }
        }
      }
    ]
  });
  modal.show();
}

SaveMenu.prototype.uploadHandler = function(){
  this.checkSaved(function(res){
    if(res) document.getElementById('uploader').click();
  });
}

SaveMenu.prototype.uploadFileHandler = function(e){
  var self = this;
  e.stopPropagation();
  e.preventDefault();
  if(typeof e.dataTransfer !== 'undefined'){
    var files = e.dataTransfer.files;
  }else if(typeof e.target !== 'undefined'){
    var files = e.target.files;
  }
  if(files.length > 1) return nanoModal(l(':single-file', 'Please select a single file to upload'), {autoRemove: true}).show();
  
  // Read the file
  var r = new FileReader(files[0]);
  r.onload = function(e) { self.loadFromFile(e.target.result) }
  r.readAsText(files[0]);
  
  return false;
}

SaveMenu.prototype.loadFromFile = function(content){
  this.persister.new();
  this.persister.loadHandler(content);
}

SaveMenu.prototype.checkSaved = function(cb){
  this.persister.unsaved(function(unsaved){
    if(unsaved){
      nanoConfirm(l(':unsaved', 'You have unsaved changes which will be lost. Do you want to continue?'), function(res){
        cb(res);
      });
    }else{
      cb(true);
    }
  });
}

SaveMenu.prototype.newHandler = function(){
  var self = this;
  this.checkSaved(function(res){
    if(res) self.persister.new();
  });
}

SaveMenu.prototype.downloadHandler = function(){
  this.persister.downloadCurrent();
}

SaveMenu.prototype.deleteHandler = function(){
  var self = this;
  var filename = this.persister.currentProgram;
  if(filename && filename !== ''){
    nanoConfirm(l(':sure', 'Are you sure you want to delete program') + " '" + filename + "'? " + l(':permanent', 'This is permanent and cannot be undone') + '.', function(res){
      if(res) self.persister.delete(filename);
    });
  }
}

SaveMenu.prototype.openProgram = function(filename){
  var self = this;
  this.checkSaved(function(res){
    if(res && filename && filename !== '') self.persister.load(filename);
  });
}