import trimesh, numpy as np, json
from scipy import ndimage
from skimage.graph import route_through_array
import fast_simplification as fs

D = '/home/claude/kevin-mattheus-moerman/bodyparts3d/assets/BodyParts3D_data/stl/'
C0 = np.array([21.5, -122.0, 1237.0])


def T(p):
    """BodyParts3D mm (x=left, y=posterior, z=up) -> three.js cm (x right, y up, z toward viewer)."""
    p = np.asarray(p, float) - C0
    return np.stack([p[..., 0], p[..., 2], -p[..., 1]], -1) / 10.0


def load(i):
    return trimesh.load(D + i + '.stl')


# ---------------- parts ----------------
PARTS = [
    # key, ids, target tris, group
    ('wall', ['FMA7274'], 90000, 'muscle'),
    ('tricuspid', ['FMA7234'], 9000, 'valve'),
    ('mitral', ['FMA7235'], 7000, 'valve'),
    ('pulmvalve', ['FMA7246'], 6000, 'valve'),
    ('papillary', ['FMA7260', 'FMA7261', 'FMA7262', 'FMA7266', 'FMA9352nsn'], 8000, 'papillary'),
    ('aorta', ['FMA3736', 'FMA3768', 'FMA3784'], 14000, 'artery'),
    ('headarteries', ['FMA3932nsn', 'FMA3941', 'FMA3953', 'FMA4058', 'FMA4694'], 8000, 'artery'),
    ('coronaryart', ['FMA3802', 'FMA3818', 'FMA3840nsn', 'FMA3862nsn', 'FMA3895', 'FMA4685', 'FMA71669', 'FMA71670', 'FMA76994'], 14000, 'coronary'),
    ('coronaryvein', ['FMA4706', 'FMA76751'], 4000, 'coronaryvein'),
    ('svc', ['FMA4720', 'FMA4751', 'FMA4761'], 4000, 'vein'),
    ('ivc', ['FMA10951'], 4000, 'vein'),
    ('pulmart', ['FMA66326'], 40000, 'pulmart'),
    ('pulmvein', ['FMA66643'], 32000, 'pulmvein'),
    ('lungs', ['FMA7333', 'FMA7337', 'FMA7383', 'FMA7370', 'FMA7371'], 16000, 'lung'),
    ('trachea', ['FMA7394'], 3000, 'lung'),
]

raw = {}
for key, ids, tgt, grp in PARTS:
    ms = []
    for i in ids:
        m = load(i)
        if key == 'wall':
            bodies = m.split(only_watertight=False)
            bodies = [b for b in bodies if len(b.faces) > 1500]
            m = trimesh.util.concatenate(bodies)
        ms.append(m)
    raw[key] = trimesh.util.concatenate(ms)

scene = trimesh.Scene()
stats = {}
for key, ids, tgt, grp in PARTS:
    m = raw[key].copy()
    m.merge_vertices()
    if len(m.faces) > tgt:
        v, f = fs.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32), target_reduction=1 - tgt / len(m.faces))
        m = trimesh.Trimesh(v, f, process=True)
        b0, b1 = raw[key].bounds
        ok = ((m.vertices >= b0 - 1) & (m.vertices <= b1 + 1)).all(1)
        m.update_faces(ok[m.faces].all(1))
        m.remove_unreferenced_vertices()
    m.update_faces(m.nondegenerate_faces()); m.remove_unreferenced_vertices()
    v0 = m.vertices.copy()
    trimesh.smoothing.filter_taubin(m, lamb=0.5, nu=-0.53, iterations=6 if key in ('wall', 'lungs') else 3)
    vv = m.vertices.copy(); bad = np.linalg.norm(vv - v0, axis=1) > 6; vv[bad] = v0[bad]; m.vertices = vv
    print(key, 'reverted', int(bad.sum()))
    m.vertices = T(m.vertices)
    m.fix_normals() if key != 'wall' else None
    stats[key] = len(m.faces)
    scene.add_geometry(m, node_name=key, geom_name=key)
scene.export('/home/claude/heart/heart.glb')
print('faces', stats, sum(stats.values()))

