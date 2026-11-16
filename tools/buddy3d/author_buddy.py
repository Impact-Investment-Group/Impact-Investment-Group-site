"""Author Buddy's actual meshes, handed skeleton and animation library in Blender.

Run with official Blender: blender --background --python author_buddy.py -- OUTPUT
The GLB is an application asset. This bpy authoring script is GPL-2.0-or-later.
"""
import bpy
import json
import math
import re
import struct
import hashlib
import sys
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix

OUT = Path(sys.argv[sys.argv.index('--') + 1])
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.fps = 30
scene.world.color = (0.3, 0.3, 0.3)

def material(name, color, emission=0, metallic=.12, roughness=.25, coat=.35):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Coat Weight'].default_value = coat
    bsdf.inputs['Coat Roughness'].default_value = .18
    bsdf.inputs['Emission Color'].default_value = (*color, 1)
    bsdf.inputs['Emission Strength'].default_value = emission
    return m

TEAL = material('Hologram_Teal', (.028, .34, .32), metallic=.12, roughness=.25)
NAVY = material('Hologram_Deep', (.012, .037, .105), metallic=.30, roughness=.25)
ORANGE = material('Hologram_Rim', (.18, .68, .65), .015, metallic=.55, roughness=.19)
GLOVE = material('Glove_Pearl', (.88, .90, .85), metallic=.02, roughness=.36, coat=.16)
WHITE = material('Eye_White', (.95, .97, .94), metallic=.02, roughness=.20)
IRIS = material('Eye_Iris', (.015, .15, .18), metallic=.20, roughness=.22)
EYE = material('Face_Ink', (.004, .012, .025), metallic=.04, roughness=.20)
LIGHT = material('Eye_Catchlight', (.96, 1, .98), .15, metallic=0, roughness=.14)
LENS = material('Hologram_Lens', (.60, .88, .85), metallic=0, roughness=.08)
LENS.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=.93

def empty(name, parent=None):
    o = bpy.data.objects.new(name, None)
    scene.collection.objects.link(o)
    o.parent = parent
    return o

ROOT = empty('BuddyRoot')
ROOT['asset_contract'] = 'buddy-hologram-3d-v1'

def finish(o, name, mat, parent=None):
    o.name = name
    o.data.materials.clear()
    o.data.materials.append(mat)
    for p in getattr(o.data, 'polygons', []): p.use_smooth = True
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.select_set(False)
    o.parent = parent
    return o

def sphere(name, pos, scale, mat=TEAL, parent=None, segments=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=12, location=pos)
    o = bpy.context.object
    o.scale = scale
    return finish(o, name, mat, parent)

def capsule(name, a, b, radius, mat=TEAL, parent=None):
    a,b = Vector(a),Vector(b)
    o = sphere(name, (a+b)/2, (radius,radius,(b-a).length/2+radius), mat, parent, 16)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = (b-a).to_track_quat('Z','Y')
    return o

def cube(name, pos, scale, mat, parent=None, bevel=.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    o=bpy.context.object
    o.scale=scale
    finish(o,name,mat,parent)
    mod=o.modifiers.new('Rounded craftsmanship','BEVEL'); mod.width=bevel;mod.segments=3
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def line(name, points, radius, mat, parent=None):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=16
    curve.bevel_depth=radius;curve.bevel_resolution=3
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type=p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o)
    o.data.materials.append(mat);o.parent=parent
    return o

