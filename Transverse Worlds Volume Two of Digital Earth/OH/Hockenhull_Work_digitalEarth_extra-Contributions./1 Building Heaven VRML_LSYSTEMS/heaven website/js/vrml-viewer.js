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

export function init(url, mode) {
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
    
    if (mode == 0) {
        loadAsset0(url);
    } else {
        loadAsset1(url);
    }
    
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

function preprocessVRML(text) {
    // Remove eventIn/eventOut declarations (Script node fields unsupported by VRMLLoader)
    text = text.replace(/^(eventIn|eventOut)\s+.*$/gm, '');

    // Replace hyphens in DEF/USE/ROUTE identifiers (unsupported by VRMLLoader lexer)
    text = text.replace(/\bDEF\s+(\S+)/g, (m, n) => 'DEF ' + n.replace(/-/g, '_'));
    text = text.replace(/\bUSE\s+(\S+)/g, (m, n) => 'USE ' + n.replace(/-/g, '_'));
    text = text.replace(/\bROUTE\s+(\S+)\s+TO\s+(\S+)/g, (m, f, t) =>
        'ROUTE ' + f.replace(/-/g, '_') + ' TO ' + t.replace(/-/g, '_'));

    // Strip interpolator nodes whose names collide with shorter NodeName tokens
    // in the VRMLLoader regex (Color vs ColorInterpolator, etc.)
    for (const nodeType of ['ColorInterpolator', 'CoordinateInterpolator', 'NormalInterpolator']) {
        const re = new RegExp('(DEF\\s+\\S+\\s+)?' + nodeType + '\\s*\\{', 'g');
        let match;
        const ranges = [];
        while ((match = re.exec(text)) !== null) {
            let depth = 0;
            for (let i = match.index; i < text.length; i++) {
                if (text[i] === '{') depth++;
                else if (text[i] === '}') {
                    depth--;
                    if (depth === 0) { ranges.push([match.index, i + 1]); break; }
                }
            }
        }
        for (let i = ranges.length - 1; i >= 0; i--) {
            text = text.slice(0, ranges[i][0]) + text.slice(ranges[i][1]);
        }
    }

    return text;
}

async function loadAsset0(url) {
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

    vrmlText = preprocessVRML(vrmlText);

    const loader = new VRMLLoader();
    const vrmlScene = loader.parse(vrmlText);

    const box = new THREE.Box3().setFromObject(vrmlScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 50 / maxDim : 1;

    vrmlScene.scale.multiplyScalar(scale);
    vrmlScene.position.sub(center).multiplyScalar(scale);

    scene.add(vrmlScene);

    camera.position.set(0, 0, 80);
    camera.lookAt(0, 0, 0);
}

function loadAsset1(url) {
    const loader = new VRMLLoader();

    loader.load(url, function (object) {
        vrmlScene = object;
        scene.add(object);
        controls.reset();
    });
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