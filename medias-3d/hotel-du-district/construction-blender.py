# Hôtel du District d'Abidjan : construction procédurale. Unités : mètres.
# Repère : X = du mur de l'horloge (X=0) vers le mur arrière, Y = de la façade à lames (Y=0)
# vers le pignon sud de la tour, Z = hauteur. Dimensions calées sur l'échelle du plan RDC.
import bpy, math, os, random
import numpy as np

OUT = r'C:\Projets\Clients\PAACIV\Code\PAACIV\medias-3d\hotel-du-district'
TEX = os.path.join(OUT, 'textures')
os.makedirs(TEX, exist_ok=True)

BX0, BX1, BY0, BY1 = 0.0, 35.2, 0.0, 22.2   # bloc bas
TX0, TX1, TY0, TY1 = 4.7, 13.3, 13.6, 35.5  # tour
ZS, ZM, ZR, ZP = 5.3, 9.25, 13.2, 13.9      # sous-face, plancher milieu, toit, acrotère
Z_RANGS = 1.4; H_RANG = 3.25; N_RANGS = 10; Z_TOUR = 35.0
N_TRAV = 13; LAME = 3.25; N_LAMES = 10

rng = random.Random(1960)

# ---------------------------------------------------------------- nettoyage
col = bpy.data.collections.get('Hotel_du_District')
if col:
    for o in list(col.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    col = bpy.data.collections.new('Hotel_du_District')
    bpy.context.scene.collection.children.link(col)
for name in ('Cube', 'Light'):
    o = bpy.data.objects.get(name)
    if o:
        bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):
    if m.users == 0:
        bpy.data.meshes.remove(m)
for c in list(bpy.data.curves):
    if c.users == 0:
        bpy.data.curves.remove(c)

# ---------------------------------------------------------------- textures
def bruit(n, sig, seed):
    r = np.random.default_rng(seed).random((n, n))
    f = np.fft.fftfreq(n)
    G = np.exp(-2 * (math.pi * sig) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    o = np.fft.ifft2(np.fft.fft2(r) * G).real
    return (o - o.min()) / (o.max() - o.min())

def ecrire(nom, arr):
    h, w = arr.shape[:2]
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., :3] = np.clip(arr[::-1], 0, 1)
    old = bpy.data.images.get(nom)
    if old:
        bpy.data.images.remove(old)
    im = bpy.data.images.new(nom, w, h, alpha=False)
    im.pixels.foreach_set(rgba.ravel())
    chemin = os.path.join(TEX, nom + '.png')
    im.filepath_raw = chemin
    im.file_format = 'PNG'
    im.save()
    return im

def tex_normale(nom, h, force):
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1)
    gy = np.roll(h, 1, 0) - np.roll(h, -1, 0)
    n = np.dstack((-gx * force, -gy * force, np.ones_like(h)))
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    im = ecrire(nom, n * .5 + .5)
    im.colorspace_settings.name = 'Non-Color'
    return im

def tex_pierre():
    n = 512
    fin, moyen, large = bruit(n, .9, 1), bruit(n, 2.4, 2), bruit(n, 28, 3)
    col_ = np.array([.62, .54, .41])[None, None] * (.80 + .26 * moyen[..., None] + .20 * large[..., None])
    gr = (fin - fin.mean()) / fin.std()
    c = np.clip((gr - .45) / .8, 0, 1)[..., None]
    col_ = col_ * (1 - c) + np.array([.82, .74, .60])[None, None] * c
    d = np.clip((-gr - .55) / .8, 0, 1)[..., None]
    col_ = col_ * (1 - .75 * d) + np.array([.19, .15, .11])[None, None] * .75 * d
    h = fin * .6 + moyen * .4
    joint = np.zeros((n, n))
    rangs, cols = 5, 3
    ph, pw = n // rangs, n // cols
    rs = np.random.default_rng(7)
    for r in range(rangs):
        dec = (r * 137) % pw
        y0 = r * ph
        for k in range(cols):
            xs = (np.arange(pw) + dec + k * pw) % n
            col_[np.ix_(np.arange(y0, y0 + ph), xs)] *= .95 + .10 * rs.random()
        joint[y0:y0 + 3] = 1
        for k in range(cols):
            x = (dec + k * pw) % n
            joint[y0:y0 + ph, x:x + 3] = 1
    col_ *= (1 - .38 * joint)[..., None]
    h = h - .7 * joint
    IMN['pierre_n'] = tex_normale('pierre_n', h[::2, ::2], 3.0)
    return ecrire('pierre', col_)

def tex_beton(nom, teinte, seed):
    n = 256
    a, b = bruit(n, 1.4, seed), bruit(n, 9, seed + 1)
    tr = bruit(n, 2.2, seed + 2).mean(axis=0)
    tr = (tr - tr.min()) / (tr.max() - tr.min())
    v = np.array(teinte)[None, None] * (.84 + .13 * a[..., None] + .13 * b[..., None] + .10 * tr[None, :, None])
    return ecrire(nom, v)

