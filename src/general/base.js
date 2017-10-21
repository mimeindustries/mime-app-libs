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

document.addEventListener('DOMContentLoaded', updateLinks);
