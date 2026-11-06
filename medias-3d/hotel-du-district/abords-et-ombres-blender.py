# Abords (végétation, rue, mobilier) puis ombres de contact et salissures cuites en couleurs de sommets.
# À exécuter après build_hotel.py, dans le même espace de noms.
import math, random, time
from mathutils import Vector, noise
from mathutils.bvhtree import BVHTree

R = random.Random(2016)

def tex_palme():
    # palme vue de dessus : U le long de la nervure, V en travers, folioles détourées par l'alpha
    h, w = 128, 512
    v, u = np.mgrid[0:h, 0:w].astype(np.float32)
    u, v = (u + .5) / w, (v + .5) / h
    s_ = np.abs(v - .5) * 2
    cote = (v > .5).astype(np.int32)
    N = 26
    u0 = u - s_ * .17
    g = np.random.default_rng(41)
    idx = np.floor(u0 * N + cote * .5).astype(np.int32)
    f = u0 * N + cote * .5 - idx - .5
    ii = np.clip(idx + 2, 0, N + 4)
    jl, jc = g.uniform(.72, 1, (2, N + 5)), g.uniform(-.05, .05, (2, N + 5))
    t = np.clip(u0, 0, 1)
    e = np.clip(t / .13, 0, 1) ** .6 * np.clip((1.03 - t) / .62, 0, 1) ** .7 * jl[cote, ii]
    q = np.clip(s_ / np.maximum(e, 1e-3), 0, 1)
    foliole = (u0 > .02) & (u0 < 1) & (s_ < e) & (np.abs(f) < .43 * (1 - q) ** .35 + .05)
    nervure = s_ < .05 * (1 - u * .75) + .012
    a = (foliole | nervure).astype(np.float32)
    vert = np.array([.30, .43, .15])[None, None] + (jc[cote, ii] * 2.2)[..., None] * np.array([.8, 1, .35])[None, None]
    jaune = np.array([.62, .60, .26])[None, None]
    c = vert * (.82 + .3 * q[..., None]) * (1 - .28 * q[..., None] ** 5 * u[..., None]) + (jaune - vert) * (q[..., None] ** 3 * .42 * u[..., None])
    c = np.where(nervure[..., None], np.array([.62, .60, .40])[None, None], c)
    rgba = np.dstack((np.clip(c, 0, 1), a))[::-1].astype(np.float32)
    old = bpy.data.images.get('palme')
    if old:
        bpy.data.images.remove(old)
    im = bpy.data.images.new('palme', w, h, alpha=True)
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw = os.path.join(TEX, 'palme.png')
    im.file_format = 'PNG'
    im.save()
    return im

def tex_tronc_palme():
    h, w = 128, 64
    a, b = bruit(128, 1.2, 50)[:h, :w], bruit(128, 6, 51)[:h, :w]
    y = np.arange(h, dtype=np.float32)[:, None]
    anneau = np.abs(((y + 7 * b * 2) / (h / 6)) % 1 - .5) * 2
    k = (.62 + .38 * np.clip(anneau * 1.7, 0, 1)) * (.8 + .4 * a)
    return ecrire('tronc_palme', np.array([.53, .47, .39])[None, None] * k[..., None])