# These authored contours preserve the supplied character's recognisable shape.
SHAPES={
 'property':'M -34 -112 C -37 -173 38 -173 35 -112 C 35 -104 50 -105 60 -100 C 82 -94 87 -80 87 -60 L 87 -25 C 87 -1 71 12 31 12 L 31 52 L 62 52 Q 75 52 75 65 L 75 74 Q 75 84 63 84 L 44 84 L 44 95 L 62 95 Q 75 95 75 107 Q 75 120 62 120 L 31 120 L 31 131 C 31 170 -31 170 -31 131 L -31 12 C -72 12 -87 0 -87 -25 L -87 -60 C -87 -88 -68 -102 -47 -104 Q -34 -105 -34 -112 Z M -16 -130 C -16 -106 18 -106 18 -130 C 18 -153 -16 -153 -16 -130 Z',
 'investment':'M 94 -113 C 78 -153 23 -164 -19 -145 C -82 -119 -104 -54 -76 -5 L -90 -5 Q -109 -5 -109 17 Q -109 37 -87 37 L -59 37 C -63 61 -89 90 -102 117 C -113 140 -105 157 -82 151 C -17 134 39 162 91 143 C 118 134 117 104 105 87 C 96 74 85 79 67 87 C 45 98 16 92 -27 92 C -10 73 1 57 4 37 L 63 37 Q 83 37 83 16 Q 83 -5 62 -5 L 5 -5 C -10 -31 -11 -52 4 -66 C 21 -82 36 -78 58 -70 C 88 -59 111 -82 94 -113 Z',
 'support':'M 0 -79 C -47 -137 -117 -107 -121 -52 C -128 8 -57 77 0 119 C 57 77 128 8 121 -52 C 117 -107 47 -137 0 -79 Z',
}
PANELS={
 'property':'M -47 -87 Q -71 -87 -71 -62 L -71 -28 Q -71 -6 -47 -6 L 48 -6 Q 71 -6 71 -29 L 71 -62 Q 71 -87 48 -87 Z',
 'investment':'M 81 -111 C 68 -140 24 -151 -14 -134 C -60 -115 -84 -74 -73 -39 C -59 -25 -38 -22 -21 -31 C -24 -51 -16 -69 -1 -80 C 20 -95 39 -90 59 -82 C 80 -75 92 -87 81 -111 Z',
 'support':'M 0 -57 C -47 -113 -103 -88 -103 -48 C -107 0 -51 58 0 97 C 51 58 107 0 103 -48 C 103 -88 47 -113 0 -57 Z',
}
def contour(name, source, mat, depth, bevel, parent, front=0):
    tokens=re.findall(r'[MLCQZ]|-?\d+(?:\.\d+)?',source)
    loops=[];loop=[];current=(0,0);i=0
    while i<len(tokens):
        op=tokens[i];i+=1;n={'M':2,'L':2,'C':6,'Q':4,'Z':0}[op]
        v=list(map(float,tokens[i:i+n]));i+=n
        if op=='M':
            if loop:loops.append(loop)
            loop=[tuple(v)];current=tuple(v)
        elif op=='L':loop.append(tuple(v));current=tuple(v)
        elif op in ('Q','C'):
            start=current
            for j in range(1,25):
                t=j/24;u=1-t
                point=tuple(u*u*start[k]+2*u*t*v[k]+t*t*v[k+2] if op=='Q' else u**3*start[k]+3*u*u*t*v[k]+3*u*t*t*v[k+2]+t**3*v[k+4] for k in range(2))
                loop.append(point)
            current=tuple(v[-2:])
        elif op=='Z':
            loops.append(loop);loop=[]
    if loop:loops.append(loop)
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='2D';curve.fill_mode='BOTH'
    curve.extrude=depth;curve.bevel_depth=bevel;curve.bevel_resolution=5;curve.resolution_u=24
    for points in loops:
        spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
        for p,xy in zip(spline.points,points):p.co=(xy[0]/100,-xy[1]/100,0,1)
        spline.use_cyclic_u=True
    o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o)
    o.rotation_euler=(math.pi/2,0,0);o.location.y=front;o.parent=parent;o.data.materials.append(mat)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    for poly in o.data.polygons:poly.use_smooth=True
    normal=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');normal.keep_sharp=True
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=normal.name)
    return o

