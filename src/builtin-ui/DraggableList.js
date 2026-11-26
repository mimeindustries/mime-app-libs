// Drag and drop for the built-in UI's function blocks.
//
// new DraggableList(elOrElements, config)
//   config.target       selector of the list blocks can be dropped into
//   config.placeholder  HTML of the placeholder shown where the block will land
//   config.copy         true to drag a copy (the toolbox), false to move the block itself (the program)
//   config.ondrag       called when the placeholder moves to a different list (e.g. to update hints)
//   config.onchange     called after a drop
//   config.onaddelem    called with the new element after a copy is dropped
//
// Mouse drags start once the pointer has moved a few pixels with the button down. Touch drags start
// after a short press-and-hold, so a quick swipe still scrolls the page. Releasing a picked-up block
// without moving it puts it back.
//
// A press that doesn't become a drag is a tap. Double-tapping a block in the program deletes it;
// double-tapping one in the toolbox adds a copy to the end of the program. While dragging, the block follows the pointer with a CSS transform and the
// placeholder is updated at most once per animation frame.
var DraggableList = function(el, config){
  var HOLD_MS = 150;        // touch: how long to hold before the block picks up
  var MOVE_SLOP = 10;       // touch: how far (px) the finger may wander during the hold
  var EDGE = 0.12;          // auto-scroll when within this fraction of the viewport's top/bottom
  var MAX_SCROLL = 18;      // auto-scroll speed at the very edge, px per frame
  var DRAG_SLOP = 5;        // mouse: how far (px) to move with the button down before a drag starts
  var DOUBLE_TAP_MS = 400;  // two taps on the same block within this are a double tap

  var state = null;         // the drag in progress, if any

  var killEvent = function(e){
    e.stopPropagation();
    if(e.cancelable) e.preventDefault();
  };

  var isFormElement = function(t){
    var name = t && t.nodeName ? t.nodeName.toLowerCase() : '';
    return name === 'select' || name === 'input' || name === 'option' || name === 'button';
  };

  var point = function(e){
    var t = e.touches && e.touches.length ? e.touches[0] : (e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e);
    return { x: t.clientX, y: t.clientY };
  };

  var makePlaceholder = function(){
    var div = document.createElement('div');
    div.innerHTML = config.placeholder;
    return div.firstChild;
  };

  // Keep the current choice in each <select> when the block is copied
  var keepSelections = function(element){
    var options = element.getElementsByTagName('option');
    for(var i = 0; i < options.length; i++){
      if(options[i].value === options[i].parentNode.value){
        options[i].setAttribute('selected', 'selected');
      }else{
        options[i].removeAttribute('selected');
      }
    }
  };

  var startDrag = function(element, p){
    keepSelections(element);

    var rect = element.getBoundingClientRect();
    var dragEl = config.copy ? element.cloneNode(true) : element;
    var target = document.querySelector(config.target);

    state = {
      element: element,
      dragEl: dragEl,
      target: target,
      placeholder: makePlaceholder(),
      // Where in the block it was grabbed, so it doesn't jump to the pointer
      grab: { x: p.x - rect.left, y: p.y - rect.top },
      origin: { x: rect.left, y: rect.top },
      pointer: p,
      start: p,
      moved: false,
      frame: null,
      lastList: null
    };

    // The dragged block floats above the page at its current size. Its size is fixed here because
    // position:fixed takes it out of the list's layout.
    dragEl.style.width = rect.width + 'px';
    dragEl.style.height = rect.height + 'px';
    dragEl.style.left = rect.left + 'px';
    dragEl.style.top = rect.top + 'px';
    dragEl.classList.add('dragged');
    if(config.copy){
      element.parentNode.appendChild(dragEl);
    }
    state.placeholder.style.height = rect.height + 'px';
    document.body.classList.add('dragging');
    scheduleFrame();
  };

  var scheduleFrame = function(){
    if(state && !state.frame){
      state.frame = window.requestAnimationFrame(frame);
    }
  };

  // All reading and writing of layout during a drag happens here, once per frame
  var frame = function(){
    if(!state) return;
    state.frame = null;
    var p = state.pointer;

    // Measure first (placeholder, auto-scroll), then move the floating block. Writing the transform
    // before measuring would make the browser lay out the page again just to answer the measurement.
    updatePlaceholder(p);
    autoScroll(p);
    // A transform needs no layout, just compositing
    state.dragEl.style.transform = 'translate3d(' + (p.x - state.grab.x - state.origin.x) + 'px,' +
                                                    (p.y - state.grab.y - state.origin.y) + 'px,0)';
  };

  var updatePlaceholder = function(p){
    var s = state;
    var targetRect = s.target.getBoundingClientRect();
    var over = p.x >= targetRect.left && p.x <= targetRect.right && p.y >= targetRect.top && p.y <= targetRect.bottom;
    if(!over){
      if(s.placeholder.parentNode){
        s.placeholder.parentNode.removeChild(s.placeholder);
        changedList(null);
      }
      return;
    }

    // While the pointer is over the placeholder, leave it where it is. Otherwise inserting it would push
    // the item under the pointer down, a different item would become nearest, and it would flicker.
    if(s.placeholder.parentNode){
      var pr = s.placeholder.getBoundingClientRect();
      if(p.y >= pr.top && p.y <= pr.bottom) return;
    }

    // Read: the list items the block could go before, nearest to the pointer first
    var items = s.target.getElementsByTagName('li');
    var nearest = null, best = Infinity;
    for(var i = 0; i < items.length; i++){
      var li = items[i];
      if(li === s.placeholder || li === s.dragEl || s.dragEl.contains(li)) continue;
      var d = Math.abs(p.y - li.getBoundingClientRect().top);
      if(d < best){ best = d; nearest = li; }
    }
    if(!nearest) return;

    // Write: only when the placeholder actually needs to move
    if(s.placeholder.nextSibling !== nearest || s.placeholder.parentNode !== nearest.parentNode){
      nearest.parentNode.insertBefore(s.placeholder, nearest);
      changedList(nearest.parentNode);
    }
  };

  var changedList = function(list){
    if(state.lastList !== list){
      state.lastList = list;
      config.ondrag && config.ondrag();
    }
  };

  // Scroll the program when the block is held near its top or bottom edge, so blocks can be dragged
  // to parts of the program that are out of view
  var autoScroll = function(p){
    var scroller = scrollParent(state.target);
    var isPage = scroller === (document.scrollingElement || document.documentElement);
    var top = 0, bottom = window.innerHeight;
    if(!isPage){
      var r = scroller.getBoundingClientRect();
      top = Math.max(r.top, 0);
      bottom = Math.min(r.bottom, window.innerHeight);
    }
    if(p.y < top || p.y > bottom) return;
    var edge = (bottom - top) * EDGE, dy = 0;
    if(p.y < top + edge) dy = -MAX_SCROLL * (1 - (p.y - top) / edge);
    else if(p.y > bottom - edge) dy = MAX_SCROLL * (1 - (bottom - p.y) / edge);
    if(dy){
      var before = scroller.scrollTop;
      scroller.scrollTop += dy;
      if(scroller.scrollTop !== before) scheduleFrame();
    }
  };

  var scrollParent = function(node){
    while(node && node !== document.body){
      var oy = window.getComputedStyle(node).overflowY;
      if((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };

  var move = function(p){
    if(!state) return;
    state.pointer = p;
    if(Math.abs(p.x - state.start.x) > DRAG_SLOP || Math.abs(p.y - state.start.y) > DRAG_SLOP) state.moved = true;
    scheduleFrame();
  };

  var endDrag = function(cancelled){
    if(!state) return;
    // Picked up and put down without moving: put it back, don't delete or add it
    if(!state.moved) cancelled = true;
    var s = state;
    state = null;
    if(s.frame) window.cancelAnimationFrame(s.frame);
    document.body.classList.remove('dragging');

    var dragEl = s.dragEl;
    dragEl.classList.remove('dragged');
    dragEl.style.width = dragEl.style.height = dragEl.style.left = dragEl.style.top = dragEl.style.transform = '';

    var dropped = !cancelled && s.placeholder.parentNode;
    if(dropped){
      s.placeholder.parentNode.insertBefore(dragEl, s.placeholder);
      if(!dragEl._draggable){
        new DraggableList(dragEl, {
          target: config.target,
          placeholder: config.placeholder,
          copy: false,
          ondrag: config.ondrag,
          onchange: config.onchange
        });
      }
    }else if(config.copy || !cancelled){
      // A copy dropped outside the program is discarded; a program block dragged out is deleted
      if(dragEl.parentNode) dragEl.parentNode.removeChild(dragEl);
    }
    if(s.placeholder.parentNode) s.placeholder.parentNode.removeChild(s.placeholder);

    // The list the block came from may now be empty
    config.ondrag && config.ondrag();
    if(!cancelled){
      config.onchange && config.onchange();
      if(dropped && config.copy && config.onaddelem) config.onaddelem(dragEl);
    }
  };

  // --- Taps --------------------------------------------------------------------------------------
  var lastTap = null;

  var tap = function(element){
    var now = Date.now();
    if(lastTap && lastTap.element === element && now - lastTap.time < DOUBLE_TAP_MS){
      lastTap = null;
      doubleTap(element);
    }else{
      lastTap = { element: element, time: now };
    }
  };

  var doubleTap = function(element){
    var target = document.querySelector(config.target);
    if(!target) return;
    if(config.copy){
      // Toolbox: add a copy to the end of the program (before its hint)
      keepSelections(element);
      var copy = element.cloneNode(true);
      var end = null;
      for(var i = 0; i < target.children.length; i++){
        if(target.children[i].classList.contains('end')) end = target.children[i];
      }
      target.insertBefore(copy, end);
      new DraggableList(copy, {
        target: config.target,
        placeholder: config.placeholder,
        copy: false,
        ondrag: config.ondrag,
        onchange: config.onchange
      });
      copy.classList.add('justAdded');
      window.setTimeout(function(){ copy.classList.remove('justAdded'); }, 600);
      if(copy.scrollIntoView) copy.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      config.ondrag && config.ondrag();
      config.onchange && config.onchange();
      config.onaddelem && config.onaddelem(copy);
    }else{
      // Program: delete the block
      if(element.parentNode) element.parentNode.removeChild(element);
      config.ondrag && config.ondrag();
      config.onchange && config.onchange();
    }
  };

  // --- Mouse ---------------------------------------------------------------------------------------
  // Listeners for the rest of the press are added on mousedown and removed again when it ends. The
  // block is only picked up once the pointer has moved, so a click is a tap, not a drag.
  var mouseDown = function(e){
    if(e.button !== 0 || e._dragHandled || isFormElement(e.target)) return;
    e._dragHandled = true;  // nested blocks: only the innermost one picks up
    var element = this;
    var start = point(e);
    var onMove = function(ev){
      var p = point(ev);
      if(!state && (Math.abs(p.x - start.x) > DRAG_SLOP || Math.abs(p.y - start.y) > DRAG_SLOP)){
        startDrag(element, start);
      }
      move(p);
      ev.preventDefault();
    };
    var onUp = function(ev){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if(state) endDrag(false);
      else tap(element);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    killEvent(e);
  };

  // --- Touch ---------------------------------------------------------------------------------------
  // Touch events keep going to the element the finger started on, so these listeners live on each
  // block and are added once. touchmove is non-passive so the page doesn't scroll during a drag.
  var hold = null;

  var touchStart = function(e){
    if(e._dragHandled || e.touches.length > 1 || isFormElement(e.target)) return;
    e._dragHandled = true;
    var element = this;
    var p = point(e);
    hold = {
      element: element,
      start: p,
      timer: window.setTimeout(function(){
        hold = null;
        startDrag(element, p);
        if(navigator.vibrate) navigator.vibrate(10);
      }, HOLD_MS)
    };
  };

  var touchMove = function(e){
    if(state){
      move(point(e));
      killEvent(e);
    }else if(hold && !e._dragHandled){
      // Moved before the hold finished: it's a scroll, not a drag
      var p = point(e);
      if(Math.abs(p.x - hold.start.x) > MOVE_SLOP || Math.abs(p.y - hold.start.y) > MOVE_SLOP){
        window.clearTimeout(hold.timer);
        hold = null;
      }
    }
    e._dragHandled = true;
  };

  var touchEnd = function(e){
    if(hold){
      // Lifted before the hold picked the block up: a tap
      window.clearTimeout(hold.timer);
      var tapped = hold.element;
      hold = null;
      if(e.type === 'touchend' && !e._dragHandled){
        e._dragHandled = true;
        tap(tapped);
        // Stop the browser turning the double tap into a zoom or a click
        if(e.cancelable) e.preventDefault();
      }
    }
    if(state && !e._dragHandled){
      e._dragHandled = true;
      // Picked up by the hold but never moved: a slower tap
      var tapped = !state.moved && e.type === 'touchend' ? state.element : null;
      endDrag(e.type === 'touchcancel');
      killEvent(e);
      if(tapped) tap(tapped);
    }
  };

  var initElement = function(element){
    if(element._draggable) return;
    element._draggable = true;
    element.addEventListener('mousedown', mouseDown);
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('touchend', touchEnd);
    element.addEventListener('touchcancel', touchEnd);
    // Stop the browser's own drag, text selection and long-press menu getting in the way
    element.addEventListener('dragstart', function(e){ e.preventDefault(); });
    element.addEventListener('contextmenu', function(e){ if(state) e.preventDefault(); });
  };

  if(typeof el.length !== 'undefined'){
    for(var i = 0; i < el.length; i++){
      initElement(el[i]);
    }
  }else{
    initElement(el);
  }
};
