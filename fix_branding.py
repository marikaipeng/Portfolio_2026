from pathlib import Path
import base64
import re

root = Path(__file__).parent
html_files = [root / 'index.html'] + sorted((root / 'SRC' / 'pages').glob('*.html'))
other_files = [root / 'README.md', root / 'server.js', root / 'package.json']
files = html_files + other_files

legacy_replacements = {
    base64.b64decode('TWVudGFzaGEgTmFmaXM=').decode('utf-8'): 'Mari Kaipeng',
    base64.b64decode('TWVudGFzaF9OYWZpczIwMDc=').decode('utf-8'): 'marikaipeng',
    base64.b64decode('TWVudGFzaGE=').decode('utf-8'): 'Mari',
    base64.b64decode('cG9ydGZvbGlvLW1hbnRhc2hhbmFmaXM=').decode('utf-8'): 'portfolio-marikaipeng',
}

social_patterns = [
    (re.compile(r'https://www\\.facebook\\.com/[^"\s]+'), 'https://www.facebook.com/share/18uBzfKNmr/'),
    (re.compile(r'https://www\\.instagram\\.com/[^"\s]+'), 'https://www.instagram.com/lunarr_marr?igsh=OGR6MmF4ZWdlbjJm'),
    (re.compile(r'https://www\\.linkedin\\.com/in/[^"\s]+'), 'https://www.linkedin.com/in/marikaipeng'),
    (re.compile(r'https://github\\.com/[^"\s]+'), 'https://github.com/marikaipeng'),
]

changed_files = []
for path in files:
    if not path.exists():
        continue

    text = path.read_text(encoding='utf-8')
    orig = text

    for old, new_val in legacy_replacements.items():
        text = text.replace(old, new_val)

    for pattern, replacement in social_patterns:
        text = pattern.sub(replacement, text)

    if text != orig:
        path.write_text(text, encoding='utf-8')
        changed_files.append(str(path.relative_to(root)))

print('Updated files:')
for f in changed_files:
    print(f)
