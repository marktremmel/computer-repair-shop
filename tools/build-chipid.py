#!/usr/bin/env python3
"""
Build the Chip ID data from iFixit's saved chip-ID pages.

GENERATED DATA, NOT TRANSCRIBED. Run this instead of editing
js/chipid-data.json by hand:

    python3 tools/build-chipid.py "/path/to/Guides_pt1"

For every saved "<Device> Chip ID - iFixit.html" page it:
  1. reads each step's photos and its colour-coded list of chips
     (iFixit marks each chip with a coloured box and lists "red: ...", etc.);
  2. finds those coloured boxes in the annotated photo;
  3. subtracts anything also found on the step's clean photo (screw pads and
     shields that happen to be the same colour);
  4. keeps only boxes from photos that really are the same shot as the clean
     one (some continuation steps show a different board);
  5. writes the clean photo (no boxes: students must find the chips
     themselves) to assets/chipid/<device>/ and the chips with their box
     positions to js/chipid-data.json. Run ./rebuild.sh afterwards.

Chip identifications are iFixit's (credited in the game); the photos are
iFixit's (credited on screen, linking to each page).
"""
import json, os, re, sys, glob, html
import numpy as np
from PIL import Image
from collections import deque

import numpy as np
from PIL import Image, ImageDraw
from collections import deque
HUES={'red':[(0,12),(345,360)],'orange':[(18,40)],'yellow':[(48,68)],'green':[(142,168)],
      'light_blue':[(180,200)],'blue':[(205,240)],'violet':[(265,335)]}
