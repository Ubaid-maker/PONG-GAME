// Scene setup
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a);
renderer.shadowMap.enabled = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00d4ff, 1);
pointLight1.position.set(20, 20, 20);
pointLight1.castShadow = true;
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff006e, 0.8);
pointLight2.position.set(-20, 15, -20);
pointLight2.castShadow = true;
scene.add(pointLight2);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -30, 0);
world.defaultContactMaterial.friction = 0.3;
world.defaultContactMaterial.restitution = 0.5;

// Camera position
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Marbles
const marbles = [];
let score = 0;

class Marble {
  constructor(x, y, z) {
    const radius = 0.5;
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const colors = [0x00d4ff, 0xff006e, 0x00ff88, 0xffd700, 0xff6b9d, 0x00ccff];
    const color = colors[Math.floor(Math.random() * colors.length)];
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

    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({ mass: 1, shape });
    body.position.set(x, y, z);
    world.addBody(body);
    this.body = body;
  }

  update() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}

// Create initial marbles with spacing
for (let i = 0; i < 8; i++) {
  const x = (Math.random() - 0.5) * 8;
  const z = (Math.random() - 0.5) * 8;
  const marble = new Marble(x, 25 + i * 3, z);
  marble.body.velocity.set(0, -5, 0);
  marbles.push(marble);
}

// Platforms
const platformGeometry = new THREE.BoxGeometry(3, 0.5, 3);
const platformMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a3a52,
  metalness: 0.5,
  roughness: 0.5
});

function createPlatform(x, y, z, isBonusColor = false) {
  const material = isBonusColor 
    ? new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
      })
    : platformMaterial;
  
  const mesh = new THREE.Mesh(platformGeometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(1.5, 0.25, 1.5));
  const body = new CANNON.Body({ mass: 0, shape });
  body.position.set(x, y, z);
  world.addBody(body);

  return { mesh, body, isBonus: isBonusColor };
}

const platforms = [];
for (let i = 0; i < 5; i++) {
  const isBonus = Math.random() > 0.7;
  platforms.push(createPlatform(
    (Math.random() - 0.5) * 15,
    10 - i * 4,
    (Math.random() - 0.5) * 15,
    isBonus
  ));
}

// Ground
const groundGeometry = new THREE.PlaneGeometry(40, 40);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x0d1f2d,
  metalness: 0.3,
  roughness: 0.7
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
ground.receiveShadow = true;
scene.add(ground);

const groundShape = new CANNON.Box(new CANNON.Vec3(20, 1, 20));
const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
groundBody.position.y = -5;
world.addBody(groundBody);

// Mouse interaction
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('touchmove', (e) => {
  mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
});

// Wind force based on mouse
function applyMouseForce() {
  marbles.forEach(marble => {
    const forceStrength = 15;
    marble.body.velocity.x += mouseX * forceStrength * 0.016;
    marble.body.velocity.z += mouseY * forceStrength * 0.016;
  });
}

// Score update on platform collision
const marbleContactPlatforms = new Set();
world.addEventListener('collide', (e) => {
  marbles.forEach((marble, marbleIndex) => {
    platforms.forEach((platform, platformIndex) => {
      if ((e.body === marble.body && e.target === platform.body) ||
          (e.target === marble.body && e.body === platform.body)) {
        const contactKey = `${marbleIndex}-${platformIndex}`;
        if (!marbleContactPlatforms.has(contactKey)) {
          marbleContactPlatforms.add(contactKey);
          if (platform.isBonus) {
            score += 50;
          } else {
            score += 10;
          }
          document.getElementById('score').textContent = score;
          setTimeout(() => marbleContactPlatforms.delete(contactKey), 500);
        }
      }
    });
  });
});

// Animation loop
let frameCount = 0;
function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);

  applyMouseForce();

  marbles.forEach(marble => {
    marble.update();
    
    // Reset marble if it falls too low
    if (marble.body.position.y < -20) {
      marble.body.position.set(
        (Math.random() - 0.5) * 8,
        25,
        (Math.random() - 0.5) * 8
      );
      marble.body.velocity.set(0, -5, 0);
    }
  });

  frameCount++;
  if (frameCount === 1) {
    console.log("[v0] Game initialized - marbles:", marbles.length, "platforms:", platforms.length);
  }

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
