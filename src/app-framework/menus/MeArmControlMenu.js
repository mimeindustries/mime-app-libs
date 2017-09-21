var MeArmControlMenu = function(el, mearm){
  var self = this;
  this.connectCb = undefined;
  this.mearm = mearm;
  var sliders = {};
  
  var sliderHandler = function(name){
    var fnName = 'move' + name[0].toUpperCase() + name.slice(1) + 'To';
    return function(values){
      console.log(name + " moved to " + values[0]);
      mearm[fnName](Number(values[0]).toFixed(0));
    }
  }

  var addSlider = function(type, min, max, cb){
    var el = document.querySelector('#' + type + 'Slider');
    noUiSlider.create(el, {
      start: min + (max - min)/2,
      connect: true,
      orientation: "horizontal",
      range: {
        'min': min,
        'max': max
      }
    })
    var slider = el.noUiSlider;
    slider.on('slide', sliderHandler(type))
    slider.on('start', function(){
      this.dragging = true;
    })
    slider.on('end', function(){
      this.dragging = false;
    })
    return slider;
  }

  this.init = function(){
    var container = document.querySelector(el);
    container.insertAdjacentHTML('beforeend', this.menuHTML);
    this.el = container.querySelector('#control');
    
    sliders.base = addSlider('base', -90, 90);
    sliders.lower = addSlider('lower', 0, 90);
    sliders.upper = addSlider('upper', 0, 135);
    sliders.grip = addSlider('grip', 0, 90);

    this.mearm.addEventListener('connectedStateChange', function(msg){
      if(msg.state === 'connected'){
        self.mearm.getServoState(function(status, msg){ self.handleServoStateChange(msg.msg); })
      }
    });
    this.mearm.addEventListener('servoChange', function(msg){
      self.handleServoStateChange(msg);
    });
    this.devices = {};
    this.el.classList.remove('hidden');
    new MainMenu(this.el, {autohide: true})
  }

  this.updateAngle = function(servo, angle){
    self.el.querySelector('.' + servo).innerHTML = Number(angle).toFixed(0) + '&deg;';
    if(!sliders[servo].dragging){
      sliders[servo].set(angle);
    }
  }

  this.handleServoStateChange = function(msg){
    console.log(msg)
    for(servo in msg){
      this.updateAngle(servo, msg[servo]);
    }
  }

  this.onConnect = function(cb){
    this.connectCb = cb;
  }

  this.init();
}

MeArmControlMenu.prototype.menuHTML = '<div id="control" class="menuItem hidden">\
  <i class="icon fa icon-sliders fa-2x"></i>\
  <div class="value"><p class="label">Base</p><p class="base"></p></div>\
  <div class="value"><p class="label">Lower</p><p class="lower"></p></div>\
  <div class="value"><p class="label">Upper</p><p class="upper"></p></div>\
  <div class="value"><p class="label">Grip</p><p class="grip"></p></div>\
  <div class="wrapper">\
    <div class="subMenu">\
      <div class="control"><label>Base:</label><div id="baseSlider" class="slider"></div></div>\
      <div class="control"><label>Lower:</label><div id="lowerSlider" class="slider"></div></div>\
      <div class="control"><label>Upper:</label><div id="upperSlider" class="slider"></div></div>\
      <div class="control"><label>Grip:</label><div id="gripSlider" class="slider"></div></div>\
    </div>\
  </div>\
</div>'
