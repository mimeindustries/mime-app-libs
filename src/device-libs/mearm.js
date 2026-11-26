var MeArm = function(url){
  MimeDevice.call(this, url);

  this.addCmd('openGrip');
  this.addCmd('closeGrip');
  this.addCmd('moveBaseTo');
  this.addCmd('moveRightTo');
  this.addCmd('moveLeftTo');
  this.addCmd('moveGripTo');
  this.addCmd('getServoState');
}