# ---------------- chambers ----------------
lo = np.array([-40, -180, 1180.]); hi = np.array([82, -64, 1300.]); p = 1.0
shape = np.ceil((hi - lo) / p).astype(int) + 1
occ = np.zeros(shape, bool)
for key in ['wall', 'tricuspid', 'mitral', 'pulmvalve', 'aorta', 'svc', 'ivc', 'coronaryvein']:
    m = raw[key]
    pts, _ = trimesh.sample.sample_surface(m, int(m.area / 0.12))
    pts = pts[(pts >= lo).all(1) & (pts <= hi).all(1)]
    ix = np.floor((pts - lo) / p).astype(int)
    occ[ix[:, 0], ix[:, 1], ix[:, 2]] = True
occ = ndimage.binary_dilation(occ, iterations=1)
lab, n = ndimage.label(~occ)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
outside = lab[0, 0, 0]
cands = [k + 1 for k in np.argsort(-sizes) if k + 1 != outside][:2]


def centroid_normal(m):
    v = m.vertices - m.vertices.mean(0)
    _, _, vt = np.linalg.svd(v, full_matrices=False)
    return m.vertices.mean(0), vt[2]


svc_low = raw['svc'].vertices[raw['svc'].vertices[:, 2].argmin()]
chambers = {}
cav_masks = {}
for L in cands:
    idx = np.argwhere(lab == L)
    pts = lo + idx * p
    side = 'right' if pts[:, 0].mean() < 20 else 'left'
    valve = raw['tricuspid'] if side == 'right' else raw['mitral']
    c, nrm = centroid_normal(valve)
    s = (pts - c) @ nrm
    # atrium = side further from apex (apex is low z, front/left). use atria up/back: compare mean z
    a_mask = s > 0
    if pts[a_mask, 2].mean() < pts[~a_mask, 2].mean():
        a_mask = ~a_mask
    names = ('RA', 'RV') if side == 'right' else ('LA', 'LV')
    for nm, mk in zip(names, [a_mask, ~a_mask]):
        sub = np.zeros(shape, bool)
        sub[tuple(idx[mk].T)] = True
        dt = ndimage.distance_transform_edt(sub)
        deep = np.unravel_index(dt.argmax(), shape)
        cav_masks[nm] = sub
        chambers[nm] = dict(deep=(lo + np.array(deep) * p).tolist(), center=pts[mk].mean(0).tolist(),
                            ml=float(mk.sum() * p ** 3 / 1000), radius=float(dt.max()))
    chambers[side + '_valve'] = dict(center=c.tolist(), normal=nrm.tolist())
print({k: (round(v.get('ml', 0), 1)) for k, v in chambers.items()})

pv_c, pv_n = centroid_normal(raw['pulmvalve'])
asc = raw['aorta'].vertices
# aortic root: lowest part of ascending aorta (FMA3736)
asc_m = load('FMA3736')
root = asc_m.vertices[asc_m.vertices[:, 2] < asc_m.vertices[:, 2].min() + 4].mean(0)


# ---------------- vessel centerlines ----------------
def vessel_path(mesh, start, end, pitch=1.0, pad=3):
    vlo = mesh.bounds[0] - pad; vhi = mesh.bounds[1] + pad
    shp = np.ceil((vhi - vlo) / pitch).astype(int) + 1
    vox = mesh.voxelized(pitch).fill()
    inside = np.zeros(shp, bool)
    pts = vox.points
    ix = np.round((pts - vlo) / pitch).astype(int)
    ix = ix[(ix >= 0).all(1) & (ix < shp).all(1)]
    inside[ix[:, 0], ix[:, 1], ix[:, 2]] = True
    dt = ndimage.distance_transform_edt(inside)
    cost = np.where(inside, 1.0 / (dt + 0.3) ** 2, 1e4)

    def snap(q):
        q = np.round((np.asarray(q) - vlo) / pitch).astype(int)
        q = np.clip(q, 0, shp - 1)
        ins = np.argwhere(inside)
        return tuple(ins[np.argmin(((ins - q) ** 2).sum(1))])
    route, _ = route_through_array(cost, snap(start), snap(end), fully_connected=True, geometric=True)
    route = vlo + np.array(route) * pitch
    return route, (inside, dt, vlo, pitch)


