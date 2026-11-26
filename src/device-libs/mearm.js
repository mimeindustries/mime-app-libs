var MeArm = function(url){
  MimeDevice.call(this, url);

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
}
