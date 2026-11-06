# Sauvegarde le .blend et exporte les GLB dans le dossier du modèle.
import bpy, os
D = r'C:\Projets\Clients\PAACIV\Code\PAACIV\medias-3d\hotel-du-district'
bpy.ops.wm.save_as_mainfile(filepath=D + r'\hotel-du-district.blend', compress=True)
col = bpy.data.collections['Hotel_du_District']
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects:
    o.select_set(o.type == 'MESH')
base = dict(use_selection=True, export_format='GLB', export_apply=True, export_yup=True, export_cameras=False, export_lights=False,
            export_animations=False, export_image_format='WEBP', export_jpeg_quality=72, export_vertex_color='ACTIVE', export_all_vertex_colors=False)
draco = dict(export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_draco_position_quantization=14,
             export_draco_normal_quantization=8, export_draco_texcoord_quantization=11, export_draco_color_quantization=8)
tailles = {}
for nom, opts in (('hotel-du-district-brut', {}), ('hotel-du-district', draco)):
    f = os.path.join(D, nom + '.glb')
    bpy.ops.export_scene.gltf(filepath=f, **base, **opts)
    tailles[nom] = os.path.getsize(f)
# mesure : le bâtiment seul, sans les abords
ABORDS = ('Arbres', 'Arbres_lointains', 'Rue', 'Mobilier', 'Cloture', 'Fontaines')
for o in col.objects:
    o.select_set(o.type == 'MESH' and o.name not in ABORDS)
f = os.path.join(D, 'hotel-du-district-bati.glb')
bpy.ops.export_scene.gltf(filepath=f, **base, **draco)
tailles['bati_seul'] = os.path.getsize(f)
result = dict(tailles=tailles, blend=os.path.getsize(D + r'\hotel-du-district.blend'))
