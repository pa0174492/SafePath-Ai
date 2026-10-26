import urllib.request, json, sys, base64
sys.path.insert(0, '.')
from scratch.eval_tab import raw_ws_eval

tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
tab = next((t for t in tabs if 'localhost:3000/map' in t.get('url', '')), None)
ws_url = tab['webSocketDebuggerUrl']

# Capture screenshot via CDP
import socket, struct, os
def raw_ws_cmd(ws_url, method, params):
    from urllib.parse import urlparse
    parsed = urlparse(ws_url)
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((parsed.hostname, parsed.port))
    key = base64.b64encode(os.urandom(16)).decode('utf-8')
    req = (
        f"GET {parsed.path} HTTP/1.1\r\n"
        f"Host: {parsed.hostname}:{parsed.port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(req.encode())
    resp = s.recv(4096).decode(errors='ignore')
    if "101" not in resp:
        return None
    msg = json.dumps({"id": 1, "method": method, "params": params}).encode('utf-8')
    length = len(msg)
    mask = os.urandom(4)
    header = bytearray([0x81])
    if length <= 125:
        header.append(0x80 | length)
    elif length <= 65535:
        header.append(0x80 | 126)
        header.extend(struct.pack("!H", length))
    else:
        header.append(0x80 | 127)
        header.extend(struct.pack("!Q", length))
    header.extend(mask)
    header.extend(bytearray([b ^ mask[i % 4] for i, b in enumerate(msg)]))
    s.sendall(header)
    
    # Read full response
    data = b""
    while True:
        chunk = s.recv(65536)
        if not chunk: break
        data += chunk
        # find end of JSON payload
        if b'"result":' in data and data.rstrip().endswith(b'}'):
            break
    s.close()
    
    # extract base64
    idx = data.find(b'"data":"')
    if idx != -1:
        end_idx = data.find(b'"', idx + 8)
        b64 = data[idx+8:end_idx]
        return base64.b64decode(b64)
    return None

shot = raw_ws_cmd(ws_url, "Page.captureScreenshot", {"format": "png"})
if shot:
    path = r"C:\Users\pammi\.gemini\antigravity-ide\brain\d38b972e-f188-4c51-81b9-a6c7ce2db073\fixed_map_screenshot.png"
    open(path, "wb").write(shot)
    print("Saved screenshot to:", path)
else:
    print("Failed to capture screenshot")
