import urllib.request, json

res = urllib.request.urlopen('http://localhost:9222/json')
tabs = json.loads(res.read())
print(f'Found {len(tabs)} tabs:')
for t in tabs:
    print(t.get('id'), t.get('title'), t.get('url'))
