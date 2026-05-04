// Initialize Three.js scene
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;

// Scene background
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x0a0a0a, 100, 1000);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00d4ff, 2);
pointLight1.position.set(15, 15, 15);
pointLight1.castShadow = true;
pointLight1.shadow.mapSize.width = 2048;
pointLight1.shadow.mapSize.height = 2048;
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff006e, 1.5);
pointLight2.position.set(-15, 10, -15);
pointLight2.castShadow = true;
scene.add(pointLight2);

// Camera setup
camera.position.set(0, 12, 25);
camera.lookAt(0, 0, 0);

// Initialize physics world
const world = new CANNON.World();
world.gravity.set(0, -25, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Material definitions
const marbleMaterial = new CANNON.Material('marble');
const platformMaterial = new CANNON.Material('platform');
const groundMaterial = new CANNON.Material('ground');

// Contact materials
const marblePlatformContact = new CANNON.ContactMaterial(marbleMaterial, platformMaterial, {
  friction: 0.2,
  restitution: 0.6
});
const marbleGroundContact = new CANNON.ContactMaterial(marbleMaterial, groundMaterial, {
  friction: 0.3,
  restitution: 0.4
});

world.addContactMaterial(marblePlatformContact);
world.addContactMaterial(marbleGroundContact);

// Data storage
const marbles = [];
const platforms = [];
let score = 0;

// Create marble class
class Marble {
  constructor(x, y, z) {
    const radius = 0.35;
    const colors = [0x00d4ff, 0xff006e, 0x00ff88, 0xffd700, 0xff6b9d];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Three.js mesh
    const geometry = new THREE.SphereGeometry(radius, 20, 20);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);

    // Physics body
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      linearDamping: 0.05,
      angularDamping: 0.05,
      material: marbleMaterial
    });
    this.body.position.set(x, y, z);
    world.addBody(this.body);
  }

  update() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}

// Create platform class
class Platform {
  constructor(x, y, z, isBonus = false) {
    this.isBonus = isBonus;
    this.width = 2.5;
    this.height = 0.3;
    this.depth = 2.5;

    // Three.js mesh
    const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
    const color = isBonus ? 0xffd700 : 0x1a3a52;
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: isBonus ? 0.9 : 0.4,
      roughness: isBonus ? 0.1 : 0.6,
      emissive: isBonus ? 0xffd700 : 0x000000,
      emissiveIntensity: isBonus ? 0.5 : 0
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);

    // Physics body
    const shape = new CANNON.Box(new CANNON.Vec3(this.width / 2, this.height / 2, this.depth / 2));
    this.body = new CANNON.Body({
      mass: 0,
      shape: shape,
      material: platformMaterial
    });
    this.body.position.set(x, y, z);
    world.addBody(this.body);
  }
}

// Create ground
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMatMesh = new THREE.MeshStandardMaterial({
  color: 0x0d1f2d,
  metalness: 0.2,
  roughness: 0.8
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMatMesh);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -8;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0, shape: groundShape, material: groundMaterial });
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
groundBody.position.y = -8;
world.addBody(groundBody);

// Create marbles
for (let i = 0; i < 10; i++) {
  const x = (Math.random() - 0.5) * 6;
  const y = 20 + i * 2.5;
  const z = (Math.random() - 0.5) * 6;
  marbles.push(new Marble(x, y, z));
}

// Create platforms
for (let i = 0; i < 6; i++) {
  const x = (Math.random() - 0.5) * 12;
  const y = 12 - i * 3.5;
  const z = (Math.random() - 0.5) * 12;
  const isBonus = Math.random() > 0.6;
  platforms.push(new Platform(x, y, z, isBonus));
}

// Mouse tracking
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  }
});

// Track collisions
const marbleTouch = new Map();

world.addEventListener('collide', (event) => {
  for (let i = 0; i < marbles.length; i++) {
    for (let j = 0; j < platforms.length; j++) {
      if ((event.body === marbles[i].body && event.target === platforms[j].body) ||
          (event.target === marbles[i].body && event.body === platforms[j].body)) {
        const key = `${i}-${j}`;
        if (!marbleTouch.has(key)) {
          marbleTouch.set(key, true);
          const points = platforms[j].isBonus ? 50 : 10;
          score += points;
          document.getElementById('score').textContent = score;
          setTimeout(() => marbleTouch.delete(key), 800);
        }
      }
    }
  }
});

// Main animation loop
function animate() {
  requestAnimationFrame(animate);

  // Step physics
  world.step(1 / 60);

  // Apply force based on mouse position
  for (let i = 0; i < marbles.length; i++) {
    marbles[i].body.velocity.x += mouseX * 5;
    marbles[i].body.velocity.z -= mouseY * 5;
    
    // Speed limit
    const speed = marbles[i].body.velocity.length();
    if (speed > 30) {
      marbles[i].body.velocity.scale(30 / speed, marbles[i].body.velocity);
    }
  }

  // Update marble positions and reset if needed
  for (let i = 0; i < marbles.length; i++) {
    marbles[i].update();
    if (marbles[i].body.position.y < -15) {
      marbles[i].body.position.set(
        (Math.random() - 0.5) * 6,
        22,
        (Math.random() - 0.5) * 6
      );
      marbles[i].body.velocity.set(0, 0, 0);
      marbles[i].body.angularVelocity.set(0, 0, 0);
    }
  }

  // Render
  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
