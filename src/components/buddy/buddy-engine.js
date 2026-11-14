import { drawBuddyBody, drawBuddyHand, projectBuddyPoint } from "./buddy-art.js";
import { sampleTornadoSpin, TORNADO_TIMING } from "./buddy-motion.js";
export { TORNADO_DURATION_SECONDS, TORNADO_REVEAL_START, TORNADO_RETARGET_UNTIL, TORNADO_TIMING } from "./buddy-motion.js";
/* Shared articulated rig with scalable artwork based on the supplied v2 design. */
  const TAU=Math.PI*2, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,v)=>a+(b-a)*v;
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const mixAngle=(a,b,v)=>a+angleDelta(a,b)*v;
  const names=['Idle','Wave','Listen','Think','Talk','Explain','Point left','Point right','Nod','Celebrate','Reassure','Bow','Glide','Peek','Shrug','Sleep','Search','Read','Idea','Approve','Wait','Thank you','Guide up','Guide down','Dance','Stretch','Sway','Toss','Build'];
  const expressions=['Automatic','Neutral','Warm','Curious','Focused','Thoughtful','Delighted','Reassuring','Concerned','Surprised','Unsure','Resting','Confident'];
  const styles=['Calm','Bouncy','Expressive'];
  const forms=['Key','£ sign','Heart'];
  const rects=[[103,10,240,439],[461,27,309,416],[836,73,356,345],[79,483,294,318],[515,514,219,285],[919,470,210,331],[119,863,221,333],[462,925,318,259],[873,869,298,327]];
  const anatomy=[
    {w:174,h:318,face:[7,-54],eyes:27,shoulders:[[-33,15],[35,15]],limbs:[60,60]},
    {w:230,h:310,face:[-8,-108],eyes:25,shoulders:[[-68,17],[61,17]],limbs:[63,63]},
    {w:246,h:238,face:[9,-23],eyes:33,shoulders:[[-91,9],[93,9]],limbs:[54,56]}
  ];
  function expression(p,id,t){
    switch(id){
      case 1:p.smile=.45;p.mouth=0;break;
      case 2:p.smile=1.25;p.eyeL=.96;p.eyeR=.96;p.browYL=-1;p.browYR=-1;break;
      case 3:p.eyeL=1.12;p.eyeR=.70;p.browL=-.18;p.browR=.18;p.browYL=-2;p.browYR=-7;p.gazeX=4;p.smile=.55;break;
      case 4:p.eyeL=.76;p.eyeR=.76;p.browL=.13;p.browR=-.13;p.smile=.08;p.mouth=0;p.gazeY=1;break;
      case 5:p.eyeL=.68;p.eyeR=.98;p.gazeX=-6;p.gazeY=-3;p.browYL=1;p.browYR=-6;p.browL=.12;p.browR=.18;p.smile=.25;p.mouth=0;p.mouthX=-3;break;
      case 6:p.eyeL=.78;p.eyeR=.78;p.browYL=-3;p.browYR=-3;p.smile=1.4;p.mouth=.60;break;
      case 7:p.eyeL=.68;p.eyeR=.68;p.browL=-.10;p.browR=.10;p.smile=.85;p.mouth=0;break;
      case 8:p.eyeL=.88;p.eyeR=.88;p.browL=-.32;p.browR=.32;p.browYL=-1;p.browYR=-1;p.smile=-.85;p.mouth=0;break;
      case 9:p.eyeL=1.22;p.eyeR=1.22;p.browYL=-5;p.browYR=-5;p.mouth=.9;p.roundMouth=1;p.smile=.1;break;
      case 10:p.eyeL=.72;p.eyeR=.97;p.browYL=-3;p.browYR=1;p.browL=-.19;p.smile=-.15;p.mouth=0;p.mouthX=3;break;
      case 11:p.eyeL=.06;p.eyeR=.06;p.smile=.5;p.mouth=0;break;
      case 12:p.eyeL=1-.95*Math.pow(Math.max(0,Math.sin(t*2.3)),18);p.eyeR=.94;p.browYL=-2;p.browR=-.08;p.smile=1.1;p.mouthX=2;break;
    }return p;
  }
  function pose(form,state,t,style=0,faceStyle=0){
    const f=anatomy[form].face, amp=[.72,1.05,1.36][style], speed=[.8,1.08,1.22][style];
    const a=t*speed,s=Math.sin(a*TAU),soft=Math.sin(a*2.1);
    // A resting wrist sits beside its own silhouette, not inside the wider £/heart body.
    const rest=[[-82,84,86,83],[-124,92,125,91],[-119,87,120,86]][form];
    const p={x:0,y:soft*2.5*amp,rot:soft*.012*amp,yaw:0,sx:1,sy:1,eye:1,eyeL:1,eyeR:1,gazeX:0,gazeY:0,mouth:0,smile:1,browL:0,browR:0,browYL:0,browYR:0,roundMouth:0,mouthX:0,handMix:1,oldLH:-1,oldRH:-1,
      lx:rest[0],ly:rest[1],lex:rest[0]-12,ley:rest[1]*.45,la:-.16,lh:5,rx:rest[2],ry:rest[3],rex:rest[2]+12,rey:rest[3]*.45,ra:.15,rh:5,frontL:0,frontR:0};
    switch(state){
      case 0:p.gazeX=Math.sin(a*.8)*2.4;p.gazeY=Math.sin(a*.55)*.7;p.rot=soft*.012;p.lx+=Math.sin(a*1.1)*1.4;p.rx+=Math.sin(a*1.1+.8)*1.4;p.ly+=Math.sin(a*1.7)*1.8;p.ry+=Math.sin(a*1.7+.7)*1.8;p.sx+=Math.sin(a*1.8)*.003;p.sy-=Math.sin(a*1.8)*.004;break;
      case 1:p.rx=109+Math.sin(a*7)*7*amp;p.ry=f[1]-35;p.rex=128;p.rey=3;p.ra=Math.sin(a*9)*.35*amp;p.rh=0;p.rot=-.035*amp;p.smile=1.2;break;
      case 2:p.rx=f[0]+75;p.ry=f[1]+2;p.rex=118;p.rey=48;p.rh=0;p.ra=.42;p.rot=-.075*amp;p.gazeX=5;p.browR=-.06;p.y+=Math.sin(a*2)*2;break;
      case 3:p.rx=f[0]+28;p.ry=f[1]+44;p.rex=106;p.rey=65;p.rh=1;p.ra=-.23;p.frontR=1;p.rot=.055*amp;p.gazeX=-4;p.gazeY=-3;p.browL=.15;p.browR=-.12;p.smile=.25;break;
      case 4:p.lx=-104;p.ly=47+Math.sin(a*4)*7*amp;p.rx=110;p.ry=36+Math.cos(a*4.4)*8*amp;p.lex=-62;p.ley=94;p.rex=66;p.rey=94;p.lh=0;p.rh=0;p.la=-.9;p.ra=.9;p.mouth=.25+.6*Math.abs(Math.sin(a*8.7));p.rot=Math.sin(a*3)*.028*amp;break;
      case 5:p.rx=135;p.ry=-25+Math.sin(a*3)*7*amp;p.rex=103;p.rey=32;p.rh=2;p.ra=1.02;p.lx=-95;p.ly=48;p.lex=-58;p.ley=88;p.lh=0;p.la=-1.15;p.gazeX=4;p.browR=-.05;p.mouth=.18+.25*Math.abs(Math.sin(a*7));break;
      case 6:p.lx=-155;p.ly=-8+Math.sin(a*3)*4*amp;p.lex=-110;p.ley=16;p.lh=2;p.la=-Math.PI/2;p.rot=-.04;p.gazeX=-6;break;
      case 7:p.rx=158;p.ry=-8+Math.sin(a*3)*4*amp;p.rex=110;p.rey=16;p.rh=2;p.ra=Math.PI/2;p.rot=.04;p.gazeX=6;break;
      case 8:{const nod=Math.sin(Math.min(a,1.7)*Math.PI*2)*Math.exp(-a*1.4);p.y+=nod*7*amp;p.sy=1-Math.max(0,nod)*.025*amp;p.gazeY=nod*2;p.eye=.95;p.smile=1.1;break;}
      case 9:{const lift=(1-Math.cos(a*TAU))*.5;p.lx=-111-Math.sin(a*3)*4;p.rx=111+Math.sin(a*3+.5)*4;p.ly=-101-lift*8;p.ry=-101-(1-Math.cos(a*TAU+.3))*4;p.lex=-132;p.rex=132;p.ley=-20;p.rey=-20;p.lh=0;p.rh=0;p.la=-.22;p.ra=.22;p.y-=lift*14*amp;p.rot=Math.sin(a*4)*.04*amp;p.sy=1+lift*.015;p.mouth=.32;p.smile=1.3;break;}
      case 10:p.lx=-102;p.ly=52;p.lex=-62;p.ley=92;p.rx=20;p.ry=form===0?25:37;p.lh=4;p.rh=5;p.la=-.22;p.ra=-.92;p.frontR=1;p.rot=-.025;p.eye=.9;p.smile=.8;break;
      case 11:{const b=(1-Math.cos(a*2.1))*.5;p.y+=b*16;p.sy=1-b*.12;p.rot=-b*.06;p.lx=-78;p.rx=78;p.ly=86;p.ry=86;p.eye=1-b*.8;p.smile=.8;break;}
      case 12:p.x=Math.sin(a*1.4)*24*amp;p.y-=Math.sin(a*2.8)*14*amp;p.rot=-Math.cos(a*1.4)*.12*amp;p.lx=-125;p.rx=125;p.ly=30;p.ry=30;p.lh=0;p.rh=0;p.la=-1.25;p.ra=1.25;p.gazeX=Math.cos(a*1.4)*5;break;
      case 13:p.x=Math.sin(a*1.6)*18*amp;p.rot=Math.sin(a*1.6)*.18*amp;p.rx=91;p.ry=f[1]+18;p.rh=0;p.ra=-.25;p.gazeX=-Math.sin(a*1.6)*6;p.browR=-.15;break;
      case 14:p.lx=-124;p.rx=124;p.ly=4+soft*8;p.ry=4+soft*8;p.lex=-107;p.rex=107;p.ley=45;p.rey=45;p.lh=0;p.rh=0;p.la=-1.3;p.ra=1.3;p.browL=-.18;p.browR=.18;p.smile=.3;p.rot=Math.sin(a*2)*.035;break;
      case 15:p.eye=0;p.smile=.45;p.rot=.085;p.y=soft*4;p.sy=1+Math.sin(a*2)*.018;p.ly=99;p.ry=99;p.lx=-58;p.rx=58;break;
      case 16:p.gazeX=Math.sin(a*2.1)*6;p.gazeY=-2;p.rx=f[0]+50;p.ry=f[1]-24;p.rh=5;p.ra=-.9;p.frontR=1;p.rot=Math.sin(a*1.8)*.055;break;
      case 17:p.lx=-66;p.rx=70;p.ly=43;p.ry=43;p.lex=-48;p.ley=86;p.rex=52;p.rey=86;p.lh=4;p.rh=4;p.la=-.14;p.ra=.14;p.gazeY=4;p.gazeX=Math.sin(a*2)*3;p.rot=.025;p.frontL=.2;p.frontR=.2;break;
      case 18:p.rx=107;p.ry=f[1]-12;p.rh=2;p.ra=.06;p.rot=-.045;p.y-=Math.sin(a*2)*3;p.browYR=-4;break;
      case 19:p.rx=105;p.ry=f[1]+25;p.rh=3;p.ra=.04;p.rot=-.04;p.y+=Math.sin(a*3)*3;break;
      case 20:p.rx=110;p.ry=0;p.rh=0;p.ra=.06;p.smile=.35;p.eye=.9;p.rot=-.025;break;
      case 21:p.rx=20;p.ry=32;p.rh=5;p.ra=-.78;p.frontR=1;p.lx=-90;p.ly=65;p.lh=4;p.la=-.18;p.sy=1-Math.max(0,Math.sin(a*2))*.04;p.y+=Math.max(0,Math.sin(a*2))*6;break;
      case 22:p.rx=105;p.ry=f[1]-15;p.rh=2;p.ra=0;p.gazeY=-4;p.lh=4;p.la=-.2;break;
      case 23:p.rx=112;p.ry=83;p.rh=2;p.ra=Math.PI;p.gazeY=4;p.lh=4;p.la=-.2;break;
      case 24:{
        // A small side-to-side groove, with opposite arms following the body beat.
        // The caller bounds the gesture and blends it back into breathing idle.
        const beat=a*3.6,rock=Math.sin(beat),follow=Math.sin(beat-.45),settle=(1-Math.cos(beat*2))*.5;
        p.x=rock*7*amp;p.y-=settle*5*amp;p.rot=rock*.055*amp;p.sx=1+settle*.012;p.sy=1-settle*.016;
        p.lx=-114+follow*7;p.rx=114+follow*7;p.ly=24+Math.sin(beat+.4)*22;p.ry=24-Math.sin(beat+.4)*22;
        p.lex=-62;p.rex=62;p.ley=94;p.rey=94;p.lh=0;p.rh=0;p.la=-.65+rock*.12;p.ra=.65+rock*.12;
        p.gazeX=rock*2;p.smile=1.25;p.mouth=.2;break;
      }
      case 25:{
        const lift=(1-Math.cos(a*1.8))*.5;
        p.lx=-103-lift*12;p.rx=103+lift*12;p.ly=30-lift*145;p.ry=30-lift*145;
        p.lex=-112;p.rex=112;p.ley=24;p.rey=24;p.lh=0;p.rh=0;
        p.la=-.3;p.ra=.3;p.sy=1+lift*.025;p.y=-lift*7;p.eye=.9;p.smile=1.1;break;
      }
      case 26:{
        const sway=Math.sin(a*2.4),step=Math.sin(a*4.8);
        p.x=sway*13*amp;p.y=-Math.abs(step)*5;p.rot=sway*.075;
        p.lx=-111+sway*9;p.rx=111+sway*9;p.ly=37+step*19;p.ry=37-step*19;
        p.lex=-76;p.rex=76;p.ley=86;p.rey=86;p.lh=4;p.rh=0;p.la=-.65;p.ra=.65;break;
      }
      case 27:{
        const reach=(1-Math.cos(a*2.3))*.5;
        p.rx=110;p.ry=52-reach*54;p.rex=83;p.rey=78;p.rh=4;p.ra=.16;p.frontR=1;
        p.lx=-100;p.ly=74;p.lh=0;p.la=-.35;p.gazeX=4;p.gazeY=-reach*3;p.rot=-reach*.035;break;
      }
      case 28:{
        const tap=(1-Math.cos(a*5.2))*.5;
        p.rx=108;p.ry=15-tap*24;p.rex=91;p.rey=68;p.rh=1;p.ra=.12-tap*.38;p.frontR=1;
        p.lx=-90;p.ly=70;p.lh=4;p.la=-.3;p.rot=.02+tap*.025;p.gazeX=5;p.gazeY=2;break;
      }
    }
    if(form===2){
      if(!p.frontL&&state!==12)p.lx-=18;
      if(!p.frontR&&state!==12)p.rx+=state===1||state===2?25:18;
    }
    if(style===1&&![0,8,9,11,12,15,24].includes(state)){p.y-=Math.abs(Math.sin(a*2.8))*3;p.sy+=Math.sin(a*2.8)*.008;}
    if(style===2&&![11,15].includes(state))p.rot+=Math.sin(a*2)*.025;
    const blink=Math.pow(Math.max(0,Math.cos((a+1.3)*1.34)),90);
    p.eye*=1-blink*.96;
    // Resolve each wrist independently before interpolation. A forward right arm
    // must never snap the lowered left hand upright (or vice versa).
    const n=anatomy[form];
    const directedWrist=state>=25&&state<=28;
    if(directedWrist){
      // New full-arm gestures keep one bend side through the whole lift. A
      // fixed world-space elbow hint can cross the two inverse-kinematic
      // candidates as the wrist rises, turning a supported palm inside out.
      const guide=(shoulder,wx,wy,side)=>{
        const dx=wx-shoulder[0],dy=wy-shoulder[1],raw=Math.hypot(dx,dy)||1;
        const reach=clamp(raw,22,(n.limbs[0]+n.limbs[1])*.94),ux=dx/raw,uy=dy/raw;
        return [shoulder[0]+ux*reach*.5-uy*side*80,shoulder[1]+uy*reach*.5+ux*side*80];
      };
      [p.lex,p.ley]=guide(n.shoulders[0],p.lx,p.ly,-1);
      [p.rex,p.rey]=guide(n.shoulders[1],p.rx,p.ry,1);
    }
    const left=limb(n.shoulders[0],[p.lx,p.ly],n.limbs,-1,[p.lex,p.ley]);
    const right=limb(n.shoulders[1],[p.rx,p.ry],n.limbs,1,[p.rex,p.rey]);
    const wrist=(arm,kind,wanted,front)=>{
      const desired=kind===1||kind===5?mixAngle(arm.angle,wanted,clamp(front)):wanted;
      return arm.angle+clamp(angleDelta(arm.angle,desired),-1.35,1.35);
    };
    if(directedWrist){
      // Author the cuff relative to its forearm. Keeping a palm at an absolute
      // angle lets the shortest-arc clamp jump between opposite limits when
      // arm and palm are antiparallel; these small offsets have no such seam.
      const offsets=state===25?[-.08,.08]:state===26?[-.12,.12]:state===27?[-.10,-.30]:[-.10,.12-(1-Math.cos(a*5.2))*.12];
      p.la=left.angle+offsets[0];p.ra=right.angle+offsets[1];
    }else{
      p.la=wrist(left,p.lh,p.la,p.frontL);p.ra=wrist(right,p.rh,p.ra,p.frontR);
    }
    const auto=[2,2,3,5,2,12,4,4,2,6,7,2,2,3,10,11,4,4,9,12,1,7,4,4,6,2,6,3,4];
    return expression(p,faceStyle||auto[state]||1,a);
  }
  function blend(a,b,t){const p={};for(const k of Object.keys(b))p[k]=['lh','rh'].includes(k)?b[k]:['la','ra','rot','yaw'].includes(k)?mixAngle(a[k],b[k],t):mix(a[k],b[k],t);p.oldLH=a.lh;p.oldRH=a.rh;p.handMix=t;return p;}
  function limb(s,w,lengths,side,preferred){
    const dx=w[0]-s[0],dy=w[1]-s[1],raw=Math.hypot(dx,dy)||1,d=clamp(raw,22,(lengths[0]+lengths[1])*.94),ux=dx/raw,uy=dy/raw;
    w=[s[0]+ux*d,s[1]+uy*d];const along=(lengths[0]**2-lengths[1]**2+d*d)/(2*d),h=Math.sqrt(Math.max(0,lengths[0]**2-along*along));
    const candidates=[1,-1].map(sign=>[s[0]+ux*along-uy*h*sign,s[1]+uy*along+ux*h*sign]);
    // Pose-authored elbow guides keep open palms supported from below.
    // The old outward-only choice could invert a speaking arm by over 130°.
    let e;
    if(preferred){
      const distances=candidates.map(point=>Math.hypot(point[0]-preferred[0],point[1]-preferred[1]));
      // A hard nearest-candidate switch flips the elbow mid-gesture. The soft
      // crossover lets the curved arm settle continuously through that boundary.
      const weight=ease(clamp(.5+(distances[1]-distances[0])/32));
      e=candidates[0].map((value,index)=>mix(candidates[1][index],value,weight));
    }else e=Math.abs(candidates[0][0]-candidates[1][0])>5?(candidates[0][0]*side>candidates[1][0]*side?candidates[0]:candidates[1]):(candidates[0][1]>candidates[1][1]?candidates[0]:candidates[1]);
    const c=[2*e[0]-(s[0]+w[0])*.5,2*e[1]-(s[1]+w[1])*.5];
    return {s,e,c,w,angle:Math.atan2(w[1]-c[1],w[0]-c[0])+Math.PI/2};
  }
  class Character {
    constructor(atlas,hands){this.atlas=atlas;this.hands=hands;}
    sprite(ctx,n,x,y,w,h){const r=rects[n];ctx.drawImage(this.atlas,...r,x,y,w,h);}
    arm(ctx,l,fore=false,alpha=1){
      const {s,e,c,w}=l;ctx.save();ctx.globalAlpha*=alpha;
      const path=()=>{ctx.beginPath();ctx.moveTo(...(fore?e:s));ctx.quadraticCurveTo(...(fore?[(c[0]+w[0])*.5,(c[1]+w[1])*.5]:c),...w);};
      ctx.lineCap='round';ctx.lineJoin='round';
      for(const [width,colour] of [[15,'#102B4F'],[12,'#193A60'],[9,'#254971']]){path();ctx.lineWidth=width;ctx.strokeStyle=colour;ctx.stroke();}
      ctx.translate(-1.1,-1.1);path();ctx.lineWidth=2.2;ctx.strokeStyle='rgba(112,144,174,.50)';ctx.stroke();ctx.restore();
    }
    body(ctx,form,yaw){drawBuddyBody(ctx,form,yaw);}
    hand(ctx,x,y,angle,kind,mirror){drawBuddyHand(ctx,x,y,angle,kind,mirror);}
    face(ctx,form,p){
      const n=anatomy[form],f=n.face,d=n.eyes;
      ctx.save();ctx.translate(...f);ctx.lineCap='round';
      for(const side of [-1,1]){
        const x=side*d,y=side===1?-2:0,eye=p.eye*(side<0?p.eyeL:p.eyeR);
        ctx.save();ctx.translate(x+p.gazeX*.38,y+p.gazeY*.28);
        if(eye<.15){ctx.strokeStyle='#173A51';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-11,0);ctx.quadraticCurveTo(0,5,11,-1);ctx.stroke();}
        else{ctx.scale(1,eye);const gloss=ctx.createLinearGradient(-10,-10,10,10);gloss.addColorStop(0,'#305870');gloss.addColorStop(.40,'#12334D');gloss.addColorStop(1,'#071D32');ctx.fillStyle=gloss;
        ctx.beginPath();ctx.moveTo(-12,4);ctx.bezierCurveTo(-9,-10,9,-12,13,0);ctx.bezierCurveTo(10,8,-5,10,-12,4);ctx.fill();
        ctx.fillStyle='#F3FBFB';ctx.beginPath();ctx.ellipse(4.4,-4.3,3,2.8,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(148,194,202,.4)';ctx.beginPath();ctx.ellipse(-4,3,1.5,1,0,0,TAU);ctx.fill();}
        ctx.restore();
        ctx.save();ctx.translate(x,y-(form===1?14:18)+(side<0?p.browYL:p.browYR));ctx.rotate(side<0?p.browL:p.browR);ctx.strokeStyle='#244759';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(-10,2);ctx.quadraticCurveTo(0,-2,11,0);ctx.stroke();ctx.restore();
      }
      ctx.translate(p.mouthX,form===1?14:23);ctx.fillStyle='#10324A';ctx.strokeStyle='#173A51';ctx.lineWidth=2.4;
      if(p.roundMouth>.5){ctx.beginPath();ctx.ellipse(0,form===1?-3:1,5.5,form===1?7:8,0,0,TAU);ctx.fill();}
      else if(p.mouth>.12){ctx.beginPath();ctx.moveTo(-13,0);ctx.quadraticCurveTo(0,4,13,0);ctx.bezierCurveTo(10,8+p.mouth*7,-10,8+p.mouth*7,-13,0);ctx.fill();ctx.fillStyle='#DAF0EE';ctx.beginPath();ctx.moveTo(-8,1.5);ctx.quadraticCurveTo(0,3,8,1.5);ctx.lineTo(6,4);ctx.quadraticCurveTo(0,5,-6,4);ctx.closePath();ctx.fill();}
      else {ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(0,9*p.smile,13,-2);ctx.stroke();}
      ctx.restore();
    }
    draw(ctx,form,p,x,y,scale=1,alpha=1,layers){
      const n=anatomy[form],yaw=p.yaw||0,facing=Math.cos(yaw);
      ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x+p.x*scale,y+p.y*scale);
      ctx.rotate(p.rot);ctx.scale(scale*p.sx,scale*p.sy);
      const left=limb(n.shoulders[0],[p.lx,p.ly],n.limbs,-1,[p.lex,p.ley]);
      const right=limb(n.shoulders[1],[p.rx,p.ry],n.limbs,1,[p.rex,p.rey]);
      const projectArm=arm=>{
        const point=v=>{const q=projectBuddyPoint(v[0],v[1],0,yaw);return [q.x,q.y];};
        const out={...arm,s:point(arm.s),e:point(arm.e),c:point(arm.c),w:point(arm.w)};
        out.angle=Math.atan2(out.w[1]-out.c[1],out.w[0]-out.c[0])+Math.PI/2;return out;
      };
      const l=projectArm(left),r=projectArm(right);
      this.arm(ctx,l);this.arm(ctx,r);
      const drawHand=(original,arm,k,angle,mirror,old)=>{
        const projected=angle+angleDelta(original.angle,arm.angle);
        const paint=kind=>this.hand(ctx,...arm.w,projected,kind,mirror);
        if(old>=0&&old!==k&&p.handMix<1){
          ctx.save();ctx.globalAlpha*=1-p.handMix;paint(old);ctx.restore();
          ctx.save();ctx.globalAlpha*=p.handMix;paint(k);ctx.restore();
        }else paint(k);
      };
      const hands=()=>{
        drawHand(left,l,p.lh,p.la,true,p.oldLH);
        drawHand(right,r,p.rh,p.ra,false,p.oldRH);
      };
      const props=()=>{if(layers?.beforeHands){ctx.save();try{layers.beforeHands(ctx,{left:l,right:r,pose:p});}finally{ctx.restore();}}};
      if(facing<0){props();hands();}
      this.body(ctx,form,yaw);
      if(facing>.02){
        ctx.save();ctx.translate(14*Math.sin(yaw),-1.68);ctx.scale(facing,1);
        this.face(ctx,form,p);ctx.restore();
      }
      if(facing>=0){
        if(p.frontL>.001)this.arm(ctx,l,true,p.frontL);
        if(p.frontR>.001)this.arm(ctx,r,true,p.frontR);
      }
      if(facing>=0){props();hands();}
      ctx.restore();
    }
    tornado(ctx,t,x,y,scale=1,front=false){
      const power=ease((t-.14)/.16)*(1-ease((t-.82)/.18));if(power<.001)return;
      ctx.save();ctx.translate(x,y);ctx.scale(scale*(.65+.35*power),scale*(.65+.35*power));ctx.globalAlpha*=power;
      const phase=.2+sampleTornadoSpin(t).angle,turns=TAU*3.15;
      if(!front){
        const core=ctx.createLinearGradient(0,-160,0,155);
        core.addColorStop(0,'rgba(101,185,179,.04)');core.addColorStop(.45,'rgba(37,141,138,.18)');core.addColorStop(1,'rgba(20,54,106,.04)');
        ctx.fillStyle=core;ctx.beginPath();ctx.moveTo(-136,-150);ctx.bezierCurveTo(-110,-30,-30,85,-10,149);ctx.quadraticCurveTo(0,157,10,149);ctx.bezierCurveTo(30,85,110,-30,136,-150);ctx.quadraticCurveTo(0,-119,-136,-150);ctx.fill();
        ctx.fillStyle='rgba(20,54,106,.08)';ctx.beginPath();ctx.ellipse(0,165,43,6,0,0,TAU);ctx.fill();
      }
      // Broad satin ribbons share a tapered helix. Exact half-turn boundaries
      // join at the sides; rear and front faces genuinely wrap around Buddy.
      const bands=[['#185D65','#80CAC0',13,0],['#14366A','#6485A7',8,1.9],['#D95B30','#F6B183',4.2,3.8],['#258D8A','#B9E4D9',2.8,5.4]];
      for(const [base,shine,width,offset] of bands){
        const start=phase+offset,end=start+turns;
        const shade=ctx.createLinearGradient(-140,0,140,0);
        shade.addColorStop(0,base);shade.addColorStop(.38,front?shine:base);shade.addColorStop(.66,base);shade.addColorStop(1,front?shine:base);
        ctx.fillStyle=shade;ctx.strokeStyle=shine;ctx.lineWidth=1.25;ctx.lineJoin='round';
        for(let k=Math.floor((start-Math.PI/2)/Math.PI);Math.PI/2+k*Math.PI<end;k++){
          const a0=Math.max(start,Math.PI/2+k*Math.PI),a1=Math.min(end,Math.PI/2+(k+1)*Math.PI);
          if((Math.cos((a0+a1)/2)>=0)!==front)continue;
          const strip=[],steps=Math.max(2,Math.ceil((a1-a0)*13));
          for(let j=0;j<=steps;j++){
            const a=mix(a0,a1,j/steps),u=(a-start)/turns,r=10+126*Math.pow(u,.82),z=Math.cos(a);
            const taper=ease(u/.07)*ease((1-u)/.07);
            strip.push({x:Math.sin(a)*r+Math.sin(u*Math.PI)*5,y:148-u*296+z*r*.16,w:width*(.45+.55*u)*taper});
          }
          ctx.save();ctx.globalAlpha*=front?.96:.46;ctx.beginPath();
          strip.forEach((p,i)=>i?ctx.lineTo(p.x,p.y-p.w):ctx.moveTo(p.x,p.y-p.w));
          for(let j=strip.length-1;j>=0;j--)ctx.lineTo(strip[j].x,strip[j].y+strip[j].w);
          ctx.closePath();ctx.fill();
          if(front){ctx.globalAlpha*=.50;ctx.beginPath();strip.forEach((p,i)=>i?ctx.lineTo(p.x,p.y-p.w):ctx.moveTo(p.x,p.y-p.w));ctx.stroke();}
          ctx.restore();
        }
      }ctx.restore();
    }
    transition(ctx,from,to,style,t,state,motionStyle,x,y,scale,sourcePose,targetPose){
      t=clamp(t);const p=pose(t<.5?from:to,state,.5,motionStyle);
      if(style==='Tornado'){
        if(t===0||t===1){this.draw(ctx,t===0?from:to,(t===0?sourcePose:targetPose)||p,x,y,scale);return;}
        const incoming=t>=.5,q={...(incoming?targetPose:sourcePose)||p};
        const gather=ease((t-.07)/.33),reveal=ease((t-TORNADO_TIMING.revealStart)/(TORNADO_TIMING.revealEnd-TORNADO_TIMING.revealStart));
        const opacity=incoming?reveal:1-ease((t-TORNADO_TIMING.concealStart)/(TORNADO_TIMING.concealEnd-TORNADO_TIMING.concealStart));
        const spin=sampleTornadoSpin(t);
        q.yaw=(q.yaw||0)+spin.angle-(incoming?TAU*8:0);
        if(incoming){
          q.sx*=.86+.14*reveal;q.sy*=.89+.11*reveal;
          q.y+=(12-6*Math.sin(Math.PI*reveal))*(1-reveal);q.rot+=.12*(1-reveal)*Math.sin(spin.angle);
        }else{
          q.x*=1-gather;q.y=mix(q.y,12,gather);q.sx*=1-.16*gather;q.sy*=1-.12*gather;
          q.rot-=.12*Math.sin(Math.PI*ease(t/.17));q.rot+=.09*gather*Math.sin(spin.angle);
        }
        this.tornado(ctx,t,x,y,scale,false);
        if(opacity>0)this.draw(ctx,incoming?to:from,q,x,y,scale,opacity);
        this.tornado(ctx,t,x,y,scale,true);
      }else if(style==='Spin'){
        p.sx=Math.max(.025,Math.abs(Math.cos(t*Math.PI)));p.rot=Math.sin(t*TAU)*.13;p.y-=Math.sin(t*Math.PI)*20;
        this.draw(ctx,t<.5?from:to,p,x,y,scale);
      }else {
        const v=Math.abs(2*t-1),s=.03+.97*v;p.sx=s;p.sy=.08+.92*v;p.y-=Math.sin(t*Math.PI)*36;p.rot=Math.sin(t*TAU)*.12;
        this.draw(ctx,t<.5?from:to,p,x,y,scale);
      }
    }
  }
export { Character, pose, expression, blend, ease, clamp, limb, anatomy, rects, names, expressions, styles, forms };