forms={}
face_locations={'property':(0,.48),'investment':(-.18,.86),'support':(0,.05)}
for form in SHAPES:
    group=empty('Form_'+form,ROOT);forms[form]=group
    contour('Body_'+form,SHAPES[form],NAVY,.19,.09,group)
    rim=SHAPES[form]
    if form=='property':rim='M -34 -112 C -37 -173 38 -173 35 -112 C 35 -104 50 -105 60 -100 C 82 -94 87 -80 87 -60 L 87 -25 C 87 -1 70 12 44 12 L -44 12 C -72 12 -87 0 -87 -25 L -87 -60 C -87 -88 -68 -102 -47 -104 Q -34 -105 -34 -112 Z M -16 -130 C -16 -106 18 -106 18 -130 C 18 -153 -16 -153 -16 -130 Z'
    contour('Rim_'+form,rim,ORANGE,.045,.06,group,-.255)
    if form=='property':contour('KeyTeeth','M 30 52 L 62 52 Q 75 52 75 65 L 75 74 Q 75 84 63 84 L 44 84 L 44 95 L 62 95 Q 75 95 75 107 Q 75 120 62 120 L 30 120 Z',ORANGE,.045,.055,group,-.255)
    contour('Panel_'+form,PANELS[form],TEAL,.045,.065,group,-.325)
    fx,fz=face_locations[form]
    face=empty('Face_'+form,group);face.location=(fx,-.445,fz)
    for side in (-1,1):
        # The animated pupil carries its layered iris and sclera. The complete
        # eye therefore blinks and enlarges together, including the close-up.
        eye=sphere('Eye_'+form+('_L' if side>0 else '_R'),(side*.235,-.018,.075),(.075,.040,.110),EYE,face)
        sphere('Sclera_'+form+str(side),(0,.060,0),(.145,.085,.190),WHITE,eye,24)
        sphere('Iris_'+form+str(side),(0,.015,0),(.098,.045,.132),IRIS,eye,24)
        sphere('Catchlight_'+form+str(side),(side*.235-.025,-.071,.120),(.026,.012,.032),LIGHT,face,12)
        line('Brow_'+form+str(side),[(side*.235-.105,-.005,.30),(side*.235,-.015,.33),(side*.235+.10,0,.30)],.018,NAVY,face)
    line('Smile_'+form,[(-.15,-.015,-.17),(0,-.037,-.23),(.15,-.015,-.17)],.023,EYE,face)
    sphere('Mouth_'+form,(0,.008,-.20),(.095,.025,.040),EYE,face,16)

# A single real armature. Left/right are the character's own sides, not screen sides.
armature=bpy.data.armatures.new('BuddySkeleton')
rig=bpy.data.objects.new('BuddyRig',armature);scene.collection.objects.link(rig);rig.parent=ROOT
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
bone_specs={}
def bone(name,a,b,parent=None):
    e=armature.edit_bones.new(name);e.head=a;e.tail=b
    if parent:e.parent=armature.edit_bones[parent]
    e.align_roll(Vector((0,-1,0)))
    bone_specs[name]=(Vector(a),Vector(b))
    return e
bone('Root',(0,0,-.1),(0,0,.3))
hand_parts={};side_positions={}
for side,suffix in ((1,'L'),(-1,'R')):
    shoulder=(side*.76,0,.00);elbow=(side*1.43,0,-.24);wrist=(side*1.43,-.035,-.64)
    side_positions[suffix]=(shoulder,elbow,wrist)
    bone('UpperArm.'+suffix,shoulder,elbow,'Root')
    bone('Forearm.'+suffix,elbow,wrist,'UpperArm.'+suffix)
    bone('Hand.'+suffix,wrist,(wrist[0],wrist[1],wrist[2]-.29),'Forearm.'+suffix)
    specs=[]
    for digit,offset,length in [('Index',-.16,.30),('Middle',-.05,.36),('Ring',.07,.32),('Pinky',.18,.245)]:
        x=wrist[0]+side*offset;start=(x,-.035,wrist[2]-.27)
        for segment in range(3):
            a=(x,-.035,start[2]-length*segment/3);b=(x,-.035,start[2]-length*(segment+1)/3)
            name=f'{digit}.{segment+1:02d}.{suffix}'
            bone(name,a,b,'Hand.'+suffix if segment==0 else f'{digit}.{segment:02d}.{suffix}')
            specs.append((name,a,b,.045 if digit!='Pinky' else .039))
    thumb=[(wrist[0]-side*.13,-.045,wrist[2]-.10),(wrist[0]-side*.25,-.055,wrist[2]-.18),(wrist[0]-side*.29,-.055,wrist[2]-.29)]
    for segment in range(2):
        name=f'Thumb.{segment+1:02d}.{suffix}'
        bone(name,thumb[segment],thumb[segment+1],'Hand.'+suffix if segment==0 else f'Thumb.01.{suffix}')
        specs.append((name,thumb[segment],thumb[segment+1],.064))
    hand_parts[suffix]=specs
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)

