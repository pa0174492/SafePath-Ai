import urllib.request, json, sys
sys.path.insert(0, '.')
from scratch.eval_tab import raw_ws_eval

tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
tab = next((t for t in tabs if 'localhost:3000/map' in t.get('url', '')), None)
ws_url = tab['webSocketDebuggerUrl']

js = """
(() => {
    const container = document.querySelector('.leaflet-container');
    const cRect = container ? container.getBoundingClientRect() : null;
    const mapPane = document.querySelector('.leaflet-map-pane');
    const tilePane = document.querySelector('.leaflet-tile-pane');
    const overlayPane = document.querySelector('.leaflet-overlay-pane');
    const tiles = Array.from(document.querySelectorAll('.leaflet-tile'));
    
    return {
        containerRect: cRect,
        containerStyle: container ? {
            overflow: window.getComputedStyle(container).overflow,
            position: window.getComputedStyle(container).position,
            zIndex: window.getComputedStyle(container).zIndex
        } : null,
        mapPaneStyle: mapPane ? {
            transform: mapPane.style.transform,
            left: mapPane.style.left,
            top: mapPane.style.top,
            zIndex: window.getComputedStyle(mapPane).zIndex
        } : null,
        tilePaneStyle: tilePane ? {
            transform: tilePane.style.transform,
            zIndex: window.getComputedStyle(tilePane).zIndex,
            opacity: window.getComputedStyle(tilePane).opacity,
            visibility: window.getComputedStyle(tilePane).visibility
        } : null,
        overlayPaneStyle: overlayPane ? {
            zIndex: window.getComputedStyle(overlayPane).zIndex
        } : null,
        firstTileRect: tiles[0] ? tiles[0].getBoundingClientRect() : null,
        tilesVisibleInsideContainer: tiles.map(t => {
            const r = t.getBoundingClientRect();
            return {
                src: t.src.split('/').slice(-3).join('/'),
                rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
                inViewport: cRect ? (r.right > cRect.left && r.left < cRect.right && r.bottom > cRect.top && r.top < cRect.bottom) : false
            };
        })
    };
})()
"""
res = raw_ws_eval(ws_url, js)
print(json.dumps(res, indent=2))
