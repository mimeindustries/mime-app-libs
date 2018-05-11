var MainMenu = function(el, options){
  var timer, autohide;

  if(options && typeof options.autohide !== 'undefined'){
    autohide = options.autohide;
  }else{
    autohide = true;
  }
  
  var toggleMenu = function(e){
    el.classList.toggle('show');
    e.preventDefault();
    return false;
  }

  var hideMenu = function(e){
    el.classList.remove('show');
    if(e) e.preventDefault();
    return false;
  }  

  var handleKeyboard = function(e){
    if(e.keyCode === 27){
      hideMenu();
      e.preventDefault();
      return false;
    }
  }

  el.addEventListener('mouseup', toggleMenu);
  el.querySelector('.wrapper').addEventListener('mouseup', function(e){
    e.stopPropagation();
  });
  if(autohide){
    el.addEventListener('mouseleave', function(){
      timer = window.setTimeout(hideMenu, 500);
    });
    el.addEventListener('mouseenter', function(){
      if(timer){
        window.clearTimeout(timer);
        timer = undefined;
      }
    });
  }
  window.addEventListener("keydown", function(e){ handleKeyboard(e);}, false);
  
  this.addItem = function(text, click){
    var sub = el.querySelector('ul.subMenu')
    var li = document.createElement('li');
    li.innerHTML = text;
    li.addEventListener('click', click);
    sub.appendChild(li);
  }
}
