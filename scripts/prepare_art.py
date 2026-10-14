"""离线、确定性的非 AI 素材整理。依赖 Pillow：python -m pip install Pillow。

输入为 assets/originals 中已获 CC0 授权的手绘 PNG；只裁切、改色和组合。
原创小物件使用显式像素坐标绘制，不调用生成式模型。
"""
from pathlib import Path
from PIL import Image, ImageDraw
import colorsys
import hashlib
import json
import math
import random

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/originals'
OUT = ROOT / 'frontend/public/art'
OUT.mkdir(parents=True, exist_ok=True)
records = []


def original(name):
    return Image.open(SOURCE / name).convert('RGBA')


def palette(im, mapping):
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                color = mapping.get((r, g, b), (r, g, b))
                px[x, y] = (*color[:3], a if len(color) == 3 else color[3])
    return im


def warm(im, foliage=False):
    im = im.copy()
    px = im.load()
    cache = {}
    for y in range(im.height):
        for x in range(im.width):
            color = px[x, y]
            if not color[3]:
                continue
            if color not in cache:
                h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in color[:3]))
                if (foliage and 0.13 < h < 0.53) or (0.14 < h < 0.21 and s > 0.65):
                    h, s, v = 0.24 + (h - 0.18) * 0.12, min(0.65, s * 0.72), min(0.9, v * 1.12 + 0.05)
                else:
                    s, v = s * 0.77, min(0.94, v * 1.1 + 0.085)
                cache[color] = (*[round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v)], color[3])
            px[x, y] = cache[color]
    return im


