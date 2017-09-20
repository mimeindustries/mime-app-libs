var Mearm = function(url){
  MimeDevice.call(this, url);

  this.addCmd('openGrip');
  this.addCmd('closeGrip');
  this.addCmd('moveBaseTo');
  this.addCmd('moveLowerTo');
  this.addCmd('moveUpperTo');
  this.addCmd('moveGripTo');
  this.addCmd('getServoState');
}