def tex_horizon():
    # bande répétable : canopée basse et cimes de palmiers, 45 m de haut pour 180 m de long
    w, h = 768, 192
    g = np.random.default_rng(77)
    x = np.arange(w, dtype=np.float32)
    H = 40 + sum(am * np.sin(2 * math.pi * (k * x / w + ph)) for k, am, ph in ((3, 9, .1), (7, 6, .6), (13, 4, .3), (29, 3, .8)))
    lignes = np.arange(h, dtype=np.float32)[:, None]
    a = (h - lignes <= H[None, :]).astype(np.float32)
    def tampon(cx, cy, r):
        for yy in range(max(0, int(cy - r)), min(h, int(cy + r) + 2)):
            for xx in range(int(cx - r), int(cx + r) + 2):
                if (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r:
                    a[yy, xx % w] = 1
    for k in range(24):
        x0 = (k + g.uniform(.1, .9)) * w / 24
        top = h - g.uniform(48, 112)
        pen = g.uniform(-9, 9)
        for i in range(int(h - top)):
            t = i / (h - top)
            tampon(x0 + pen * t * t, h - i, 1.1)
        cx = x0 + pen
        for f in range(9):
            az = 2 * math.pi * f / 9 + g.uniform(-.2, .2)
            L = g.uniform(20, 28)
            for i in range(14):
                t = i / 13
                tampon(cx + math.cos(az) * L * t, top - math.sin(az) * L * .55 * t + 15 * t * t, 2.6 * (1 - t * .6))
    ton = (.8 + .4 * bruit(768, 6, 78)[:h, :w])[..., None]
    rgb = np.array([.38, .47, .30])[None, None] * ton
    rgba = np.dstack((np.clip(rgb, 0, 1), a))[::-1].astype(np.float32)
    old = bpy.data.images.get('horizon')
    if old:
        bpy.data.images.remove(old)
    im = bpy.data.images.new('horizon', w, h, alpha=True)
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw = os.path.join(TEX, 'horizon.png')
    im.file_format = 'PNG'
    im.save()
    return im

def tex_pelouse():
    a, b = bruit(128, 2.2, 60), bruit(128, 7, 61)
    k = (.84 + .2 * a + .14 * b)[..., None]
    return ecrire('pelouse', np.array([.37, .43, .25])[None, None] * k)

IM.update(palme=tex_palme(), tronc_palme=tex_tronc_palme(), horizon=tex_horizon(), pelouse=tex_pelouse())
matiere('asphalte', '#6d6b63', .9)
M.update(
    feuille=matiere('feuille', rugo=.95, tex='feuille'),
    feuille_so=matiere('feuille_so', '#31482a', .95),
    palme=matiere('palme', rugo=.75, tex='palme'),
    tronc_palme=matiere('tronc_palme', rugo=.95, tex='tronc_palme'),
    horizon=matiere('horizon', rugo=1.0, tex='horizon'),
    pelouse=matiere('pelouse', rugo=1.0, tex='pelouse'),
    tronc=matiere('tronc', '#5a4a3b', .95),
    tronc_cl=matiere('tronc_cl', '#a59a86', .95),
    haie=matiere('haie', '#46622f', .95),
    voiture_bl=matiere('voiture_bl', '#e8e8e5', .3, .3),
    voiture_gr=matiere('voiture_gr', '#7f8388', .3, .5),
    voiture_ro=matiere('voiture_ro', '#9c2b26', .3, .3),
    voiture_no=matiere('voiture_no', '#23262a', .3, .4),
    vitre_auto=matiere('vitre_auto', '#20262a', .1, .7),
    orange=matiere('orange', '#f27d0c', .7),
    blanc=matiere('blanc', '#f4f3ee', .7),
    vert=matiere('vert', '#0f9b5a', .7),
    pot=matiere('pot', '#a05a3a', .8),
    lampadaire=matiere('lampadaire', '#c9c8c2', .6, .3),
    loin=matiere('loin', '#62704f', 1.0),
    marquage=matiere('marquage', '#d9d8d2', .8),
)

# palme détourée : l'alpha de la texture découpe les folioles, et l'exportateur glTF lit Round comme un seuil
def detoure(m):
    nt = m.node_tree
    for n_ in [n_ for n_ in nt.nodes if n_.type == 'MATH']:
        nt.nodes.remove(n_)
    seuil = nt.nodes.new('ShaderNodeMath')
    seuil.operation = 'ROUND'
    nt.links.new(next(n_ for n_ in nt.nodes if n_.type == 'TEX_IMAGE').outputs['Alpha'], seuil.inputs[0])
    nt.links.new(seuil.outputs[0], next(n_ for n_ in nt.nodes if n_.type == 'BSDF_PRINCIPLED').inputs['Alpha'])
    m.use_backface_culling = False

detoure(M['palme'])
detoure(M['horizon'])

# icosaèdres pour les masses végétales
def ico(sub):
    t = (1 + 5 ** .5) / 2
    V = [Vector(v).normalized() for v in ((-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1))]
    F = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
         (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    for _ in range(sub):
        F2 = []
        for a, b, c in F:
            ab, bc, ca = (V[a] + V[b]).normalized(), (V[b] + V[c]).normalized(), (V[c] + V[a]).normalized()
            i = len(V)
            V += [ab, bc, ca]
            F2 += [(a, i, i + 2), (i, b, i + 1), (i + 2, i + 1, c), (i, i + 1, i + 2)]
        F = F2
    return V, F

ICO0, ICO1 = ico(0), ico(1)

def masse(mb, c, r, mat, base=ICO1, amp=.28, f=.13):
    V, F = base
    P = []
    for v in V:
        q = Vector((v.x * r[0], v.y * r[1], v.z * r[2]))
        k = 1 + amp * noise.noise(Vector(c) * .07 + v * 1.7) + amp * .5 * noise.noise(Vector(c) * .07 + v * 3.8)
        P.append(tuple(Vector(c) + q * k))
    uv = lambda q: ((q[0] + .6 * q[1]) / 4, (q[2] + .4 * q[1]) / 4)
    for a, b, d in F:
        mb.poly([P[a], P[b], P[d]], mat, uvs=[uv(P[a]), uv(P[b]), uv(P[d])])

def fut(mb, p0, p1, r0, r1, mat, n=6):
    p0, p1 = Vector(p0), Vector(p1)
    ax = (p1 - p0).normalized()
    u = ax.orthogonal().normalized()
    v = ax.cross(u)
    for i in range(n):
        a, b = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        ca, cb = u * math.cos(a) + v * math.sin(a), u * math.cos(b) + v * math.sin(b)
        mb.poly([tuple(p0 + ca * r0), tuple(p0 + cb * r0), tuple(p1 + cb * r1), tuple(p1 + ca * r1)], mat, uvs=[(0, 0)] * 4)

def fronde(mb, base, az, elev, L, chute, segs):
    # carte en V le long d'une nervure qui retombe
    hz = Vector((math.cos(az), math.sin(az), 0))
    lat = Vector((-hz.y, hz.x, 0))
    haut = Vector((0, 0, 1))
    W = L * .38
    rangs = []
    P = Vector(base)
    for i in range(segs + 1):
        q = elev - chute * (i / segs) ** 1.25
        d = hz * math.cos(q) + haut * math.sin(q)
        n = haut * math.cos(q) - hz * math.sin(q)
        rangs.append((P - n * W * .15 + lat * W / 2, P.copy(), P - n * W * .15 - lat * W / 2))
        P = P + d * (L / segs)
    for i in range(segs):
        u0, u1 = i / segs, (i + 1) / segs
        a, b = rangs[i], rangs[i + 1]
        mb.poly([tuple(a[0]), tuple(a[1]), tuple(b[1]), tuple(b[0])], 'palme', uvs=[(u0, 1), (u0, .5), (u1, .5), (u1, 1)])
        mb.poly([tuple(a[1]), tuple(a[2]), tuple(b[2]), tuple(b[1])], 'palme', uvs=[(u0, .5), (u0, 0), (u1, 0), (u1, .5)])

def palmier(mb, x, y, h, proche=False):
    # cocotier : tronc élancé, légèrement penché, évasé au pied
    cap = R.uniform(0, 2 * math.pi)
    pen = h * R.uniform(.04, .1)
    cotes, nz = (6, 5) if proche else (5, 4)
    anneaux = []
    for i in range(nz + 1):
        t = i / nz
        c = Vector((x + math.cos(cap) * pen * t ** 1.8, y + math.sin(cap) * pen * t ** 1.8, h * t))
        anneaux.append((c, .16 + .05 * (1 - t) + .22 * (1 - t) ** 7, h * t / 1.5))
    for i in range(nz):
        (c0, r0, v0), (c1, r1, v1) = anneaux[i], anneaux[i + 1]
        for k in range(cotes):
            a, b = 2 * math.pi * k / cotes, 2 * math.pi * (k + 1) / cotes
            pa = lambda c, r, t: tuple(c + Vector((math.cos(t) * r, math.sin(t) * r, 0)))
            mb.poly([pa(c0, r0, a), pa(c0, r0, b), pa(c1, r1, b), pa(c1, r1, a)], 'tronc_palme',
                    uvs=[(k / cotes, v0), ((k + 1) / cotes, v0), ((k + 1) / cotes, v1), (k / cotes, v1)])
    tete = anneaux[-1][0]
    ech = max(.9, min(1.2, h / 14))
    nb, segs = (16, 4) if proche else (11, 3)
    for k in range(nb):
        t = k / (nb - 1)
        az = k * 2.39996 + R.uniform(-.14, .14)
        elev = math.radians(74 - 88 * t + R.uniform(-5, 5))
        chute = math.radians(52 + 34 * t)
        L = ech * (3.5 + 1.7 * t) * R.uniform(.9, 1.05)
        o = Vector((math.cos(az), math.sin(az), 0)) * .14
        fronde(mb, tete + o - Vector((0, 0, .3 * t)), az, elev, L, chute, segs)
    if proche:
        for k in range(4):
            a = cap + k * math.pi / 2 + R.uniform(-.3, .3)
            masse(mb, (tete.x + math.cos(a) * .26, tete.y + math.sin(a) * .26, h - .42), (.17, .17, .19), 'tronc', ICO0, .1)

def lisser(o):
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.0005)
    bm.to_mesh(o.data)
    bm.free()
    o.data.polygons.foreach_set('use_smooth', [True] * len(o.data.polygons))
    o.data.update()

arb = MB('Arbres')
# bosquets aux emplacements des anciens arbres, loin des vues de présentation
for (x, y, h) in ((34, 56, 22), (52, 42, 20), (20, 68, 23), (60, 24, 21), (64, 6, 19), (44, 72, 22), (16, -36, 16), (30, -48, 15)):
    for k, f in enumerate((1, .84, .7)):
        a = 2 * math.pi * k / 3 + R.uniform(-.5, .5)
        d = 0 if k == 0 else R.uniform(4.5, 7)
        palmier(arb, x + math.cos(a) * d, y + math.sin(a) * d, h * f)
for (x, y, h) in ((-6, -8, 9.5), (-11, -12, 10.5), (43, -9, 10)):
    palmier(arb, x, y, h, proche=True)
for (x, y, h) in ((-13, -7, 3.2), (39, 13, 3.6)):
    palmier(arb, x, y, h, proche=True)
lisser(arb.creer())

# horizon : deux bandes de silhouettes, sans ombre portée
loin = MB('Arbres_lointains')
for rayon, haut, rep, dec in ((250, 45, 9, 0), (335, 62, 9, .37)):
    n_ = 28
    for i in range(n_):
        a0, a1 = 2 * math.pi * i / n_, 2 * math.pi * (i + 1) / n_
        u0, u1 = rep * i / n_ + dec, rep * (i + 1) / n_ + dec
        p0, p1 = (8 + rayon * math.cos(a0), 14 + rayon * math.sin(a0)), (8 + rayon * math.cos(a1), 14 + rayon * math.sin(a1))
        loin.poly([(*p0, -.1), (*p1, -.1), (*p1, haut), (*p0, haut)], 'horizon', uvs=[(u0, .02), (u1, .02), (u1, .96), (u0, .96)])
lisser(loin.creer())

# ---------------- rue, trottoir et sol lointain
rue = MB('Rue')
rue.poly([(-700, -700, -.06), (700, -700, -.06), (700, 700, -.06), (-700, 700, -.06)], 'pelouse', uvs=[(-17, -17), (17, -17), (17, 17), (-17, 17)])
rue.box(-58, -44, -320, 320, -.02, 0, 'asphalte', faces='Z')
rue.box(-44, -39, -320, 320, -.02, .04, 'trottoir', faces='Z')
rue.box(-66, -58, -320, 320, -.02, .04, 'trottoir', faces='Z')
y = -318
while y < 318:
    rue.box(-51.1, -50.9, y, y + 3, 0, .005, 'marquage', faces='Z')
    y += 8
rue.creer()

# ---------------- mobilier
mob = MB('Mobilier')
mob.box(-37.3, -36.3, SY0 + 1, 7, 0, 1.05, 'haie', faces='xXyYZ')
mob.box(-37.3, -36.3, 13, SY1 - 1, 0, 1.05, 'haie', faces='xXyYZ')
for (x, y) in ((-5, 3), (-5, 12), (-5, 21), (-15, -6), (-15, 30), (-27, -6), (-27, 30), (-6, 40)):
    fut(mob, (x, y, 0), (x, y, 7.2), .08, .05, 'lampadaire', 6)
    for sens in (-1, 1):
        fut(mob, (x, y, 7.1), (x, y + sens * .9, 7.5), .03, .03, 'lampadaire', 4)
        mob.box(x - .14, x + .14, y + sens * .9 - .28, y + sens * .9 + .28, 7.42, 7.52, 'blanc')

def plante(x, y, z=0):
    mob.cyl(x, y, z, z + .55, .26, .36, 'pot', 7)
    masse(mob, (x, y, z + 1.0), (.5, .5, .62), 'haie', ICO0, .25)

for y in (2.5, 7.5, 12.5, 17.5):
    plante(-.2, y, .34)
for (x, y) in ((-12, 3), (-12, 19), (-24, 11), (3, 2.0), (3, 19.5)):
    plante(x, y)

# drapeau ivoirien, mât sur le parvis
fut(mob, (-8, -3.6, 0), (-8, -3.6, 10.5), .07, .045, 'lampadaire', 6)
for k, (couleur, a, b) in enumerate((('orange', 0, 1.0), ('blanc', 1.0, 2.0), ('vert', 2.0, 3.0))):
    pts = []
    for t in (a, b):
        pts.append((-8 - t, -3.6 + .16 * math.sin(t * 2.1), 8.5))
    pts = [pts[0], pts[1], (pts[1][0], pts[1][1], 10.4), (pts[0][0], pts[0][1], 10.4)]
    mob.poly(pts, couleur, uvs=[(0, 0)] * 4)

def voiture(x, y, ang, coul):
    ca, sa = math.cos(ang), math.sin(ang)
    T = lambda p: (x + p[0] * ca - p[1] * sa, y + p[0] * sa + p[1] * ca, p[2])
    def bx(x0, x1, y0, y1, z0, z1, mat, x0h=None, x1h=None, y_in=0):
        x0h = x0 if x0h is None else x0h
        x1h = x1 if x1h is None else x1h
        b = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)]
        h = [(x0h, y0 + y_in, z1), (x1h, y0 + y_in, z1), (x1h, y1 - y_in, z1), (x0h, y1 - y_in, z1)]
        for i in range(4):
            j = (i + 1) % 4
            mob.poly([T(b[i]), T(b[j]), T(h[j]), T(h[i])], mat, uvs=[(0, 0)] * 4)
        mob.poly([T(h[0]), T(h[1]), T(h[2]), T(h[3])], mat, uvs=[(0, 0)] * 4)
    bx(-2.2, 2.2, -.88, .88, .28, .84, coul, -2.15, 2.15)
    bx(-1.3, 1.0, -.82, .82, .84, 1.38, 'vitre_auto', -.9, .55, .1)
    bx(-.95, .6, -.72, .72, 1.38, 1.42, coul)
    for (a, b) in ((-1.4, -.92), (-1.4, .92), (1.4, -.92), (1.4, .92)):
        mob.box(T((a, b, 0))[0] - .3, T((a, b, 0))[0] + .3, T((a, b, 0))[1] - .3, T((a, b, 0))[1] + .3, 0, .56, 'interieur', faces='xXyY')

