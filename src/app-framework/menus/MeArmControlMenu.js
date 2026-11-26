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

  // Set each slider's range from the joint limits the firmware reports
  // ({"base":{"min":-90,"max":90}, ...}). Joints missing from the reply keep
  // their current range.
  this.applyLimits = function(limits){
    if(!limits || typeof limits !== 'object') return;
    for(var name in sliders){
      var lim = limits[name];
      if(!lim || typeof lim.min !== 'number' || typeof lim.max !== 'number') continue;
      var min = Math.min(lim.min, lim.max), max = Math.max(lim.min, lim.max);
      if(max === min) max = min + 1; // noUiSlider needs a non-empty range
      sliders[name].updateOptions({range: {min: min, max: max}}, false);
      var el = self.el.querySelector('.' + name + 'Range');
      if(el) el.innerHTML = Math.round(min) + '&deg; to ' + Math.round(max) + '&deg;';
    }
  }

  this.refreshLimits = function(){
    self.mearm.getLimits(function(status, msg){
      if(msg && msg.msg) self.applyLimits(msg.msg);
    });
  }

  this.init = function(){
    var container = document.querySelector(el);
    container.insertAdjacentHTML('beforeend', this.menuHTML);
    this.el = container.querySelector('#control');
    
    sliders.base = addSlider('base', -90, 90);
    sliders.right = addSlider('right', 0, 90);
    sliders.left = addSlider('left', 0, 135);
    sliders.grip = addSlider('grip', 0, 90);

    this.mearm.addEventListener('connectedStateChange', function(msg){
      if(msg.state === 'connected'){
        self.refreshLimits();
        self.mearm.getServoState(function(status, msg){ self.handleServoStateChange(msg.msg); })
      }
    });
    this.mearm.addEventListener('servoChange', function(msg){
      self.handleServoStateChange(msg);
    });
    // setLimits and resetLimits reply with the limits now in force, so keep
    // the sliders in step when an app or the console changes them
    ['setLimits', 'resetLimits'].forEach(function(cmd){
      var orig = self.mearm[cmd];
      if(!orig) return;
      self.mearm[cmd] = function(arg1, arg2){
        var userCb = typeof arg1 === 'function' ? arg1 : arg2;
        var wrapped = function(status, msg){
          if(msg && msg.msg) self.applyLimits(msg.msg);
          if(userCb) userCb(status, msg);
        };
        if(typeof arg1 === 'function' || typeof arg1 === 'undefined') return orig.call(self.mearm, wrapped);
        return orig.call(self.mearm, arg1, wrapped);
      };
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
    for(var servo in msg){
      if(sliders[servo]) this.updateAngle(servo, msg[servo]);
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
  <div class="value"><p class="label">Right</p><p class="right"></p></div>\
  <div class="value"><p class="label">Left</p><p class="left"></p></div>\
  <div class="value"><p class="label">Grip</p><p class="grip"></p></div>\
  <div class="wrapper">\
    <div class="subMenu">\
      <div class="control"><label>Base: <span class="range baseRange"></span></label><div id="baseSlider" class="slider"></div></div>\
      <div class="control"><label>Right: <span class="range rightRange"></span></label><div id="rightSlider" class="slider"></div></div>\
      <div class="control"><label>Left: <span class="range leftRange"></span></label><div id="leftSlider" class="slider"></div></div>\
      <div class="control"><label>Grip: <span class="range gripRange"></span></label><div id="gripSlider" class="slider"></div></div>\
    </div>\
  </div>\
</div>'
