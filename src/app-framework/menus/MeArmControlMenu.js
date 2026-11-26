// The joint control panel in the MeArm header.
//
// Normal mode: one slider per joint, between that joint's limits (from the
// firmware's getLimits). Dragging moves the arm. Moves are coalesced: only
// one is in flight at a time and, when it finishes, the latest slider
// positions are sent as a single moveJointsTo, so the arm follows the drag
// without a backlog of stale moves.
//
// Adjust limits mode: each slider becomes a two-handle range over the servo's
// full travel. Releasing a handle tries the new limit out (setLimits with
// "save":false) and moves the joint to it so you can see where it is. Save
// stores the limits on the arm, Cancel puts back the ones from before, and
// Defaults restores the firmware defaults.
var MeArmControlMenu = function(el, mearm){
  var self = this;
  this.connectCb = undefined;
  this.mearm = mearm;

  var JOINTS = [
    {name: 'base',  label: 'Base',  min: -90, max: 90},
    {name: 'right', label: 'Right', min: 0,   max: 90},
    {name: 'left',  label: 'Left',  min: 0,   max: 135},
    {name: 'grip',  label: 'Grip',  min: 0,   max: 90}
  ];

  var sliders = {};      // name -> noUiSlider
  var limits = {};       // name -> {min, max, travelMin, travelMax}
  var angles = {};       // name -> last known angle
  var dragging = {};     // name -> true while the user holds the handle
  var editing = false;
  var savedLimits = null; // limits when Adjust limits was opened, for Cancel

  JOINTS.forEach(function(j){
    limits[j.name] = {min: j.min, max: j.max, travelMin: j.min, travelMax: j.max};
    angles[j.name] = j.min + (j.max - j.min) / 2;
  });

  var deg = function(v){ return Math.round(v) + '&deg;'; };
  var q = function(sel){ return self.el.querySelector(sel); };

  // ---- Coalesced moves ------------------------------------------------------

  var pending = {};
  var inFlight = false;
  var inFlightTimer;

  var queueMove = function(name, angle){
    pending[name] = Math.round(angle);
    angles[name] = Math.round(angle);
    pump();
  };

  var pump = function(){
    if(inFlight || Object.keys(pending).length === 0) return;
    var arg = pending;
    pending = {};
    inFlight = true;
    var done = function(){
      clearTimeout(inFlightTimer);
      inFlight = false;
      pump();
    };
    // Don't wait forever if a reply goes missing
    inFlightTimer = setTimeout(done, 3000);
    self.mearm.moveJointsTo(arg, function(status){
      if(status === 'complete') done();
    });
  };

  // ---- Sliders --------------------------------------------------------------

  var range = function(min, max){
    if(max <= min) max = min + 1; // noUiSlider needs a non-empty range
    return {min: min, max: max};
  };

  var createSlider = function(name){
    var el = q('#' + name + 'Slider');
    if(el.noUiSlider) el.noUiSlider.destroy();
    var lim = limits[name];
    var slider;

    if(editing){
      // Two handles: the joint's limits, anywhere within the servo's travel
      slider = noUiSlider.create(el, {
        start: [lim.min, lim.max],
        connect: [false, true, false],
        step: 1,
        range: range(lim.travelMin, lim.travelMax)
      });
      slider.on('update', function(values){
        q('.joint-' + name + ' .angle').innerHTML = deg(values[0]) + ' to ' + deg(values[1]);
      });
      slider.on('change', function(values, handle){
        var mn = Math.round(Number(values[0])), mx = Math.round(Number(values[1]));
        limits[name].min = mn;
        limits[name].max = mx;
        var arg = {save: false};
        arg[name] = {min: mn, max: mx};
        self.mearm.setLimits(arg);
        // Show where the new end is
        queueMove(name, handle === 0 ? mn : mx);
      });
      setEnds(name, lim.travelMin, lim.travelMax);
    }else{
      var start = Math.min(Math.max(angles[name], lim.min), lim.max);
      slider = noUiSlider.create(el, {
        start: start,
        connect: [true, false],
        step: 1,
        range: range(lim.min, lim.max)
      });
      slider.on('slide', function(values){
        dragging[name] = true;
        queueMove(name, values[0]);
        showAngle(name, values[0]);
      });
      slider.on('end', function(){ dragging[name] = false; });
      setEnds(name, lim.min, lim.max);
      showAngle(name, start);
    }
    sliders[name] = slider;
  };

  var setEnds = function(name, lo, hi){
    q('.joint-' + name + ' .lo').innerHTML = deg(lo);
    q('.joint-' + name + ' .hi').innerHTML = deg(hi);
  };

  var showAngle = function(name, angle){
    if(!editing) q('.joint-' + name + ' .angle').innerHTML = deg(angle);
    var v = self.el.querySelector('.value .' + name);
    if(v) v.innerHTML = deg(angle);
  };

  var buildAll = function(){
    JOINTS.forEach(function(j){ createSlider(j.name); });
    self.el.classList.toggle('editing', editing);
  };

  // ---- Limits ---------------------------------------------------------------

  // Store limits from a getLimits / setLimits / resetLimits reply
  // ({"base":{"min":-90,"max":90,"travelMin":-90,"travelMax":90}, ...}).
  // Joints missing from the reply keep what they had.
  this.applyLimits = function(reply){
    if(!reply || typeof reply !== 'object') return;
    JOINTS.forEach(function(j){
      var r = reply[j.name];
      if(!r || typeof r.min !== 'number' || typeof r.max !== 'number') return;
      var l = limits[j.name];
      l.min = Math.min(r.min, r.max);
      l.max = Math.max(r.min, r.max);
      if(typeof r.travelMin === 'number') l.travelMin = r.travelMin;
      if(typeof r.travelMax === 'number') l.travelMax = r.travelMax;
      // Firmware without travel* reports: allow at least the current limits
      l.travelMin = Math.min(l.travelMin, l.min);
      l.travelMax = Math.max(l.travelMax, l.max);
    });
    // While editing, the sliders are the source of truth: don't move them
    if(!editing) buildAll();
  };

  this.refreshLimits = function(){
    self.mearm.getLimits(function(status, msg){
      if(msg && msg.msg) self.applyLimits(msg.msg);
    });
  };

  var copyLimits = function(){
    var c = {};
    JOINTS.forEach(function(j){ c[j.name] = {min: limits[j.name].min, max: limits[j.name].max}; });
    return c;
  };

  var startEditing = function(){
    savedLimits = copyLimits();
    editing = true;
    buildAll();
  };

  var stopEditing = function(){
    editing = false;
    savedLimits = null;
    buildAll();
  };

  var saveEdits = function(){
    var arg = copyLimits();
    arg.save = true;
    self.mearm.setLimits(arg, function(status, msg){
      if(msg && msg.msg) self.applyLimits(msg.msg);
    });
    stopEditing();
  };

  var cancelEdits = function(){
    var arg = savedLimits;
    arg.save = false;
    JOINTS.forEach(function(j){
      limits[j.name].min = savedLimits[j.name].min;
      limits[j.name].max = savedLimits[j.name].max;
    });
    self.mearm.setLimits(arg, function(status, msg){
      if(msg && msg.msg) self.applyLimits(msg.msg);
    });
    stopEditing();
  };

  var resetToDefaults = function(){
    self.mearm.resetLimits(function(status, msg){
      editing = false;
      savedLimits = null;
      if(msg && msg.msg) self.applyLimits(msg.msg); else buildAll();
    });
  };

  // ---- Set up ---------------------------------------------------------------

  this.init = function(){
    var container = document.querySelector(el);
    container.insertAdjacentHTML('beforeend', this.menuHTML(JOINTS));
    this.el = container.querySelector('#control');
    buildAll();

    var on = function(sel, fn){
      q(sel).addEventListener('click', function(e){ e.preventDefault(); fn(); });
    };
    on('.editLimits', startEditing);
    on('.saveLimits', saveEdits);
    on('.cancelLimits', cancelEdits);
    on('.defaultLimits', resetToDefaults);

    // Keep the sliders in step when an app or the console changes the limits
    ['setLimits', 'resetLimits'].forEach(function(cmd){
      var orig = self.mearm[cmd];
      if(!orig) return;
      self.mearm[cmd] = function(arg1, arg2){
        var userCb = typeof arg1 === 'function' ? arg1 : arg2;
        var wrapped = function(status, msg){
          if(msg && msg.msg && !editing) self.applyLimits(msg.msg);
          if(userCb) userCb(status, msg);
        };
        if(typeof arg1 === 'function' || typeof arg1 === 'undefined') return orig.call(self.mearm, wrapped);
        return orig.call(self.mearm, arg1, wrapped);
      };
    });

    this.mearm.addEventListener('connectedStateChange', function(msg){
      if(msg.state === 'connected'){
        self.refreshLimits();
        self.mearm.getServoState(function(status, msg){ self.handleServoStateChange(msg.msg); });
      }
    });
    this.mearm.addEventListener('servoChange', function(msg){
      self.handleServoStateChange(msg);
    });

    // Opening and closing. The panel stays open while you use it (dragging off
    // the edge doesn't close it). Click the icon again, press Esc or click
    // elsewhere to close. This doesn't use MainMenu: it stops mouseup events
    // leaving the panel, and noUiSlider listens for mouseup on the document to
    // end a drag, so drags inside the panel would never finish.
    var wrapper = q('.wrapper');
    this.el.addEventListener('click', function(e){
      if(wrapper.contains(e.target)) return;   // clicks inside the panel
      self.el.classList.toggle('show');
    });
    var closeIfOutside = function(e){
      if(!self.el.contains(e.target)) self.el.classList.remove('show');
    };
    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('touchstart', closeIfOutside);
    window.addEventListener('keydown', function(e){
      if(e.keyCode === 27) self.el.classList.remove('show');
    });

    this.devices = {};
    this.el.classList.remove('hidden');
  };

  this.updateAngle = function(name, angle){
    angles[name] = angle;
    if(!editing && sliders[name] && !dragging[name]){
      sliders[name].set(angle);
      showAngle(name, angle);
    }else{
      var v = self.el.querySelector('.value .' + name);
      if(v) v.innerHTML = deg(angle);
    }
  };

  this.handleServoStateChange = function(msg){
    if(!msg) return;
    for(var name in msg){
      if(limits[name] && typeof msg[name] === 'number') this.updateAngle(name, msg[name]);
    }
  };

  this.onConnect = function(cb){
    this.connectCb = cb;
  };

  this.init();
};

