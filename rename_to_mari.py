from pathlib import Path

root = Path('.').resolve()
files = [
    p for p in root.rglob('*')
    if p.suffix in {'.html', '.md', '.js', '.json'}
    and 'node_modules' not in p.parts
    and '.git' not in p.parts
]
replacements = {
    'Mary Kaipeng': 'Mari Kaipeng',
    "Mary's portfolio": "Mari's portfolio",
    'portfolio-marykaipeng': 'portfolio-marikaipeng',
    'Mary is': 'Mari is',
}
for path in files:
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    new = text
    for old, newval in replacements.items():
        new = new.replace(old, newval)
    if new != text:
        path.write_text(new, encoding='utf-8')
        print(f'updated {path.relative_to(root)}')
