// MeArm-WiFi start-up code for the Blockly app (/a/blockly.js).
// The MeArm blocks and the MearmBlockly editor come from src/blockly/mearm-blocks.js and mearm-blockly.js.
// index.html calls init() once this file has loaded.
var init = function(){
  loadFile('/a/editor.css', 'css', function(res){
    if(!res) return;

    qs('#app').innerHTML =
      '<div id="editor" class="hidden"></div>' +
      '<div id="controlBar" class="hidden"><button class="run">&#9654; <span data-data-l10n=":run">Run</span></button>' +
      '<button class="pause" style="display:none;">&#10074;&#10074; <span data-data-l10n=":pause">Pause</span></button>' +
      '<button class="stop">&#9724; <span data-data-l10n=":stop">Stop</span></button>' +
      '<button class="clear">&#10006; <span data-data-l10n=":clear">Clear</span></button>' +
      '</div>' +
      '<xml id="toolbox" style="display: none">' +
      '  <category name="MeArm" colour="0">' +
      '    <block type="mearm_moveBaseTo"><value name="ANGLE"><block type="math_number"><field name="NUM">0</field></block></value></block>' +
      '    <block type="mearm_moveLowerTo"><value name="ANGLE"><block type="math_number"><field name="NUM">45</field></block></value></block>' +
      '    <block type="mearm_moveUpperTo"><value name="ANGLE"><block type="math_number"><field name="NUM">45</field></block></value></block>' +
      '    <block type="mearm_moveGripTo"><value name="ANGLE"><block type="math_number"><field name="NUM">90</field></block></value></block>' +
      '    <block type="mearm_openGrip"></block>' +
      '    <block type="mearm_closeGrip"></block>' +
      '  </category>' +
      '  <category name="Logic" colour="210" data-l10n=":logic">' +
      '    <block type="controls_if"></block>' +
      '    <block type="logic_compare"></block>' +
      '    <block type="logic_operation"></block>' +
      '    <block type="logic_negate"></block>' +
      '    <block type="logic_boolean"></block>' +
      '    <block type="logic_ternary"></block>' +
      '  </category>' +
      '  <category name="Loops" colour="120" data-l10n=":loops">' +
      '    <block type="controls_repeat_ext"><value name="TIMES"><block type="math_number"><field name="NUM">10</field></block></value></block>' +
      '    <block type="controls_whileUntil"></block>' +
      '    <block type="controls_for"><value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value><value name="TO"><block type="math_number"><field name="NUM">10</field></block></value><value name="BY"><block type="math_number"><field name="NUM">1</field></block></value></block>' +
      '    <block type="controls_forEach"></block>' +
      '    <block type="controls_flow_statements"></block>' +
      '  </category>' +
      '  <category name="Math" colour="230" data-l10n=":math">' +
      '    <block type="math_number"></block>' +
      '    <block type="math_arithmetic"></block>' +
      '    <block type="math_single"></block>' +
      '    <block type="math_trig"></block>' +
      '    <block type="math_constant"></block>' +
      '    <block type="math_number_property"></block>' +
      '    <block type="math_change"><value name="DELTA"><block type="math_number"><field name="NUM">1</field></block></value></block>' +
      '    <block type="math_round"></block>' +
      '    <block type="math_on_list"></block>' +
      '    <block type="math_modulo"></block>' +
      '    <block type="math_constrain"><value name="LOW"><block type="math_number"><field name="NUM">1</field></block></value><value name="HIGH"><block type="math_number"><field name="NUM">100</field></block></value></block>' +
      '    <block type="math_random_int"><value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value><value name="TO"><block type="math_number"><field name="NUM">100</field></block></value></block>' +
      '<block type="math_random_float"></block>' +
      '  </category>' +
      '  <category name="Lists" colour="260" data-l10n=":lists">' +
      '    <block type="lists_create_empty"></block>' +
      '    <block type="lists_create_with"></block>' +
      '    <block type="lists_repeat"><value name="NUM"><block type="math_number"><field name="NUM">5</field></block></value></block>' +
      '    <block type="lists_length"></block>' +
      '    <block type="lists_isEmpty"></block>' +
      '    <block type="lists_indexOf"><value name="VALUE"><block type="variables_get"><field name="VAR">list</field></block></value></block>' +
      '    <block type="lists_getIndex"><value name="VALUE"><block type="variables_get"><field name="VAR">list</field></block></value></block>' +
      '    <block type="lists_setIndex"><value name="LIST"><block type="variables_get"><field name="VAR">list</field></block></value></block>' +
      '    <block type="lists_getSublist"><value name="LIST"><block type="variables_get"><field name="VAR">list</field></block></value></block>' +
      '  </category>' +
      '  <category name="Variables" colour="330" custom="VARIABLE" data-l10n=":variables"></category>' +
      '  <category name="Functions" colour="290" custom="PROCEDURE" data-l10n=":functions"></category></xml>';

    var editor = new MearmBlockly('editor', 'controlBar');
    editor.setMearm(mearm);

    if(hasLocalStorage()){
      new SaveMenu('#menu', {
        saveHandler: function(){ return editor.saveProgram(); },
        loadHandler: function(prog){ return editor.loadProgram(prog); },
        clearHandler: function(){ return editor.clearProgram(); },
        namespace: 'blockly'
      });
    }
  });
};
