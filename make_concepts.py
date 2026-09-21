#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

F  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def f(s): return ImageFont.truetype(F, s)
def fb(s): return ImageFont.truetype(FB, s)

MINT   = (16,185,129)
MINT_D = (7,94,70)
BG     = (248,250,252)
CARD   = (255,255,255)
TXT    = (17,24,39)
SUB    = (107,114,128)
LINE   = (229,231,235)
AMBER  = (245,158,11)
BLUE   = (37,99,235)
RED    = (220,38,38)

def rr(d, box, r, fill=None, outline=None, w=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=w)

def txt(d, xy, s, font, fill=TXT, anchor="la"):
    d.text(xy, s, font=font, fill=fill, anchor=anchor)

def phone_frame(img, x, y, w, h):
    d = ImageDraw.Draw(img)
    rr(d, (x-8, y-8, x+w+8, y+h+8), 30, fill=(209,213,219))
    rr(d, (x, y, x+w, y+h), 26, fill=BG)
    d.rectangle((x, y+4, x+w, y+h-4), fill=BG)
    return d

def header(d, x, y, w, label):
    d.rectangle((x, y, x+w, y+64), fill=MINT_D)
    txt(d, (x+18, y+32), label, fb(19), (255,255,255), anchor="lm")
    d.ellipse((x+w-52, y+12, x+w-20, y+44), fill=(255,255,255))

def card(d, x, y, w, h, r=16):
    rr(d, (x, y, x+w, y+h), r, fill=CARD, outline=LINE, w=1)

def row(d, x, y, w, icon, label, sub=None, chev=True):
    txt(d, (x+14, y+18), icon, f(16))
    txt(d, (x+42, y+18), label, fb(13), TXT, anchor="lm")
    if sub: txt(d, (x+42, y+36), sub, f(10), SUB, anchor="lm")
    if chev: txt(d, (x+w-18, y+18), "›", fb(16), SUB, anchor="lm")

def bigdoor(d, x, y, w, icon, label, sub, color=MINT):
    h = 78
    card(d, x, y, x+w, y+h, 18)
    d.ellipse((x+14, y+16, x+56, y+58), fill=color)
    txt(d, (x+35, y+37), icon, fb(20), (255,255,255), anchor="mm")
    txt(d, (x+72, y+30), label, fb(15), TXT, anchor="lm")
    txt(d, (x+72, y+50), sub, f(11), SUB, anchor="lm")