def masks(img, grow=True):
    a=np.asarray(img.convert('RGB')).astype(np.float32)/255.
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); d=mx-mn+1e-6
    h=np.where(mx==r,(g-b)/d%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    s=d/(mx+1e-6); v=mx
    out={}
    for k,rs in HUES.items():
        m=np.zeros(h.shape,bool)
        for lo,hi in rs: m|=(h>=lo)&(h<hi)
        # iFixit's green sits brighter and bluer than a green circuit board.
        m=m&(s>(0.6 if k=='green' else 0.55))&(v>(0.65 if k=='green' else 0.5))
        # JPEG breaks a 2 px outline into pieces; grow it by a pixel so each
        # drawn box is one shape again.
        g=m.copy()
        if grow:
            g[1:,:]|=m[:-1,:]; g[:-1,:]|=m[1:,:]; g[:,1:]|=m[:,:-1]; g[:,:-1]|=m[:,1:]
        out[k]=g
    return out
def comps(m):
    H,W=m.shape; seen=np.zeros_like(m); res=[]
    ys,xs=np.nonzero(m)
    for y0,x0 in zip(ys,xs):
        if seen[y0,x0]: continue
        q=deque([(y0,x0)]); seen[y0,x0]=True; pts=[]
        while q:
            y,x=q.popleft(); pts.append((y,x))
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    ny,nx=y+dy,x+dx
                    if 0<=ny<H and 0<=nx<W and m[ny,nx] and not seen[ny,nx]:
                        seen[ny,nx]=True; q.append((ny,nx))
        res.append(pts)
    return res
def boxes(path):
    # Two passes: as drawn (keeps boxes that touch their neighbours apart) and
    # grown by a pixel (rejoins outlines JPEG broke). Keep what either finds.
    a,size=boxes_pass(path, False); b,_=boxes_pass(path, True)
    out=list(a)
    for x in b:
        if not any(y['color']==x['color'] and iou(x,y)>0.5 for y in out): out.append(x)
    return out,size

def iou(p,q):
    ix=max(0,min(p['x']+p['w'],q['x']+q['w'])-max(p['x'],q['x'])); iy=max(0,min(p['y']+p['h'],q['y']+q['h'])-max(p['y'],q['y']))
    i=ix*iy; return i/(p['w']*p['h']+q['w']*q['h']-i+1e-9)

def boxes_pass(path, grow):
    img=Image.open(path); W,H=img.size; ms=masks(img, grow); found=[]
    for col,m in ms.items():
        for pts in comps(m):
            if len(pts)<16: continue
            ys=[p[0] for p in pts]; xs=[p[1] for p in pts]
            x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys); bw,bh=x1-x0+1,y1-y0+1
            if bw<7 or bh<7: continue
            # iFixit boxes wrap a chip; nothing they box is a long thin bar.
            if max(bw,bh)>4*min(bw,bh): continue
            S=set(pts)
            # A drawn box: the whole perimeter is covered by a thin band...
            band=max(2,min(4,min(bw,bh)//4))
            def edge_hit(cells): return sum(1 for c in cells if any(p in S for p in c))/max(1,len(cells))
            top=[[(y,x) for y in range(y0,y0+band)] for x in range(x0,x1+1)]
            bot=[[(y,x) for y in range(y1-band+1,y1+1)] for x in range(x0,x1+1)]
            lef=[[(y,x) for x in range(x0,x0+band)] for y in range(y0,y1+1)]
            rig=[[(y,x) for x in range(x1-band+1,x1+1)] for y in range(y0,y1+1)]
            # Three edges whole; the fourth may be partly hidden under a
            # neighbouring box drawn on top of it.
            ed=sorted([edge_hit(top),edge_hit(bot),edge_hit(lef),edge_hit(rig)])
            if ed[1]<0.8 or ed[0]<0.3: continue
            # ...and the inside is empty.
            mg=max(band+1,int(min(bw,bh)*0.3))
            inner=sum(1 for y,x in pts if x0+mg<x<x1-mg and y0+mg<y<y1-mg)
            if inner>0.05*len(pts): continue
            found.append({'color':col,'x':x0/W,'y':y0/H,'w':bw/W,'h':bh/H})
    return found,(W,H)


DEVICES = {  # page name -> (key, display name, exact machine id in the game or None)
    'Steam Deck Chip ID':          ('steamdeck',   'Steam Deck',        'steamdeck'),
    'Nintendo Switch 2 Chip ID':   ('switch2',     'Nintendo Switch 2', 'switch2'),
    'PS5 Pro Chip ID':             ('ps5pro',      'PS5 Pro',           'ps5pro'),
    'iMac M1 24_ Full Chip ID':    ('imac_m1',     'iMac M1 24"',       'imac_m1'),
    'MacBook Neo Chip ID':         ('mbneo',       'MacBook Neo',       'mbneo'),
    'iPad 10 Chip ID':             ('ipad10',      'iPad 10',           None),
    'iPhone 17 Pro Chip ID':       ('iphone17pro', 'iPhone 17 Pro',     None),
    'Meta Quest 3 Chip ID':        ('quest3',      'Meta Quest 3',      None),
}

VENDORS = ['Monolithic Power Systems', 'Texas Instruments', 'Analog Devices', 'Maxim Integrated', 'Diodes Incorporated',
           'NXP Semiconductors', 'NXP Semiconductor', 'STMicroelectronics', 'Cirrus Logic', 'SK hynix', 'Bosch Sensortec',
           'Dialog Semiconductor', 'ON Semiconductor', 'Genesys Logic', 'AKM Semiconductor', 'SG Micro', 'VIA Labs',
           'Apple/Cirrus Logic', 'Sony/AMD', 'AMD/Valve', 'Silicon Works', 'Qualcomm', 'Broadcom', 'Samsung', 'Micron',
           'Kioxia', 'Winbond', 'Infineon', 'Richtek', 'Renesas', 'Nuvoton', 'Murata', 'Apple', 'Sony', 'NVIDIA',
           'Nintendo', 'Qorvo', 'Skyworks', 'MediaTek', 'Realtek', 'O2Micro', 'ITE Tech', 'Analogix', 'Nexperia',
           'SanDisk', 'GigaDevice', 'Vishay', 'Silergy', 'Toshiba', 'Macronix', 'Onsemi', 'Anpec', 'Goodix',
           'Dialog Semiconductor (formerly Silego)', 'Triad Semiconductor', 'Silicon Labs', 'Microchip', 'USI', 'Alps']

def split_text(t):
    hedge = None
    s = t.strip()
    m = re.match(r'^(Likely|Possibly|Probably)\s+', s)
    if m: hedge = m.group(1).lower(); s = s[m.end():]
    if re.search(r'\((likely|possibly)\)\s*$', s):
        hedge = hedge or 'likely'; s = re.sub(r'\s*\((likely|possibly)\)\s*$', '', s)
    vendor = next((v for v in sorted(VENDORS, key=len, reverse=True) if s.startswith(v + ' ') or s == v), None)
    rest = s[len(vendor):].strip() if vendor else s
    toks = rest.split(' ')
    part = []
    def is_part(tok):
        # A part number mixes letters and digits (or is a long numeric code)
        # and is not a quantity: "8 GB", "35 A", "6-axis" and "A14" are not parts.
        if re.search(r'-(bit|axis|port|phase|amp)$', tok, re.I): return False
        if not re.match(r'^[A-Z0-9][A-Za-z0-9\-/.:+]*$', tok) or len(tok) < 4: return False
        return bool(re.search(r'\d', tok) and (re.search(r'[A-Za-z]', tok) or re.match(r'^\d{3}-\d+', tok)))
    while toks and (is_part(toks[0]) or (part and toks[0] == '/' and len(toks) > 1 and is_part(toks[1]))):
        part.append(toks.pop(0))
    return {'vendor': vendor or '', 'part': ' '.join(part), 'desc': ' '.join(toks), 'hedge': hedge}

ROLE_RULES = [
    ('qi', r'wireless charging'), ('sensor', r'\bir analog|infrared|hall sensor'), ('reader', r'card reader'), ('security', r'secure element|\bnfc\b'),
    ('modem', r'\bmodem\b'), ('rf', r'front[- ]end|\brf\b|envelope tracker|low noise|\blna\b|antenna|filter'),
    ('wireless', r'wi-?fi|bluetooth'), ('soc', r'applications processor|system on a chip|\bsoc\b|processor w/ gpu'),
    ('memory', r'sdram|lpddr|gddr|\bddr\d|\bdram\b'), ('storage', r'nand|\bufs\b|ssd controller|\bemmc\b'),
    ('firmware', r'nor flash|eeprom|serial flash'), ('pmic', r'power management'),
    ('battery', r'charger|fuel gauge|battery'),
    ('usbc', r'type-c|usb-c|power delivery|port controller|port protector'),
    ('display', r'backlight|display|led driver|gamma|hdmi|displayport|level shifter|timing controller'),
    ('sensor', r'sensor|accelerometer|gyroscope|temperature|current sense|comparator|analog to digital|operational amplifier|op amp'),
    ('audio', r'audio|codec|amplifier'), ('ec', r'embedded controller|microcontroller'),
    ('input', r'touch|haptic|taptic|touchpad|trackpad'), ('camera', r'camera|flash controller|image'),
    ('power', r'convert|regulator|\bldo\b|power stage|buck|boost|efuse|load switch|power switch|multiplexer|phase controller|power-distribution|power supply|rectifier|power factor'),
    ('signal', r'hub|switch|transceiver|translat|redriver|repeater|retimer|buffer|inverter|matrix|array|mux|motor|bridge'),
]
def role_of(text):
    t = text.lower()
    for r, pat in ROLE_RULES:
        if re.search(pat, t): return r
    return 'signal'

def text_of(x): return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', x))).strip()

def parse_page(path):
    s = open(path, encoding='utf-8', errors='ignore').read()
    canon = (re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', s) or re.search(r'og:url" content="([^"]+)"', s) or [None, ''])[1]
    steps = []
    for m in re.finditer(r'<li id="s(\d+)" class="step step-wrapper[\s\S]*?(?=<li id="s\d+" class="step step-wrapper|</ol>)', s):
        blk = m.group(0)
        title = text_of((re.search(r'stepTitleTitle[^>]*>([\s\S]*?)</span>', blk) or [None, ''])[1])
        imgs = []
        for im in re.finditer(r'guide-images\.cdn\.ifixit\.com/igi/([A-Za-z0-9]+)\.', blk):
            if im.group(1) not in imgs: imgs.append(im.group(1))
        lines = []
        for li in re.finditer(r'<li class="level-(\d)[^"]*"([\s\S]*?)</li>', blk):
            col = re.search(r'bullet_([a-z_]+)', li.group(2))
            t = text_of((re.search(r'<p itemprop="text">([\s\S]*?)</p>', li.group(2)) or [None, ''])[1])
            lines.append((col.group(1) if col else None, t))
        steps.append({'title': title, 'imgs': imgs, 'lines': lines})
    return canon, steps

def main(G, repo):
    best = {}
    for d in glob.glob(os.path.join(G, '*Chip ID*_files')):
        for f in os.listdir(d):
            if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')): continue
            iid = f.split('_')[0].split('.')[0]; p = os.path.join(d, f)
            try: w, h = Image.open(p).size
            except Exception: continue
            if iid not in best or w * h > best[iid][1] * best[iid][2]: best[iid] = (p, w, h)
    data, report = {}, []
    for page, (key, name, machine) in DEVICES.items():
        path = os.path.join(G, page + ' - iFixit.html')
        if not os.path.exists(path): continue
        url, steps = parse_page(path)
        sides, cur = [], None
        for st in steps:
            if st['title'] or cur is None:
                cur = {'title': st['title'] or name, 'steps': []}; sides.append(cur)
            cur['steps'].append(st)
        boards = []
        for side in sides:
            imgs = [i for st in side['steps'] for i in st['imgs'] if i in best]
            first = [i for i in side['steps'][0]['imgs'][1:] if i in best]
            if not first: continue          # no clean photo saved: cannot be a find-it board
            clean = first[0]
            det = {i: boxes(best[i][0])[0] for i in imgs}
            bg = det[clean]
            def g(i):
                a = np.asarray(Image.open(best[i][0]).convert('L').resize((96, 72))).astype(float)
                return (a - a.mean()) / (a.std() + 1e-9)
            C = g(clean)
            chips = []
            for st in side['steps']:
                legend = [(c, t) for (c, t) in st['lines'] if c and c != 'black']
                ann = [i for i in st['imgs'] if i in best and i != clean]
                ann = [i for i in ann if float((g(i) * C).mean()) > 0.9]
                if not legend or not ann: continue
                cols = set(c for c, _ in legend)
                cand = {i: [b for b in det[i] if not any(x['color'] == b['color'] and iou(x, b) > 0.4 for x in bg)] for i in ann}
                a = max(ann, key=lambda i: len(cols & set(b['color'] for b in cand[i])))
                for c, t in legend:
                    bx = [b for b in cand[a] if b['color'] == c]
                    rec = split_text(t)
                    rec.update({'text': t, 'role': role_of(t), 'boxes': [{k: round(b[k], 4) for k in 'xywh'} for b in bx]})
                    chips.append(rec)
                    if not bx: report.append('%s | %s | no box for %s' % (name, side['title'], t[:60]))
            if not any(c['boxes'] for c in chips): continue
            out_dir = os.path.join(repo, 'assets', 'chipid', key); os.makedirs(out_dir, exist_ok=True)
            im = Image.open(best[clean][0]).convert('RGB')
            if im.width > 1000: im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
            fn = clean + '.jpg'; im.save(os.path.join(out_dir, fn), quality=82, optimize=True)
            boards.append({'title': side['title'], 'image': 'assets/chipid/%s/%s' % (key, fn),
                           'w': im.width, 'h': im.height, 'chips': chips})
        if boards:
            data[key] = {'name': name, 'machine': machine, 'source': url, 'boards': boards}
    json.dump(data, open(os.path.join(repo, 'js', 'chipid-data.json'), 'w'), ensure_ascii=False, indent=1, sort_keys=True)
    build_boards(data, best, repo)
    n = sum(len(b['chips']) for d in data.values() for b in d['boards'])
    f = sum(1 for d in data.values() for b in d['boards'] for c in b['chips'] if c['boxes'])
    print('%d devices, %d boards, %d chips, %d located on their photo' % (len(data), sum(len(d['boards']) for d in data.values()), n, f))
    for r in report: print('  ' + r)

ROLE_IDS = {'soc': 'soc', 'storage': 'nand1'}
SHORT = {'soc': 'SoC + RAM', 'memory': 'RAM', 'storage': 'NAND', 'pmic': 'Power mgmt', 'battery': 'Charger',
         'usbc': 'USB-C ctrl', 'audio': 'Audio', 'wireless': 'Wi-Fi', 'security': 'Secure element',
         'firmware': 'Firmware', 'display': 'Backlight', 'ec': 'EC'}

def board_bbox(path):
    """Where the board itself is in the photo: everything that is not the white background."""
    a = np.asarray(Image.open(path).convert('L')).astype(float)
    ys, xs = np.nonzero(a < 225)
    return xs.min() / a.shape[1], ys.min() / a.shape[0], (xs.max() + 1) / a.shape[1], (ys.max() + 1) / a.shape[0]

def build_boards(data, best, repo):
    """The drawn bench boards for machines that have a real photo: chips where iFixit boxed them,
    plus the connectors in tools/board-connectors.json."""
    spec = json.load(open(os.path.join(repo, 'tools', 'board-connectors.json')))
    layouts, for_machine = {}, {}
    for key, sp in spec.items():
        if key.startswith('_') or key not in data: continue
        dev = data[key]; b = dev['boards'][sp.get('board', 0)]
        src = os.path.join(repo, b['image'])
        x0, y0, x1, y1 = board_bbox(src)
        W = 1000.0; aspect = ((y1 - y0) * b['h']) / ((x1 - x0) * b['w'])
        H = round(W * aspect * sp.get('stretch', 1))
        chips, seen = [], {}
        for c in b['chips']:
            if not c['boxes']: continue
            bx = max(c['boxes'], key=lambda q: q['w'] * q['h'])
            n = seen.get(c['role'], 0) + 1; seen[c['role']] = n
            cid = ROLE_IDS.get(c['role']) if n == 1 and c['role'] in ROLE_IDS else '%s%d' % (c['role'], n)
            # Spread the positions by the stretch, but keep each chip its true
            # shape: a square package stays square.
            st = sp.get('stretch', 1)
            cx = (bx['x'] + bx['w'] / 2 - x0) / (x1 - x0) * W; cy = (bx['y'] + bx['h'] / 2 - y0) / (y1 - y0) * H
            w = bx['w'] / (x1 - x0) * W; h = bx['h'] / (y1 - y0) * H / st
            X = cx - w / 2; Y = cy - h / 2
            # Short names on the parts a repair touches; the small regulators and
            # switches are drawn but not labelled, as on the other boards. The
            # full identification is the hover title.
            short = SHORT.get(c['role'])
            full = ((c['vendor'] + ' ') if c['vendor'] else '') + (c['part'] + ' \u2014 ' if c['part'] else '') + (c['desc'] or c['text'])
            chips.append({'id': cid, 'x': round(X), 'y': round(Y), 'w': max(10, round(w)), 'h': max(8, round(h)),
                          'role': c['role'], 'label': short or '', 'title': full[:120], 'big': c['role'] == 'soc'})
        for k in sp['connectors']:
            chips.append({'id': k['id'], 'x': round(k['x'] * W), 'y': round(k['y'] * H), 'w': round(k['w'] * W), 'h': round(k['h'] * H / sp.get('stretch', 1)),
                          'role': k['role'], 'label': k['label'], 'slot': True})
        name = 'real_' + key
        layouts[name] = {'w': int(W), 'h': H, 'shape': 'strip', 'pcb': '#161b1f', 'note': sp['note'],
                         'source': dev['source'], 'chips': chips}
        for_machine[dev['machine']] = name
    out = ('/* GENERATED by tools/build-chipid.py from iFixit chip-ID photos and tools/board-connectors.json.\n'
           '   Do not edit by hand. */\n'
           'window.TechOpsRealBoards = ' + json.dumps({'layouts': layouts, 'forMachine': for_machine}, ensure_ascii=False, indent=1) + ';\n')
    open(os.path.join(repo, 'js', 'data-boards-real.js'), 'w', encoding='utf-8').write(out)
    print('boards drawn from photos:', ', '.join(sorted(for_machine)))

if __name__ == '__main__':
    main(sys.argv[1], os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
