// Mirobot start-up code for the Point & Click app (/a/point-click.js).
// The app itself is src/point-click/turtle.js. index.html calls init() once this file has loaded.
var init = function(){
  loadFile('/a/point-click.css', 'css', function(res){
    new Turtle(qs('#app')).setMirobot(window.mirobot);
  });
};
