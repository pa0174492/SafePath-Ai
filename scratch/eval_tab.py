import urllib.request, json, asyncio
try:
    import websockets
except ImportError:
    pass

import socket

# Simple raw WebSocket client in Python without dependencies
import base64, os, struct

def raw_ws_eval(ws_url, expression):
    # Use websocket to send Runtime.evaluate
    import json
    from urllib.parse import urlparse
    parsed = urlparse(ws_url)
    host = parsed.hostname
    port = parsed.port
    path = parsed.path
    
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    
    key = base64.b64encode(os.urandom(16)).decode('utf-8')
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(req.encode())
    resp = s.recv(4096).decode(errors='ignore')
    if "101" not in resp:
        print("WS handshake failed:", resp)
        return None

    # Send message
    msg = json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True}})
    payload = msg.encode('utf-8')
    length = len(payload)
    mask = os.urandom(4)
    
    header = bytearray([0x81]) # text frame, FIN
    if length <= 125:
        header.append(0x80 | length)
    elif length <= 65535:
        header.append(0x80 | 126)
        header.extend(struct.pack("!H", length))
    else:
        header.append(0x80 | 127)
        header.extend(struct.pack("!Q", length))
        
    header.extend(mask)
    masked_payload = bytearray([b ^ mask[i % 4] for i, b in enumerate(payload)])
    s.sendall(header + masked_payload)
    
    # Read response
    data = b""
    while True:
        chunk = s.recv(65536)
        if not chunk:
            break
        data += chunk
        if len(data) > 2:
            # parse basic frame
            plen = data[1] & 0x7f
            if plen <= 125 and len(data) >= 2 + plen:
                break
            elif plen == 126 and len(data) >= 4 + struct.unpack("!H", data[2:4])[0]:
                break
            elif plen == 127 and len(data) >= 10 + struct.unpack("!Q", data[2:10])[0]:
                break
    s.close()
    
    # parse frame payload
    b0 = data[0]
    b1 = data[1]
    masked = bool(b1 & 0x80)
    plen = b1 & 0x7f
    offset = 2
    if plen == 126:
        plen = struct.unpack("!H", data[2:4])[0]
        offset = 4
    elif plen == 127:
        plen = struct.unpack("!Q", data[2:10])[0]
        offset = 10
        
    raw = data[offset:offset+plen]
    res_json = json.loads(raw.decode('utf-8', errors='ignore'))
    return res_json.get('result', {}).get('result', {}).get('value')

# Find tab ws url
tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
tab = next((t for t in tabs if 'localhost:3000/map' in t.get('url', '')), None)
if tab:
    ws_url = tab['webSocketDebuggerUrl']
    print("Connecting to:", ws_url)
    js = """
    (() => {
        const tiles = Array.from(document.querySelectorAll('.leaflet-tile'));
        const pane = document.querySelector('.leaflet-tile-pane');
        const mapDiv = document.querySelector('.leaflet-container');
        return {
            mapRect: mapDiv ? { w: mapDiv.offsetWidth, h: mapDiv.offsetHeight } : null,
            tileCount: tiles.length,
            paneHtml: pane ? pane.innerHTML.substring(0, 500) : null,
            tiles: tiles.slice(0, 5).map(t => ({
                src: t.src,
                w: t.naturalWidth,
                h: t.naturalHeight,
                complete: t.complete,
                opacity: window.getComputedStyle(t).opacity,
                visibility: window.getComputedStyle(t).visibility,
                display: window.getComputedStyle(t).display,
                top: t.style.top,
                left: t.style.left
            }))
        };
    })()
    """
    out = raw_ws_eval(ws_url, js)
    print(json.dumps(out, indent=2))
else:
    print("Tab not found!")
