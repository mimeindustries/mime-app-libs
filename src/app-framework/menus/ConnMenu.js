ConnMenu = function(el, device, options){
  var self = this;
  this.connectCb = undefined;
  
  this.updateMenu = function(){
    this.menu.setDevices(this.devices, this.address);
  }

  this.connHandler = function(e){
    if(e.state === 'connected'){
      this.connState = 'connected';
      this.has_connected = true;
    }else if(e.state === 'disconnected'){
      if(!this.has_connected){
        this.connState = 'cant_connect';
      }else{
        this.connState = 'disconnected';
      }
    }
    this.updateMenu();
  }

  this.init = function(){    
    var container = document.querySelector(el);
    container.insertAdjacentHTML('beforeend', '<div id="conn" class="menuItem"><i class="icon icon-wifi fa-2x"></i><div class="wrapper"><ul class="subMenu"><li class="selected"></li></ul></div></div>');
    this.el = container.querySelector('#conn');
    this.device = device;
    this.device.addEventListener('connectedStateChange', function(r){ self.connHandler(r) });
    this.connState = 'not_set';
    new MainMenu(this.el)
    this.updateMenu();
  }
  
  this.updateMenu = function(){
    switch(this.connState){
      case 'connected':
        this.el.classList.add('connected');
        this.el.classList.remove('error');
        this.el.querySelector('li').innerHTML = options.connected;
        break;
      case 'disconnected':
      case 'connected':
        this.el.classList.remove('connected');
        this.el.classList.add('error');
        this.el.querySelector('li').innerHTML = options.error;
        break;
      case 'not_set':
        this.el.classList.remove('error');
        this.el.classList.remove('connected');
        this.el.querySelector('li').innerHTML = options.connecting;
        break;
    }
  }
  
  this.init();
}