def resample(path, step=2.0):
    path = np.asarray(path, float)
    # smooth
    k = 5
    if len(path) > 2 * k:
        sm = np.copy(path)
        for i in range(len(path)):
            a, b = max(0, i - k), min(len(path), i + k + 1)
            sm[i] = path[a:b].mean(0)
        sm[0], sm[-1] = path[0], path[-1]
        path = sm
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))]
    n = max(2, int(d[-1] / step))
    t = np.linspace(0, d[-1], n)
    return np.stack([np.interp(t, d, path[:, j]) for j in range(3)], 1)


paths = {}
pa = raw['pulmart']; pvn = raw['pulmvein']
pa_start = pv_c + pv_n * 0  # pulmonary valve center
# lung targets: far periphery of PA tree
V = pa.vertices
targets = {
    'RU': V[np.argmin(V[:, 0] * 1.0 - V[:, 2] * 0.6)],
    'RL': V[np.argmin(V[:, 0] * 1.0 + V[:, 2] * 0.6)],
    'LU': V[np.argmax(V[:, 0] * 1.0 + V[:, 2] * 0.6)],
    'LL': V[np.argmax(V[:, 0] * 1.0 - V[:, 2] * 0.6)],
}
# pull targets slightly inward so they lie in decent vessels
for k in targets:
    targets[k] = targets[k] + (np.array([21.5, -110, 1240]) - targets[k]) * 0.18
la_deep = np.array(chambers['LA']['deep'])
for k, tg in targets.items():
    r, _ = vessel_path(pa, pa_start, tg)
    paths['pa_' + k] = r
    # vein: from nearby lung point to LA
    W = pvn.vertices
    vstart = W[np.argmin(((W - tg) ** 2).sum(1))]
    # LA entry: vein vertex closest to LA deep point
    vend = W[np.argmin(((W - la_deep) ** 2).sum(1))]
    r2, _ = vessel_path(pvn, vstart, vend)
    paths['pv_' + k] = r2
    print(k, len(r), len(r2))

ao = trimesh.util.concatenate([load('FMA3736'), load('FMA3768'), load('FMA3784')])
ao_bottom = ao.vertices[ao.vertices[:, 2].argmin()]
paths['aorta'], _ = vessel_path(ao, root, ao_bottom)
ivc = raw['ivc']
ivc_bot = ivc.vertices[ivc.vertices[:, 2].argmin()]; ivc_top = ivc.vertices[ivc.vertices[:, 2].argmax()]
paths['ivc'], _ = vessel_path(ivc, ivc_bot, ivc_top)
svc = load('FMA4720')
svc_top = svc.vertices[svc.vertices[:, 2].argmax()]; svc_bot = svc.vertices[svc.vertices[:, 2].argmin()]
paths['svc'], _ = vessel_path(svc, svc_top, svc_bot)

# intra-heart path through chambers (straight waypoints, smoothed later in JS)
RA, RV, LA, LV = [np.array(chambers[k]['deep']) for k in ('RA', 'RV', 'LA', 'LV')]
tri_c = np.array(chambers['right_valve']['center']); mit_c = np.array(chambers['left_valve']['center'])

out = dict(
    chambers={k: dict(deep=T(v['deep']).tolist(), center=T(v['center']).tolist(), radius=v['radius'] / 10, ml=v['ml'])
              for k, v in chambers.items() if 'ml' in v},
    valves=dict(tricuspid=T(tri_c).tolist(), mitral=T(mit_c).tolist(), pulmonary=T(pv_c).tolist(), aortic=T(root).tolist()),
    paths={k: T(resample(v)).round(3).tolist() for k, v in paths.items()},
)
json.dump(out, open('/home/claude/heart/heartdata.json', 'w'))
print('chambers', {k: v['deep'] for k, v in out['chambers'].items()})
print('valves', out['valves'])
