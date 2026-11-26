var MeArm = function(url){
  MimeDevice.call(this, url);
  var self = this;

  this.addCmd('openGrip');
  this.addCmd('closeGrip');
  this.addCmd('moveBaseTo');
  this.addCmd('moveRightTo');
  this.addCmd('moveLeftTo');
  this.addCmd('moveGripTo');
  this.addCmd('moveJointsTo');
  this.addCmd('getServoState');
  this.addCmd('getLimits');
  this.addCmd('setLimits');
  this.addCmd('resetLimits');

  // The joint limits, as last reported by the arm:
  // {"base":{"min":-90,"max":90,"travelMin":-90,"travelMax":90}, ...}.
  // Empty until the first getLimits reply. Every getLimits, setLimits and
  // resetLimits reply updates it and fires a 'limitsChange' event with it.
  this.limits = {};

  ['getLimits', 'setLimits', 'resetLimits'].forEach(function(cmd){
    var send = self[cmd];
    self[cmd] = function(arg1, arg2){
      var userCb = typeof arg1 === 'function' ? arg1 : arg2;
      var cb = function(status, msg){
        if(msg && msg.msg && typeof msg.msg === 'object'){
          self.limits = msg.msg;
          self.emitEvent('limitsChange', self.limits);
        }
        if(userCb) userCb(status, msg);
      };
      if(typeof arg1 === 'function' || typeof arg1 === 'undefined') return send.call(self, cb);
      return send.call(self, arg1, cb);
    };
  });

  // Fetch the limits whenever the arm connects
  this.addEventListener('connectedStateChange', function(msg){
    if(msg.state === 'connected') self.getLimits();
  });

  // The allowed range for a joint ('base', 'Right', ...), or undefined if the
  // arm hasn't reported it yet
  this.jointRange = function(joint){
    var l = self.limits[String(joint).toLowerCase()];
    if(!l || typeof l.min !== 'number' || typeof l.max !== 'number') return undefined;
    return {min: Math.min(l.min, l.max), max: Math.max(l.min, l.max)};
  };
}
