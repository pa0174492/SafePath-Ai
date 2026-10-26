import urllib.request, json, sys
sys.path.insert(0, '.')
from scratch.eval_tab import raw_ws_eval

tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
tab = next((t for t in tabs if 'localhost:3000/map' in t.get('url', '')), None)
ws_url = tab['webSocketDebuggerUrl']

js = """
(() => {
    const tile = document.querySelector('.leaflet-tile');
    if (!tile) return "No tile";
    const cs = window.getComputedStyle(tile);
    return {
        inlineStyle: tile.getAttribute('style'),
        className: tile.className,
        width: cs.width,
        height: cs.height,
        maxWidth: cs.maxWidth,
        minWidth: cs.minWidth,
        boxSizing: cs.boxSizing,
        display: cs.display,
        position: cs.position,
        overflow: cs.overflow,
        attributeWidth: tile.getAttribute('width'),
        naturalWidth: tile.naturalWidth
    };
})()
"""
res = raw_ws_eval(ws_url, js)
print(json.dumps(res, indent=2))