def tex_feuille():
    n = 256
    a, b = bruit(n, 1.8, 30), bruit(n, 5, 31)
    t = np.clip((a - .32) / .36, 0, 1)[..., None] * (.6 + .6 * b[..., None])
    return ecrire('feuille', np.array([.20, .27, .13])[None, None] + np.array([.24, .31, .13])[None, None] * t)

def tex_portique():
    n = 256
    v = np.ones((n, n, 3)) * np.array([.80, .75, .63])
    for k in range(0, n, 64):
        v[k + 14:k + 34] = np.array([.44, .41, .36])
    for k in range(0, n, 128):
        v[:, k:k + 8] = np.array([.44, .41, .36])
    return ecrire('portique', v * (.92 + .14 * bruit(n, 2, 12)[..., None]))

def tex_toit():
    n = 256
    a, b = bruit(n, .9, 13), bruit(n, 14, 14)
    return ecrire('toit', np.array([.47, .52, .43])[None, None] * (.72 + .3 * a[..., None] + .34 * b[..., None]))

def tex_panneaux():
    n = 256
    a = bruit(n, 1.6, 4)
    col_ = np.array([.83, .80, .72])[None, None] * (0.93 + 0.14 * a[..., None])
    rs = np.random.default_rng(8)
    h, w = n // 4, n // 2
    for r in range(4):
        dec = (r % 2) * w // 2
        for k in range(2):
            xs = (np.arange(w) + dec + k * w) % n
            col_[np.ix_(np.arange(r * h, r * h + h), xs)] *= 0.95 + 0.09 * rs.random()
        col_[r * h:r * h + 2] *= .72
        col_[r * h:r * h + h, dec:dec + 2] *= .72
        col_[r * h:r * h + h, (dec + w) % n:((dec + w) % n) + 2] *= .72
    return ecrire('panneaux', col_)

