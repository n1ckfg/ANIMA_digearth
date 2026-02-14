import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

let camera, scene, renderer, stats;

let isUserInteracting = false,
    onPointerDownMouseX = 0, onPointerDownMouseY = 0,
    lon = 0, onPointerDownLon = 0,
    lat = 0, onPointerDownLat = 0,
    phi = 0, theta = 0;

export function init(url, mode = 0) {
    const container = document.body;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);

    scene = new THREE.Scene();

    if (mode === 0) {
        // Equirectangular
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);

        const texture = new THREE.TextureLoader().load(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    } else {
        // Cubemap (Single Image Atlas)
        // This assumes the image is a 3x2 grid of cube faces.
        // The standard 3x2 layout is:
        // px, nx, py, 
        // ny, pz, nz
        // Each face is 1/3 width and 1/2 height.
        const geometry = new THREE.BoxGeometry(100, 100, 100);
        geometry.scale(1, 1, -1); // Invert box

        const textures = [];
        const texture = new THREE.TextureLoader().load(url);
        texture.colorSpace = THREE.SRGBColorSpace;

        for (let i = 0; i < 6; i++) {
            textures[i] = texture.clone();
            textures[i].needsUpdate = true;
        }

        // px
        textures[0].repeat.set(1 / 3, 1 / 2);
        textures[0].offset.set(0, 1 / 2);
        // nx
        textures[1].repeat.set(1 / 3, 1 / 2);
        textures[1].offset.set(1 / 3, 1 / 2);
        // py
        textures[2].repeat.set(1 / 3, 1 / 2);
        textures[2].offset.set(2 / 3, 1 / 2);
        // ny
        textures[3].repeat.set(1 / 3, 1 / 2);
        textures[3].offset.set(0, 0);
        // pz
        textures[4].repeat.set(1 / 3, 1 / 2);
        textures[4].offset.set(1 / 3, 0);
        // nz
        textures[5].repeat.set(1 / 3, 1 / 2);
        textures[5].offset.set(2 / 3, 0);

        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(new THREE.MeshBasicMaterial({ map: textures[i] }));
        }

        const mesh = new THREE.Mesh(geometry, materials);
        scene.add(mesh);
    }

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    container.appendChild(renderer.domElement);

    stats = new Stats();
    container.appendChild(stats.dom);

    container.style.touchAction = 'none';
    container.addEventListener('pointerdown', onPointerDown);

    document.addEventListener('wheel', onDocumentMouseWheel);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
    if (event.isPrimary === false) return;

    isUserInteracting = true;

    onPointerDownMouseX = event.clientX;
    onPointerDownMouseY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(event) {
    if (event.isPrimary === false) return;

    lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
    lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
}

function onPointerUp(event) {
    if (event.isPrimary === false) return;

    isUserInteracting = false;

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
}

function onDocumentMouseWheel(event) {
    const fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
    camera.updateProjectionMatrix();
}

function animate() {
    if (isUserInteracting === false) {
        lon += 0.1;
    }

    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    const x = 500 * Math.sin(phi) * Math.cos(theta);
    const y = 500 * Math.cos(phi);
    const z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(x, y, z);

    renderer.render(scene, camera);
    stats.update();
}
