import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;

export function init(url, mode = 0) {
    const container = document.body;

    scene = new THREE.Scene();

    if (mode === 0) {
        // Equirectangular
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); //100);
        camera.position.z = 0.01;

        const geometry = new THREE.SphereGeometry(500, 60, 40); //50, 60, 40);
        geometry.scale(-1, 1, 1);

        const texture = new THREE.TextureLoader().load(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    } else {
        // Cubemap (from horizontal strip atlas)
        camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 0.01;

        const textures = getTexturesFromAtlasFile(url, 6);
        const materials = [];

        for (let i = 0; i < 6; i++) {
            materials.push(new THREE.MeshBasicMaterial({ map: textures[i] }));
        }

        const skyBox = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            materials
        );
        skyBox.geometry.scale(1, 1, -1);
        scene.add(skyBox);
    }

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.rotateSpeed = -0.25;

    window.addEventListener('resize', onWindowResize);
}

function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {
    const textures = [];

    for (let i = 0; i < tilesNum; i++) {
        textures[i] = new THREE.Texture();
    }

    new THREE.ImageLoader().load(atlasImgUrl, (image) => {
        let canvas, context;
        const tileWidth = image.height;

        for (let i = 0; i < textures.length; i++) {
            canvas = document.createElement('canvas');
            context = canvas.getContext('2d');
            canvas.height = tileWidth;
            canvas.width = tileWidth;

            context.drawImage(
                image,
                tileWidth * i, 0,
                tileWidth, tileWidth,
                0, 0,
                tileWidth, tileWidth
            );

            textures[i].colorSpace = THREE.SRGBColorSpace;
            textures[i].image = canvas;
            textures[i].needsUpdate = true;
        }
    });

    return textures;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    controls.update();
    renderer.render(scene, camera);
}
