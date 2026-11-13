// Stylized, friendly closed fist (✊, palm side toward +Z, wrist down -Y).
// Plain JS: call buildFist(THREE) -> THREE.Group. Units ≈ cm (≈9 wide, 10 tall, 7 deep).
function buildFist(THREE) {
  const group = new THREE.Group();
  group.name = 'fist';

  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xf2b48f, roughness: 0.55, metalness: 0,
    sheen: 0.6, sheenColor: new THREE.Color(0xffd2c2), sheenRoughness: 0.6,
    clearcoat: 0.15, clearcoatRoughness: 0.6
  });
  const skinDark = skin.clone(); skinDark.color.set(0xe39f7c);
  const nailMat = new THREE.MeshPhysicalMaterial({ color: 0xffd9d0, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const sleeveMat = new THREE.MeshPhysicalMaterial({ color: 0x7b5cff, roughness: 0.7, sheen: 1, sheenColor: new THREE.Color(0xc9b8ff) });
  const cuffMat = new THREE.MeshPhysicalMaterial({ color: 0xffd43b, roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) });

  const add = (geo, mat, pos, rot, scl) => {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) m.scale.set(scl[0], scl[1], scl[2]);
    group.add(m); return m;
  };

  // superellipsoid blob (rounded box) from a sphere
  function blob(w, h, d, e) {
    const g = new THREE.SphereGeometry(1, 40, 28);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const f = x => Math.sign(x) * Math.pow(Math.abs(x), e);
      p.setXYZ(i, f(v.x) * w / 2, f(v.y) * h / 2, f(v.z) * d / 2);
    }
    g.computeVertexNormals();
    return g;
  }
  const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 20);
  const sphere = r => new THREE.SphereGeometry(r, 22, 16);

  // ---- palm / back of hand
  add(blob(7.6, 6.0, 5.2, 0.55), skin, [0.3, -0.6, 0.2]);

  // ---- four curled fingers (index at -x, pinky at +x)
  const fingers = [
    { x: -2.55, r: 1.02, top: 0.15, len: 1.45 },
    { x: -0.65, r: 1.06, top: 0.30, len: 1.55 },
    { x: 1.25, r: 1.0, top: 0.18, len: 1.4 },
    { x: 3.0, r: 0.86, top: -0.15, len: 1.1 },
  ];
  for (const f of fingers) {
    const yTop = 2.45 + f.top;
    // proximal phalanx: runs from the back knuckle forward over the top
    add(capsule(f.r, 2.6), skin, [f.x, yTop - 0.15, 0.55], [Math.PI / 2 - 0.12, 0, 0]);
    // back knuckle bump
    add(sphere(f.r * 1.08), skinDark, [f.x, yTop - 0.05, -1.05], null, [1, 0.92, 0.95]);
    // middle phalanx: faces the viewer, going down
    add(capsule(f.r * 1.02, f.len), skin, [f.x, yTop - f.len / 2 - 0.55, 2.35], [0.08, 0, 0]);
    // rounded front-top corner (middle knuckle)
    add(sphere(f.r * 1.04), skin, [f.x, yTop - 0.35, 2.15]);
    // distal tip tucked under, toward the palm
    add(capsule(f.r * 0.88, 0.9), skin, [f.x, yTop - f.len - 1.2, 1.5], [Math.PI / 2 + 0.5, 0, 0]);
  }

  // ---- thumb wrapped across the front of the fingers
  // thenar pad (fleshy thumb base) on the index side
  add(blob(3.4, 3.8, 3.4, 0.8), skin, [-3.4, -1.6, 1.4], [0, 0, 0.25]);
  // thumb proximal segment
  add(capsule(1.12, 2.0), skin, [-2.6, -0.7, 2.75], [0, 0, Math.PI / 2 - 0.35]);
  // thumb distal segment across the fingers
  const tip = add(capsule(1.05, 1.9), skin, [-0.35, -0.15, 3.25], [0, 0.12, Math.PI / 2 - 0.12]);
  // thumbnail
  add(sphere(0.62), nailMat, [0.9, -0.0, 3.95], [0, 0.35, 0], [1.25, 0.95, 0.35]);
  // little crease bump at the thumb joint
  add(sphere(1.12), skin, [-1.55, -0.5, 3.0]);

  // ---- wrist + sleeve
  add(new THREE.CylinderGeometry(2.55, 2.75, 2.0, 40, 1, true), skin, [0.35, -3.9, 0.2], null, [1, 1, 0.82]);
  // sleeve
  const sleeve = new THREE.CylinderGeometry(3.25, 3.35, 1.3, 48, 1, false);
  add(sleeve, sleeveMat, [0.35, -5.6, 0.2], null, [1, 1, 0.84]);
  // soft rolled cuff
  add(new THREE.TorusGeometry(3.15, 0.45, 14, 48), cuffMat, [0.35, -4.95, 0.2], [Math.PI / 2, 0, 0], [1, 0.84, 1]);
  // bottom rim of sleeve (finished look)
  add(new THREE.TorusGeometry(3.3, 0.22, 10, 48), sleeveMat, [0.35, -6.25, 0.2], [Math.PI / 2, 0, 0], [1, 0.84, 1]);

  // ---- center the group on its visual center
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const c = box.getCenter(new THREE.Vector3());
  for (const ch of group.children) ch.position.sub(c);
  return group;
}
