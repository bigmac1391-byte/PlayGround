import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const palette = {
  seraphine: { skin: '#e8b99c', hair: '#30232b', outfit: '#67404c', trim: '#d8c49c', eyes: '#a9c5d6' },
  rowan: { skin: '#dfad8e', hair: '#372b25', outfit: '#3e5548', trim: '#a5b88a', eyes: '#a4c875' },
  mira: { skin: '#f0c4a4', hair: '#e8c879', outfit: '#654d64', trim: '#e0b779', eyes: '#8ac6c4' },
  brann: { skin: '#d89d7c', hair: '#a94f37', outfit: '#665239', trim: '#d49b5c', eyes: '#86a98b' }
};

const material = (color, roughness = 0.72, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const sphereGeometry = new THREE.SphereGeometry(1, 24, 18);
const unitY = new THREE.Vector3(0, 1, 0);

function ellipsoid(parent, color, position, scale, options = {}) {
  const mesh = new THREE.Mesh(sphereGeometry, material(color, options.roughness, options.metalness));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  parent.add(mesh);
  return mesh;
}

function cylinderBetween(parent, color, start, end, radius, tipRadius = radius, segments = 12) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(tipRadius, radius, direction.length(), segments), material(color));
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(unitY, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function coneBetween(parent, color, start, end, radius) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, direction.length(), 12), material(color));
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(unitY, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function tube(parent, color, points, radius) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), material(color));
  parent.add(mesh);
  return mesh;
}

function makeCharacter(id) {
  const look = palette[id] || palette.seraphine;
  const group = new THREE.Group();
  if (id === 'brann') group.scale.set(0.88, 0.82, 0.92);

  const skin = material(look.skin);
  const cloth = material(look.outfit, 0.62);
  const hair = material(look.hair, 0.48);
  const trim = material(look.trim, 0.38, id === 'seraphine' ? 0.45 : 0.12);
  const eyeWhite = material('#fff1df', 0.32);
  const eyeColor = material(look.eyes, 0.3);
  const dark = material('#29232b', 0.38);

  // A shaped jacket/dress silhouette with stylized boots and articulated arms.
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), cloth);
  torso.position.set(0, 1.35, 0);
  torso.scale.set(id === 'brann' ? 0.49 : 0.42, 0.65, 0.31);
  group.add(torso);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.67, 1.12, 12, 1, false), cloth);
  skirt.position.set(0, 0.63, 0);
  skirt.rotation.y = Math.PI / 12;
  group.add(skirt);
  ellipsoid(group, look.trim, [0, 1.75, 0.03], [0.35, 0.12, 0.33]);
  ellipsoid(group, look.trim, [0, 1.74, 0.25], [0.075, 0.42, 0.055]);

  for (const side of [-1, 1]) {
    cylinderBetween(group, look.outfit, [side * 0.23, 0.46, 0], [side * 0.23, 0.12, 0.02], 0.12, 0.1);
    ellipsoid(group, '#3a3035', [side * 0.23, 0.09, 0.075], [0.15, 0.11, 0.24]);
    cylinderBetween(group, look.outfit, [side * 0.38, 1.72, 0], [side * 0.53, 1.26, 0.05], 0.14, 0.115);
    ellipsoid(group, look.skin, [side * 0.53, 1.2, 0.07], [0.12, 0.14, 0.12]);
  }
  cylinderBetween(group, look.skin, [0, 1.88, 0], [0, 2.07, 0], 0.13);

  // Anime-inspired face: large irises, soft cheeks, and a distinct fringe.
  ellipsoid(group, look.skin, [0, 2.39, 0.03], [0.38, 0.47, 0.31]);
  ellipsoid(group, look.skin, [0, 2.22, 0.245], [0.22, 0.16, 0.11]);
  for (const side of [-1, 1]) {
    ellipsoid(group, '#ed9f95', [side * 0.23, 2.22, 0.25], [0.09, 0.055, 0.025]);
    ellipsoid(group, '#f4c9a7', [side * 0.155, 2.43, 0.285], [0.105, 0.14, 0.055]);
    ellipsoid(group, look.eyes, [side * 0.15, 2.43, 0.332], [0.061, 0.095, 0.025]);
    ellipsoid(group, '#29232b', [side * 0.15, 2.425, 0.353], [0.029, 0.061, 0.014]);
    ellipsoid(group, '#fff8e9', [side * 0.17, 2.47, 0.369], [0.021, 0.028, 0.012]);
    ellipsoid(group, look.hair, [side * 0.15, 2.59, 0.31], [0.12, 0.035, 0.035]);
    ellipsoid(group, look.hair, [side * 0.33, 2.29, 0.04], [0.15, 0.34, 0.18]);
  }
  ellipsoid(group, '#9e6257', [0, 2.29, 0.35], [0.035, 0.045, 0.028]);
  ellipsoid(group, '#9d4f59', [0, 2.15, 0.34], [0.07, 0.025, 0.025]);
  ellipsoid(group, look.hair, [0, 2.69, -0.02], [0.39, 0.24, 0.34]);
  ellipsoid(group, look.hair, [-0.19, 2.56, 0.22], [0.19, 0.23, 0.16], { rotation: [0, 0, -0.38] });
  ellipsoid(group, look.hair, [0.04, 2.62, 0.25], [0.21, 0.18, 0.15], { rotation: [0, 0, 0.28] });
  ellipsoid(group, look.hair, [0.28, 2.5, 0.16], [0.13, 0.28, 0.16]);

  if (id === 'seraphine') {
    // Moon-knight circlet, pointed elven ears, pauldrons, and a short crimson mantle.
    for (const side of [-1, 1]) {
      coneBetween(group, look.skin, [side * 0.31, 2.4, 0], [side * 0.62, 2.45, 0], 0.09);
      ellipsoid(group, '#b8c2c7', [side * 0.39, 1.7, 0.03], [0.2, 0.15, 0.19], { metalness: 0.55 });
    }
    ellipsoid(group, '#c9d6dc', [0, 2.91, -0.05], [0.27, 0.045, 0.045], { metalness: 0.65 });
    coneBetween(group, '#e1c98e', [0, 2.9, 0.03], [0, 3.08, 0.03], 0.08);
    const cape = new THREE.Mesh(new THREE.ConeGeometry(0.59, 1.25, 8, 1, true), material('#713d4a', 0.78, 0.05));
    cape.position.set(0, 1.0, -0.22); cape.rotation.x = Math.PI; group.add(cape);
  } else if (id === 'rowan') {
    // Fox ears and tail make Rowan recognizable even in the small portrait.
    for (const side of [-1, 1]) {
      coneBetween(group, look.hair, [side * 0.22, 2.7, -0.02], [side * 0.34, 3.14, -0.02], 0.16);
      coneBetween(group, '#d99185', [side * 0.22, 2.78, 0.045], [side * 0.32, 3.05, 0.045], 0.075);
    }
    tube(group, '#9a6847', [[0.35, 0.48, -0.3], [0.68, 0.62, -0.47], [0.78, 0.93, -0.45], [0.56, 1.06, -0.39]], 0.13);
    ellipsoid(group, '#ead9bc', [0.56, 1.06, -0.39], [0.17, 0.14, 0.14]);
    ellipsoid(group, look.trim, [-0.31, 1.58, 0.08], [0.13, 0.11, 0.13]);
  } else if (id === 'mira') {
    // Fin-shaped ears, pearl earrings, and a golden side braid.
    for (const side of [-1, 1]) {
      coneBetween(group, look.skin, [side * 0.31, 2.4, 0], [side * 0.66, 2.47, 0], 0.1);
      ellipsoid(group, '#e9d8bd', [side * 0.43, 2.3, 0.08], [0.045, 0.055, 0.04], { metalness: 0.35 });
    }
    for (let i = 0; i < 5; i++) ellipsoid(group, look.hair, [0.32 + i * 0.025, 2.3 - i * 0.14, 0.02], [0.09, 0.12, 0.1]);
    ellipsoid(group, '#e9d8bd', [0.46, 1.77, 0.05], [0.13, 0.13, 0.12], { metalness: 0.25 });
  } else if (id === 'brann') {
    // Copper braids, dragonkin horns, and a bright rune-work apron.
    for (const side of [-1, 1]) {
      coneBetween(group, '#7b4739', [side * 0.27, 2.64, -0.02], [side * 0.43, 2.98, -0.02], 0.11);
      for (let i = 0; i < 5; i++) ellipsoid(group, look.hair, [side * (0.33 + i * 0.025), 2.37 - i * 0.12, 0.04], [0.1, 0.11, 0.11]);
    }
    ellipsoid(group, '#d4a956', [0, 1.26, 0.3], [0.28, 0.43, 0.045], { metalness: 0.25 });
    for (let i = 0; i < 3; i++) ellipsoid(group, '#f0ca6c', [-0.1 + i * 0.1, 1.4, 0.35], [0.025, 0.025, 0.018], { metalness: 0.4 });
    cylinderBetween(group, '#684536', [0.58, 0.8, 0.1], [0.7, 1.7, 0.1], 0.055, 0.055);
    ellipsoid(group, '#d2a35d', [0.7, 1.78, 0.1], [0.24, 0.12, 0.14], { metalness: 0.4 });
  }

  // A subtle jewel and shoulder details catch the warm key light.
  ellipsoid(group, id === 'seraphine' ? '#d9c58f' : look.trim, [0, 1.77, 0.37], [0.07, 0.09, 0.045], { metalness: 0.35 });
  return group;
}