def weight(o,bone_name):
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    g=o.vertex_groups.new(name=bone_name);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    o.select_set(False)
    return o

for side,suffix in ((1,'L'),(-1,'R')):
    shoulder,elbow,wrist=side_positions[suffix]
    pieces=[]
    for name,a,b in [('UpperArm.'+suffix,shoulder,elbow),('Forearm.'+suffix,elbow,wrist)]:
        pieces.append(weight(capsule('Sleeve_'+name,a,b,.10,NAVY),name))
    pieces.append(weight(sphere('Elbow_'+suffix,elbow,(.105,.105,.105),NAVY),'Forearm.'+suffix))
    pieces.append(weight(sphere('Palm_'+suffix,(wrist[0],wrist[1],wrist[2]-.16),(.195,.115,.22),GLOVE),'Hand.'+suffix))
    bpy.ops.mesh.primitive_torus_add(major_radius=.105,minor_radius=.025,major_segments=24,minor_segments=10,location=wrist)
    pieces.append(weight(finish(bpy.context.object,'Cuff_'+suffix,TEAL),'Hand.'+suffix))
    for name,a,b,r in hand_parts[suffix]:pieces.append(weight(capsule('Finger_'+name,a,b,r,GLOVE),name))
    bpy.ops.object.select_all(action='DESELECT')
    for o in pieces:o.select_set(True)
    bpy.context.view_layer.objects.active=pieces[0];bpy.ops.object.join()
    hand=bpy.context.object;hand.name='HandMesh.'+suffix;hand.parent=rig
    # Fuse the overlapping phalanges and palm into one continuous glove surface.
    # Weights are rebuilt after remeshing, so there are no disconnected bead joints.
    remesh=hand.modifiers.new('Continuous glove surface','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.014;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=hand.modifiers.new('Soft glove knuckles','SMOOTH');smooth.factor=.45;smooth.iterations=3
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    simplify=hand.modifiers.new('Efficient glove topology','DECIMATE');simplify.ratio=.55
    bpy.ops.object.modifier_apply(modifier=simplify.name)
    # Voxel merging keeps a continuous skin; restore the intended sleeve/glove regions.
    teal_index=next(i for i,m in enumerate(hand.data.materials) if m==TEAL)
    glove_index=next(i for i,m in enumerate(hand.data.materials) if m==GLOVE)
    navy_index=next(i for i,m in enumerate(hand.data.materials) if m==NAVY)
    for poly in hand.data.polygons:
        z=sum(hand.data.vertices[index].co.z for index in poly.vertices)/len(poly.vertices)
        poly.material_index=glove_index if z<wrist[2]-.035 else teal_index if z<wrist[2]+.065 else navy_index
    hand.vertex_groups.clear()
    relevant={name:ends for name,ends in bone_specs.items() if name.endswith('.'+suffix)}
    groups={name:hand.vertex_groups.new(name=name) for name in relevant}
    for vertex in hand.data.vertices:
        point=vertex.co
        distances=[]
        for name,(a,b) in relevant.items():
            direction=b-a;fraction=max(0,min(1,(point-a).dot(direction)/direction.length_squared))
            distance=(point-(a+direction*fraction)).length
            distances.append((distance,name))
        closest=sorted(distances)[:2]
        weights=[1/(distance+.025)**5 for distance,name in closest];total=sum(weights)
        for (_,name),value in zip(closest,weights):groups[name].add([vertex.index],value/total,'REPLACE')
    hand['handedness']='left' if suffix=='L' else 'right';hand['digits']=5
    modifier=hand.modifiers.new('Handed skeleton','ARMATURE');modifier.object=rig
    hand.select_set(False)
    socket=empty('Grip.'+suffix)
    socket.parent=rig;socket.parent_type='BONE';socket.parent_bone='Hand.'+suffix
    # Bone local +Y is wrist-to-fingers; socket sits in the centre of the palm.
    socket.location=(0,-.12,-.045)
    socket['handedness']=hand['handedness']
    glass=empty('Magnifier.'+suffix,socket)
    capsule('GlassHandle.'+suffix,(0,0,0),(0,-.63,0),.052,ORANGE,glass)
    bpy.ops.mesh.primitive_torus_add(major_radius=.40,minor_radius=.035,major_segments=48,minor_segments=10,location=(0,-1.02,0))
    ring=bpy.context.object;finish(ring,'GlassRing.'+suffix,TEAL,glass)
    lens=sphere('GlassLens.'+suffix,(0,-1.02,0),(.375,.375,.008),LENS,glass,32)
    centre=empty('LensCentre.'+suffix,glass);centre.location=(0,-1.02,0)
    hammer=empty('Hammer.'+suffix,socket)
    capsule('HammerHandle.'+suffix,(0,.10,0),(0,-.56,0),.045,ORANGE,hammer)
    cube('HammerHead.'+suffix,(0,-.56,0),(.39,.16,.16),NAVY,hammer,.04)

# Low-poly construction prop, separated into authored courses for staged assembly.
house=empty('House',ROOT);house.location=(-2.15,0,-1.15)
for course in range(4):
    row=empty('HouseCourse_'+str(course),house)
    for column in range(3):
        if course<2 and column==1:continue
        cube(f'Brick_{course}_{column}',((column-1)*.37,0,course*.25),(.35,.30,.23),TEAL,row,.02)
roof=empty('HouseRoof',house)
for side in (-1,1):
    r=cube('Roof'+str(side),(side*.29,0,1.0),(.76,.45,.10),ORANGE,roof,.025);r.rotation_euler.y=side*math.radians(32)
cube('HouseDoor',(0,-.18,.14),(.23,.055,.45),NAVY,house,.015)
cube('HouseWindow',(-.36,-.18,.53),(.19,.055,.20),LIGHT,house,.015)
dust=empty('BuildDust',ROOT);dust.location=(-2.15,-.18,-1.05)
for index in range(9):
    angle=index*math.pi*2/9
    sphere('Dust_'+str(index),(math.cos(angle)*.45,math.sin(angle)*.14,.18+index%3*.13),(.075,.055,.075),ORANGE,dust,12)

# Three actual helical mesh ribbons, depth sorted around the turning character.
vortex=empty('Vortex',ROOT)
for strand in range(3):
    verts=[];faces=[]
    for i in range(145):
        t=i/144;angle=t*math.pi*6+strand*math.pi*2/3
        radius=.40+1.05*math.sin(math.pi*t)**.65
        for edge in (-1,1):
            r=radius+edge*.065;verts.append((math.cos(angle)*r,math.sin(angle)*r,-1.7+t*3.4))
        if i:faces.append((i*2-2,i*2-1,i*2+1,i*2))
    mesh=bpy.data.meshes.new('VortexRibbon');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new('VortexRibbon_'+str(strand),mesh);scene.collection.objects.link(obj);obj.parent=vortex;obj.data.materials.append((TEAL,ORANGE,LIGHT)[strand])
    for p in mesh.polygons:p.use_smooth=True

# The symbol body follows the same root bone as its limbs during authored acting.
bpy.context.view_layer.update()
for group in forms.values():
    world=group.matrix_world.copy();group.parent=rig;group.parent_type='BONE';group.parent_bone='Root';group.matrix_world=world

# Baked bone actions. The rig is the same for every body; neither hand is mirrored.
CLIPS={'Idle':4,'Wave':2.4,'Listen':3.2,'Think':3.4,'Talk':2.8,'Explain':2.8,'Reassure':3,'Approve':2,'Celebrate':3,'Dance':4.8,'Stretch':4.2,'Peek':4.6,'Polish':6.6,'Build':9.4,'Glide':2.0,'InspectLeft':2,'InspectRight':2,'InspectUp':2,'InspectDown':2,'Closeup_Thumb_R':3.2,'Closeup_Inspect_R':3.6}
rig.animation_data_create()

def world_rotation(name, rotation):
    """Convert an authored armature-space rotation to this bone's local frame."""
    p=rig.pose.bones[name]
    desired=Matrix.LocRotScale(p.head,rotation,p.matrix.to_scale())
    p.matrix=desired
    bpy.context.view_layer.update()

def reach_hand(suffix, wrist_target, hand_rotation, amount=1):
    """Analytic two-bone IK; elbows bend outwards, never swap handed frames."""
    shoulder,elbow,wrist=map(Vector,side_positions[suffix])
    goal=wrist.lerp(Vector(wrist_target),amount)
    first=(elbow-shoulder).length;second=(wrist-elbow).length
    direction=goal-shoulder;distance=min(direction.length,first+second-.001)
    direction.normalize();goal=shoulder+direction*distance
    along=(first*first-second*second+distance*distance)/(2*distance)
    bend=Vector((1 if suffix=='L' else -1,0,-.25))
    bend=(bend-direction*bend.dot(direction)).normalized()
    joint=shoulder+direction*along+bend*math.sqrt(max(0,first*first-along*along))
    for name,start,end in [('UpperArm.'+suffix,shoulder,joint),('Forearm.'+suffix,joint,goal)]:
        rest=rig.data.bones[name].matrix_local.to_quaternion()
        original=bone_specs[name][1]-bone_specs[name][0]
        rotation=original.rotation_difference(end-start)@rest
        world_rotation(name,rotation)
    rest=rig.data.bones['Hand.'+suffix].matrix_local.to_quaternion()
    world_rotation('Hand.'+suffix,rest.slerp(hand_rotation@rest,amount))

for name,duration in CLIPS.items():
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    for frame in range(0,round(duration*30)+1,3):
        t=frame/30;u=t/duration;wave=math.sin(t*3);envelope=math.sin(math.pi*min(1,u))**2
        for p in rig.pose.bones:p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
        def rotate(b,x=0,y=0,z=0):
            from mathutils import Euler
            rig.pose.bones[b].rotation_quaternion=Euler((x,y,z),'XYZ').to_quaternion()
        rotate('Root',0,0,math.sin(t*1.6)*.015)
        rig.pose.bones['Root'].location.z=math.sin(t*1.6)*.022
        if name=='Wave':rotate('UpperArm.R',0,.1,-1.9*envelope);rotate('Forearm.R',.05,0,-.75*envelope);rotate('Hand.R',.2,0,wave*.30*envelope)
        elif name=='Listen':rotate('Root',.03,0,.07*envelope);rotate('Forearm.L',.12,0,.25*envelope)
        elif name=='Think':rotate('UpperArm.R',.35,0,-.58*envelope);rotate('Forearm.R',.5,0,-1.15*envelope)
        elif name=='Talk':rotate('Forearm.L',.15,0,.20+.18*wave);rotate('Forearm.R',.20,0,-.25+.14*math.sin(t*4))
        elif name=='Explain':rotate('UpperArm.L',.15,0,.5*envelope);rotate('Forearm.L',.4,0,.5*envelope)
        elif name=='Reassure':rotate('UpperArm.R',.3,0,-.35*envelope);rotate('Forearm.R',.8,0,-1.4*envelope)
        elif name=='Approve':rotate('Root',.13*math.sin(t*3)*envelope,0,0)
        elif name in ('Celebrate','Dance'):
            rotate('Root',.08*wave,.18*wave,.10*wave);rig.pose.bones['Root'].location.z=abs(math.sin(t*4))*.13*envelope
            rotate('UpperArm.L',.1,0,.9*envelope);rotate('UpperArm.R',.1,0,-.7*envelope)
            rotate('Forearm.L',.2,0,.3*math.sin(t*5));rotate('Forearm.R',.2,0,-.3*math.sin(t*5+1))
        elif name=='Stretch':rotate('UpperArm.L',0,0,2.0*envelope);rotate('UpperArm.R',0,0,-2.0*envelope)
        elif name=='Peek':rotate('Root',0,.22*wave,.1*wave)
        elif name=='Polish':rotate('UpperArm.L',.3,0,.4*envelope);rotate('Forearm.L',.8,0,.7*envelope+.18*wave)
        elif name=='Build':
            strike=(.5+.5*math.sin(t*5))**2
            settle=min(1,t/.8,(duration-t)/.8);settle=settle*settle*(3-2*settle)
            reach_hand('R',(-1.65,-.10,-.15+.35*strike),Quaternion((0,1,0),-math.pi/2+.30*strike),settle)
        elif name=='Glide':rotate('Root',0,.08,.12);rotate('Forearm.L',.1,0,.30);rotate('Forearm.R',.1,0,-.3)
        elif name.startswith('Closeup'):
            # Front is -Y in Blender. Positive fore/aft coordinates are never
            # guessed from Euler signs: a real wrist target is solved in 3D.
            if name=='Closeup_Thumb_R':
                reach_hand('R',(-.82,-.93,.32),Quaternion((0,1,0),-math.pi/2),envelope)
                rig.pose.bones['Hand.R'].scale=(1+.42*envelope,)*3
            else:
                # The lens is 1.02 units above the grip, directly in front of
                # the eye, with its normal towards the viewer.
                reach_hand('R',(-.12,-.73,-.45),Quaternion((0,1,0),0),envelope)
        elif name.startswith('Inspect'):
            suffix='L' if name=='InspectRight' else 'R'
            target={'InspectLeft':(-1.55,-.18,-.15),'InspectRight':(1.55,-.18,-.15),'InspectUp':(-.60,-.35,.55),'InspectDown':(-1.10,-.18,-.45)}[name]
            reach_hand(suffix,target,Quaternion((0,1,0),math.pi if name=='InspectDown' else 0))
        if name in ('Think','Build') or name.startswith(('Inspect','Closeup')):
            suffix='L' if name=='InspectRight' else 'R'
            for p in rig.pose.bones:
                if p.name.endswith('.'+suffix) and p.name.split('.')[0] in ('Index','Middle','Ring','Pinky','Thumb'):
                    curl=.9 if not p.name.startswith('Thumb') else .45
                    if name=='Closeup_Thumb_R':
                        curl=(1.35 if not p.name.startswith('Thumb') else -.65)*envelope
                    elif name=='Closeup_Inspect_R':curl*=envelope
                    rotate(p.name,curl,0,0)
        if name=='Closeup_Thumb_R':
            # Straight, raised thumb above four curled fingers. Its world axis
            # is authored explicitly, independent of the wrist's handed roll.
            for part in ('01','02'):
                key='Thumb.'+part+'.R';original=bone_specs[key][1]-bone_specs[key][0]
                rest=rig.data.bones[key].matrix_local.to_quaternion()
                target=original.rotation_difference(Vector((0,-.03,1)))@rest
                current=rig.pose.bones[key].matrix.to_quaternion()
                world_rotation(key,current.slerp(target,envelope))
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_quaternion',frame=frame)
            p.keyframe_insert('scale',frame=frame)
            if p.name=='Root':p.keyframe_insert('location',frame=frame)
    track=rig.animation_data.nla_tracks.new();track.name=name
    track.strips.new(name,0,action)
    track.mute=True
rig.animation_data.action=None
for track in rig.animation_data.nla_tracks:track.mute=True
for p in rig.pose.bones:p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
scene.frame_set(0)

# Export all geometry once. Consumers select one form, never three characters.
scene.frame_end=282
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'master.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'buddy.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_extras=True,export_yup=True,export_force_sampling=True,export_materials='EXPORT')
manifest={'version':'buddy-hologram-3d-v1','authoring':'Blender 5.2.4 LTS','forms':list(forms),'clips':CLIPS,'handedness':{'L':'character left, front-view screen right','R':'character right, front-view screen left'},'hands':{'L':{'mesh':'HandMesh.L','bone':'Hand.L','grip':'Grip.L'},'R':{'mesh':'HandMesh.R','bone':'Hand.R','grip':'Grip.R'}},'coordinates':{'gltfUp':'+Y','front':'+Z','characterLeft':'+X'},'geometry':'authored closed meshes and a separate five-digit skeleton on each side','hologram':'shared runtime GPU material, no image-plane character'}
binary=(OUT/'buddy.glb').read_bytes();length=struct.unpack_from('<I',binary,12)[0];document=json.loads(binary[20:20+length])
manifest['asset']={'file':'buddy.glb','bytes':len(binary),'sha256':hashlib.sha256(binary).hexdigest(),'nodes':len(document['nodes']),'meshes':len(document['meshes']),'primitives':sum(len(mesh['primitives']) for mesh in document['meshes']),'trianglesAllForms':sum(document['accessors'][primitive.get('indices',primitive['attributes']['POSITION'])]['count']//3 for mesh in document['meshes'] for primitive in mesh['primitives'])}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))

# Render authoring turntables, never application screenshots.
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
# Authoring plates use the same opaque, physically shaded material roles as
# the runtime. No extra transparency/emission makes these previews look better
# than the exported model. The lens alone transmits light.
for suffix in ('L','R'):
    bpy.data.objects['Magnifier.'+suffix].hide_render=True
    bpy.data.objects['Hammer.'+suffix].hide_render=True
house.hide_render=True
def hide_tree(obj,hidden):
    obj.hide_render=hidden
    for child in obj.children:hide_tree(child,hidden)
hide_tree(house,True)
hide_tree(vortex,True)
hide_tree(dust,True)
for suffix in ('L','R'):
    hide_tree(bpy.data.objects['Magnifier.'+suffix],True);hide_tree(bpy.data.objects['Hammer.'+suffix],True)
for other,group in forms.items():hide_tree(group,other!='property')
bpy.ops.object.camera_add(location=(0,-8,.4));camera=bpy.context.object;scene.camera=camera
camera.data.type='ORTHO';camera.data.ortho_scale=4.4
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
for pos,power,size in [((-3,-4,5),850,4),((4,-2,2),400,3),((0,3,4),950,3)]:
    bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'master.blend'))
