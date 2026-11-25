// Mirobot start-up code for the Snap! app (/a/snap.js).
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('/a/remote.css', 'css', function(res){
    qs('#app').innerHTML = '<canvas id="world" tabindex="1" style="position: absolute;" />';

    var world;

    // Snap!'s logo and block click sound are in data/snap/ on the board
    IDE_Morph.prototype.assetPath = '/a/snap/';

    // Keep the Snap! IDE below the page header
    IDE_Morph.prototype.reactToWorldResize = function(rect){
      if(this.isAutoFill){
        rect.origin.y = document.getElementById('header').getBoundingClientRect().height;
        this.setPosition(rect.origin);
        this.setExtent(rect.extent());
      }
      if(this.filePicker){
        document.body.removeChild(this.filePicker);
        this.filePicker = null;
      }
    };

    world = new WorldMorph(document.getElementById('world'));
    world.worldCanvas.focus();

    var IDE = new IDE_Morph(false);
    IDE.loadNewProject = false;
    IDE.userLanguage = String.locale;
    IDE.openIn(world);
    IDE.toggleStageSize(true);

    if(hasLocalStorage()){
      new SaveMenu('#menu', {
        saveHandler: function(name){
          IDE.setProjectName(name);
          return IDE.serializer.serialize(IDE.stage);
        },
        loadHandler: function(prog){ return IDE.rawOpenProjectString(prog); },
        clearHandler: function(){ return IDE.newProject(); },
        namespace: 'snap',
        fileType: 'js'
      });
    }

    IDE.setLanguage(String.locale);

    setInterval(function(){
      world.doOneCycle();
    }, 1);
  });
};
