from PIL import Image, ImageDraw, ImageFont
F  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def f(s): return ImageFont.truetype(F, s)
def fb(s): return ImageFont.truetype(FB, s)
MINT=(16,185,129); TEAL=(13,110,82); BG=(248,250,252); CARD=(255,255,255)
TXT=(17,24,39); SUB=(107,114,128); LINE=(229,231,235); AMBER=(245,158,11); BLUE=(37,99,235); RING=(5,150,105)
def rr(d,box,r,fill=None,outline=None,w=1): d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=w)
def txt(d,xy,s,font,fill=TXT,anchor="la"): d.text(xy,s,font=font,fill=fill,anchor=anchor)
def title(img,y,main,subs):
    d=ImageDraw.Draw(img)
    txt(d,(img.width//2,y),main,fb(30),TXT,anchor="mm")
    for i,s in enumerate(subs): txt(d,(img.width//2,y+34+i*22),s,f(15),SUB,anchor="mm")
def frame(img,x,y,w,h):
    d=ImageDraw.Draw(img)
    rr(d,(x-8,y-8,x+w+8,y+h+8),30,fill=(209,213,219))
    rr(d,(x,y,x+w,y+h),26,fill=BG)
    d.rectangle((x,y+4,x+w,y+h-4),fill=BG)
    return d
def hdr(d,x,y,w,label,teal=True):
    d.rectangle((x,y,x+w,y+60),fill=TEAL if teal else MINT)
    txt(d,(x+16,y+30),label,fb(18),(255,255,255),anchor="lm")
    txt(d,(x+w-30,y+30),":",fb(18),(255,255,255),anchor="mm")
def ring_av(d,cx,cy,r,letter,col,ringcol,ringw=4):
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=ringcol)
    d.ellipse((cx-r+ringw,cy-r+ringw,cx+r-ringw,cy+r-ringw),fill=col)
    txt(d,(cx,cy),letter,fb(15),(255,255,255),anchor="mm")
W=2100;H=1500
img=Image.new("RGB",(W,H),(255,255,255))
title(img,60,"Status Page Redesign - 3 New Concepts",["Pick one - I build it immediately as v96.","v94 teal headers shown."])
PW,PH=420,1120; py=180
xs=[110,720,1330,1940-W]
names=[("C1","WhatsApp Mirror"),("C2","Story Circles"),("C3","Bold Grid")]
for k,(px,(cid,nm)) in enumerate(zip([140,780,1420],names)):
    d=frame(img,px,py,PW,PH)
    txt(d,(px+PW/2,py-32),"OPTION "+cid+" - "+nm,fb(16),TEAL,anchor="mm")
    hdr(d,px,py,PW,"Status")
    if cid=="C1":
        cy=py+76
        # my status row
        rr(d,(px+14,cy,px+PW-14,cy+58),16,fill=CARD,outline=LINE)
        ring_av(d,px+52,cy+28,24,"S",MINT,(5,150,105),3)
        txt(d,(px+92,cy+18),"My status",fb(14),TXT,anchor="lm")
        txt(d,(px+92,cy+38),"Tap to add a status update",f(11),SUB,anchor="lm")
        d.ellipse((px+PW-66,cy+10,px+PW-30,cy+46),fill=MINT)
        txt(d,(px+PW-48,cy+28),":",fb(14),(255,255,255),anchor="mm")
        # recent
        cy+=76
        txt(d,(px+22,cy),"RECENT UPDATES",fb(11),(5,150,105),anchor="lm")
        for i,(nm2,t) in enumerate([("Adebayo","12:04"),("Chidi","11:47"),("Zainab","09:15")]):
            ry=cy+18+i*62
            rr(d,(px+14,ry,px+PW-14,ry+52),14,fill=CARD,outline=LINE)
            ring_av(d,px+46,ry+26,20,nm2[0],(37,99,235),(5,150,105),4)
            txt(d,(px+78,ry+18),nm2,fb(13),TXT,anchor="lm")
            txt(d,(px+78,ry+36),"3 minutes ago",f(10),SUB,anchor="lm")
            txt(d,(px+PW-24,ry+26),t,f(10),SUB,anchor="rm")
        # viewed
        cy2=cy+18+3*62+14
        txt(d,(px+22,cy2),"VIEWED UPDATES",fb(11),SUB,anchor="lm")
        for i,(nm2,t) in enumerate([("Emeka","Yesterday"),("Tunde","Yesterday")]):
            ry=cy2+18+i*56
            rr(d,(px+14,ry,px+PW-14,ry+46),12,fill=(241,245,249))
            ring_av(d,px+44,ry+23,18,nm2[0],(148,163,184),(203,213,225),3)
            txt(d,(px+74,ry+23),nm2,fb(12),(100,116,139),anchor="lm")
        # pencil FAB
        d.ellipse((px+PW-76,py+PH-90,px+PW-20,py+PH-34),fill=MINT)
        txt(d,(px+PW-48,py+PH-62),"E",fb(18),(255,255,255),anchor="mm")
        txt(d,(px+PW/2,py+PH-14),"Exactly WhatsApp. Zero learning curve.",f(10),SUB,anchor="mm")
    elif cid=="C2":
        cy=py+80
        # horizontal story circles
        xs2=[px+52,px+126,px+200,px+274,px+348]
        d.ellipse((xs2[0]-30,cy-30,xs2[0]+30,cy+30),fill=(209,250,229))
        txt(d,(xs2[0],cy),"S",fb(16),RING,anchor="mm")
        d.ellipse((xs2[0]+14,cy+12,xs2[0]+32,cy+30),fill=MINT)
        txt(d,(xs2[0]+23,cy+21),"+",fb(11),(255,255,255),anchor="mm")
        labels=["Ade","Chi","Zai","Eme"]
        cols=[(37,99,235),(139,92,246),(234,88,12),(6,182,212)]
        for i in range(4):
            ring_av(d,xs2[i+1],cy,28,labels[i][0],cols[i],(5,150,105),5)
            txt(d,(xs2[i+1],cy+44),labels[i],f(9),SUB,anchor="mm")
        txt(d,(px+PW/2,cy+76),"tap a circle - story opens full-screen",f(10),SUB,anchor="mm")
        # viewer preview box
        vy=cy+96
        rr(d,(px+14,vy,px+PW-14,vy+330),18,fill=(15,23,42))
        txt(d,(px+PW/2,vy+90),"FULL-SCREEN",fb(16),(255,255,255),anchor="mm")
        txt(d,(px+PW/2,vy+120),"STORY VIEWER",fb(16),(255,255,255),anchor="mm")
        txt(d,(px+PW/2,vy+160),"tap sides = next / prev",f(10),(148,163,184),anchor="mm")
        txt(d,(px+PW/2,vy+180),"swipe down = close",f(10),(148,163,184),anchor="mm")
        txt(d,(px+PW/2,vy+220),"progress bars on top",f(10),(148,163,184),anchor="mm")
        txt(d,(px+PW/2,vy+280),"Instagram-energy, WhatsApp-familiar",f(10),SUB,anchor="mm")
    else:
        cy=py+80
        # your status big tile
        rr(d,(px+14,cy,px+PW-14,cy+130),18,fill=MINT)
        txt(d,(px+48,cy+40),"Y",fb(30),(255,255,255),anchor="mm")
        txt(d,(px+90,cy+44),"Your status",fb(16),(255,255,255),anchor="lm")
        txt(d,(px+90,cy+70),"Camera - Photo - Video - Text",f(11),(209,250,229),anchor="lm")
        txt(d,(px+90,cy+96),"one tap to share with all friends",f(9),(167,243,208),anchor="lm")
        # grid
        cy2=cy+150
        txt(d,(px+22,cy2),"RECENT",fb(11),(5,150,105),anchor="lm")
        gx=[px+14,px+PW/2+7]; gy=[cy2+20,cy2+20+150]
        for i in range(4):
            x0=gx[i%2];y0=gy[i//2]
            rr(d,(x0,y0,x0+(PW-28)/2 if i%2==0 else px+PW-14,y0+140),16,fill=(15,23,42) if i%2 else (37,99,235))
            txt(d,(x0+(PW-28)/4,y0+60),["Ade","Chi","Zai","Eme"][i],fb(14),(255,255,255),anchor="mm")
            txt(d,(x0+(PW-28)/4,y0+86),"12m ago",f(9),(148,163,184),anchor="mm")
        txt(d,(px+PW/2,py+PH-60),"Viewed: dimmed grid tiles below",f(10),SUB,anchor="mm")
        txt(d,(px+PW/2,py+PH-14),"Visual, bold, modern - feeds-first",f(10),SUB,anchor="mm")
img.save("status_concepts.png")
print("saved")
