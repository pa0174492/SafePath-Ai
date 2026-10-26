import urllib.request, re

html = urllib.request.urlopen('http://localhost:3000/map').read().decode()
css_files = re.findall(r'href="(/_next/static/css/[^"]+)"', html)
print('CSS files:', css_files)

for cf in css_files:
    css_content = urllib.request.urlopen('http://localhost:3000' + cf).read().decode()
    has_leaflet = 'leaflet' in css_content
    print(f'{cf}: len={len(css_content)}, has_leaflet={has_leaflet}')
    if '@import' in css_content:
        for imp in re.findall(r'@import[^;]+;', css_content):
            print('  Found import:', imp)
    if 'leaflet-tile-pane' in css_content:
        print('  Found leaflet-tile-pane in CSS!')
    else:
        print('  MISSING leaflet-tile-pane in CSS!')
