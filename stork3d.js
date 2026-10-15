/* Procedural 3D Oriental white stork (Ciconia boyciana) for three.js r128.
 * window.makeStork3D(THREE) -> { group, update(dt, flapPhase), bundle, releaseBundle(), wings, head }
 * Bird flies along +X, up = +Y, origin at body centre, torso length ~2 units, wingspan ~9.
 * window.addStorkLights(scene, THREE) adds hemisphere + key + fill lights.
 */
(function () {
  window.makeStork3D = function (THREE) {
    var DS = THREE.DoubleSide;
    function mat(c, r, extra) {
      var o = { color: c, roughness: r, metalness: 0 };
      for (var k in extra || {}) o[k] = extra[k];
      return new THREE.MeshStandardMaterial(o);
    }
    var M = {
      white: mat(0xf3f0e8, 0.85),
      white2: mat(0xe9e5dc, 0.9, { side: DS }),
      black: mat(0x1b1917, 0.75, { side: DS }),
      black2: mat(0x2f2b28, 0.7, { side: DS }),
      bill: mat(0x1f1c1a, 0.35),
      red: mat(0xc9372a, 0.55),
      eye: mat(0x0d0b0a, 0.2),
      iris: mat(0xe8e2c8, 0.4),
      cloth: mat(0xf3c4c4, 0.95, { side: DS }),
      cloth2: mat(0xf7ecd9, 0.95, { side: DS }),
      skin: mat(0xf7d6bd, 0.8),
      cheek: mat(0xf2a7a0, 0.9)
    };
    function mesh(g, m, parent) {
      var o = new THREE.Mesh(g, m);
      o.castShadow = true;
      if (parent) parent.add(o);
      return o;
    }
    // map shape coords (x = span u, y = chord v) into 3D (X = v forward, Y = thickness, Z = u outward)
    var SWAP = new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1);
    function shapeGeo(pts, depth) {
      var s = new THREE.Shape();
      s.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
      var g = depth
        ? new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false })
        : new THREE.ShapeGeometry(s);
      if (depth) g.translate(0, 0, -depth / 2);
      g.applyMatrix4(SWAP);
      g.computeVertexNormals();
      return g;
    }
    function lathe(profile, seg) {
      var pts = profile.map(function (p) { return new THREE.Vector2(p[1], p[0]); });
      var g = new THREE.LatheGeometry(pts, seg || 20);
      g.rotateZ(-Math.PI / 2); // lathe axis Y -> X
      return g;
    }

    var group = new THREE.Group();
    group.name = 'stork';
    var bob = new THREE.Group(); // body bob container
    group.add(bob);

    // ---- torso (teardrop, slightly flattened) ----
    var torso = mesh(lathe([
      [-1.05, 0.0], [-0.98, 0.12], [-0.8, 0.22], [-0.5, 0.31], [-0.15, 0.36], [0.2, 0.35],
      [0.5, 0.3], [0.72, 0.22], [0.86, 0.15], [0.95, 0.12]
    ], 24), M.white, bob);
    torso.scale.set(1, 0.88, 1);

    // ---- neck (extended forward, very slight droop) ----
    var neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.8, 0.04, 0), new THREE.Vector3(1.2, 0.0, 0),
      new THREE.Vector3(1.6, -0.03, 0), new THREE.Vector3(1.9, -0.02, 0)
    ]);
    var neckGeo = new THREE.TubeGeometry(neckCurve, 16, 0.1, 12, false);
    // taper: thicker at base
    var np = neckGeo.attributes.position, cp = new THREE.Vector3();
    for (var i = 0; i < np.count; i++) {
      var x = np.getX(i), t = Math.min(1, Math.max(0, (x - 0.8) / 1.1));
      var r = 1.45 - 0.55 * Math.sqrt(t);
      neckCurve.getPoint(t, cp);
      np.setY(i, cp.y + (np.getY(i) - cp.y) * r);
      np.setZ(i, np.getZ(i) * r);
    }
    neckGeo.computeVertexNormals();
    mesh(neckGeo, M.white, bob);

    // ---- head ----
    var head = new THREE.Group();
    head.position.set(1.98, -0.01, 0);
    bob.add(head);
    var skull = mesh(new THREE.SphereGeometry(0.15, 18, 14), M.white, head);
    skull.scale.set(1.35, 0.95, 0.85);
    // bill: long, thick, dark, slightly upturned tip
    var billGeo = lathe([[0, 0.085], [0.2, 0.07], [0.45, 0.05], [0.65, 0.03], [0.8, 0.008], [0.82, 0]], 12);
    var bp = billGeo.attributes.position;
    for (i = 0; i < bp.count; i++) {
      var bx = bp.getX(i);
      bp.setY(i, bp.getY(i) * 1.15 + 0.06 * Math.pow(Math.max(0, bx) / 0.82, 2.2));
      bp.setZ(i, bp.getZ(i) * 0.75);
    }
    billGeo.computeVertexNormals();
    var bill = mesh(billGeo, M.bill, head);
    bill.position.set(0.12, -0.03, 0);
    bill.rotation.z = -0.06;
    var billTip = new THREE.Vector3(0.12 + 0.8, -0.03 + 0.06 - 0.8 * 0.06, 0);
    // red bare skin around eyes + eye
    [1, -1].forEach(function (s) {
      var patch = mesh(new THREE.SphereGeometry(0.06, 12, 8), M.red, head);
      patch.scale.set(1.5, 0.95, 0.45);
      patch.position.set(0.1, 0.02, 0.105 * s);
      patch.rotation.y = -0.25 * s;
      var iris = mesh(new THREE.SphereGeometry(0.026, 10, 8), M.iris, head);
      iris.position.set(0.09, 0.03, 0.123 * s);
      var pupil = mesh(new THREE.SphereGeometry(0.014, 8, 6), M.eye, head);
      pupil.position.set(0.095, 0.03, 0.142 * s);
    });

    // ---- tail: short white fan ----
    var tail = mesh(shapeGeo([[-0.2, 0], [-0.24, -0.38], [-0.12, -0.46], [0, -0.48], [0.12, -0.46], [0.24, -0.38], [0.2, 0]], 0.05), M.white2, bob);
    tail.position.set(-0.82, 0.02, 0);

    // ---- legs: red, trailing straight back beyond the tail ----
    var legGeo = new THREE.CylinderGeometry(0.028, 0.034, 0.72, 8);
    legGeo.rotateZ(Math.PI / 2);
    var thighGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.5, 8);
    thighGeo.rotateZ(Math.PI / 2);
    var toeGeo = new THREE.ConeGeometry(0.018, 0.2, 6);
    toeGeo.rotateZ(Math.PI / 2);
    [1, -1].forEach(function (s) {
      var leg = new THREE.Group();
      leg.position.set(-0.45, -0.22, 0.08 * s);
      leg.rotation.z = 0.07;
      bob.add(leg);
      var th = mesh(thighGeo, M.red, leg); th.position.x = -0.15;
      var tib = mesh(legGeo, M.red, leg); tib.position.x = -0.66;
      var tar = mesh(legGeo, M.red, leg); tar.position.x = -1.36; tar.scale.set(0.95, 0.85, 0.85);
      var knee = mesh(new THREE.SphereGeometry(0.04, 8, 6), M.red, leg); knee.position.x = -1.01;
      for (var k = -1; k <= 1; k++) {
        var toe = mesh(toeGeo, M.red, leg);
        toe.position.set(-1.8, -0.01 * Math.abs(k), 0.05 * k);
        toe.rotation.set(0, 0.35 * k, 0.15);
        toe.scale.x = k === 0 ? 1.2 : 1;
      }
    });

    // ---- wings ----
    // Each wing: root (mirror) > shoulder pivot > arm meshes + wrist pivot > hand meshes.
    var ARM = 1.7;
    function buildWing(side) {
      var root = new THREE.Group();
      root.position.set(0.22, 0.17, 0.26 * side);
      root.scale.z = side; // mirror for the -Z wing
      bob.add(root);
      var shoulder = new THREE.Group();
      root.add(shoulder);
      // arm: black secondaries with scalloped trailing edge
      var trail = [[ARM, 0.25], [ARM, -0.7]];
      var n = 9;
      for (var j = 0; j < n; j++) {
        var u0 = ARM - (ARM / n) * j, u1 = u0 - ARM / n;
        trail.push([(u0 + u1) / 2 + 0.03, -0.8 + 0.05 * (j / n)]);
        trail.push([u1, -0.66 + 0.04 * (j / n)]);
      }
      trail.push([0, -0.45], [0, 0.18]);
      mesh(shapeGeo(trail), M.black, shoulder);
      // feather separation lines (slightly lighter tone, just above surface)
      for (j = 1; j < n; j++) {
        var uu = ARM - (ARM / n) * j;
        var ln = mesh(shapeGeo([[uu - 0.008, -0.12], [uu + 0.008, -0.12], [uu + 0.03, -0.64], [uu + 0.014, -0.64]]), M.black2, shoulder);
        ln.position.y = 0.004;
      }
      // white coverts on the leading half (thin slab -> both faces white)
      mesh(shapeGeo([[0, 0.24], [0.6, 0.28], [ARM, 0.27], [ARM, -0.18], [1.4, -0.24], [1.15, -0.16], [0.9, -0.26], [0.6, -0.18], [0.35, -0.26], [0, -0.12]], 0.035), M.white2, shoulder);
      // wrist/hand
      var wrist = new THREE.Group();
      wrist.position.set(0, 0, ARM);
      shoulder.add(wrist);
      mesh(shapeGeo([[-0.02, 0.27], [0.7, 0.22], [1.25, 0.1], [1.3, -0.35], [0.8, -0.62], [-0.02, -0.7]]), M.black, wrist);
      mesh(shapeGeo([[-0.03, 0.27], [0.6, 0.23], [1.05, 0.14], [0.8, 0.02], [0.45, -0.04], [0.2, -0.16], [-0.03, -0.18]], 0.03), M.white2, wrist);
      // fingered primaries
      var prim = [
        [1.05, 0.12, 0.12, 1.25], [1.12, 0.0, -0.05, 1.35], [1.15, -0.13, -0.2, 1.3],
        [1.12, -0.27, -0.36, 1.2], [1.0, -0.4, -0.52, 1.05], [0.82, -0.52, -0.7, 0.9], [0.6, -0.6, -0.9, 0.75]
      ];
      prim.forEach(function (p, k) {
        var L = p[3], w = 0.085 + 0.012 * k;
        var f = mesh(shapeGeo([[0, w], [L * 0.55, w * 0.9], [L * 0.85, w * 0.55], [L, 0], [L * 0.85, -w * 0.6], [L * 0.4, -w], [0, -w]]), k % 2 ? M.black2 : M.black, wrist);
        f.position.set(p[1], 0.006 * (7 - k), p[0] - 0.35);
        f.rotation.y = p[2];
        f.userData.baseRotY = p[2];
        f.userData.k = k;
        f.name = 'primary';
      });
      return { root: root, shoulder: shoulder, wrist: wrist, side: side };
    }
    var wings = [buildWing(1), buildWing(-1)];

    // ---- baby bundle hanging from the bill ----
    var bundle = new THREE.Group();
    bundle.name = 'storkBundle';
    bundle.position.copy(billTip).add(new THREE.Vector3(-0.08, -0.02, 0));
    bundle.scale.setScalar(0.85);
    head.add(bundle);
    var knot = mesh(new THREE.SphereGeometry(0.06, 10, 8), M.cloth, bundle);
    knot.scale.set(1.3, 1, 1);
    [1, -1].forEach(function (s) {
      var ear = mesh(new THREE.ConeGeometry(0.045, 0.16, 8), M.cloth, bundle);
      ear.position.set(0.08 * s, 0.04, 0);
      ear.rotation.z = -1.1 * s;
    });
    var gather = mesh(lathe([[0, 0.04], [0.12, 0.07], [0.22, 0.14]], 14), M.cloth, bundle);
    gather.rotation.z = -Math.PI / 2;
    gather.position.y = -0.02;
    var sling = mesh(new THREE.SphereGeometry(0.27, 20, 16), M.cloth, bundle);
    sling.scale.set(1.15, 0.95, 0.85);
    sling.position.y = -0.45;
    var face = new THREE.Group();
    face.position.set(0.04, -0.4, 0.15);
    bundle.add(face);
    mesh(new THREE.SphereGeometry(0.12, 16, 12), M.skin, face);
    [1, -1].forEach(function (s) {
      var e = mesh(new THREE.SphereGeometry(0.014, 8, 6), M.eye, face);
      e.position.set(0.042 * s, 0.02, 0.11);
      var c = mesh(new THREE.SphereGeometry(0.025, 8, 6), M.cheek, face);
      c.scale.set(1, 0.7, 0.4);
      c.position.set(0.07 * s, -0.025, 0.093);
    });
    var mouth = mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 10, Math.PI), M.red, face);
    mouth.position.set(0, -0.035, 0.115);
    mouth.rotation.z = Math.PI;
    var hood = mesh(new THREE.TorusGeometry(0.13, 0.04, 8, 18), M.cloth2, face);
    hood.position.z = 0.04;
    hood.scale.set(1, 1.05, 1);

    // ---- animation ----
    var phase = 0, released = false, D = Math.PI / 180;
    var FREQ = 1.6; // flaps per second (storks flap slowly)
    function update(dt, flapPhase) {
      if (typeof flapPhase === 'number') phase = flapPhase;
      else phase += (dt || 0) * FREQ * Math.PI * 2;
      var s = Math.sin(phase), c = Math.cos(phase);
      var up = 35 * s + 4; // degrees, + = wings up
      var lag = Math.sin(phase - 0.9);
      wings.forEach(function (w) {
        w.shoulder.rotation.x = -up * D;
        w.shoulder.rotation.y = (c > 0 ? -6 * c : 0) * D; // slight sweep back on upstroke
        w.shoulder.rotation.z = -4 * c * D; // pitch: leading edge down on downstroke
        w.wrist.rotation.x = -(16 * lag - 3) * D; // hand lags behind the arm
        w.wrist.rotation.y = (c > 0 ? -14 * c : 2 * c) * D; // hand folds back on upstroke
        w.wrist.children.forEach(function (f) {
          if (f.name === 'primary') f.rotation.y = f.userData.baseRotY * (c > 0 ? 1 - 0.3 * c : 1);
        });
      });
      bob.position.y = -0.07 * s; // body rises on downstroke
      bob.rotation.z = 0.02 * c;
      if (!released) {
        bundle.rotation.z = 0.06 * Math.sin(phase - 1.2) - bob.rotation.z;
        bundle.rotation.x = 0.03 * c;
      }
    }
    function releaseBundle() {
      var top = group;
      while (top.parent) top = top.parent;
      var p = new THREE.Vector3();
      bundle.getWorldPosition(p);
      if (!released) {
        released = true;
        if (top !== group) top.attach(bundle); else { group.attach(bundle); }
      }
      return p;
    }
    update(0, 0);
    return { group: group, update: update, bundle: bundle, releaseBundle: releaseBundle, wings: wings, head: head, billTip: billTip };
  };

  window.addStorkLights = function (scene, THREE) {
    var hemi = new THREE.HemisphereLight(0xfffaf0, 0xb9b09c, 0.8);
    var key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(3, 8, 6);
    var fill = new THREE.DirectionalLight(0xdfe8ff, 0.35);
    fill.position.set(-5, -2, -4);
    scene.add(hemi, key, fill);
    return { hemi: hemi, key: key, fill: fill };
  };
})();
