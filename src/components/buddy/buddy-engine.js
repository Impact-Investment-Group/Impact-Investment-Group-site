/* IIG animation concept. Generated body and hand artwork, articulated canvas rig. */

  const TAU=Math.PI*2, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,v)=>a+(b-a)*v;
  const names=['Idle','Wave','Listen','Think','Talk','Explain','Point left','Point right','Nod','Celebrate','Reassure','Bow','Glide','Peek','Shrug','Sleep'];
  const styles=['Calm','Bouncy','Expressive'];
  const forms=['Key','£ sign','Heart'];
  const rects=[[156,9,293,552],[568,48,368,511],[1025,114,435,410],[115,638,328,357],[639,672,239,313],[1145,612,227,382]];
  const anatomy=[
    {w:172,h:324,face:[1,-61],eyes:28,shoulders:[[-30,15],[32,15]]},
    {w:222,h:308,face:[14,-106],eyes:26,shoulders:[[-60,18],[54,18]]},
    {w:258,h:244,face:[10,-25],eyes:34,shoulders:[[-91,6],[94,6]]}
  ];
  function pose(form,state,t,style=0){
    const f=anatomy[form].face, amp=[.72,1.05,1.36][style], speed=[.8,1.08,1.22][style];
    const a=t*speed,s=Math.sin(a*TAU),soft=Math.sin(a*2.1);
    const p={x:0,y:soft*2.5*amp,rot:soft*.012*amp,sx:1,sy:1,eye:1,gazeX:0,gazeY:0,mouth:0,smile:1,browL:0,browR:0,
      lx:-68,ly:78,lex:-107,ley:54,la:-.16,lh:1,rx:72,ry:72,rex:109,rey:45,ra:.15,rh:1,frontL:0,frontR:0};
    switch(state){
      case 0:p.gazeX=Math.sin(a*.8)*3;p.rot=soft*.02;break;
      case 1:p.rx=109+Math.sin(a*7)*7*amp;p.ry=f[1]-35;p.rex=128;p.rey=3;p.ra=Math.sin(a*9)*.35*amp;p.rh=0;p.rot=-.035*amp;p.smile=1.2;break;
      case 2:p.rx=f[0]+75;p.ry=f[1]+2;p.rex=118;p.rey=48;p.rh=0;p.ra=.42;p.rot=-.075*amp;p.gazeX=5;p.browR=-.06;p.y+=Math.sin(a*2)*2;break;
      case 3:p.rx=f[0]+28;p.ry=f[1]+44;p.rex=106;p.rey=65;p.rh=1;p.ra=-.23;p.frontR=1;p.rot=.055*amp;p.gazeX=-4;p.gazeY=-3;p.browL=.15;p.browR=-.12;p.smile=.25;break;
      case 4:p.lx=-104;p.ly=47+Math.sin(a*4)*10*amp;p.rx=110;p.ry=36+Math.cos(a*4.4)*12*amp;p.lh=0;p.rh=0;p.la=-.9;p.ra=.9;p.mouth=.25+.6*Math.abs(Math.sin(a*8.7));p.rot=Math.sin(a*3)*.035*amp;break;
      case 5:p.rx=135;p.ry=-25+Math.sin(a*3)*7*amp;p.rex=103;p.rey=32;p.rh=2;p.ra=1.02;p.lx=-95;p.ly=48;p.lh=0;p.la=-1.15;p.gazeX=4;p.browR=-.05;p.mouth=.18+.25*Math.abs(Math.sin(a*7));break;
      case 6:p.lx=-155;p.ly=-8+Math.sin(a*3)*4*amp;p.lex=-110;p.ley=16;p.lh=2;p.la=-Math.PI/2;p.rot=-.04;p.gazeX=-6;break;
      case 7:p.rx=158;p.ry=-8+Math.sin(a*3)*4*amp;p.rex=110;p.rey=16;p.rh=2;p.ra=Math.PI/2;p.rot=.04;p.gazeX=6;break;
      case 8:p.y+=Math.sin(a*5)*7*amp;p.sy=1-Math.max(0,Math.sin(a*5))*.035*amp;p.gazeY=Math.sin(a*5)*2;p.eye=.95;p.smile=1.1;break;
      case 9:p.lx=-115;p.rx=115;p.ly=-107-Math.abs(s)*12;p.ry=-107-Math.abs(s)*12;p.lex=-139;p.rex=139;p.ley=-24;p.rey=-24;p.lh=0;p.rh=0;p.la=-.25;p.ra=.25;p.y-=Math.abs(s)*22*amp;p.rot=Math.sin(a*5)*.045*amp;p.mouth=.45;p.smile=1.5;break;
      case 10:p.lx=-16;p.ly=48;p.rx=22;p.ry=60;p.lex=-111;p.ley=58;p.rex=113;p.rey=63;p.lh=0;p.rh=0;p.la=1.15;p.ra=-1.15;p.frontL=1;p.frontR=1;p.rot=-.025;p.eye=.9;p.smile=.8;break;
      case 11:{const b=(1-Math.cos(a*2.1))*.5;p.y+=b*16;p.sy=1-b*.12;p.rot=-b*.06;p.lx=-78;p.rx=78;p.ly=86;p.ry=86;p.eye=1-b*.8;p.smile=.8;break;}
      case 12:p.x=Math.sin(a*1.4)*90*amp;p.y-=Math.sin(a*2.8)*14*amp;p.rot=-Math.cos(a*1.4)*.12*amp;p.lx=-125;p.rx=125;p.ly=30;p.ry=30;p.lh=0;p.rh=0;p.la=-1.25;p.ra=1.25;p.gazeX=Math.cos(a*1.4)*5;break;
      case 13:p.x=Math.sin(a*1.6)*52*amp;p.rot=Math.sin(a*1.6)*.18*amp;p.rx=91;p.ry=f[1]+18;p.rh=0;p.ra=-.25;p.gazeX=-Math.sin(a*1.6)*6;p.browR=-.15;break;
      case 14:p.lx=-124;p.rx=124;p.ly=4+soft*8;p.ry=4+soft*8;p.lex=-107;p.rex=107;p.ley=45;p.rey=45;p.lh=0;p.rh=0;p.la=-1.3;p.ra=1.3;p.browL=-.18;p.browR=.18;p.smile=.3;p.rot=Math.sin(a*2)*.035;break;
      case 15:p.eye=0;p.smile=.45;p.rot=.085;p.y=soft*4;p.sy=1+Math.sin(a*2)*.018;p.ly=99;p.ry=99;p.lx=-58;p.rx=58;break;
    }
    if(form===2){
      p.lex-=37;p.rex+=37;
      if(!p.frontL&&state!==12)p.lx-=22;
      if(!p.frontR&&state!==12)p.rx+=state===1||state===2?40:22;
    }
    if(style===1&&![9,11,12,15].includes(state)){p.y-=Math.abs(Math.sin(a*2.8))*5;p.sy+=Math.sin(a*2.8)*.012;}
    if(style===2&&![11,15].includes(state))p.rot+=Math.sin(a*2)*.025;
    const blink=Math.pow(Math.max(0,Math.cos((a+1.3)*1.34)),90);
    p.eye*=1-blink*.96;
    return p;
  }
  function blend(a,b,t){const p={};for(const k of Object.keys(b)){p[k]=['lh','rh','frontL','frontR'].includes(k)?(t<.5?a[k]:b[k]):mix(a[k],b[k],t);}return p;}
  class Character {
    constructor(atlas){this.atlas=atlas;}
    sprite(ctx,n,x,y,w,h){const r=rects[n];ctx.drawImage(this.atlas,...r,x,y,w,h);}
    arm(ctx,s,e,w,fore=false){
      const path=()=>{ctx.beginPath();ctx.moveTo(...(fore?e:s));if(!fore)ctx.quadraticCurveTo(s[0]*1.22,(s[1]+e[1])*.5,...e);ctx.quadraticCurveTo((e[0]+w[0])*.5,e[1]+8,...w);};
      ctx.lineCap='round';ctx.lineJoin='round';path();ctx.strokeStyle='#102B52';ctx.lineWidth=14;ctx.stroke();
      const g=ctx.createLinearGradient(0,s[1]-12,0,w[1]+12);g.addColorStop(0,'#5379A0');g.addColorStop(.45,'#21466F');g.addColorStop(1,'#14366A');
      path();ctx.strokeStyle=g;ctx.lineWidth=10;ctx.stroke();
    }
    hand(ctx,x,y,angle,kind,mirror){
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);if(mirror)ctx.scale(-1,1);
      const size=kind===0?[47,51]:kind===1?[35,46]:[34,57];
      this.sprite(ctx,3+kind,-size[0]*.5,-size[1]*.88,...size);ctx.restore();
    }
    face(ctx,form,p){
      const n=anatomy[form],f=n.face,d=n.eyes;
      ctx.save();ctx.translate(...f);ctx.lineCap='round';
      for(const side of [-1,1]){
        const x=side*d,y=side===1?-3:0,eye=Math.max(.045,p.eye);
        ctx.save();ctx.translate(x,y);ctx.scale(1,eye);
        const gloss=ctx.createLinearGradient(-12,-7,10,8);gloss.addColorStop(0,'#193D58');gloss.addColorStop(1,'#071B30');ctx.fillStyle=gloss;
        ctx.beginPath();ctx.moveTo(-13,4);ctx.bezierCurveTo(-10,-12,9,-14,14,0);ctx.bezierCurveTo(10,9,-5,11,-13,4);ctx.fill();
        if(p.eye>.3){ctx.fillStyle='#F8FCFF';ctx.beginPath();ctx.ellipse(5+p.gazeX*.35,-4+p.gazeY*.25,3.3,3.1,0,0,TAU);ctx.fill();}
        ctx.restore();
        ctx.save();ctx.translate(x,y-(form===1?13:20));ctx.rotate(side<0?p.browL:p.browR);ctx.strokeStyle='#143047';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-11,2);ctx.quadraticCurveTo(0,-2,12,0);ctx.stroke();ctx.restore();
      }
      ctx.translate(0,form===1?20:24);ctx.fillStyle='#10324A';ctx.strokeStyle='#10324A';ctx.lineWidth=2.4;
      if(p.mouth>.12){ctx.beginPath();ctx.ellipse(0,2,12+2*p.smile,3+p.mouth*9,0,0,Math.PI);ctx.quadraticCurveTo(0,-4,-12-2*p.smile,2);ctx.fill();ctx.fillStyle='#48A8A1';ctx.beginPath();ctx.ellipse(1,6,7,2.2,0,0,TAU);ctx.fill();}
      else {ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(0,9*p.smile,13,-2);ctx.stroke();}
      ctx.restore();
    }
    draw(ctx,form,p,x,y,scale=1,alpha=1){
      const n=anatomy[form];ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x+p.x*scale,y+p.y*scale);ctx.scale(scale*p.sx,scale*p.sy);ctx.rotate(p.rot);
      this.arm(ctx,n.shoulders[0],[p.lex,p.ley],[p.lx,p.ly]);this.arm(ctx,n.shoulders[1],[p.rex,p.rey],[p.rx,p.ry]);
      this.sprite(ctx,form,-n.w/2,-n.h/2,n.w,n.h);this.face(ctx,form,p);
      if(p.frontL)this.arm(ctx,n.shoulders[0],[p.lex,p.ley],[p.lx,p.ly],true);
      if(p.frontR)this.arm(ctx,n.shoulders[1],[p.rex,p.rey],[p.rx,p.ry],true);
      this.hand(ctx,p.lx,p.ly,p.la,p.lh,true);this.hand(ctx,p.rx,p.ry,p.ra,p.rh,false);
      ctx.restore();
    }
    tornado(ctx,t,x,y,scale=1){
      const power=ease((t-.08)/.23)*(1-ease((t-.70)/.25));if(power<.001)return;
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=power;
      const colours=['#14366A','#E15E31','#258D8A'],phase=t*TAU*5.6;
      for(const front of [false,true])for(let c=0;c<3;c++){
        let strip=[];const draw=()=>{if(strip.length<2){strip=[];return;}const g=ctx.createLinearGradient(-170,0,170,0);g.addColorStop(0,colours[c]);g.addColorStop(.45,front?['#56779B','#F59A66','#65B9B3'][c]:colours[c]);g.addColorStop(1,colours[c]);ctx.fillStyle=g;ctx.beginPath();strip.forEach((p,i)=>i?ctx.lineTo(p.x,p.y-p.w):ctx.moveTo(p.x,p.y-p.w));[...strip].reverse().forEach(p=>ctx.lineTo(p.x,p.y+p.w));ctx.closePath();ctx.fill();strip=[];};
        for(let i=0;i<=480;i++){const u=i/480,a=phase+u*TAU*4.7+c*TAU/3,r=(13+153*Math.pow(u,.8))*power,z=Math.cos(a);if((z>=0)===front)strip.push({x:Math.sin(a)*r+Math.sin(u*4-phase*.2)*7,y:174-u*344*power+z*r*.11,w:(7+13*u)*power});else draw();}draw();
      }ctx.restore();
    }
    transition(ctx,from,to,style,t,state,motionStyle,x,y,scale){
      t=clamp(t);const p=pose(t<.5?from:to,state,.5,motionStyle);
      if(style==='Tornado'){
        const opacity=t<.5?1-ease((t-.14)/.20):ease((t-.72)/.23);
        p.sx=t<.5?.15+.85*Math.abs(Math.cos(t*t*70)):.8+.2*ease((t-.72)/.23);
        p.rot=t<.5?-.09:0;this.draw(ctx,t<.5?from:to,p,x,y,scale,opacity);this.tornado(ctx,t,x,y,scale);
      }else if(style==='Spin'){
        p.sx=Math.max(.025,Math.abs(Math.cos(t*Math.PI)));p.rot=Math.sin(t*TAU)*.13;p.y-=Math.sin(t*Math.PI)*20;
        this.draw(ctx,t<.5?from:to,p,x,y,scale);
      }else {
        const v=Math.abs(2*t-1),s=.03+.97*v;p.sx=s;p.sy=.08+.92*v;p.y-=Math.sin(t*Math.PI)*36;p.rot=Math.sin(t*TAU)*.12;
        this.draw(ctx,t<.5?from:to,p,x,y,scale);
      }
    }
  }
export { Character, pose, blend, ease, clamp, names, styles, forms };