def save(name, im, sources, modification):
    path = OUT / f'{name}.png'
    im.save(path, optimize=True)
    records.append({'file': f'art/{name}.png', 'sources': sources, 'modification': modification,
                    'size': list(im.size), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    return im


sky_art = palette(original('magical-road/back.png'), {
    (90, 107, 231): (238, 215, 190), (123, 132, 222): (248, 231, 199),
    (140, 140, 222): (241, 209, 182), (156, 156, 231): (247, 222, 191),
    (181, 181, 231): (252, 236, 208), (198, 198, 231): (255, 246, 219),
})
# 用原画云形重新编排疏密，避免 112px 原图每隔一小段机械重复。
cloud_shape = sky_art.crop((0, 0, 112, 120))
px = cloud_shape.load()
for y in range(cloud_shape.height):
    for x in range(cloud_shape.width):
        r, g, b, a = px[x, y]
        px[x, y] = (r, g, b, 0 if (r, g, b) in [(238, 215, 190), (248, 231, 199)] else 135)
sky = Image.new('RGBA', (1024, 768), (248, 231, 199, 255))
draw = ImageDraw.Draw(sky)
for y in range(768):
    t = min(1, (y // 16) * 16 / 240)
    color = tuple(round(a * (1-t) + b * t) for a, b in zip((237, 224, 198), (251, 236, 205)))
    draw.line((0, y, 1023, y), fill=(*color, 255))
for x, y, scale in [(140, 10, 1), (360, -25, 2), (720, 22, 1), (910, 5, 1)]:
    shape = cloud_shape.resize((112 * scale, 120 * scale), Image.Resampling.NEAREST)
    sky.alpha_composite(shape, (x, y))
sky = save('sky', sky, ['magical-road/back.png'], '六色色板替换、云形透明提取与疏密重组，纯色延伸避免纵向重复')
clouds = original('sunnyland-woods/bg-clouds.png')
px = clouds.load()
for y in range(clouds.height):
    for x in range(clouds.width):
        r, g, b, a = px[x, y]
        px[x, y] = {(152, 220, 255): (0, 0, 0, 0), (10, 137, 255): (0, 0, 0, 0),
                    (91, 168, 255): (0, 0, 0, 0), (255, 255, 255): (255, 249, 220, 170)}.get((r, g, b), (r, g, b, a))
save('clouds', clouds.crop((0, 0, 160, 124)), ['sunnyland-woods/bg-clouds.png'], '移除不透明底色，裁切云层并改为暖色半透明')
save('mountains', palette(original('sunnyland-woods/bg-mountains.png'), {
    (2, 74, 202): (167, 176, 156), (10, 137, 255): (194, 192, 165), (91, 168, 255): (215, 207, 179),
}), ['sunnyland-woods/bg-mountains.png'], '蓝色山脉改为低对比鼠尾草色，保留像素岩面纹理')
middle = palette(original('magical-road/middle.png'), {
    (49, 148, 115): (115, 154, 102), (33, 123, 107): (85, 132, 97),
    (16, 99, 99): (69, 111, 91), (33, 74, 90): (72, 95, 80),
    (66, 173, 123): (149, 182, 109), (165, 222, 123): (215, 214, 141),
    (115, 107, 90): (182, 157, 115), (156, 132, 132): (210, 185, 143),
    (57, 82, 82): (98, 118, 85),
})
save('forest', middle.crop((0, 78, 64, 142)), ['magical-road/middle.png'], '分离远处针叶林，色板暖绿化')
save('meadow', middle.crop((0, 146, 64, 206)), ['magical-road/middle.png'], '分离有花丛细节的草地，色板暖绿化')
save('path', middle.crop((0, 133, 64, 153)), ['magical-road/middle.png'], '裁切土路，保留不规则路缘并调整暖沙色')
ground = warm(original('magical-road/tileset.png'), True)
save('bank', ground.crop((32, 0, 96, 96)), ['magical-road/tileset.png'], '裁切中间可平铺草岸块；降低饱和度并提亮')
for name in ['tree', 'pine']:
    art = warm(original(f'sunnyland-trees/{name}.png'), True)
    if name == 'tree':
        art = palette(original(f'sunnyland-trees/{name}.png'), {
            (50, 44, 67): (53, 80, 67), (33, 73, 80): (64, 101, 76),
            (48, 112, 71): (85, 132, 83), (58, 143, 64): (117, 157, 87),
            (83, 179, 57): (171, 190, 108), (105, 63, 85): (115, 85, 62),
            (150, 75, 76): (167, 115, 75), (179, 105, 80): (206, 157, 104),
        })
    save(name, art, [f'sunnyland-trees/{name}.png'], '暖绿树冠、铜棕枝干与暖色高光，保留透明边界')
for name in ['house', 'plant', 'mushroom-red', 'rock']:
    save(name, warm(original(f'sunnyland-forest/{name}.png'), name == 'plant'), [f'sunnyland-forest/{name}.png'], '提亮暗部、暖木色改色；屋顶植被改为暖绿')

# 下列是可审阅的原创像素点缀；不冒充第三方素材。
sun = Image.new('RGBA', (96, 96))
draw = ImageDraw.Draw(sun)
for y in range(96):
    for x in range(96):
        distance = math.hypot(x - 48, y - 48)
        if distance < 46:
            sun.putpixel((x, y), (255, 219, 137, round((1 - distance / 46) ** 1.4 * 35)))
for dy in range(-20, 21, 2):
    half = round(math.sqrt(max(0, 400 - dy * dy)))
    draw.rectangle((48 - half, 48 + dy, 48 + half, 49 + dy), fill='#fff1ba')
save('sun', sun, [], '原创像素太阳与离散光晕；显式坐标绘制，无 AI')
water = Image.new('RGBA', (256, 96), '#819d91')
draw = ImageDraw.Draw(water)
for y in range(96):
    t = y / 96
    color = tuple(round(a * (1 - t) + b * t) for a, b in zip((145, 176, 151), (75, 119, 105)))
    draw.line((0, y, 255, y), fill=(*color, 255))
rng = random.Random(17)
for i in range(105):
    x, y = rng.randrange(256), rng.randrange(96)
    base = water.getpixel((x, y))
    amount = rng.uniform(0.08, 0.22)
    color = tuple(round(a * (1 - amount) + b * amount) for a, b in zip(base[:3], (206, 211, 158)))
    draw.rectangle((x, y, min(255, x + rng.randrange(3, 19)), y), fill=(*color, 255))
save('water', water, [], '原创离散水面色阶和稀疏水纹；确定性手工程序绘制，无 AI')
mail = Image.new('RGBA', (44, 64))
draw = ImageDraw.Draw(mail)
for box, color in [((18, 29, 23, 63), '#866849'), ((20, 30, 21, 62), '#c8a573'),
                   ((6, 15, 37, 34), '#a96255'), ((9, 12, 34, 15), '#e4a379'),
                   ((7, 16, 34, 29), '#cf8864'), ((8, 16, 34, 18), '#f4c393'),
                   ((13, 22, 30, 24), '#795448'), ((38, 7, 39, 28), '#82604c'),
                   ((39, 6, 43, 15), '#f8d29d'), ((15, 33, 28, 35), '#815847')]:
    draw.rectangle(box, fill=color)
save('mailbox', mail, [], '原创信箱，显式像素坐标与有限色板，无 AI')
flowers = Image.new('RGBA', (80, 24))
draw = ImageDraw.Draw(flowers)
for i in range(12):
    x, y = i * 6 + 3, 5 + (i * 7) % 13
    draw.line((x, y, x, 23), fill='#779359')
    color = ['#f7d8b0', '#e6aa92', '#eebba5'][i % 3]
    draw.rectangle((x - 2, y, x + 2, y + 2), fill=color)
    draw.rectangle((x - 1, y - 1, x + 1, y + 3), fill=color)
    draw.point((x, y + 1), fill='#d0a75f')
save('flowers', flowers, [], '原创小花簇；显式像素坐标，无 AI')
lantern = Image.new('RGBA', (14, 26))
draw = ImageDraw.Draw(lantern)
for box, color in [((6, 0, 7, 7), '#806249'), ((2, 7, 11, 10), '#8c6c4d'),
                   ((3, 11, 10, 21), '#e3b977'), ((5, 12, 8, 20), '#ffe1a6'), ((2, 22, 11, 24), '#8c6c4d')]:
    draw.rectangle(box, fill=color)
save('lantern', lantern, [], '原创纸灯像素点缀，无 AI')

# 卡片使用同一批授权素材拼成风景明信片，取代第一阶段几何占位图。
postcard = Image.new('RGBA', (384, 256), '#f8e7c7')
for x in range(0, 384, sky.width):
    postcard.alpha_composite(sky, (x, -8))
mountains = Image.open(OUT / 'mountains.png').convert('RGBA')
for x in range(0, 384, 160):
    postcard.alpha_composite(mountains, (x, 0))
forest = Image.open(OUT / 'forest.png').convert('RGBA')
for x in range(0, 384, 64):
    postcard.alpha_composite(forest, (x, 125))
postcard.alpha_composite(sun, (240, 15))
tree = Image.open(OUT / 'tree.png').convert('RGBA')
postcard.alpha_composite(tree, (14, 94))
house = Image.open(OUT / 'house.png').convert('RGBA')
postcard.alpha_composite(house, (175, 44))
meadow = Image.open(OUT / 'meadow.png').convert('RGBA')
for x in range(0, 384, 64):
    postcard.alpha_composite(meadow, (x, 203))
postcard.alpha_composite(mail, (150, 154))
save('memory-landscape', postcard, ['magical-road/back.png', 'magical-road/middle.png', 'sunnyland-woods/bg-mountains.png', 'sunnyland-trees/tree.png', 'sunnyland-forest/house.png'], '由本项目改色版本与原创太阳/信箱组合成明信片')

source_hashes = {str(p.relative_to(SOURCE)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in SOURCE.rglob('*.png')}
(OUT / 'manifest.json').write_text(json.dumps({'sources': source_hashes, 'outputs': records}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Prepared {len(records)} textures; {sum(p.stat().st_size for p in OUT.glob("*.png")):,} bytes')
