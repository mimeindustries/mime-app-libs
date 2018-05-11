AppsMenu = function(el, config){
  var self = this;

  var addMenuItem
  this.init = function(){
    var container = document.querySelector(el);
    container.insertAdjacentHTML('beforeend', '<div id="apps" class="menuItem"><i class="icon icon-apps"></i><div class="wrapper"><ul class="subMenu"></ul></div></div>');
    this.el = container.querySelector('#apps');
    
    this.el.innerHTML += '';
    var menu = new MainMenu(this.el)
    
    menu.addItem("Default UI", function(){
      window.location = '/';
    });
    config.apps.map(function(app){
      menu.addItem(app.name, function(){
        window.location = '/?' + app.id;
      });
    });
  }
  
  this.init();
}