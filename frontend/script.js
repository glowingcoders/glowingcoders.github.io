const socket = io("https://your-backend.onrender.com"); // Replace with your backend URL

let camera, scene, renderer, controls;
let localPlayer = null;
const players = {};
const objects = [];

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaec6cf);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  scene.add(light);

  const groundGeo = new THREE.BoxGeometry(1, 1, 1);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
      const block = new THREE.Mesh(groundGeo, groundMat);
      block.position.set(x, 0, z);
      scene.add(block);
      objects.push(block);
    }
  }

  controls = new THREE.PointerLockControls(camera, document.body);
  document.body.addEventListener('click', () => controls.lock());

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  socketEvents();
  inputEvents();
}

function socketEvents() {
  socket.on("currentPlayers", data => {
    Object.keys(data).forEach(id => {
      if (id === socket.id) {
        localPlayer = createPlayer(id, 0x00ff00);
        localPlayer.position.set(data[id].x, data[id].y, data[id].z);
        camera.position.copy(localPlayer.position);
      } else {
        const other = createPlayer(id);
        other.position.set(data[id].x, data[id].y, data[id].z);
      }
    });
  });

  socket.on("newPlayer", data => {
    if (!players[data.id]) {
      const p = createPlayer(data.id);
      p.position.set(data.x, data.y, data.z);
    }
  });

  socket.on("playerMoved", data => {
    if (players[data.id]) {
      players[data.id].position.set(data.x, data.y, data.z);
    }
  });

  socket.on("playerDisconnected", id => {
    if (players[id]) {
      scene.remove(players[id]);
      delete players[id];
    }
  });
}

function inputEvents() {
  let moveF = false, moveB = false, moveL = false, moveR = false;
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  document.addEventListener('keydown', e => {
    switch (e.code) {
      case 'KeyW': moveF = true; break;
      case 'KeyS': moveB = true; break;
      case 'KeyA': moveL = true; break;
      case 'KeyD': moveR = true; break;
    }
  });

  document.addEventListener('keyup', e => {
    switch (e.code) {
      case 'KeyW': moveF = false; break;
      case 'KeyS': moveB = false; break;
      case 'KeyA': moveL = false; break;
      case 'KeyD': moveR = false; break;
    }
  });

  setInterval(() => {
    if (!localPlayer) return;
    velocity.set(0, 0, 0);
    direction.set(0, 0, 0);

    if (moveF) direction.z -= 1;
    if (moveB) direction.z += 1;
    if (moveL) direction.x -= 1;
    if (moveR) direction.x += 1;
    direction.normalize();

    velocity.x = direction.x * 0.1;
    velocity.z = direction.z * 0.1;

    localPlayer.position.x += velocity.x;
    localPlayer.position.z += velocity.z;

    camera.position.copy(localPlayer.position);

    socket.emit("move", {
      x: localPlayer.position.x,
      y: localPlayer.position.y,
      z: localPlayer.position.z
    });
  }, 100);
}

function createPlayer(id, color = 0xff0000) {
  const geom = new THREE.BoxGeometry(0.5, 1.8, 0.5);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);
  players[id] = mesh;
  return mesh;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
