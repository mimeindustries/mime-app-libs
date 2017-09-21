var MimeDevice = function(url){
  this.url = url;
  if(url) this.connect();
  this.cbs = {};
  this.listeners = [];
  this.connected = false;
  this.error = false;
  this.timeoutTimer = undefined;
  this.devices = {};
  this.discoveryURL = undefined;
  this.deviceState = 'idle',
  this.msg_stack = [],
  this.immediateCmds = ['stop', 'pause', 'resume', 'ping', 'version']

  this.connect = function(url){
    if(url) this.url = url;
    if(!this.connected && !this.error && this.url){
      var self = this;
      this.has_connected = false;
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = function(ws_msg){self.handle_msg(ws_msg)};
      this.ws.onopen = function(){
        self.connected = true;
        self.version(function(){
          self.setConnectedState(true);
        });
      }
      this.ws.onerror = function(err){self.handleError(err)}
      this.ws.onclose = function(err){self.handleError(err)}
      this.connTimeout = window.setTimeout(function(){
        if(!self.connected){
          self.ws.close();
        }
      }, 1000);
    }
  }
  
  this.fetchDevices = function(cb){
    if(!this.discoveryURL) return cb(false);
    var self = this;
    var req = new XMLHttpRequest();
    req.addEventListener("load", function(){
      var resp = JSON.parse(this.responseText);
      if(resp.devices && resp.devices.length > 0){
        for(var i = 0; i< resp.devices.length; i++){
          self.devices[resp.devices[i].address] = resp.devices[i];
        }
        cb(self.devices);
      }
    });
    req.addEventListener("error", function(e){
      console.log('Error fetching devices list');
      console.log(e);
    });
    req.open("GET", this.discoveryURL);
    req.send();
  }

  this.disconnect = function(){
    this.connected = false;
    this.error = false
    this.ws.onerror = function(){};
    this.ws.onclose = function(){};
    this.ws.close();
  }

  this.setConnectedState = function(state){
    var self = this;
    clearTimeout(self.connTimeout);
    self.connected = state;
    if(state){ self.has_connected = true; }
    setTimeout(function(){
      self.emitEvent('readyStateChange', {state: (self.ready() ? 'ready' : 'notReady')});
      self.emitEvent('connectedStateChange', {state: (self.connected ? 'connected' : 'disconnected')});
    }, 500);
    // Try to auto reconnect if disconnected
    if(state){
      if(self.reconnectTimer){
        clearTimeout(self.reconnectTimer);
        self.reconnectTimer = undefined;
      }
    }else{
      if(!self.reconnectTimer){
        self.reconnectTimer = setTimeout(function(){
          self.reconnectTimer = undefined;
          self.connect();
        }, 5000);
      }
    }
  }

  this.setSimulator = function(sim){
    this.sim = sim;
  }

  this.setSimulating = function(s){
    this.simulating = s;
    this.emitEvent('readyStateChange', {state: (this.ready() ? 'ready' : 'notReady')});
  }

  this.ready = function(){
    return this.connected || this.simulating;
  }
  
  this.emitEvent = function(event, msg){
    if(typeof this.listeners[event] !== 'undefined'){
      for(var i = 0; i< this.listeners[event].length; i++){
        this.listeners[event][i](msg);
      }
    }
  }

  this.addEventListener = function(event, listener){
    this.listeners[event] =  this.listeners[event] || [];
    this.listeners[event].push(listener);
  }

  this.handleError = function(err){
    if(err instanceof CloseEvent || err === 'Timeout'){
      if(this.ws.readyState === WebSocket.OPEN){
        this.ws.close();
      }
      this.msg_stack = [];
    }else{
      console.log(err);
    }
    this.setConnectedState(false);
  }

  this.send = function(msg, cb){
    msg.id = Math.random().toString(36).substr(2, 10)
    if(cb){
      this.cbs[msg.id] = cb;
    }
    if(msg.arg){ msg.arg = msg.arg.toString(); }
    if(this.immediateCmds.indexOf(msg.cmd) >= 0){
      this.send_msg(msg);
    }else{
      if(this.msg_stack.length === 0){
        this.emitEvent('programStart');
      }
      this.msg_stack.push(msg);
      this.process_msg_queue();
    }
  }
  
  this.send_msg = function(msg){
    var self = this;
    console.log(msg);
    if(this.simulating && this.sim){
      this.sim.send(msg, function(msg){ self.handle_msg(msg) });
    }else if(this.connected){
      this.ws.send(JSON.stringify(msg));
      if(this.timeoutTimer) clearTimeout(this.timeoutTimer);
      this.timeoutTimer = window.setTimeout(function(){ self.handleError("Timeout") }, 3000);
    }
  }
  
  this.process_msg_queue = function(){
    if(this.deviceState === 'idle' && this.msg_stack.length > 0){
      this.deviceState = 'receiving';
      this.send_msg(this.msg_stack[0]);
    }
  }
  
  this.handle_msg = function(msg){
    if(typeof msg === 'object' && typeof msg.data === 'string') msg = JSON.parse(msg.data);
    console.log(msg);
    clearTimeout(this.timeoutTimer);
    if(msg.status === 'notify'){
      this.emitEvent(msg.id, msg.msg);
      return;
    }
    if(this.msg_stack.length > 0 && this.msg_stack[0].id == msg.id){
      if(msg.status === 'accepted'){
        if(this.cbs[msg.id]){
          this.cbs[msg.id]('started', msg);
        }
        this.deviceState = 'running';
      }else if(msg.status === 'complete'){
        if(this.cbs[msg.id]){
          this.cbs[msg.id]('complete', msg);
          delete this.cbs[msg.id];
        }
        this.msg_stack.shift();
        if(this.msg_stack.length === 0){
          this.emitEvent('programComplete');
        }
        this.deviceState = 'idle';
        this.process_msg_queue();
      }
    }else{
      if(this.cbs[msg.id]){
        this.cbs[msg.id]('complete', msg);
        delete this.cbs[msg.id];
      }
    }
    if(msg.status && msg.status === 'error' && msg.msg === 'Too many connections'){
      this.error = true;
      this.emitEvent('error');
    }
  }
  
  this.stop = function(cb){
    var self = this;
    this.send({cmd:'stop'}, function(state, msg, recursion){
      if(state === 'complete' && !recursion){
        for(var i in self.cbs){
          self.cbs[i]('complete', undefined, true);
        }
        self.emitEvent('programComplete');
        self.robot_state = 'idle';
        self.msg_stack = [];
        self.cbs = {};
        if(cb){ cb(state); }
      }
    });
  },
  
  this.addCmd = function(cmd){
    this[cmd] = function(cb, arg){
      var msg = {cmd: cmd};
      if(typeof arg !== 'undefined') msg.arg = arg;
      this.send(msg, cb);
    }
  }
  
  this.addCmd('ping');
  this.addCmd('version');
}

var MeArm = function(url){
  MimeDevice.call(this, url);

  this.addCmd('openGrip');
  this.addCmd('closeGrip');
  this.addCmd('moveBaseTo');
  this.addCmd('moveLowerTo');
  this.addCmd('moveUpperTo');
  this.addCmd('moveGripTo');
  this.addCmd('getServoState');
}
