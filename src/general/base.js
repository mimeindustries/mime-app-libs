var isChromeApp = function(){
  return window.chrome && chrome.runtime && chrome.runtime.id;
}

var hasLocalStorage = function(){
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

// pull out any hash parameters into an easily accessible variable
window.hashConfig = {};
if(window.location.hash !== ''){
  window.location.hash.replace('#', '').split('&').map(function(el){
    var split = el.split('=');
    hashConfig[split[0]] = split[1];
  });
}

/*
  Update the links so that they preserve the language and mirobot config
*/
var updateLinks = function(){
  [].forEach.call(document.links, function(l) {
    if(l.getAttribute('data-relink') && l.getAttribute('data-relink') === 'false') return;
    if(l.href.startsWith('mailto')) return;
    l.href = l.href.split('?')[0];
    l.href = l.href.split('#')[0];
    // Make the URL have index.html if running as a chrome app
    if(isChromeApp()){
      if(l.href.slice(-1) === '/'){
        l.href += 'index.html';
      }
    }
    // Add the query for the language
    l.href += document.location.search;
    // Add the hash for configuring Mirobot    
    l.href += document.location.hash;
  });
}

var qs = function(e){
  return document.querySelector(e);
}

var qsa = function(e){
  return document.querySelectorAll(e);
}

var remove = function(e){
  if(e.parentNode){
    e.parentNode.removeChild(e);
  }
}

var loadFile = function( src, type, cb ){
  var loaded = false, errored = false, timeout, el;
  if(type === 'js'){
    el = document.createElement('script');
    el.setAttribute("type","text/javascript");
    el.setAttribute("src", src);
  }else if(type === 'css'){
    el = document.createElement("link");
    el.setAttribute("rel", "stylesheet");
    el.setAttribute("type", "text/css");
    el.setAttribute("href", src);
  }
  var noload = function(err) {
    // handling error when loading script
    if(!loaded && !errored && cb){
      cb(false);
    }
    errored = true;
  }
  el.onerror = noload
  el.onload = function(){
    loaded = true;
    delete timeout;
    cb(true);
  }
  document.getElementsByTagName('head')[0].appendChild(el);
  window.setTimeout(noload, 10000);
}
