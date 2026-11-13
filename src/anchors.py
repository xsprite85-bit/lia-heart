import trimesh, numpy as np, json
D='/home/claude/kevin-mattheus-moerman/bodyparts3d/assets/BodyParts3D_data/stl/'
C0=np.array([21.5,-122.0,1237.0])
def T(p):
    p=np.asarray(p,float)-C0; return np.stack([p[...,0],p[...,2],-p[...,1]],-1)/10.0
L=lambda i: trimesh.load(D+i+'.stl')
rvpap=np.vstack([L(i).vertices for i in ['FMA7260','FMA7261','FMA7262']]).mean(0)
lvpap=np.vstack([L(i).vertices for i in ['FMA7266','FMA9352nsn']]).mean(0)
tri=L('FMA7234'); mit=L('FMA7235')
# valve annulus: top ring of leaflets = vertices near the atrial side. use the 30% of verts farthest from papillary
def annulus(v,pap):
    d=np.linalg.norm(v.vertices-pap,axis=1); return v.vertices[d>np.percentile(d,80)].mean(0)
tri_a=annulus(tri,rvpap); mit_a=annulus(mit,lvpap)
svc=L('FMA4720'); ivc=L('FMA10951')
svc_b=svc.vertices[svc.vertices[:,2]<svc.vertices[:,2].min()+3].mean(0)
ivc_t=ivc.vertices[ivc.vertices[:,2]>ivc.vertices[:,2].max()-3].mean(0)
d=json.load(open('heartdata.json'))
pv_ends=np.array([d['paths'][k][-1] for k in d['paths'] if k.startswith('pv_')])
RA=(T(svc_b)+T(ivc_t))/2*0.5+T(tri_a)*0.5
RV=T(rvpap)*0.6+T(tri_a)*0.2+np.array(d['valves']['pulmonary'])*0.2
LV=T(lvpap)*0.65+T(mit_a)*0.35
LA=pv_ends.mean(0)*0.55+T(mit_a)*0.45
A=dict(RA=RA,RV=RV,LA=LA,LV=LV,tri=T(tri_a),mit=T(mit_a),svc_b=T(svc_b),ivc_t=T(ivc_t),rvpap=T(rvpap),lvpap=T(lvpap))
for k,v in A.items(): print(k, np.round(v,2))
d['anchors']={k:np.round(v,3).tolist() for k,v in A.items()}
json.dump(d,open('heartdata.json','w'))
