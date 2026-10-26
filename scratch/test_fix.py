import urllib.request, json, sys
sys.path.insert(0, '.')
from scratch.eval_tab import raw_ws_eval

tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
tab = next((t for t in tabs if 'localhost:3000/map' in t.get('url', '')), None)
ws_url = tab['webSocketDebuggerUrl']

js = """
(() => {
    let s = document.getElementById('test-leaflet-fix');
    if (!s) {
        s = document.createElement('style');
        s.id = 'test-leaflet-fix';
        s.innerHTML = '.leaflet-container img, .leaflet-tile { max-width: none !important; max-height: none !important; }';
        document.head.appendChild(s);
    }
    const tile = document.querySelector('.leaflet-tile');
    if (!tile) return "No tile";
    const r = tile.getBoundingClientRect();
    return {
        width: window.getComputedStyle(tile).width,
        maxWidth: window.getComputedStyle(tile).maxWidth,
        rect: { x: r.x, y: r.y, w: r.width, h: r.height }
    };
})()
"""
res = raw_ws_eval(ws_url, js)
print("After fix:", json.dumps(res, indent=2))
