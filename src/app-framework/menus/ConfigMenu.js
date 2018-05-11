ConfigMenu = function(el, device, options){
  var self = this;
  var networks = {};

  this.init = function(){
    var container = document.querySelector(el);
    container.insertAdjacentHTML('beforeend', '<div id="config" class="menuItem"><i class="icon icon-cog"></i></div>');
    this.el = container.querySelector('#config');
    
    this.device = device;
    this.device.addEventListener('network', function(c){ self.configHandler(c) });
    this.device.addEventListener('wifiScan', function(c){ self.scanHandler(c) });
    this.device.addEventListener('connectedStateChange', function(m){ 
      if(m.state === 'connected'){
        self.device.getConfig(function(c, msg){
          self.configHandler(msg.msg);
          self.device.startWifiScan();
        });
      }
    });
    this.initMenu();
  }
  
  this.configHandler = function(conf){
    this.conf = conf;
    this.updateMenu();
  }

  this.scanHandler = function(result){
    for(var i in result){
      networks[result[i][0]] = result[i];
    }
    this.updateMenu();
  }
  
  this.initMenu = function(){
    this.el.innerHTML += '<div class="wrapper"><ul class="subMenu"><li><table><tr><td class="label">' + l(':net-wifi', 'WiFi Network') + ':</td><td><select id="staSsid"></select></td></tr><tr><td class="label">' + l(':password', 'Password') + ':</td><td><input id="staPass" type="password" /></td></tr><tr><td class="label">' + l(':ip', 'IP Address') + '</td><td><span class="ip"></span></td></table></li>\
<li class="advanced hidden"><table><tr><td colspan="2"><h4>' + l(':net-settings', 'Network Settings') + '</h4></td></tr><tr class="label"><td class="label">' + l(':dhcp', 'Use DHCP') + ':</td><td><input id="staDhcp" type="checkbox" checked="checked" /></td></tr>\
<tbody id="manualNet" class="hidden"><tr><td class="label">' + l(':ip', 'IP Address') + ':</td><td><input id="staFixedIp" type="text" /></td></tr><tr><td class="label">' + l(':gw', 'Gateway') + ':</td><td><input id="staFixedGateway" type="text" /></td></tr><tr><td class="label">' + l(':nm', 'Netmask') + ':</td><td><input id="staFixedNetmask" type="text" placeholder="255.255.255.0" /></td></tr><tr><td class="label">' + l(':dns', 'DNS Server') + ' 1:</td><td><input id="staFixedDns1" type="text" /></td></tr><tr><td class="label">' + l(':dns', 'DNS Server') + ' 2:</td><td><input id="staFixedDns2" type="text" /></td></tr></tbody>\
<tr><td colspan="2"><h4>' + l(':ap-settings', 'Access Point Settings') + '</h4></td></tr><tr><td class="label">' + l(':ap-name', 'Access Point Name') + ':</td><td><input id="apSsid" type="text" /></td></tr><tr><td class="label">' + l(':pass-prot', 'Password protection') + ':</td><td><input id="apProtected" type="checkbox" /></td></tr><tbody id="apPassword" class="hidden"><tr><td class="label">' + l(':password', 'Password') + ':</td><td><input id="apPass" type="text" /></td></tr></tbody><tr><td colspan="2"><h4>' + l(':update-fw') + '</h4></td></tr><tr><td colspan="2"><a href="#" class="updatefw">' + l(':update-fw-click') + '</a></td></tr><tr><td colspan="2"><a href="#" class="updateui">' + l(':update-ui-click') + '</a></td></tr></table></li>\
<li><button class="saveConfig">' + l(':save', 'Save') + '</button><a class="showAdvanced" href="#">' + l(':advanced', 'Advanced Settings') + '</a> <button class="resetConfig hidden">' + l(':reset-settings', 'Reset Settings') + '</button></li></ul></div>';
    new MainMenu(this.el)
    this.el.querySelector('.showAdvanced').addEventListener('click', function(e){
      self.el.querySelector('.advanced').classList.toggle('hidden');
      self.el.querySelector('.showAdvanced').classList.add('hidden');
      self.el.querySelector('.resetConfig').classList.toggle('hidden');
      e.preventDefault();
      return false;
    });
    this.el.querySelector('.saveConfig').addEventListener('click', function(e){ self.saveConfig(e); });
    this.el.querySelector('.updatefw').addEventListener('click', function(e){ self.updateFW(e); });
    this.el.querySelector('.updateui').addEventListener('click', function(e){ self.updateUI(e); });
    this.el.querySelector('.resetConfig').addEventListener('click', function(e){ self.resetConfig(e); });
    this.el.querySelector('#apProtected').addEventListener('change', function(e){
      var check = e.target || e.srcElement;
      document.querySelector('#apPassword').classList.toggle('hidden', !check.checked);
      e.preventDefault();
      return false;
    });
    this.el.querySelector('#staDhcp').addEventListener('change', function(e){
      var check = e.target || e.srcElement;
      document.querySelector('#manualNet').classList.toggle('hidden', check.checked);
      e.preventDefault();
      return false;
    });
    this.updateMenu();
  }
  
  this.updateMenu = function(){
    // Update the WiFi network list
    var net = this.el.querySelector('#staSsid');
    if(Object.keys(networks).length === 0){
      net.innerHTML = '<option value="">' + l(':scanning', "Scanning for networks...") + '</option>'
      net.disabled = true;
    }else{
      var nets = Object.keys(networks).map(function(n){
        return networks[n];
      }).sort(function(a, b){
        return b[2] - a[2];
      })
      this.el.querySelector('#staSsid').innerHTML = nets.map(function(n){
        var s = '<option value="' + n[0] + '"';
        if(n[0] === self.conf.sta_ssid) s += ' selected="selected"';
        s += '>' + n[0]
        if(n[1]) s += ' &#x1f512; ';
        if(n[0] === self.conf.sta_ssid) s += ' [connected]';
        s += '</option>';
        return s
      });
      net.disabled = false;
    }
    if(this.conf){
      // Update the other network settings
      // DHCP setting
      this.el.querySelector('#staDhcp').checked = this.conf.sta_dhcp;
      document.querySelector('#manualNet').classList.toggle('hidden', this.conf.sta_dhcp);
      this.el.querySelector('.ip').innerHTML = this.conf.sta_ip;
      // Update the manual network settings if we're not using DHCP
      if(!this.conf.sta_dhcp){
        // STA Fixed IP
        this.el.querySelector('#staFixedIp').value = this.conf.sta_fixedip;
        this.el.querySelector('#staFixedGateway').value = this.conf.sta_fixedgateway;
        this.el.querySelector('#staFixedNetmask').value = this.conf.sta_fixednetmask;
        this.el.querySelector('#staFixedDns1').value = this.conf.sta_fixeddns1 || '';
        this.el.querySelector('#staFixedDns2').value = this.conf.sta_fixeddns2 || '';
      }
      // AP SSID
      this.el.querySelector('#apSsid').value = this.conf.ap_ssid;
      // AP Encryption
      this.el.querySelector('#apProtected').checked = this.conf.ap_encrypted;
      document.querySelector('#apPass').classList.toggle('hidden', !this.conf.ap_encrypted);
    }
  }
  
  this.resetConfig = function(e){
    self.device.resetConfig();
    e.preventDefault();
    return false;
  }
  
  this.saveConfig = function(e){
    var newConfig = {
      sta_ssid: document.querySelector('#staSsid').value,
      sta_pass: document.querySelector('#staPass').value,
      sta_dhcp: this.el.querySelector('#staDhcp').checked,
      sta_fixedip: this.el.querySelector('#staFixedIp').value,
      sta_fixedgateway: this.el.querySelector('#staFixedGateway').value,
      sta_fixednetmask: this.el.querySelector('#staFixedNetmask').value,
      sta_fixeddns1: this.el.querySelector('#staFixedDns1').value,
      sta_fixeddns2: this.el.querySelector('#staFixedDns2').value,
      ap_ssid: this.el.querySelector('#apSsid').value,
      ap_pass: document.querySelector('#apPass').value
    }
    // Send the config in groups of 3 because parsing long strings of JSON is memory hungry
    for(var k in newConfig){
      if(newConfig.hasOwnProperty(k) && (newConfig[k] === '' || newConfig[k] === self.conf[k])){
        delete newConfig[k];
      }
    }
    
    var sendConfig = function(){
      var batchSize = 3;
      var toSend = {};
      for(var k in newConfig){
        toSend[k] = newConfig[k];
        delete newConfig[k];
        if(!--batchSize) break;
      }
      if(Object.keys(toSend).length > 0){
        console.log(toSend);
        //Send the request and call again to send them all
        self.device.setConfig(toSend, sendConfig); 
      }else{
        self.device.getConfig();
        self.el.querySelector('.saveConfig').disabled = false;
      }
    }
    this.el.querySelector('.saveConfig').disabled = true;
    sendConfig();
    e.preventDefault();
    return false;
  }
  
  var getVersions = function(cb){
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', 'http://downloads.mime.co.uk/Mirobot/v3/versions.json', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == "200") {
        cb(JSON.parse(xhr.responseText));
      }
    };
    xhr.send(null); 
  }
  
  this.updateFW = function(e){
    if(confirm("Are you sure you want to update the firmware? This may take several minutes. Please do not power off the device during this time.")){
      getVersions(function(res){
        console.log(res);
        self.device.updateFirmware("http://downloads.mime.co.uk/Mirobot/v3/" + res.firmware);
      });
    }
    e.preventDefault();
    return false;
  }
  
  this.updateUI = function(e){
    if(confirm("Are you sure you want to update the user interface? This may take several minutes. Please do not power off the device during this time.")){
      getVersions(function(res){
        self.device.updateUI("http://downloads.mime.co.uk/Mirobot/v3/" + res.ui);
      });
    }
    e.preventDefault();
    return false;
  }
  
  this.init();
}