for form in forms:
    for other,group in forms.items():hide_tree(group,other!=form)
    for view,angle in [('front',0),('profile',math.pi/2),('back',math.pi)]:
        ROOT.rotation_euler.z=angle
        scene.render.filepath=str(OUT/f'{form}-{view}.png');bpy.ops.render.render(write_still=True)
    ROOT.rotation_euler.z=0
    scene.render.film_transparent=False;scene.world.use_nodes=True
    scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.947,.939,.896,1)
    scene.render.filepath=str(OUT/f'{form}-bone.png');bpy.ops.render.render(write_still=True)
    scene.render.film_transparent=True
for other,group in forms.items():hide_tree(group,other!='property')
ROOT.rotation_euler.z=0
camera.data.type='PERSP';camera.data.lens=52
for name,seconds in [('Wave',1.2),('Closeup_Thumb_R',1.6),('Closeup_Inspect_R',1.8),('Build',3.6)]:
    for track in rig.animation_data.nla_tracks:track.mute=True
    rig.animation_data.action=bpy.data.actions[name];scene.frame_set(round(seconds*30))
    bpy.context.view_layer.update()
    if name.startswith('Closeup'):
        print('POSE_FRAME',name,'wrist',list(rig.pose.bones['Hand.R'].head),'lens',list(bpy.data.objects['LensCentre.R'].matrix_world.translation),flush=True)
    hide_tree(bpy.data.objects['Magnifier.R'],name!='Closeup_Inspect_R')
    hide_tree(bpy.data.objects['Hammer.R'],name!='Build');hide_tree(house,name!='Build')
    for suffix in ('L','R'):
        eye=bpy.data.objects['Eye_property_'+suffix]
        eye.scale=(1.35,1.35,1.35) if name=='Closeup_Inspect_R' and suffix=='R' else (1,1,1)
    if name=='Build':camera.data.lens=42;camera.location.x=-.4
    scene.render.filepath=str(OUT/f'pose-{name}.png');bpy.ops.render.render(write_still=True)
print('BUDDY_ASSET_EXPORT_COMPLETE',str(OUT))