for (x, y, a, c) in ((1.0, 25.5, 0, 'voiture_bl'), (1.0, 28.6, 0, 'voiture_no'), (1.0, 31.7, 0, 'voiture_gr'), (1.0, 37.5, 0, 'voiture_bl'),
                     (-54, 24, math.pi / 2, 'voiture_ro'), (-48, -22, math.pi / 2, 'voiture_bl'), (-54, -50, math.pi / 2, 'voiture_gr')):
    voiture(x, y, a, c)
mob.creer()

# ---------------- ombres cuites
def cuire():
    t0 = time.time()
    objs = [o for o in col.objects if o.type == 'MESH']
    V, P = [], []
    for o in objs:
        if o.name in ('Arbres_lointains', 'Rue'):
            continue
        mw = o.matrix_world
        b = len(V)
        V += [mw @ v.co for v in o.data.vertices]
        P += [[b + i for i in p.vertices] for p in o.data.polygons]
    bvh = BVHTree.FromPolygons(V, P, all_triangles=False, epsilon=0.0)
    N = 18
    dirs = []
    for i in range(N):
        u = (i + .5) / N
        r = math.sqrt(u)
        a = i * 2.39996
        dirs.append((r * math.cos(a), r * math.sin(a), math.sqrt(1 - u)))
    PORTEE = 7.0
    nb = 0
    for o in objs:
        me = o.data
        for c in list(me.color_attributes):
            me.color_attributes.remove(c)
        ca = me.color_attributes.new('Color', 'BYTE_COLOR', 'POINT')
        vals = [1.0] * len(me.vertices)
        mw = o.matrix_world
        vegetal = o.name in ('Arbres', 'Arbres_lointains')
        if vegetal:
            cols = []
            for v_ in me.vertices:
                c0 = mw @ v_.co
                t = .55 + .45 * (v_.normal.z * .5 + .5)
                k = noise.noise(c0 * .045) * .5 + .5
                cols.append((min(1, t * (.72 + .5 * k)), min(1, t * (.8 + .34 * k)), min(1, t * (.8 + .1 * k)), 1))
            for i, c in enumerate(cols):
                ca.data[i].color = c
            me.color_attributes.active_color = ca
            me.color_attributes.render_color_index = 0
            continue
        for p in me.polygons:
            n = (mw.to_3x3() @ p.normal).normalized()
            if o.name == 'Rue' or o.name.startswith(('Lettres', 'Horloge', 'Aiguille')):
                continue
            u = n.orthogonal().normalized()
            v = n.cross(u)
            cen = mw @ p.center
            for i in p.vertices:
                co = mw @ me.vertices[i].co
                org = co + (cen - co) * .03 + n * .05
                occ = 0.0
                for dx, dy, dz in dirs:
                    d = u * dx + v * dy + n * dz
                    h = bvh.ray_cast(org, d, PORTEE)
                    if h[0] is not None:
                        occ += (1 - h[3] / PORTEE) ** 1.5
                nb += N
                ao = max(.42, 1 - occ / N * 1.05)
                # salissures : coulures sur la tour, sous les climatiseurs et les fenêtres du milieu
                sale = 1.0
                if o.name in ('Tour', 'Bloc_bas', 'Facade_lames', 'Portique', 'Equipements_toit'):
                    q = co * Vector((.5, .32, .09))
                    sale = 1 - .13 * max(0, noise.noise(q) + .35)
                    if o.name == 'Tour' and 21 < co.y < 27.5 and 14 < co.z < 27 and co.x < 6:
                        f = abs(co.y - (24.2 + 1.6 * math.sin(co.z * .5))) / 3.2
                        sale *= 1 - .3 * max(0, 1 - f)
                vals[i] = ao * sale
        for i, c in enumerate(vals):
            ca.data[i].color = (c, c, c, 1)
        me.color_attributes.active_color = ca
        me.color_attributes.render_color_index = 0
    return dict(rayons=nb, secondes=round(time.time() - t0, 1))

baked = cuire()
tris = 0
stats = {}
for o in col.objects:
    if o.type == 'MESH':
        o.data.calc_loop_triangles()
        stats[o.name] = len(o.data.loop_triangles)
        tris += stats[o.name]
result = dict(triangles=tris, objets=stats, cuisson=baked)
