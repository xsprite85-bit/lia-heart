// Zoomed-in alveolus scene: bronchiole -> grape-like sacs, capillary wrapping, RBCs, O2 / CO2 / air particles.
function buildAlveoli(THREE, rbcGeometry) {
  const group = new THREE.Group();
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- sacs ----------
  const sacMat = new THREE.MeshPhysicalMaterial({
    color: 0xff7f9f, roughness: 0.4, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false,
    sheen: 0.55, sheenColor: new THREE.Color(0xffc4d4), sheenRoughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.2,
    emissive: 0x2a0410,
  });
  const sacDefs = [
    [0, 0.15, 0, 1.3],
    [1.75, 0.45, 0.45, 1.1], [-1.7, 0.35, 0.55, 1.12], [0.25, -1.55, 0.6, 1.08],
    [0.9, 0.2, -1.6, 1.05], [-1.0, -0.6, -1.4, 1.05], [-0.4, 0.4, 1.75, 1.0], [1.3, -1.2, -0.3, 0.98],
  ];
  const sacGeo = new THREE.SphereGeometry(1, 24, 16);
  const sacs = sacDefs.map(([x, y, z, r]) => {
    const m = new THREE.Mesh(sacGeo, sacMat); m.position.set(x, y, z); m.scale.setScalar(r);
    m.userData.r = r; m.userData.base = new THREE.Vector3(x, y, z); m.renderOrder = 1; group.add(m); return m;
  });
  // small ducts from the bronchiole end to each outer sac
  const ductMat = new THREE.MeshPhysicalMaterial({ color: 0xffb3c6, roughness: 0.4, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, sheen: 0.8, sheenColor: new THREE.Color(0xffffff) });
  const hub = new THREE.Vector3(0, 1.45, 0);

  // ---------- bronchiole ----------
  const bronCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3, 5.4, -0.2), new THREE.Vector3(0.1, 3.8, 0), new THREE.Vector3(0, 2.4, 0), hub.clone()]);
  const bron = new THREE.Mesh(new THREE.TubeGeometry(bronCurve, 48, 0.55, 20, false), ductMat);
  bron.renderOrder = 1; group.add(bron);
  // rings on the bronchiole (cartilage hint)
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xfff0f3, roughness: 0.6, transparent: true, opacity: 0.6, depthWrite: false });
  for (let i = 1; i < 6; i++) {
    const t = i / 7, p = bronCurve.getPointAt(t), tg = bronCurve.getTangentAt(t);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 6, 28), ringMat);
    ring.position.copy(p); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg); group.add(ring);
  }
  const ducts = [];
  for (const s of sacs.slice(1)) {
    const end = s.userData.base.clone().multiplyScalar(0.55);
    const c = new THREE.CatmullRomCurve3([hub.clone(), hub.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.2, 0)), end]);
    const d = new THREE.Mesh(new THREE.TubeGeometry(c, 10, 0.26, 10, false), ductMat); d.renderOrder = 1; group.add(d); ducts.push(d);
  }

  // ---------- capillary ----------
  const capPts = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = t * Math.PI * 3.6 + 0.3;
    const y = 2.1 - 4.5 * t;
    const R = 2.85 + 0.3 * Math.sin(a * 2.5) - 0.35 * Math.abs(y) / 2.5;
    capPts.push(new THREE.Vector3(Math.cos(a) * R, y + 0.25 * Math.sin(a * 3), Math.sin(a) * R));
  }
  // lead-in and lead-out so the vessel visibly comes from / goes off-scene
  capPts.unshift(capPts[0].clone().add(new THREE.Vector3(1.8, 1.4, 0.4)));
  capPts.push(capPts[capPts.length - 1].clone().add(new THREE.Vector3(-1.2, -1.6, 1.2)));
  const capCurve = new THREE.CatmullRomCurve3(capPts, false, 'centripetal');
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0xc23a5c, roughness: 0.35, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false, clearcoat: 0.8, sheen: 0.6, sheenColor: new THREE.Color(0xff9ab0) });
  const capRadius = 0.36;
  const capMesh = new THREE.Mesh(new THREE.TubeGeometry(capCurve, 240, capRadius, 10, false), capMat);
  capMesh.renderOrder = 2; group.add(capMesh);
  const capSamples = capCurve.getSpacedPoints(600);
  const capTan = capSamples.map((p, i) => capSamples[Math.min(i + 1, 600)].clone().sub(capSamples[Math.max(i - 1, 0)]).normalize());
  const capAt = (u, out) => { const f = THREE.MathUtils.clamp(u, 0, 1) * 600; const i = Math.floor(f); const j = Math.min(i + 1, 600); return out.copy(capSamples[i]).lerp(capSamples[j], f - i); };
  const EX0 = 0.36, EX1 = 0.62; // exchange section

  // ---------- red blood cells ----------
  const NC = 18;
  const BLUE = new THREE.Color(0x3d63dd), RED = new THREE.Color(0xe8262d), tmpC = new THREE.Color();
  const cells = new THREE.InstancedMesh(rbcGeometry(0.24), new THREE.MeshStandardMaterial({ roughness: 0.35, emissive: 0x220000 }), NC);
  cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage); cells.renderOrder = 0; group.add(cells);
  const cellS = [];
  for (let i = 0; i < NC; i++) { cellS.push({ u: i / NC, spin: rnd(0, 6), sp: rnd(0.9, 1.1) }); cells.setColorAt(i, BLUE); }

  // ---------- sprite textures ----------
  function labelTex(fill, ring, text, textColor) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const grd = g.createRadialGradient(54, 50, 8, 64, 64, 60); grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.35, fill); grd.addColorStop(1, ring);
    g.fillStyle = grd; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
    g.fillStyle = textColor; g.font = 'bold 50px Rubik, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 64, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const o2Tex = labelTex('#5ee7ff', '#0a8fc2', 'O₂', '#063a52');
  const co2Tex = labelTex('#d7dbe2', '#7c8594', 'CO₂', '#2b2f36');

  // ---------- O2 particles: sac air -> capillary exchange section ----------
  const o2 = [];
  const NO2 = 20;
  for (let i = 0; i < NO2; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: o2Tex, transparent: true, depthWrite: false, opacity: 0 }));
    sp.scale.setScalar(0.5); sp.renderOrder = 5; group.add(sp);
    const p = { sp, k: Math.random(), dur: rnd(2.4, 3.4), a: new THREE.Vector3(), b: new THREE.Vector3(), mid: new THREE.Vector3(), delay: rnd(0, 2) };
    spawnO2(p); p.k = Math.random(); o2.push(p);
  }
  function spawnO2(p) {
    const s = sacs[Math.floor(rnd(0, sacs.length))];
    const dir = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize();
    p.sac = s; p.local = s.userData.base.clone().addScaledVector(dir, s.userData.r * rnd(0.1, 0.55));
    p.u = rnd(EX0, EX1); p.k = 0; p.dur = rnd(2.4, 3.4); p.delay = rnd(0, 1.2);
  }

  // ---------- CO2 particles: capillary early section -> sac -> up and out the bronchiole ----------
  const co2 = [];
  const NCO2 = 12;
  for (let i = 0; i < NCO2; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: co2Tex, transparent: true, depthWrite: false, opacity: 0 }));
    sp.scale.setScalar(0.48); sp.renderOrder = 5; group.add(sp);
    const p = { sp }; spawnCO2(p); p.k = Math.random(); co2.push(p);
  }
  function spawnCO2(p) {
    p.u = rnd(0.18, EX0 + 0.05); p.sac = sacs[Math.floor(rnd(1, sacs.length))]; p.k = 0; p.dur = rnd(4.5, 6); p.delay = rnd(0, 2);
    p.off = new THREE.Vector3(rnd(-0.25, 0.25), 0, rnd(-0.25, 0.25));
  }
  const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
  const sacWorld = (s, local, out) => { // local point inside sac (base coords) -> current coords with sac scaling around its center
    const sc = s.scale.x / s.userData.r; return out.copy(local).sub(s.userData.base).multiplyScalar(sc).add(s.position);
  };

  // ---------- air dots in the bronchiole ----------
  const NAIR = 46;
  const airGeo = new THREE.BufferGeometry(); const airPos = new Float32Array(NAIR * 3); airGeo.setAttribute('position', new THREE.BufferAttribute(airPos, 3));
  const airMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.13, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true });
  const air = new THREE.Points(airGeo, airMat); air.renderOrder = 6; group.add(air);
  const airS = [];
  for (let i = 0; i < NAIR; i++) airS.push({ t: Math.random(), a: rnd(0, Math.PI * 2), r: rnd(0, 0.38) });

  // soft inner glow
  const glow = new THREE.PointLight(0xffc2d4, 6, 7, 1.6); glow.position.set(0, 0.2, 0.4); group.add(glow);

  let prevBreath = null, time = 0;
  function update(dt, breath, timeScale = 1) {
    const ts = timeScale; time += dt * ts;
    const dB = prevBreath === null ? 0 : (breath - prevBreath) / Math.max(dt, 1e-4); prevBreath = breath;
    // sacs breathe
    const g = 1 + 0.18 * breath;
    for (const s of sacs) { s.scale.setScalar(s.userData.r * g); s.position.copy(s.userData.base).multiplyScalar(1 + 0.12 * breath); }
    for (const d of ducts) d.scale.setScalar(1 + 0.08 * breath);
    const cg = 1 + 0.12 * breath; capMesh.scale.setScalar(cg);

    // cells
    for (let i = 0; i < NC; i++) {
      const c = cellS[i]; c.u += dt * ts * 0.055 * c.sp; if (c.u > 1) c.u -= 1; c.spin += dt * ts * 1.5;
      const f = Math.min(Math.floor(c.u * 600), 600);
      capAt(c.u, _v).multiplyScalar(cg);
      _q.setFromUnitVectors(Y, capTan[f]); _w.set(Math.cos(c.spin), 0, Math.sin(c.spin));
      const tumble = new THREE.Quaternion().setFromAxisAngle(_w, 1.2); _q.multiply(tumble);
      const fade = Math.min(1, c.u * 25, (1 - c.u) * 25);
      _s.setScalar(Math.max(0.001, fade));
      _m.compose(_v, _q, _s); cells.setMatrixAt(i, _m);
      const k = THREE.MathUtils.smoothstep(c.u, EX0, EX1);
      cells.setColorAt(i, tmpC.copy(BLUE).lerp(RED, k));
    }
    cells.instanceMatrix.needsUpdate = true; cells.instanceColor.needsUpdate = true;

    // O2: sac -> capillary
    for (const p of o2) {
      if (p.delay > 0) { p.delay -= dt * ts; p.sp.material.opacity = 0; continue; }
      p.k += dt * ts / p.dur;
      if (p.k >= 1) { spawnO2(p); continue; }
      const a = sacWorld(p.sac, p.local, _v);
      const b = capAt(p.u, _w).multiplyScalar(cg);
      const e = p.k * p.k * (3 - 2 * p.k);
      p.sp.position.copy(a).lerp(b, e);
      p.sp.position.y += Math.sin(p.k * Math.PI) * 0.35 + Math.sin(time * 3 + p.u * 40) * 0.05;
      p.sp.material.opacity = Math.min(1, p.k / 0.15, (1 - p.k) / 0.2);
      p.sp.scale.setScalar(0.5 * (1 - 0.35 * Math.max(0, (p.k - 0.75) / 0.25)));
    }
    // CO2: capillary -> sac -> bronchiole out
    for (const p of co2) {
      if (p.delay > 0) { p.delay -= dt * ts; p.sp.material.opacity = 0; continue; }
      p.k += dt * ts / p.dur;
      if (p.k >= 1) { spawnCO2(p); continue; }
      const a = capAt(p.u, _v).multiplyScalar(cg);
      const sc = p.sac.position;
      let pos;
      if (p.k < 0.4) { const e = p.k / 0.4; pos = a.clone().lerp(sc, e * e * (3 - 2 * e)); }
      else if (p.k < 0.6) { const e = (p.k - 0.4) / 0.2; pos = sc.clone().lerp(hub, e * e * (3 - 2 * e)); }
      else { const e = (p.k - 0.6) / 0.4; pos = bronCurve.getPointAt(1 - e).add(p.off); }
      p.sp.position.copy(pos);
      p.sp.material.opacity = Math.min(0.95, p.k / 0.1, (1 - p.k) / 0.15);
    }
    // air: down on inhale, up on exhale
    const v = THREE.MathUtils.clamp(dB, -2, 2) * 0.35; // fraction of bronchiole per second
    for (let i = 0; i < NAIR; i++) {
      const a = airS[i];
      a.t += (v + 0.02 * Math.sin(time + i)) * dt * ts * 1.0 * (1 / 1); // t: 0 top -> 1 bottom
      if (a.t > 1) a.t -= 1; if (a.t < 0) a.t += 1;
      const p = bronCurve.getPointAt(a.t);
      airPos[i * 3] = p.x + Math.cos(a.a) * a.r; airPos[i * 3 + 1] = p.y; airPos[i * 3 + 2] = p.z + Math.sin(a.a) * a.r;
    }
    airGeo.attributes.position.needsUpdate = true;
    airMat.opacity = 0.35 + 0.55 * Math.min(1, Math.abs(dB) * 1.5);
    glow.intensity = 5 + 3 * breath;
  }
  update(0.016, 0, 1);

  return { group, update, camPos: new THREE.Vector3(1.2, 2.2, 14.5), target: new THREE.Vector3(0, 0.6, 0) };
}
