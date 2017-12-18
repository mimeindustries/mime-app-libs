var DraggableList = function(el, config){
  var clickTimeout;
  var dragging = false;
  var dragEl;
  var movers;
  var body = qs('body');
  var offset;
  var placeholder;
  
  var setPos = function(el, x, y){
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
  
  // Works out if a point is within an element
  var intersect = function(x, y, el){
    var rect = el.getBoundingClientRect();
    return x >= rect.left &&
           x <= rect.right &&
           y >= rect.top &&
           y <= rect.bottom;
  }
  
  var ancestor = function(el1, el2){
    if(el1 === el2){
      return true;
    }
    while(el1 = el1.parentElement){
      if(el1 === el2){
        return true;
      }
    }
    return false;
  }

  var movePlaceholder = function(event){
    // Create the placeholder if it doesn't exist already
    if(!placeholder){ 
      var div = document.createElement('div');
      div.innerHTML = config.placeholder;
      placeholder = div.childNodes[0];
    }
    
    var target = qs(config.target);
    // If we're over the drop area, work out where to put the placeholder
    var dragRect = dragEl.getBoundingClientRect();
    if(intersect(event.pageX, event.pageY, target)){
      // find the li that's nearest to the cursor and insert placeholder bofore it
      var targets = Array.prototype.slice.call( target.getElementsByTagName('li'), 0 ).filter(function(el){ return !ancestor(el, dragEl) });
      // calculate vertical distances
      var dists = targets.map(function(t){
        return [t, Math.abs(event.pageY - t.getBoundingClientRect().top)];
      });
      // find the nearest
      var nearest = dists.reduce(function(prev, curr){
        return (prev[1] < curr[1] ? prev : curr);
      });
      // insert placeholder before
      nearest[0].parentNode.insertBefore(placeholder, nearest[0]);
      placeholder.style.height = dragEl.getBoundingClientRect().height - 22 + 'px';
    }else{
      if(placeholder){
        remove(placeholder);
      }
    }
  }
  
  var killEvent = function(e){
    e.cancelBubble = true;
    e.stopPropagation();
    e.preventDefault();
    e.returnValue = false;
  }

  var startDrag = function(element, event){
    // Can't stop events bubbling on iOS so resorting to this more manual hack
    if(event.handled){return;}
    event.handled = true;
    // Set the currently selected elements as default, otherwise when copied the settings reset
    var options = element.getElementsByTagName('option');
    for(var i=0; i<options.length; i++){
      options[i].value === options[i].parentNode.value ? options[i].setAttribute("selected", "selected") : options[i].removeAttribute("selected");
    };
    // Either use or copy the node
    dragEl = (config.copy ? element.cloneNode(true) : element)
    // Store the offset of the mouse from top left
    offset = {
      x: event.pageX - element.offsetLeft,
      y: event.pageY - element.offsetTop
    }
    // Style it so it looks the same (padding and border currently hardcoded)
    dragEl.style.width = element.offsetWidth - 22 + 'px';
    dragEl.style.height = element.offsetHeight - 22 + 'px';
    dragEl.style.display = 'block';
    dragEl.style.position = 'absolute';
    dragEl.classList.add('dragged');
    qs('body').classList.add('dragging');
    setPos(dragEl, event.pageX - offset.x, event.pageY - offset.y);
    element.parentElement.appendChild(dragEl);
    movePlaceholder(event);
    dragging = true;
    killEvent(event);
  }
  
  // Called on move to update the position and the placeholder
  var drag = function(event){
    if(!dragging){ return; }
    setPos(dragEl, event.pageX - offset.x, event.pageY - offset.y);
    movePlaceholder(event);
    config.ondrag && config.ondrag();
    killEvent(event);
  }
  
  // Drop it in place
  var stopDrag = function(event){
    if(!dragging){return;}
    if(movers){
      movers.detach('movers');
      movers = undefined;
    }
    dragging = false;
    qs('body').classList.remove('dragging');
    dragEl.classList.remove('dragged');
    dragEl.parentNode.removeChild( dragEl );
    if(placeholder.parentNode){
      placeholder.parentNode.insertBefore(dragEl, placeholder);
      if(!dragEl._draggable){
        new DraggableList(dragEl, {
          target: config.target,
          placeholder: '<li class="placeholder"/>',
          copy: false
        });
      }
    }
    
    dragEl.style.width = ''
    dragEl.style.height = '';
    dragEl.style.display = '';
    dragEl.style.position = '';
    
    remove(placeholder);
    killEvent(event);
    config.onchange && config.onchange();
    config.copy && config.onaddelem && config.onaddelem(dragEl);
  }
  
  // Monolithic event handler for all of the events
  var eventHandler = function(event, element){
    var elType = (event.target || event.srcElement).nodeName.toLowerCase();
    if(elType !== 'select' && elType !== 'input'){
      if(event.type === 'mousedown'){
        // start listening to move and up
        movers = addEventHandlers(['mouseup', 'mousemove'], body, 'movers');
        // start dragging
        startDrag(element, event);
      }else if(event.type === 'touchstart'){
        // Add a small delay to differentiate from page scroll
        clickTimeout = window.setTimeout(function(){
          startDrag(element, event);
        }, 100);
        // start listening to move and end
        movers = addEventHandlers(['touchend', 'touchmove'], body, 'movers');
      }else if(event.type === 'touchend' || event.type === 'mouseup'){
        // Clear the timeout if we've released before it triggered
        if(clickTimeout){
          clearTimeout(clickTimeout);
        }
        // Stop dragging
        stopDrag(event);
      }else if(event.type === 'touchmove' || event.type === 'mousemove'){
        // Clear the timeout if we've moved before it triggered
        if(clickTimeout){
          clearTimeout(clickTimeout);
        }
        // Stop dragging
        drag(event);
      }
    }
  }
  
  // Attach handlers
  var addEventHandlers = function(events, el, ns){
    ns = (ns ? '.' + ns : '');
    for(var i=0; i<events.length; i++){ 
      var ev = events[i];
      el.addEventListener(events[i], function(event){eventHandler(event, el)});
      if(ev === 'mousedown' || ev === 'touchstart'){
        // Stop event propagation on form elements
        var tags = el.getElementsByTagName('select');
        for(var j = 0; j< tags.length; j++){
          tags[j].addEventListener(ev, function(e){e.stopPropagation();});
        }
        var tags = el.getElementsByTagName('input');
        for(var j = 0; j< tags.length; j++){
          tags[j].addEventListener(ev, function(e){e.stopPropagation();});
        }
      }
    };
  }
  
  var initElement = function(el){
    console.log(el);
    addEventHandlers(['mousedown', 'touchstart'], el);
    el._draggable = true;
  }
  
  if(typeof el.length !== 'undefined'){
    for(var i=0; i< el.length; i++){
      initElement(el[i]);
    }
  }else{
    initElement(el);
  }
  
}
  

