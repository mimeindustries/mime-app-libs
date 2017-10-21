var Mirobot = function(url){
  MimeDevice.call(this, url);

  this.addCmd('forward');
  this.addCmd('back');
  this.addCmd('left');
  this.addCmd('right');
  this.addCmd('penup');
  this.addCmd('pendown');
  this.addCmd('beep');
  this.addCmd('collide');
  this.addCmd('follow');
  this.addCmd('slackCalibration');
  this.addCmd('moveCalibration');
  this.addCmd('turnCalibration');

  this.move = function(direction, distance, cb){
    this.send({cmd: direction, arg: distance}, cb);
  }

  this.turn = function(direction, angle, cb){
    if(angle < 0){
      angle = -angle;
      direction = (direction === 'left' ? 'right' : 'left')
    }
    this.send({cmd: direction, arg: angle}, cb);
  }

  this.calibrateSlack = function(steps, cb){
    this.send({cmd: 'calibrateSlack', arg: "" + steps}, cb);
  }

  this.calibrateMove = function(factor, cb){
    this.send({cmd: 'calibrateMove', arg: "" + factor}, cb);
  }

  this.calibrateTurn = function(factor, cb){
    this.send({cmd: 'calibrateTurn', arg: "" + factor}, cb);
  }

  this.collideState = function(cb){
    if(this.sensorState.collide === null || !this.collideListening){
      var self = this;
      this.send({cmd: 'collideState'}, function(state, msg){
        if(state === 'complete'){
          self.sensorState.collide = msg.msg;
          cb(self.sensorState.collide);
        }
      });
    }else{
      cb(this.sensorState.collide);
    }
  }

  this.followState = function(cb){
    if(this.sensorState.follow === null || !this.followListening){
      var self = this;
      this.send({cmd: 'followState'}, function(state, msg){
        if(state === 'complete'){
          self.sensorState.follow = msg.msg;
          cb(self.sensorState.follow);
        }
      });
    }else{
      cb(this.sensorState.follow);
    }
  }

  this.collideSensorNotify = function(state, cb){
    var self = this;
    this.send({cmd: 'collideNotify', arg: (state ? 'true' : 'false')}, function(){
      self.collideListening = true;
      cb();
    });
  }

  this.followSensorNotify = function(state, cb){
    var self = this;
    this.send({cmd: 'followNotify', arg: (state ? 'true' : 'false')}, function(){
      self.followListening = true;
      cb();
    });
  }
}
