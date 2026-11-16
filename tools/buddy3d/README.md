# Buddy 3D character master

`master.blend` is the editable Blender master for one Buddy character with three
symbol bodies, an articulated five-digit hand on each side, grip sockets,
magnifiers, a hammer, construction scenery and helical transition ribbons.
`author_buddy.py` authors the geometry, weights and 21 animation clips. It does
not convert a flat sprite into a character or use an externally licensed model.

The three forms follow the user-supplied Buddy key, pound and heart references.
The meshes and animations were authored for Impact Investment Group. Left and
right always mean the character's anatomical sides: left appears on the viewer's
right in a front view. Neither hand uses a negative scale or a mirrored skeleton.
Blender Z-up and front -Y become glTF Y-up and front +Z.

Author with the official Blender 5.2.4 portable release:

```powershell
blender.exe --background --python tools/buddy3d/author_buddy.py -- OUTPUT_DIRECTORY
```

The authoring output includes GLB, master, a hash/count manifest, transparent
three-quarter fallbacks, front/three-quarter/profile/back views and isolated
pose previews. Runtime assets are in `iip-frontend/iip-web/public/images/buddy/3d`.
The same GLB and fallback
images are copied to the public website; its master is a source copy.

The official Windows ZIP was checked against Blender's published SHA256 file:
`bbd78f8931dc940444da4ff2983374930f9f5c092ae0e330588e9760bb9d967c`.
Download: <https://download.blender.org/release/Blender5.2/blender-5.2.4-windows-x64.zip>.
Blender's GPL applies to Blender software, not to these authored output models:
<https://www.blender.org/about/license/>. The authoring script states its own
GPL-2.0-or-later licence. The OGL 1.0.11 runtime is Unlicense:
<https://github.com/oframe/ogl>.

The current geometry restores the original orange-edged `v2-refined` identity,
explicitly selected by Israel on 16 November: navy symbol depth and arms, an
orange perimeter, teal inset face and teal hands. The key retains its real bow
opening and shaft; the pound and heart retain their original silhouettes.
Small domed navy almond eyes, catchlights and a curved smile replace the later
white eyeballs, cheek volumes and pearl gloves. All bodies have real depth and
rounded bevels; they are not image planes.

Arms have ordered joint loops with smooth elbow and wrist weighting and relaxed,
asymmetric idle bends. Each hand is one connected palm and five-digit surface.
Exact root unions retain the distal bend loops, avoiding the voxel bridges
that stretched into flaps when a fist closed. Digit surface provenance survives
the unions, so nearby thumb and index vertices cannot be assigned to each
other. A finger vertex follows its own joint chain and palm, never a
neighbouring digit or the opposite hand.
Pose authoring aligns the forearm with the wrist and grip without reflected
scales. CI inspects shipped skin influences, cross-digit triangles and one
triangle-connected surface per hand after welding coincident export seams,
as well as posed hand matrices.

The runtime uses distinct face and hand materials to keep those features
readable within the translucent projection. Navy, teal and orange retain their
brand roles. Luminous contours, spatial reconstruction lines and a slow light
sweep accompany the shaded geometry; the raster is bounded to avoid subpixel
aliasing in small portraits. Studio authoring renders show the geometry and
physical materials; runtime projection effects are not baked into fallbacks.
The runtime writes nearest-surface depth before the translucent colour pass,
so the page shows through Buddy without rear arms showing through his body.

The runtime applies the shared hologram GPU material and expression transforms
to the actual geometry. PNGs are only the source-faithful fallback if WebGL or
the model is unavailable. The manifest records the entire library, including
all three mutually exclusive forms; it is not a claim that all its triangles
are drawn simultaneously. CI, rather than this authoring process, verifies the
application integration, browser lifecycle, animation frames and size budgets.
