import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer, stats, controls, loader;

/*
const params = {
    asset: 'house'
};
const assets = [
    'creaseAngle',
    'crystal',
    'house',
    'elevationGrid1',
    'elevationGrid2',
    'extrusion1',
    'extrusion2',
    'extrusion3',
    'lines',
    'linesTransparent',
    'meshWithLines',
    'meshWithTexture',
    'pixelTexture',
    'points',
];
*/

let vrmlScene;

init();

function init() {
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1e10);
    camera.position.set(- 10, 5, 10);
    scene = new THREE.Scene();
    scene.add(camera);
    // light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(200, 200, 200);
    scene.add(dirLight);
    
    loadAsset2("nettle.wrl");
    
    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);
    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 200;
    controls.enableDamping = true;
    //
    stats = new Stats();
    document.body.appendChild(stats.dom);
    //
    window.addEventListener('resize', onWindowResize);
    //
    /*
    const gui = new GUI();
    gui.add(params, 'asset', assets).onChange(function (value) {
        if (vrmlScene) {
            vrmlScene.traverse(function (object) {
                if (object.material) object.material.dispose();
                if (object.material && object.material.map) object.material.map.dispose();
                if (object.geometry) object.geometry.dispose();
            });
            scene.remove(vrmlScene);
        }
        loadAsset(value);
    });
    */
}

function loadAsset(url) {
    try {
        loadAsset1(url);
    } catch (error) {
        console.error('Error loading VRML using method 1:', url, error);

        try {
            loadAsset2(url);
        } catch (error) {
            console.error('Error loading VRML using method 2:', url, error);                    
        }
    }
}

function loadAsset1(url) {
    const loader = new VRMLLoader();

    loader.load(url, function (object) {
        vrmlScene = object;
        scene.add(object);
        controls.reset();
    });
}

async function loadAsset2(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let vrmlText;

    // Check if zip compressed (magic bytes 0x1f 0x8b) and decompress with pako
    if (uint8Array[0] === 0x1f && uint8Array[1] === 0x8b) {
        const decompressed = pako.inflate(uint8Array);
        vrmlText = new TextDecoder().decode(decompressed);
    } else {
        vrmlText = new TextDecoder().decode(uint8Array);
    }

    const loader = new VRMLLoader();
    const vrmlScene = loader.parse(vrmlText);

    const box = new THREE.Box3().setFromObject(vrmlScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    vrmlScene.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
        const scale = 50 / maxDim;
        vrmlScene.scale.multiplyScalar(scale);
    }

    scene.add(vrmlScene);

    camera.position.set(0, 0, 80);
    camera.lookAt(0, 0, 0);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    controls.update(); // to support damping
    renderer.render(scene, camera);
    stats.update();
}