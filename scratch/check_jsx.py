with open(r'apps/web/src/components/RealMapViewer.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines[924:1320], start=925):
    # Print lines that define major elements or containers
    stripped = line.strip()
    if stripped.startswith('<div') or stripped.startswith('</div>') or stripped.startswith('{/*') or 'mapContainerRef' in stripped:
        print(f"{i}: {line.rstrip()}")