def tex_claustra():
    n = 256
    v = np.ones((n, n, 3)) * np.array([.80, .78, .72])
    nx, ny = 4, 6
    for j in range(ny):
        for i in range(nx):
            x0 = i * n // nx; y0 = j * n // ny
            dec = (j % 2) * (n // nx // 2)
            xs = (np.arange(x0 + 10, x0 + n // nx - 10) + dec) % n
            v[np.ix_(np.arange(y0 + 11, y0 + n // ny - 11), xs)] = np.array([.30, .29, .27])
    return ecrire('claustra', v)

def tex_persiennes():
    n = 128
    v = np.ones((n, n, 3)) * np.array([.88, .87, .82])
    for y in range(0, n, 12):
        v[y:y + 4] = np.array([.28, .28, .27])
    return ecrire('persiennes', v)

def tex_briques_verre():
    n = 128
    a = bruit(n, 4, 9)
    v = np.array([.62, .69, .68])[None, None] * (0.82 + 0.35 * a[..., None])
    for k in range(0, n, 32):
        v[k:k + 4] = np.array([.82, .81, .76])
        v[:, k:k + 4] = np.array([.82, .81, .76])
    return ecrire('briques_verre', v)

def tex_dalles():
    n = 512
    a, c = bruit(n, 1.6, 5), bruit(n, 46, 6)
    v = np.array([.74, .66, .51])[None, None] * (.84 + .16 * a[..., None] + .20 * c[..., None])
    pas = n // 6
    for k in range(0, n, pas):
        v[k:k + 3] *= .74
        v[:, k:k + 3] *= .74
    ocre = np.array([.56, .43, .29])
    for k in (pas // 2, 3 * pas + pas // 2):
        v[k:k + 18] = v[k:k + 18] * .35 + ocre * .65
        v[:, k:k + 18] = v[:, k:k + 18] * .35 + ocre * .65
    y, x = np.mgrid[0:n, 0:n]
    diag = ((x + y) % n < 10) | ((x - y) % n < 10)
    v[diag] = v[diag] * .5 + ocre * .5
    return ecrire('dalles', v)

IMN = {}
IM = dict(pierre=tex_pierre(), beton=tex_beton('beton', (.71, .68, .61), 20), beton_clair=tex_beton('beton_clair', (.79, .76, .68), 24),
          portique=tex_portique(), toit=tex_toit(), feuille=tex_feuille(), panneaux=tex_panneaux(), claustra=tex_claustra(), persiennes=tex_persiennes(),
          briques_verre=tex_briques_verre(), dalles=tex_dalles())
p = os.path.join(TEX, 'horloge.png')
for im in [i for i in bpy.data.images if i.name.startswith('horloge')]:
    bpy.data.images.remove(im)
IM['horloge'] = bpy.data.images.load(p)
IM['horloge'].name = 'horloge'

# ---------------------------------------------------------------- matériaux
def lin(c):
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4

def matiere(nom, hexa=None, rugo=.8, metal=0.0, tex=None, normale=None):
    m = bpy.data.materials.get(nom) or bpy.data.materials.new(nom)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    for n in [n for n in nt.nodes if n.type in ('TEX_IMAGE', 'NORMAL_MAP')]:
        nt.nodes.remove(n)
    if hexa:
        h = hexa.lstrip('#')
        bsdf.inputs['Base Color'].default_value = (*[lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)], 1)
    bsdf.inputs['Roughness'].default_value = rugo
    bsdf.inputs['Metallic'].default_value = metal
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = IM[tex]
        nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    if normale:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = IMN[normale]
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = 1.0
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return m

M = dict(
    beton=matiere('beton', rugo=.9, tex='beton'),
    beton_ombre=matiere('beton_ombre', '#8f8b80', .9),
    beton_clair=matiere('beton_clair', rugo=.85, tex='beton_clair'),
    pierre=matiere('pierre', rugo=.9, tex='pierre', normale='pierre_n'),
    panneaux=matiere('panneaux', rugo=.9, tex='panneaux'),
    allege=matiere('allege', '#7a7362', .7),
    verre_or=matiere('verre_or', '#dcaa5e', .16, .68),
    verre_ambre=matiere('verre_ambre', '#efbf80', .18, .62),
    verre_vert=matiere('verre_vert', '#a3a66c', .16, .68),
    verre_sombre=matiere('verre_sombre', '#2a3034', .12, .8),
    verre_pale=matiere('verre_pale', '#b7b6a8', .45),
    verre_bleu=matiere('verre_bleu', '#55666f', .1, .9),
    menuiserie=matiere('menuiserie', '#bfbdb2', .6),
    interieur=matiere('interieur', '#191817', .95),
    porte=matiere('porte', '#8f3a1f', .6),
    toit=matiere('toit', rugo=.95, tex='toit'),
    portique=matiere('portique', rugo=.6, tex='portique'),
    toit_tour=matiere('toit_tour', '#8d8a80', .95),
    tole=matiere('tole', '#d9d9d2', .6, .2),
    clim=matiere('clim', '#9c9c98', .6),
    sol=matiere('sol', '#5d6d46', .95),
    trottoir=matiere('trottoir', '#b0a794', .9),
    asphalte=matiere('asphalte', '#55544f', .9),
    dalles=matiere('dalles', rugo=.85, tex='dalles'),
    socle=matiere('socle', '#2c2a27', .9),
    enduit=matiere('enduit', '#efece2', .85),
    eau=matiere('eau', '#4d6c5a', .12, .2),
    claustra=matiere('claustra', rugo=.9, tex='claustra'),
    persiennes=matiere('persiennes', rugo=.7, tex='persiennes'),
    briques_verre=matiere('briques_verre', rugo=.35, tex='briques_verre'),
    bronze=matiere('bronze', '#8d7044', .55, .5),
    or_=matiere('or', '#d9b85a', .35, .9),
    cadran=matiere('cadran', rugo=.5, tex='horloge'),
    lettre=matiere('lettre', '#f6f5ef', .5),
)
VERRES = ['verre_or'] * 9 + ['verre_ambre'] * 5 + ['verre_vert'] * 3 + ['verre_sombre'] * 2 + ['verre_pale'] * 2

# ---------------------------------------------------------------- construction de maillages
TUILES = dict(beton=5.0, beton_clair=5.0, toit=9.0, toit_tour=9.0)

class MB:
    def __init__(s, nom):
        s.nom, s.v, s.f, s.m, s.uv, s.noms = nom, [], [], [], [], []

    def _mid(s, mat):
        if mat not in s.noms:
            s.noms.append(mat)
        return s.noms.index(mat)

    def poly(s, pts, mat, tuile=1.0, uvs=None):
        if tuile == 1.0 and uvs is None:
            tuile = TUILES.get(mat, 1.0)
        i = len(s.v)
        s.v += [tuple(p) for p in pts]
        s.f.append(tuple(range(i, i + len(pts))))
        s.m.append(s._mid(mat))
        if uvs is None:
            a, b, c = map(np.array, pts[:3])
            n = np.abs(np.cross(b - a, c - b))
            ax = int(np.argmax(n))
            if ax == 2:
                uvs = [(p[0] / tuile, p[1] / tuile) for p in pts]
            elif ax == 0:
                uvs = [(p[1] / tuile, p[2] / tuile) for p in pts]
            else:
                uvs = [(p[0] / tuile, p[2] / tuile) for p in pts]
        s.uv.append(uvs)

    def qx(s, x, y0, y1, z0, z1, sens, mat, tuile=1.0):
        if sens < 0:
            s.poly([(x, y1, z0), (x, y0, z0), (x, y0, z1), (x, y1, z1)], mat, tuile)
        else:
            s.poly([(x, y0, z0), (x, y1, z0), (x, y1, z1), (x, y0, z1)], mat, tuile)

    def qy(s, y, x0, x1, z0, z1, sens, mat, tuile=1.0):
        if sens < 0:
            s.poly([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], mat, tuile)
        else:
            s.poly([(x1, y, z0), (x0, y, z0), (x0, y, z1), (x1, y, z1)], mat, tuile)

    def box(s, x0, x1, y0, y1, z0, z1, mat, tuile=1.0, faces='xXyYzZ'):
        if 'x' in faces: s.qx(x0, y0, y1, z0, z1, -1, mat, tuile)
        if 'X' in faces: s.qx(x1, y0, y1, z0, z1, 1, mat, tuile)
        if 'y' in faces: s.qy(y0, x0, x1, z0, z1, -1, mat, tuile)
        if 'Y' in faces: s.qy(y1, x0, x1, z0, z1, 1, mat, tuile)
        if 'z' in faces: s.poly([(x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0)], mat, tuile)
        if 'Z' in faces: s.poly([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], mat, tuile)

    def cyl(s, cx, cy, z0, z1, r0, r1, mat, n=10):
        for i in range(n):
            a, b = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
            s.poly([(cx + r0 * math.cos(a), cy + r0 * math.sin(a), z0), (cx + r0 * math.cos(b), cy + r0 * math.sin(b), z0),
                    (cx + r1 * math.cos(b), cy + r1 * math.sin(b), z1), (cx + r1 * math.cos(a), cy + r1 * math.sin(a), z1)], mat)

    def diviser(s, m):
        v, f, uv, mi = [], [], [], []
        for k, ids in enumerate(s.f):
            P = [np.array(s.v[i], float) for i in ids]
            U = [np.array(u, float) for u in s.uv[k]]
            if len(ids) != 4:
                nu = nv = 1
            else:
                nu = max(1, math.ceil(np.linalg.norm(P[1] - P[0]) / m))
                nv = max(1, math.ceil(np.linalg.norm(P[3] - P[0]) / m))
            if nu == 1 and nv == 1:
                b = len(v)
                v += [tuple(p) for p in P]
                f.append(tuple(range(b, b + len(P))))
                uv.append([tuple(u) for u in U])
                mi.append(s.m[k])
                continue
            def bil(A, a, b_):
                return (A[0] * (1 - a) + A[1] * a) * (1 - b_) + (A[3] * (1 - a) + A[2] * a) * b_
            for i in range(nu):
                for j in range(nv):
                    co = [(i / nu, j / nv), ((i + 1) / nu, j / nv), ((i + 1) / nu, (j + 1) / nv), (i / nu, (j + 1) / nv)]
                    b = len(v)
                    v += [tuple(bil(P, a, c)) for a, c in co]
                    f.append(tuple(range(b, b + 4)))
                    uv.append([tuple(bil(U, a, c)) for a, c in co])
                    mi.append(s.m[k])
        s.v, s.f, s.uv, s.m = v, f, uv, mi

    def creer(s, max_arete=None):
        if max_arete:
            s.diviser(max_arete)
        me = bpy.data.meshes.new(s.nom)
        me.from_pydata(s.v, [], s.f)
        for n in s.noms:
            me.materials.append(M[n])
        me.polygons.foreach_set('material_index', s.m)
        uv = me.uv_layers.new(name='UVMap')
        k = 0
        for fuv in s.uv:
            for u in fuv:
                uv.data[k].uv = u
                k += 1
        me.update()
        o = bpy.data.objects.new(s.nom, me)
        col.objects.link(o)
        return o

# ---------------------------------------------------------------- tour
def facade_tour(mb, x, s, ouverts=()):
    prof = 0.28
    xr = x - s * prof
    ys = [TY0 + .45 + i * (TY1 - TY0 - .9) / N_TRAV for i in range(N_TRAV + 1)]
    zr = [Z_RANGS + k * H_RANG for k in range(N_RANGS + 1)]
    x0, x1 = min(x, xr), max(x, xr)
    fx = 'X' if s > 0 else 'x'
    for y in ys:
        zb = ZP if y < BY1 else 0
        mb.box(x0, x1, y - .1, y + .1, zb, Z_TOUR, 'beton', faces=fx + 'yY')
    for z in zr:
        for k, (a, b) in enumerate(((ys[0], BY1), (BY1, ys[-1]))):
            if k == 0 and z < ZP:
                continue
            mb.box(x0, x1, a, b, z - .16, z + .16, 'beton', faces=fx + 'zZ')
    mb.box(x0, x1, ys[0], ys[-1], Z_TOUR - .1, Z_TOUR + .35, 'beton', faces=fx + 'zZ')
    for i in range(N_TRAV):
        a, b = ys[i] + .1, ys[i + 1] - .1
        col_haut = N_TRAV - i   # colonne comptée depuis le pignon sud, comme sur la vue aérienne
        for k in range(N_RANGS):
            zb, zt = zr[k] + .16, zr[k + 1] - .16
            if zt < ZP and b < BY1:
                continue
            zal = zb + .92
            mb.qx(xr, a, b, zb, zal, s, 'allege')
            mb.qx(xr, a, b, zal, zal + .08, s, 'menuiserie')
            rang_haut = N_RANGS - k
            ouvert = (rang_haut, col_haut) in ouverts
            v = 'verre_sombre' if ouvert else rng.choice(VERRES)
            e = .06
            mb.qx(xr, a, b, zal + .08, zt, s, 'menuiserie')
            ty, tz = rng.uniform(-.014, .014), rng.uniform(-.012, .012)
            yc, zc = (a + b) / 2, (zal + zt) / 2
            xv = lambda y_, z_: xr + s * .03 + ty * (y_ - yc) + tz * (z_ - zc)
            y0v, y1v, z0v, z1v = a + e, b - e, zal + .08 + e, zt - e
            pv = [(xv(y1v, z0v), y1v, z0v), (xv(y0v, z0v), y0v, z0v), (xv(y0v, z1v), y0v, z1v), (xv(y1v, z1v), y1v, z1v)]
            if s > 0:
                pv = [pv[1], pv[0], pv[3], pv[2]]
            mb.poly(pv, v)
            if ouvert:
                zh, zl = zt - .03, zt - 1.0
                xo = xr + s * .72
                pts = [(xr, b, zh), (xr, a, zh), (xo, a, zl), (xo, b, zl)]
                if s > 0:
                    pts = pts[::-1]
                mb.poly(pts, 'verre_pale')
                mb.poly(pts[::-1], 'menuiserie')
                c = (a + b) / 2
                mb.box(min(xr, xr + s * .3), max(xr, xr + s * .3), c - .32, c + .32, zb + .2, zb + .68, 'clim', faces='xXyYZ')
        zb, zt = zr[-1] + .16, Z_TOUR - .1
        mb.qx(xr, a, b, zb, zt, s, 'interieur')
        if b > BY1:
            mb.qx(xr + 0 * s, a, b, 0, zr[0] - .16, s, 'beton')
            if i % 2 == 0:
                mb.qx(x - s * .2, a + .35, b - .35, .55, 1.0, s, 'persiennes', .5)

tour = MB('Tour')
OUVERTS = {(1, 7), (1, 9), (2, 4), (2, 7), (2, 9), (3, 9), (3, 10), (4, 8), (4, 9), (5, 10), (5, 11)}
facade_tour(tour, TX0, -1, OUVERTS)
facade_tour(tour, TX1, 1, {(2, 6), (3, 4), (3, 5), (6, 8), (7, 3)})
T_P = 4.0
tour.box(TX0, TX1, TY1 - .45, TY1, 0, Z_TOUR + .35, 'pierre', T_P, faces='xXYzZ')
tour.box(TX0, TX1, TY0, TY0 + .45, ZP, Z_TOUR + .35, 'pierre', T_P, faces='xXyZ')
for k in range(N_RANGS + 1):
    z = Z_RANGS + k * H_RANG
    tour.box(TX0 - .03, TX1 + .03, TY1 - .1, TY1 + .12, z - .1, z + .12, 'beton', faces='xXYzZ')
    if z > ZP:
        tour.box(TX0 - .03, TX1 + .03, TY0 - .12, TY0 + .1, z - .1, z + .12, 'beton', faces='xXyzZ')
    # consoles triangulaires sous les cordons, comme sur la photo du pignon
    for pign in (TY1 + .12, TY0 - .12):
        if pign < TY1 and z < ZP:
            continue
        for j in range(9):
            xc = TX0 + .5 + j * (TX1 - TX0 - 1) / 8
            d = 1 if pign > 20 else -1
            pts = [(xc - .12, pign, z - .1), (xc + .12, pign, z - .1), (xc, pign - d * .1, z - .32)]
            tour.poly(pts if d < 0 else pts[::-1], 'beton')
tour.box(TX0, TX1, TY0, TY1, Z_TOUR + .02, Z_TOUR + .1, 'toit_tour', faces='Z')
tour.creer(3.0)

# ---------------------------------------------------------------- bloc bas
bloc = MB('Bloc_bas')
bloc.box(BX0, .35, BY0 + .6, BY1, ZS + .45, ZP, 'pierre', T_P, faces='xyYZ')           # mur de l'horloge
bloc.box(-.32, .32, BY0 - .1, BY1 + .1, ZS, ZS + .46, 'beton_clair')                    # poutre de rive
bloc.box(BX1 - .3, BX1, BY0 + 1.9, BY1, ZS + .45, ZP, 'panneaux', 4.0, faces='XyYZ')    # mur arrière
bloc.box(BX1 - .32, BX1 + .28, BY0, BY1 + .1, ZS, ZS + .46, 'beton_clair')
bloc.qx(BX1 - .32, BY0 + 1.6, BY0 + 1.9, ZS, ZP, 1, 'interieur')                         # fente verticale
bloc.box(BX0, BX1, BY0, BY1, ZS - .02, ZS, 'beton_clair', faces='z')                     # sous-face
bloc.box(BX0, BX1, BY0, BY1, ZR, ZR + .1, 'toit', faces='Z', tuile=1)                    # toit
for a in ((BX0, BX1, BY0, BY0 + .3), (BX0, TX0, BY1 - .3, BY1), (TX1, BX1, BY1 - .3, BY1)):
    bloc.box(a[0], a[1], a[2], a[3], ZP, ZP + .12, 'beton')
bloc.box(BX0, TX0, BY1 - .3, BY1, ZR, ZP, 'beton_clair', faces='Yx')
# côté sud, entre le mur de l'horloge et la tour : cadre vitré vu sur la vue aérienne
for i in range(4):
    x = .35 + i * (TX0 - .35) / 3
    bloc.box(x - .1, x + .1, BY1 - .5, BY1, ZS + .45, ZR, 'beton', faces='xXY')
bloc.qy(BY1 - .5, .35, TX0, ZS + .45, ZR, 1, 'verre_bleu')
for z in (7.1, 9.25, 11.2):
    bloc.box(.35, TX0, BY1 - .45, BY1 - .25, z - .05, z + .05, 'menuiserie', faces='YzZ')
# côté sud, à droite de la tour : aucune photo, façade interprétée
bloc.box(TX1, BX1, BY1 - .25, BY1, ZS, ZP, 'enduit', faces='Y')
for i in range(6):
    x = 15.2 + i * 3.3
    for z in (6.4, 10.2):
        bloc.qy(BY1 + .005, x, x + 2.2, z, z + 2.0, 1, 'verre_bleu')
        bloc.qy(BY1 + .01, x + 1.05, x + 1.15, z, z + 2.0, 1, 'menuiserie')
# rez-de-chaussée
XH = 12.8
bloc.box(XH, BX1 - .9, 1.3, BY1 - .1, 0, ZS, 'beton_clair', faces='')
bloc.qy(1.3, XH, 33.6, 0, ZS, -1, 'claustra', 2.4)
bloc.box(33.6, 34.3, 1.0, 1.6, 0, ZS, 'beton_clair')
bloc.qx(BX1 - .9, 1.6, 9.0, 0, ZS, 1, 'briques_verre', 1.6)
bloc.qx(BX1 - .9, 9.0, BY1, 0, ZS, 1, 'persiennes', 1.2)
for y in (9.0, 15.5):
    bloc.box(BX1 - .9, BX1 - .55, y - .2, y + .2, 0, ZS, 'beton_clair', faces='XyY')
bloc.qy(BY1 - .05, TX1, BX1 - .9, 0, ZS, 1, 'enduit')
for i in range(6):
    x = 15.2 + i * 3.3
    bloc.qy(BY1 - .04, x, x + 2.2, 1.2, 3.6, 1, 'verre_bleu')
bloc.creer(2.5)

# ---------------------------------------------------------------- façade à lames
lames = MB('Facade_lames')
GY = 1.4
X_FIN = .6 + N_LAMES * LAME - .0
lames.qy(GY, .6, X_FIN, ZS, ZR, -1, 'verre_bleu')
for i in range(N_LAMES + 1):
    x = .6 + i * LAME
    for j in (0, 1):
        z0, z1 = (ZS, ZM) if j == 0 else (ZM, ZR)
        B = .92
        # lame : triangle pointe en haut, plein jusqu'au vitrage
        xg, xd = max(x - B, .6), min(x + B, X_FIN)
        t = [(xg, 0.02, z0), (xd, 0.02, z0), (x, 0.02, z1)]
        lames.poly(t, 'beton_clair')
        lames.poly([(xd, .02, z0), (xd, GY, z0), (x, GY, z1), (x, .02, z1)], 'beton_ombre')
        lames.poly([(xg, GY, z0), (xg, .02, z0), (x, .02, z1), (x, GY, z1)], 'beton_ombre')
    if i < N_LAMES:
        for dx in (LAME * .33, LAME * .67):
            lames.box(x + dx - .03, x + dx + .03, GY - .05, GY, ZS, ZR, 'menuiserie', faces='yxX')
for z in (ZS + 1.1, ZS + 2.6, ZM + 1.3, ZM + 2.5):
    lames.box(.6, X_FIN, GY - .05, GY, z - .03, z + .03, 'menuiserie', faces='yzZ')
lames.box(0, X_FIN, 0, GY, ZS - .05, ZS + .12, 'beton_clair', faces='yzZ')
lames.box(0, X_FIN, 0, GY, ZM - .1, ZM + .1, 'beton_clair', faces='yzZ')
lames.box(0, X_FIN, 0, GY, ZR - .3, ZP, 'beton_clair', faces='yzZ')
lames.box(0, .6, 0, .6, ZS, ZP, 'beton_clair', faces='xy')
lames.box(.0, .6, .6, GY, ZS, ZP, 'beton_clair', faces='X')
lames.box(X_FIN, BX1 + .02, 0, 1.6, ZS, ZP, 'beton_clair', faces='xXyZ')
# garde-corps du premier rang
for i in range(N_LAMES):
    x = .6 + i * LAME
    a, b = x + .92, x + LAME - .92
    lames.box(a, b, .05, .1, ZS + 1.1, ZS + 1.15, 'interieur', faces='yYZz')
    n = 7
    for k in range(n + 1):
        xk = a + (b - a) * k / n
        lames.box(xk - .012, xk + .012, .06, .09, ZS + .12, ZS + 1.1, 'interieur', faces='yYxX')
lames.creer(2.5)

# ---------------------------------------------------------------- portique
por = MB('Portique')
for x in (.35, 3.6):
    for i in range(8):
        y = .3 + i * 3.08
        por.cyl(x, y, .5, ZS - .35, .3, .26, 'beton_clair', 12)
for x in (6.85, 10.1):
    for y in (.3, 3.38):
        por.cyl(x, y, .5, ZS - .35, .3, .26, 'beton_clair', 12)
for i in range(8):
    y = .3 + i * 3.08
    por.box(-.2, XH, y - .2, y + .2, ZS - .42, ZS, 'beton_clair', faces='yYz')
for x in (3.6, 6.85, 10.1):
    por.box(x - .18, x + .18, .1, BY1, ZS - .42, ZS, 'beton_clair', faces='xXz')
por.box(0, XH + .1, 0, BY1, 0, .5, 'portique', 3.0, faces='Z')
por.box(0, XH + .1, 0, BY1, 0, .5, 'beton_clair', faces='xyY')
for k, (dx, h) in enumerate(((.5, .33), (1.0, .17))):
    por.box(-dx, 0, -.0, BY1, 0, h, 'beton_clair', faces='xyYZ')
por.qx(XH, 1.3, 18.3, .5, ZS, -1, 'verre_sombre')
for i in range(6):
    y = 1.3 + i * 3.4
    por.box(XH - .15, XH, y - .14, y + .14, .5, ZS, 'beton_clair', faces='xyY')
por.box(XH - .06, XH, 8.2, 11.2, .5, 4.3, 'porte', faces='x')
por.box(TX0, XH, 18.3, 18.5, .5, ZS, 'pierre', T_P, faces='y')
por.box(TX0, XH, 18.3, BY1, .5, ZS, 'pierre', T_P, faces='x')
por.creer(2.5)

# ---------------------------------------------------------------- toiture
eq = MB('Equipements_toit')
eq.box(8.1, 10.9, 22.5, 25.3, Z_TOUR + .1, Z_TOUR + 2.8, 'toit_tour')
eq.box(8.0, 11.0, 22.4, 25.4, Z_TOUR + 2.8, Z_TOUR + 3.0, 'beton')
eq.cyl(6.3, 31.0, Z_TOUR, Z_TOUR + 6, .04, .02, 'clim', 6)
eq.cyl(11.8, 16.5, Z_TOUR, Z_TOUR + 7, .04, .02, 'clim', 6)
eq.cyl(7.0, TY1 + .22, 18.0, Z_TOUR + .2, .07, .07, 'clim', 6)
for (x0, x1, y0, y1) in ((15.5, 27, 15.5, 18.5), (15.5, 24, 19.3, 21.6)):
    eq.box(x0, x1, y0, y1, ZR + .1, ZR + 1.4, 'beton_clair', faces='xXyY')
    eq.box(x0 - .25, x1 + .25, y0 - .25, y1 + .25, ZR + 1.4, ZR + 1.55, 'tole')
for (x, y) in ((1.2, 15.0), (2.1, 15.0), (1.2, 16.0), (2.1, 16.0), (1.3, 17.2), (2.3, 17.2), (1.2, 18.4), (2.2, 18.4), (3.1, 16.0), (3.3, 18.2)):
    eq.box(x, x + .75, y, y + .85, ZR + .1, ZR + .8, 'clim', faces='xXyYZ')
eq.creer()

# ---------------------------------------------------------------- horloge et balcon
hc, hy, hz, hr = -.04, 6.2, 9.75, 1.35
disque = MB('Horloge_cadran')
n = 40
pts = [(hc, hy - hr * math.cos(2 * math.pi * i / n), hz + hr * math.sin(2 * math.pi * i / n)) for i in range(n)]
uvs = [(.5 + .5 * math.cos(2 * math.pi * i / n), .5 + .5 * math.sin(2 * math.pi * i / n)) for i in range(n)]
disque.poly(pts, 'cadran', uvs=uvs)
disque.creer()

def aiguille(nom, L, l, angle):
    mb = MB(nom)
    mb.poly([(-.03, l, -L * .12), (-.03, 0, L), (-.03, -l, -L * .12)], 'or_')
    mb.poly([(-.03, l, -L * .12), (-.03, -l, -L * .12), (-.03, 0, -L * .3)], 'or_')
    o = mb.creer()
    o.location = (hc, hy, hz)
    o.rotation_mode = 'XYZ'
    o.rotation_euler = (angle, 0, 0)
    return o

aiguille('Aiguille_heures', .72, .07, math.radians(300))
aiguille('Aiguille_minutes', 1.12, .05, math.radians(55))

bal = MB('Balcon_medaillon')
yb = 15.8
bal.box(-.5, .35, yb - 1.15, yb + 1.15, ZS + .46, ZS + 1.3, 'bronze')
bal.box(-.56, -.5, yb - .4, yb + .4, ZS + .6, ZS + 1.16, 'or_')
bal.qx(-.005, yb - .62, yb + .62, ZS + 1.3, ZS + 3.2, -1, 'verre_pale')
for (a, b) in ((-.7, -.6), (.6, .7), (-.05, .05)):
    bal.box(-.03, 0, yb + a, yb + b, ZS + 1.3, ZS + 3.25, 'menuiserie', faces='x')
for z in (ZS + 1.3, ZS + 2.4, ZS + 3.2):
    bal.box(-.03, 0, yb - .7, yb + .7, z - .04, z + .04, 'menuiserie', faces='x')
bal.creer()

# ---------------------------------------------------------------- lettres
bpy.ops.object.select_all(action='DESELECT')
cu = bpy.data.curves.new('Lettres', 'FONT')
cu.body = 'HOTEL DU DISTRICT'
cu.font = bpy.data.fonts.load(r'C:\Windows\Fonts\arialbd.ttf', check_existing=True)
cu.size = 1.62
cu.extrude = .07
cu.resolution_u = 1
cu.space_character = 1.0
ol = bpy.data.objects.new('Lettres', cu)
col.objects.link(ol)
ol.rotation_euler = (math.pi / 2, 0, -math.pi / 2)
ol.location = (.15, 19.8, ZP + .55)
bpy.context.view_layer.objects.active = ol
ol.select_set(True)
bpy.context.view_layer.update()
lg = ol.dimensions.x
ol.scale = (18.6 / lg, 1, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.object.convert(target='MESH')
ol.data.materials.clear()
ol.data.materials.append(M['lettre'])
sup = MB('Support_lettres')
sup.box(.29, .33, 1.2, 19.8, ZP + .62, ZP + .66, 'clim', faces='xzZ')
sup.box(.29, .33, 1.2, 19.8, ZP + 1.42, ZP + 1.46, 'clim', faces='xzZ')
for i in range(5):
    y = 1.6 + i * 4.4
    sup.box(.29, .33, y, y + .05, ZP, ZP + 1.46, 'clim', faces='xXyY')
sup.creer()

# ---------------------------------------------------------------- site
site = MB('Parvis')
SX0, SX1, SY0, SY1 = -40, 44, -20, 44
site.box(SX0, SX1, SY0, SY1, -.02, 0, 'sol', faces='Z')
site.box(-35, 1, -5, 28, 0, .03, 'dalles', 18.0, faces='Z')
site.box(1, SX1, SY0, 1, 0, .02, 'trottoir', faces='Z')
site.box(-8, TX0, TY1 + .0 - 13.5, SY1, 0, .02, 'asphalte', faces='Z')
site.box(TX1, BX1, BY1, SY1, 0, .02, 'asphalte', faces='Z')
site.creer(4.0)

def fontaine(mb, x0, y0, sy):
    # deux bassins en L et un pilier central, d'après la photo de la fontaine
    mb.box(x0, x0 + 16, y0, y0 + 9, 0, .7, 'panneaux', 3.0, faces='xXyY')
    mb.box(x0, x0 + 16, y0, y0 + .4, .7, .78, 'panneaux', 3.0)
    mb.box(x0, x0 + 16, y0 + 8.6, y0 + 9, .7, .78, 'panneaux', 3.0)
    mb.box(x0, x0 + .4, y0, y0 + 9, .7, .78, 'panneaux', 3.0)
    mb.box(x0 + 15.6, x0 + 16, y0, y0 + 9, .7, .78, 'panneaux', 3.0)
    mb.box(x0 + .4, x0 + 15.6, y0 + .4, y0 + 8.6, .4, .5, 'eau', faces='Z')
    xc, yc = x0 + 8, y0 + 4.5
    mb.box(xc - 3.2, xc + 3.2, yc - 2.2, yc + 2.2, .5, 1.25, 'panneaux', 3.0)
    mb.box(xc - 2.9, xc + 2.9, yc - 1.9, yc + 1.9, 1.25, 1.27, 'eau', faces='Z')
    mb.box(xc - .9, xc + .9, yc - .9, yc + .9, 1.25, 3.0, 'panneaux', 3.0)
    mb.box(xc - 1.0, xc + 1.0, yc - 1.0, yc + 1.0, 3.0, 3.12, 'panneaux', 3.0)

f = MB('Fontaines')
fontaine(f, -31, 29.5, 1)
fontaine(f, -31, -18.5, -1)
f.creer()

cl = MB('Cloture')
XF = -38
cl.box(XF - .15, XF + .15, SY0 + 1, SY1 - 1, 0, .55, 'panneaux', 3.0)
k = 0
y = SY0 + 1
while y <= SY1 - 1:
    cl.box(XF - .2, XF + .2, y - .2, y + .2, 0, 1.95, 'enduit', faces='xXyYZ')
    y += 5.0
for z in (.9, 1.7):
    cl.box(XF - .03, XF + .03, SY0 + 1, SY1 - 1, z, z + .05, 'interieur', faces='xXZ')
y = SY0 + 1
while y < SY1 - 1:
    cl.box(XF - .02, XF + .02, y, y + .04, .55, 1.75, 'interieur', faces='xX')
    y += .7
cl.creer()

# ---------------------------------------------------------------- lumière et monde
w = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
bpy.context.scene.world = w
w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (.62, .76, .95, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = .62
sun = bpy.data.objects.get('Soleil')
if not sun:
    sd = bpy.data.lights.new('Soleil', 'SUN')
    sun = bpy.data.objects.new('Soleil', sd)
    col.objects.link(sun) if sun.name not in col.objects else None
else:
    if sun.name not in col.objects:
        col.objects.link(sun)
sun.data.energy = 3.2
sun.data.color = (1, .95, .86)
sun.data.angle = math.radians(1.5)
sun.rotation_euler = (math.radians(55), 0, math.radians(-110))
sc = bpy.context.scene
sc.view_settings.view_transform = 'Standard'
sc.render.resolution_x, sc.render.resolution_y = 1400, 1000
sc.render.film_transparent = False

stats = {}
tris = 0
for o in col.objects:
    if o.type == 'MESH':
        o.data.calc_loop_triangles()
        t = len(o.data.loop_triangles)
        stats[o.name] = t
        tris += t
result = dict(triangles=tris, objets=stats, materiaux=len(M))
