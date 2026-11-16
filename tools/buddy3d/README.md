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
fallbacks, front/profile/back views and isolated pose previews. Runtime assets
are in `iip-frontend/iip-web/public/images/buddy/3d`. The same GLB and fallback
images are copied to the public website; its master is a source copy.

The official Windows ZIP was checked against Blender's published SHA256 file:
`bbd78f8931dc940444da4ff2983374930f9f5c092ae0e330588e9760bb9d967c`.
Download: <https://download.blender.org/release/Blender5.2/blender-5.2.4-windows-x64.zip>.
Blender's GPL applies to Blender software, not to these authored output models:
<https://www.blender.org/about/license/>. The authoring script states its own
GPL-2.0-or-later licence. The OGL 1.0.11 runtime is Unlicense:
<https://github.com/oframe/ogl>.

The current finish follows Israel's 16 November rejection of the flat, striped
hologram. Rounded body bevels and a convex face are paired with polished navy
and teal surfaces, pearl gloves, layered eye whites/irises/pupils and restrained
cool edge reflections. The runtime honours the GLB's metallic, roughness,
clearcoat and emission values with a small studio-lighting shader. Body and
hands are opaque; the magnifier aperture remains transparent. There is no
scanline texture or full-body transparency.

The runtime applies the shared studio GPU material and expression transforms
to the actual geometry. PNGs are only the source-faithful fallback if WebGL or
the model is unavailable. The manifest records the entire library, including
all three mutually exclusive forms; it is not a claim that all its triangles
are drawn simultaneously. CI, rather than this authoring process, verifies the
application integration, browser lifecycle, animation frames and size budgets.