function createScene(id) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff0df', '#35303b', 2.2));
  const key = new THREE.DirectionalLight('#ffe3c3', 3.2);
  key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(palette[id]?.eyes || '#b7d5df', 2.1);
  rim.position.set(3, 3, -3); scene.add(rim);
  scene.add(makeCharacter(id));
  return scene;
}

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0x000000, 0);

function disposeScene(scene) {
  scene.traverse(object => {
    if (!object.isMesh) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) object.material.forEach(item => item.dispose());
    else object.material.dispose();
  });
}

function paint(canvas) {
  const id = canvas.dataset.character;
  const portrait = canvas.classList.contains('portrait-canvas');
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));
  const scene = createScene(id);
  const aspect = width / height;
  const viewHeight = portrait ? 1.12 : 3.35;
  const camera = new THREE.OrthographicCamera(-viewHeight * aspect / 2, viewHeight * aspect / 2, viewHeight / 2, -viewHeight / 2, 0.1, 30);
  camera.position.set(0, portrait ? 2.43 : 1.55, 7);
  camera.lookAt(0, portrait ? 2.43 : 1.55, 0);
  renderer.setSize(width, height, false);
  renderer.render(scene, camera);
  const context = canvas.getContext('2d');
  if (context) {
    canvas.width = width * renderer.getPixelRatio();
    canvas.height = height * renderer.getPixelRatio();
    context.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
  }
  canvas.closest('.character-figure')?.classList.add('is-3d');
  canvas.closest('.companion-avatar')?.classList.add('is-3d');
  disposeScene(scene);
}

function initCharacterModels() {
  document.querySelectorAll('.character-canvas, .portrait-canvas').forEach(canvas => {
    try { paint(canvas); } catch (error) { console.warn('Could not render a 3D companion portrait:', error); }
  });
}

window.initCharacterModels = initCharacterModels;
window.disposeCharacterModels = () => {};
initCharacterModels();