MeArmControlMenu.prototype.menuHTML = function(joints){
  var values = joints.map(function(j){
    return '<div class="value"><p class="label">' + j.label + '</p><p class="' + j.name + '"></p></div>';
  }).join('');
  var rows = joints.map(function(j){
    return '<div class="joint joint-' + j.name + '">' +
      '<div class="jointHead"><span class="name">' + j.label + '</span><span class="angle"></span></div>' +
      '<div id="' + j.name + 'Slider" class="slider"></div>' +
      '<div class="ends"><span class="lo"></span><span class="hi"></span></div>' +
    '</div>';
  }).join('');
  return '<div id="control" class="menuItem hidden">' +
    '<i class="icon fa icon-sliders fa-2x"></i>' + values +
    '<div class="wrapper"><div class="panel">' +
      '<div class="panelHead">' +
        '<span class="title normalOnly">Joints</span>' +
        '<span class="title editOnly">Adjust limits</span>' +
        '<button class="editLimits normalOnly">Adjust limits</button>' +
      '</div>' +
      '<p class="hint editOnly">Drag the ends of each range. The arm moves to an end when you let go, so you can see where it is.</p>' +
      rows +
      '<div class="buttons editOnly">' +
        '<button class="defaultLimits">Defaults</button>' +
        '<span class="spacer"></span>' +
        '<button class="cancelLimits">Cancel</button>' +
        '<button class="saveLimits primary">Save</button>' +
      '</div>' +
    '</div></div>' +
  '</div>';
};
