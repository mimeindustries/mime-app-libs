var FullscreenMenu = function(el){
  var container = document.querySelector(el);
  container.insertAdjacentHTML('beforeend', '<div id="fullscreen" class="menuItem"><i class="icon icon-resize-full"></i></div>');
  var el = container.querySelector('#fullscreen')
  if(typeof document.fullscreenEnabled === 'undefined') return el.classList.add('hidden');

  var setBodyClass = function(){
    var fn = document.fullscreenElement ? 'add' : 'remove'
    document.body.classList[fn]('fullscreen');
  }

  el.addEventListener('click', function(){
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', setBodyClass, false);
  setBodyClass();
}