def sheet_title(img, y, main, subs):
    d = ImageDraw.Draw(img)
    txt(d, (img.width//2, y), main, fb(30), TXT, anchor="mm")
    for i, s in enumerate(subs):
        txt(d, (img.width//2, y+34+i*22), s, f(16), SUB, anchor="mm")

def badge(d, xy, label, color):
    x, y = xy
    w = 10 + len(label)*8
    rr(d, (x, y, x+w, y+22), 11, fill=color)
    txt(d, (x+w/2, y+11), label, fb(11), (255,255,255), anchor="mm")

W = 1720; H = 1560
img = Image.new("RGB", (W, H), (255,255,255))
sheet_title(img, 60, "Profile Redesign - 2 Concepts", ["Tap the top-right avatar -> a real Profile space, separate from the menu.", "Pick one (or mix) - I build it immediately."])

PW, PH = 380, 1180
py = 170
for px, name in [(190, "A"), (900, "B")]:
    d = phone_frame(img, px, py, PW, PH)
    label = "OPTION A - Identity Card" if name=="A" else "OPTION B - Command Center"
    txt(d, (px+PW/2, py-34), label, fb(17), MINT_D, anchor="mm")
    header(d, px, py, PW, "AirConnect")

    if name=="A":
        cy = py+84
        card(d, px+12, cy, PW-24, 150, 18)
        d.ellipse((px+28, cy+35, px+98, cy+105), fill=MINT)
        txt(d, (px+63, cy+70), ":)", fb(26), (255,255,255), anchor="mm")
        txt(d, (px+116, cy+52), "Samuel", fb(18), TXT, anchor="lm")
        txt(d, (px+116, cy+76), "+234 100 000 001", f(11), SUB, anchor="lm")
        badge(d, (px+116, cy+92), "PREMIUM", AMBER)
        card(d, px+12, cy+162, PW-24, 96, 18)
        txt(d, (px+26, cy+178), "About", fb(12), SUB, anchor="lm")
        txt(d, (px+26, cy+200), "Building the future.", f(13), TXT, anchor="lm")
        txt(d, (px+PW-26, cy+210), "Edit", fb(12), MINT, anchor="lm")
        rr(d, (px+12, cy+270, px+PW-12, cy+316), 16, fill=MINT)
        txt(d, (px+PW/2, cy+293), "Edit profile", fb(15), (255,255,255), anchor="mm")
        cy2 = cy+336
        card(d, px+12, cy2, PW-24, 190, 18)
        txt(d, (px+26, cy2+16), "ACCOUNT", fb(11), SUB, anchor="lm")
        row(d, px+12, cy2+40, PW-24, "*", "Recovery phrase", "View your 12 words")
        d.line((px+40, cy2+78, px+PW-30, cy2+78), fill=LINE)
        row(d, px+12, cy2+84, PW-24, "#", "Change passphrase", None)
        d.line((px+40, cy2+122, px+PW-30, cy2+122), fill=LINE)
        row(d, px+12, cy2+128, PW-24, "@", "Language", "English (auto)")
        cy3 = cy2+206
        card(d, px+12, cy3, PW-24, 128, 18)
        txt(d, (px+26, cy3+16), "DANGER ZONE", fb(11), RED, anchor="lm")
        row(d, px+12, cy3+40, PW-24, "<", "Log out", None)
        d.line((px+40, cy3+78, px+PW-30, cy3+78), fill=LINE)
        row(d, px+12, cy3+84, PW-24, "X", "Delete account", "Requires passphrase", False)
        txt(d, (px+PW/2, py+PH-26), "Clean. One screen. Nothing scattered.", f(11), SUB, anchor="mm")
    else:
        cy = py+84
        d.rectangle((px+12, cy, px+PW-12, cy+66), fill=MINT_D)
        d.ellipse((px+26, cy+13, px+78, cy+65), fill=(255,255,255))
        txt(d, (px+52, cy+39), ":)", fb(16), MINT_D, anchor="mm")
        txt(d, (px+92, cy+22), "Samuel", fb(16), (255,255,255), anchor="lm")
        txt(d, (px+92, cy+42), "Premium member", f(11), (209,250,229), anchor="lm")
        card(d, px+12, cy+76, PW-24, 78, 18)
        for i,(v,l) in enumerate([("142","Friends"),("8","Groups"),("1.2k","Posts")]):
            txt(d, (px+52+i*106, cy+100), v, fb(17), MINT_D, anchor="mm")
            txt(d, (px+52+i*106, cy+120), l, f(10), SUB, anchor="mm")
        cy2 = cy+168
        txt(d, (px+26, cy2), "QUICK ACTIONS", fb(11), SUB, anchor="lm")
        gx = [px+12, px+PW/2+6]; gy = [cy2+22, cy2+90]
        for i,(ic,l) in enumerate([("E","Edit profile"),("L","Language"),("S","Security"),("P","My plans")]):
            x0=gx[i%2]; y0=gy[i//2]
            card(d, x0, y0, PW/2-18, 62, 14)
            txt(d, (x0+PW/4-9, y0+20), ic, f(16), anchor="mm")
            txt(d, (x0+PW/4-9, y0+42), l, fb(10), TXT, anchor="mm")
        cy3 = cy2+172
        card(d, px+12, cy3, PW-24, 132, 18)
        row(d, px+12, cy3+8, PW-24, "*", "Recovery phrase", None)
        d.line((px+40, cy3+46, px+PW-30, cy3+46), fill=LINE)
        row(d, px+12, cy3+52, PW-24, "#", "Change passphrase", None)
        d.line((px+40, cy3+90, px+PW-30, cy3+90), fill=LINE)
        row(d, px+12, cy3+96, PW-24, "X", "Delete account", "Requires passphrase", False)
        rr(d, (px+12, cy3+146, px+PW-12, cy3+192), 16, fill=CARD, outline=RED, w=2)
        txt(d, (px+PW/2, cy3+169), "Log out", fb(14), RED, anchor="mm")
        txt(d, (px+PW/2, py+PH-26), "Power user feel: stats + one-tap actions.", f(11), SUB, anchor="mm")

img.save("profile_concepts.png")
print("profile_concepts.png saved")

W = 1720; H = 1560
img = Image.new("RGB", (W, H), (255,255,255))
sheet_title(img, 60, "Menu Redesign - 2 Concepts", ["Scattered items become a few clean doors. Each door opens its own screen.", "Owner-only tools (Forge & Admin) stay hidden from normal users."])

PW, PH = 380, 1180
py = 170
for px, name in [(190, "A"), (900, "B")]:
    d = phone_frame(img, px, py, PW, PH)
    label = "OPTION A - Five Doors" if name=="A" else "OPTION B - Hub + More"
    txt(d, (px+PW/2, py-34), label, fb(17), MINT_D, anchor="mm")
    header(d, px, py, PW, "AirConnect")
    cy = py+80
    txt(d, (px+18, cy), "MENU", fb(11), SUB, anchor="lm")
    cy += 22
    if name=="A":
        doors = [
            ("$","My Plans","Free - Pro - Ultra - Premium", MINT),
            ("O","Connect","World calling - My link - Add friend", BLUE),
            ("F","Studio","My channel - Broadcasts - Skills", (139,92,246)),
            ("g","Preferences","Language - Notifications - Privacy", (71,85,105)),
            ("H","Help & Support","Terms - Privacy - Contact us", (14,165,233)),
        ]
        for ic, l, s, col in doors:
            bigdoor(d, px+12, cy, PW-24, ic, l, s, col); cy += 88
        bigdoor(d, px+12, cy+6, PW-24, "W","Owner Tools","Forge - Admin - Fleet console", AMBER)
        txt(d, (px+PW/2, cy+96), "visible to Samuel only", f(10), AMBER, anchor="mm")
        txt(d, (px+PW/2, py+PH-60), "Every scattered button now lives behind one of these 6 doors.", f(11), SUB, anchor="mm")
        txt(d, (px+PW/2, py+PH-26), "AirConnect v94", f(11), SUB, anchor="mm")
    else:
        bigdoor(d, px+12, cy, PW-24, "$","My Plans","Manage your subscription", MINT); cy += 92
        bigdoor(d, px+12, cy, PW-24, "F","Studio","Channel - Broadcasts - Skills", (139,92,246)); cy += 92
        bigdoor(d, px+12, cy, PW-24, "O","Connect","World calling - Invite link", BLUE); cy += 100
        card(d, px+12, cy, PW-24, 240, 18)
        txt(d, (px+26, cy+16), "MORE SETTINGS", fb(11), SUB, anchor="lm")
        rows = [("+","Add a friend"),("L","Language"),("P","Privacy & Terms"),("R","Refresh app"),("D","Your data")]
        ry = cy+40
        for ic,l in rows:
            row(d, px+12, ry, PW-24, ic, l, None); ry += 38
            if l != rows[-1][1]: d.line((px+40, ry-20, px+PW-30, ry-20), fill=LINE)
        cy += 252
        bigdoor(d, px+12, cy, PW-24, "W","Owner Tools","Forge - Admin", AMBER); cy += 92
        txt(d, (px+PW/2, cy+8), "Profile & security moved to the avatar (top-right)", f(11), SUB, anchor="mm")
        txt(d, (px+PW/2, py+PH-26), "AirConnect v94", f(11), SUB, anchor="mm")

img.save("menu_concepts.png")
print("menu_concepts.png saved")
