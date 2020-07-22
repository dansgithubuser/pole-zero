export function e(name){ return document.getElementById(name) }
export function v(name){ return e(name).value }

export function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = window.crypto.getRandomValues(new Uint8Array(1)) % 16;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomElement(array) {
  if (!array.length) return;
  return array[Math.floor(Math.random() * array.length)];
}

export function rect(context, xi, yi, xf, yf, r, g, b) {
  context.fillStyle = `rgb(${r}, ${g}, ${b})`;
  context.fillRect(xi, yi, xf - xi, yf - yi);
  context.stroke();
}

/*
options:
  // callbacks
  before()
  onStart(id, x, y)
  onMove(xi, yi, xf, yf) // mouse only
  onWheel(x, y, dWheel) // mouse only
  onDrag([{id, xi, yi, xf, yf}, ...], dx, dy, dSize, dTheta, { xi, yi, sizeI })
  onEnd(id, x, y)
  onTap(id, x, y)
  after()

  // parameters
  tapTolerance: How far a tap can move before it is no longer considered a tap. Measured in pixels. Default 5.
*/
export function listenToTouches(element, options) {
  const tapTolerance = options.tapTolerance === undefined ? 5 : options.tapTolerance;

  var touches = { mouse: {} };

  function elementCoords(evt) {
    return {
      x: evt.pageX - element.offsetLeft,
      y: evt.pageY - element.offsetTop,
    };
  }

  if ('ontouchstart' in document.documentElement) {
    function touchStart(evt) {
      if (options.before) options.before(evt);
      for (const touch of evt.changedTouches) {
        const { x, y } = elementCoords(touch);
        touches[touch.identifier] = { x, y, xi: x, yi: y };
        if (options.onStart)
          options.onStart(touch.identifier, x, y);
      }
      if (options.after) options.after(evt);
    }

    function touchEnd(evt) {
      if (options.before) options.before(evt);
      for (const touch of evt.changedTouches) {
        const { x, y } = elementCoords(touch);
        const oldTouch = touches[touch.identifier];
        if (options.onEnd)
          options.onEnd(touch.identifier, oldTouch.x, oldTouch.y);
        if (options.onTap && !touches[touch.identifier].moved)
          options.onTap(touch.identifier, x, y);
        delete touches[touch.identifier];
      }
      if (options.after) options.after(evt);
    }

    function touchMove(evt) {
      if (options.before) options.before(evt);
      if (options.onDrag) {
        const ts = Array.from(evt.touches).map(touch => {
          const { x, y } = elementCoords(touch);
          const oldTouch = touches[touch.identifier];
          const result = {
            id: touch.identifier,
            xi: oldTouch.x,
            yi: oldTouch.y,
            xf: x,
            yf: y,
          };
          if (Math.pow(oldTouch.xi - x, 2) + Math.pow(oldTouch.yi - y, 2) > Math.pow(tapTolerance, 2))
            touches[touch.identifier].moved = true;
          touches[touch.identifier].x = x;
          touches[touch.identifier].y = y;
          return result;
        });
        const cxi = ts.reduce((sum, i) => (sum + i.xi), 0) / ts.length;
        const cyi = ts.reduce((sum, i) => (sum + i.yi), 0) / ts.length;
        const cxf = ts.reduce((sum, i) => (sum + i.xf), 0) / ts.length;
        const cyf = ts.reduce((sum, i) => (sum + i.yf), 0) / ts.length;
        const dist = (xa, ya, xb, yb) => Math.sqrt(
          Math.pow(xa - xb, 2)
          +
          Math.pow(ya - yb, 2)
        );
        const sizeI = ts.reduce((sum, i) => (sum + dist(i.xi, i.yi, cxi, cyi)), 0) / ts.length;
        const sizeF = ts.reduce((sum, i) => (sum + dist(i.xf, i.yf, cxf, cyf)), 0) / ts.length;
        const thetaI = ts.reduce((sum, i) => (sum + Math.atan2(i.yi - cyi, i.xi - cxi)), 0) / ts.length;
        const thetaF = ts.reduce((sum, i) => (sum + Math.atan2(i.yf - cyf, i.xf - cxf)), 0) / ts.length;
        options.onDrag(ts, cxf - cxi, cyf - cyi, sizeF - sizeI, thetaF - thetaI, {
          xi: cxi,
          yi: cyi,
          sizeI,
        });
      }
      if (options.after) options.after(evt);
    }

    element.addEventListener('touchstart' , touchStart, { passive: false });
    element.addEventListener('touchend'   , touchEnd  , { passive: false });
    element.addEventListener('touchcancel', touchEnd  , { passive: false });
    element.addEventListener('touchmove'  , touchMove , { passive: false });
  } else {
    function mouseDown(evt) {
      if (options.before) options.before(evt);
      const { x, y } = elementCoords(evt);
      touches['mouse'] = { x, y, dragging: true, moved: false, xi: x, yi: y };
      if (options.onStart)
        options.onStart('mouse', x, y)
      if (options.after) options.after(evt);
    }

    function mouseUp(evt) {
      if (options.before) options.before(evt);
      const { x, y } = elementCoords(evt);
      if (options.onEnd)
        options.onEnd('mouse', x, y);
      if (options.onTap && !touches['mouse'].moved)
        options.onTap('mouse', x, y);
      touches['mouse'].dragging = false;
      if (options.after) options.after(evt);
    }

    function mouseMove(evt) {
      if (options.before) options.before(evt);
      const { x, y } = elementCoords(evt);
      if (options.onMove)
        options.onMove(touches['mouse'].x, touches['mouse'].y, x, y);
      if (options.onDrag && touches['mouse'].dragging) {
        const xi = touches['mouse'].x;
        const yi = touches['mouse'].y;
        const xf = x;
        const yf = y;
        options.onDrag([{ id: 'mouse', xi, yi, xf, yf }], xf - xi, yf - yi, undefined, undefined, { xi, yi });
      }
      touches['mouse'].x = x;
      touches['mouse'].y = y;
      if (Math.pow(touches['mouse'].xi - x, 2) + Math.pow(touches['mouse'].yi - y, 2) > Math.pow(tapTolerance, 2))
        touches['mouse'].moved = true;
      if (options.after) options.after(evt);
    }

    function mouseWheel(evt) {
      if (options.before) options.before(evt);
      const { x, y } = elementCoords(evt);
      if (options.onWheel)
        options.onWheel(x, y, evt.deltaY);
      if (options.after) options.after(evt);
    }

    element.addEventListener('mousedown', mouseDown , { passive: false });
    element.addEventListener('mouseup'  , mouseUp   , { passive: false });
    element.addEventListener('mousemove', mouseMove , { passive: false });
    element.addEventListener('wheel'    , mouseWheel, { passive: false });
  }
}
