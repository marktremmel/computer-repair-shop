#!/usr/bin/env bash
# Re-stamp index.html so browsers always pick up edited JS/CSS.
# Run after changing anything in js/ or css/.
cd "$(dirname "$0")"
python3 - <<'PY'
import re, hashlib, os
stamp = hashlib.md5(b''.join(
    open(os.path.join(d, f), 'rb').read()
    for d in ('js', 'css') for f in sorted(os.listdir(d))
    if f.endswith(('.js', '.css', '.json'))
)).hexdigest()[:8]
s = open('index.html').read()
s = re.sub(r'(<script src="(?!http)[^"?]+)(\?v=[0-9a-f]+)?"', lambda m: m.group(1) + '?v=' + stamp + '"', s)
s = re.sub(r'(<link rel="stylesheet" href="(?!http)[^"?]+)(\?v=[0-9a-f]+)?"', lambda m: m.group(1) + '?v=' + stamp + '"', s)
s = re.sub(r'window\.TECHOPS_BUILD="[0-9a-f]*"', 'window.TECHOPS_BUILD="%s"' % stamp, s)
open('index.html', 'w').write(s)
print('build', stamp)
PY
