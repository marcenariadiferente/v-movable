import Vue from 'vue';

const pxVal = v => Number(v.replace(/[^0-9]/g,''));
const childOf = (pid,child) => {
  while(child.getAttribute('moveid') !== pid){
    child = child.parentElement;
    if (child.tagName === 'BODY'){
      return false;
    }
  }
  return true;
};

const getClickOffset = event => {
  const coords = { x: event.pageX, y: event.pageY };
  const off = event.target.getBoundingClientRect();
  return {
    x: coords.x - (off.left + document.body.scrollLeft),
    y: coords.y - (off.top + document.body.scrollTop)
  };
};

const guid = ()=> 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

Vue.directive('movable',{
  update(el,binding){
    //let target = binding.value.target || el;
    if(el.getAttribute('moveid')){
      return;
    }
    let args = binding.value;
    let grid = args.grid || 1;
    let bounds = args.bounds || null; /*{ // boundaries from start of move
			x: [null, null], // min. max
			y: [null, null] // min, max
			};*/
    let actualBounds = { left: null, top: null };
    let target = args.target || el;
    target.style.touchAction = 'none';
    let moveid = guid();
    let targetId = 'target' + moveid;
    target.setAttribute('moveid',targetId);
    el.setAttribute('moveid', moveid);

    let onstart = args.onstart;
    let onmove = args.onmove;
    let oncomplete = args.oncomplete;
    let moveObj = {}; // var placeholder for instance of move function
    let isMoving;
    let pointerId;

    const init = () => {
      setBounds();
      document.body.addEventListener('pointerdown', (event) => {
        let etarget = event.target;
        //let mid = etarget.getAttribute('moveid');
        if (target.classList.contains('disabled') || etarget.classList.contains('fa-close')) {
          return;
        }
        else if (etarget.getAttribute('moveid') === targetId || !childOf(moveid,etarget) || isMoving) {
          return;
        }

        document.body.setPointerCapture(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
        if (event.pointerId !== undefined) {
          pointerId = event.pointerId;
        }
        moveInit(event);

        document.body.addEventListener('pointerup', unbind, false);
        document.body.addEventListener('pointermove', function (evt) {
          //console.log(evt);
          if (pointerId !== undefined && evt.pointerId === pointerId) {
            motionHandler(evt);
          }
        }, false);
      }, false);
    };

    function setBounds(newBounds) {
      bounds = newBounds || bounds;
      if (!bounds) {
        actualBounds.left = [0 - Infinity, Infinity];
        actualBounds.top = [0 - Infinity, Infinity];
        return;
      }
      let css = {
        left: parseFloat(el.style.left) || 0,
        top: parseFloat(el.offsetTop) || 0
      };
      if (bounds.x) {
        actualBounds.left = [css.left + bounds.x[0], css.left + bounds.x[1]];
      } else {
        actualBounds.left = [0 - Infinity, Infinity];
      }
      if (bounds.y) {
        actualBounds.top = [css.top + bounds.y[0], css.top + bounds.y[1]];
      } else {
        actualBounds.top = [0 - Infinity, Infinity];
      }
    }

    //#endregion



    //#region event handlers
    const moveInit = event => {
      moveObj.mouseCoord = getCoord(event);
      moveObj.startCoord = { x: pxVal(target.style.left), y: pxVal(target.style.top) };
      if (isNaN(moveObj.startCoord.x)) moveObj.startCoord.x = 0;
      if (isNaN(moveObj.startCoord.y)) moveObj.startCoord.y = 0;
      moveObj.moveDist = { x: 0, y: 0 };
      moveObj.totalDist = { x: 0, y: 0 };
      moveObj.clickOffset = getClickOffset(event);
      moveObj.css = { top: moveObj.startCoord.y, left: moveObj.startCoord.x };
      moveObj.maxX = actualBounds.left[0] + actualBounds.left[1];
      moveObj.maxY = actualBounds.top[0] + actualBounds.top[1];
      isMoving = true;
      if (onstart) {
        onstart(moveObj);
      }
      //el.trigger('dragstart');
    };

    const motionHandler = function (evt) {
      evt.stopPropagation();
      let newCoord = getCoord(evt);
      moveObj.moveDist = {
        x: newCoord.x - moveObj.mouseCoord.x,
        y: newCoord.y - moveObj.mouseCoord.y
      };
      moveObj.mouseCoord = newCoord;
      moveObj.css.top += moveObj.moveDist.y;
      moveObj.css.left += moveObj.moveDist.x;
      moveObj.totalDist = {
        x: moveObj.totalDist.x + moveObj.moveDist.x,
        y: moveObj.totalDist.y + moveObj.moveDist.y
      };

      moveObj.gridCss = {
        left: (Math.round(moveObj.totalDist.x / grid) * grid) + moveObj.startCoord.x,
        top: (Math.round(moveObj.totalDist.y / grid) * grid) + moveObj.startCoord.y
      };
      moveObj.css = moveObj.gridCss;


      moveObj.css.top = Math.min(Math.max(actualBounds.top[0], moveObj.css.top), actualBounds.top[1]);
      moveObj.css.left = Math.min(Math.max(actualBounds.left[0], moveObj.css.left), actualBounds.left[1]);
      moveObj.pctX = Math.max(actualBounds.left[0], moveObj.css.left) / moveObj.maxX;
      moveObj.pctY = Math.max(actualBounds.top[0], moveObj.css.top) / moveObj.maxY;
      args.reposition(moveObj.css);

      if (onmove) {
        onmove(moveObj);
      }

    };

    const unbind = (evt) => {
      pointerId = null;
      isMoving = false;
      moveEnd(evt);
    };

    const moveEnd = (event) => {
      if (oncomplete)
        oncomplete(moveObj);
      isMoving = moveObj.isMoving = false;
      if (event) {
        event.preventDefault();
      }

    };
    //#endregion

    const getCoord =  (evt) => {
      let coord = {};
      coord.x = evt.pageX;
      coord.y = evt.pageY;
      return coord;
    };

    init();
  }
});