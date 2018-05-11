SpriteMorph.prototype.categories.push('mearm');
SpriteMorph.prototype.blockColor.mearm = new Color(255, 0, 0);

// Meamr functions
Process.prototype.mearmOpenGrip = function () {
  if(!mearm.ready()) return;
  if (typeof this.context.proceed === 'undefined') {
    var self = this;
    this.context.proceed = false;
    mearm.openGrip(function(state, msg){
      if(state === 'complete' && self.context){
        self.context.proceed = true;
      }
    });
  }
  if(this.context.proceed){
    return null;
  }
  this.pushContext('doYield');
  this.pushContext();
}
  
Process.prototype.mearmCloseGrip = function () {
  if(!mearm.ready()) return;
  if (typeof this.context.proceed === 'undefined') {
    var self = this;
    this.context.proceed = false;
    mearm.closeGrip(function(state, msg){
      if(state === 'complete' && self.context){
        self.context.proceed = true;
      }
    });
  }
  if(this.context.proceed){
    return null;
  }
  this.pushContext('doYield');
  this.pushContext();
}

Process.prototype.mearmMoveBaseTo = function (angle) {
  if(!mearm.ready()) return;
  if (typeof this.context.proceed === 'undefined') {
    var self = this;
    this.context.proceed = false;
    mearm.moveBaseTo(angle, function(state, msg){
      if(state === 'complete' && self.context){
        self.context.proceed = true;
      }
    });
  }
  if(this.context.proceed){
    return null;
  }
  this.pushContext('doYield');
  this.pushContext();
}

Process.prototype.mearmMoveLowerTo = function (angle) {
  if(!mearm.ready()) return;
  if (typeof this.context.proceed === 'undefined') {
    var self = this;
    this.context.proceed = false;
    mearm.moveLowerTo(angle, function(state, msg){
      if(state === 'complete' && self.context){
        self.context.proceed = true;
      }
    });
  }
  if(this.context.proceed){
    return null;
  }
  this.pushContext('doYield');
  this.pushContext();
}

Process.prototype.mearmMoveUpperTo = function (angle) {
  if(!mearm.ready()) return;
  if (typeof this.context.proceed === 'undefined') {
    var self = this;
    this.context.proceed = false;
    mearm.moveUpperTo(angle, function(state, msg){
      if(state === 'complete' && self.context){
        self.context.proceed = true;
      }
    });
  }
  if(this.context.proceed){
    return null;
  }
  this.pushContext('doYield');
  this.pushContext();
}

Process.prototype.mearmMoveGripTo = function (angle) {
  if(!mearm.ready()) return;
  if (typeof this.context.proceed === 'undefined') {
    var self = this;
    this.context.proceed = false;
    mearm.moveGripTo(angle, function(state, msg){
      if(state === 'complete' && self.context){
        self.context.proceed = true;
      }
    });
  }
  if(this.context.proceed){
    return null;
  }
  this.pushContext('doYield');
  this.pushContext();
}

Process.prototype.mearmStop = function () {
  // interpolated
  if(!mearm.ready()) return;
  if (typeof this.context.proceed === 'undefined') {
    var self = this;
    this.context.proceed = false;
    mearm.stop(function(state, msg){
      if(state === 'complete' && self.context){
        self.context.proceed = true;
      }
    });
  }
  if(this.context.proceed){
    return null;
  }
  this.pushContext('doYield');
  this.pushContext();
}
