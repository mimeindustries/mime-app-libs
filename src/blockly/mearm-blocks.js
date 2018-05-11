'use strict';

var tokenise = function(str){
  var re = /(\[\[[^\]]+\]\])/g;
  var m;
  var prevIndex = 0;
  var output = [];
  
  while ((m = re.exec(str)) !== null) {
    if (m.index === re.lastIndex) {
        re.lastIndex++;
    }
    output.push(str.substr(prevIndex, m.index - prevIndex).trim());
    output.push(m[0]);
    prevIndex = m.index + m[0].length;
    
  }
  if(prevIndex < str.length){
    output.push(str.substr(prevIndex, str.length - prevIndex).trim());
  }
  return output
}

Blockly.Mearm = Blockly.JavaScript;

['Base', 'Lower', 'Upper', 'Grip'].map(function(servo){
  Blockly.Blocks['mearm_move' + servo + 'To'] = {
    init: function() {
      var str = l(':move' + servo + 'To-cmd');
      var tokens = tokenise(str);
      for(var i = 0; i< tokens.length; i++){
        if(tokens[i] === '[[angle]]'){
          this.appendValueInput("ANGLE").setCheck("Number");
        }else{
          this.appendDummyInput().appendField(tokens[i]);
        }
      }
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['mearm_move' + servo + 'To'] = function(block) {
    // Generate JavaScript for moving
    var angle = Blockly.JavaScript.valueToCode(block, 'ANGLE', Blockly.JavaScript.ORDER_NONE) || '0';
    return 'mearm.move' + servo + 'To(' + angle + ');\n';
  };

  Blockly.Mearm['mearm_move' + servo + 'To'] = function(block) {
    // Generate JavaScript for moving
    var angle = Blockly.JavaScript.valueToCode(block, 'ANGLE', Blockly.JavaScript.ORDER_NONE) || '0';
    return 'this.move' + servo + 'To(' + angle + ', "' + block.id + '");\n';
  };
});


['open', 'close'].map(function(dir){
  Blockly.Blocks['mearm_' + dir + 'Grip'] = {
    init: function() {
      this.appendDummyInput().appendField(l(':' + dir + 'Grip-cmd'));
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['mearm_' + dir + 'Grip'] = function(block) {
    // Generate JavaScript for pen up/down.
    return 'mearm.' + dir + 'Grip();\n';
  };

  Blockly.Mearm['mearm_' + dir + 'Grip'] = function(block) {
    // Generate JavaScript for pen up/down.
    return 'this.' + dir + 'Grip("' + block.id + '");\n';
  };
});
