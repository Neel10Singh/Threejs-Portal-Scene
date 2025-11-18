import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
import floorVertexShader from './shaders/floor/vertex.glsl'
import floorFragmentShader from './shaders/floor/fragment.glsl'


/**
 * Base
 */
// Debug
const gui = new GUI({
    width: 400,
})
gui.close();

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const debugObject = {}

/**
 * Texture
*/
const bakedTexture = textureLoader.load(
    'baked.jpg',
    (texture)=>{
    },
    ()=>{
        
    },
    ()=>{
        
    }
)
bakedTexture.flipY = false //loaded is flipped
bakedTexture.colorSpace = THREE.SRGBColorSpace

debugObject.fillColor = "#1c7f8d";
debugObject.glowCOlor = "#bef5f5"

/**
 * Materials
 */
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture});
const poleLightMaterial = new THREE.MeshBasicMaterial({color:0xffffe5})
// const portalMaterial = new THREE.MeshBasicMaterial({color:0xbef5f5})
const portalMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: {value: 0},
        uInsideColor : {value: new THREE.Color(debugObject.fillColor)},
        uOutsideColor : {value: new THREE.Color(debugObject.glowCOlor)}
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
})

gui.addColor(debugObject, 'fillColor').name("fillColor").onChange(()=>portalMaterial.uniforms.uInsideColor.value.set(debugObject.fillColor))
gui.addColor(debugObject, 'glowCOlor').name("glowColor").onChange(()=>portalMaterial.uniforms.uOutsideColor.value.set(debugObject.glowCOlor))

/**
 * Model
 */

const axeGroup = new THREE.Group();

gltfLoader.load(
    'PortalScene.glb',
    (gltf)=>{

        
        const poleLightAMesh = gltf.scene.children.find((child)=> {return child.name === 'PoleLightA'})
        const poleLightBMesh = gltf.scene.children.find((child)=> {return child.name === 'PoleLightB'})
        const portalLightMesh = gltf.scene.children.find((child)=> {return child.name === 'PortalLight'})
        const bakedMesh = gltf.scene.children.find((child)=> {return child.name === 'baked'})
        const axeHandleMesh = gltf.scene.children.find((child)=> {return child.name === 'AxeHandle'})
        const axeHeadMesh = gltf.scene.children.find((child)=> {return child.name === 'AxeHead'})
        const floorMesh = gltf.scene.children.find((child)=> {return child.name === 'Plane'})
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        portalLightMesh.material = portalMaterial
        bakedMesh.material = bakedMaterial
        axeHandleMesh.material = bakedMaterial
        axeHeadMesh.material = bakedMaterial
        floorMesh.material = bakedMaterial

        axeGroup.position.copy(axeHandleMesh.position);

        // Step 3: reset the children's local positions to zero
        axeHandleMesh.position.set(0,0,0);
        axeHeadMesh.position.set(-0.02,-0.08,0);

        axeGroup.add(axeHandleMesh);
        axeGroup.add(axeHeadMesh);

        scene.add(axeGroup);

        scene.add(gltf.scene)

    }
)
/** 
 * Dummy floor
 */
const PLANE_SIZE = 4;
const BLADE_COUNT = 200000;
const BLADE_WIDTH = 0.025;
const BLADE_HEIGHT = 0.05;
const BLADE_HEIGHT_VARIATION = 0.01;

const grassTexture = new THREE.TextureLoader().load('GrassFloor.jpg');
grassTexture.flipY = false //loaded is flipped
grassTexture.colorSpace = THREE.SRGBColorSpace

const grassMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: {value: grassTexture},
    uTime: {value: 0}
  },
  vertexShader: floorVertexShader,
  fragmentShader: floorFragmentShader,
  vertexColors: true,
  side: THREE.DoubleSide
});

generateField();

function convertRange (val, oldMin, oldMax, newMin, newMax) {
  return (((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
}

function generateField () {
  const positions = [];
  const uvs = [];
  const indices = [];
  const colors = [];

  for (let i = 0; i < BLADE_COUNT; i++) {
    const VERTEX_COUNT = 5;
    const surfaceMin = PLANE_SIZE / 2 * -1;
    const surfaceMax = PLANE_SIZE / 2;
    const radius = PLANE_SIZE / 2;

    const half = PLANE_SIZE / 2;
    const x = THREE.MathUtils.lerp(-half, half, Math.random());
    const y = THREE.MathUtils.lerp(-half, half, Math.random());

    const pos = new THREE.Vector3(x, 0, y);

    const uv = [convertRange(pos.x, surfaceMin, surfaceMax, 0, 1), convertRange(pos.z, surfaceMin, surfaceMax, 0, 1)];

    const blade = generateBlade(pos, i * VERTEX_COUNT, uv);
    blade.verts.forEach(vert => {
      positions.push(...vert.pos);
      uvs.push(...vert.uv);
      colors.push(...vert.color);
    });
    blade.indices.forEach(indice => indices.push(indice));
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
//   geom.computeFaceNormals();

  const mesh = new THREE.Mesh(geom, grassMaterial);
  scene.add(mesh);
}

function generateBlade (center, vArrOffset, uv) {
  const MID_WIDTH = BLADE_WIDTH * 0.5;
  const TIP_OFFSET = 0.005;
  const height = BLADE_HEIGHT + (Math.random() * BLADE_HEIGHT_VARIATION);

  const yaw = Math.random() * Math.PI * 2;
  const yawUnitVec = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const tipBend = Math.random() * Math.PI * 2;
  const tipBendUnitVec = new THREE.Vector3(Math.sin(tipBend), 0, -Math.cos(tipBend));

  // Find the Bottom Left, Bottom Right, Top Left, Top right, Top Center vertex positions
  const bl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((BLADE_WIDTH / 2) * 1));
  const br = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((BLADE_WIDTH / 2) * -1));
  const tl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * 1));
  const tr = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * -1));
  const tc = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(tipBendUnitVec).multiplyScalar(TIP_OFFSET));

  tl.y += height / 2;
  tr.y += height / 2;
  tc.y += height;

  // Vertex Colors
  const black = [0, 0, 0];
  const gray = [0.5, 0.5, 0.5];
  const white = [1.0, 1.0, 1.0];

  const verts = [
    { pos: bl.toArray(), uv: uv, color: black },
    { pos: br.toArray(), uv: uv, color: black },
    { pos: tr.toArray(), uv: uv, color: gray },
    { pos: tl.toArray(), uv: uv, color: gray },
    { pos: tc.toArray(), uv: uv, color: white }
  ];

  const indices = [
    vArrOffset,
    vArrOffset + 1,
    vArrOffset + 2,
    vArrOffset + 2,
    vArrOffset + 4,
    vArrOffset + 3,
    vArrOffset + 3,
    vArrOffset,
    vArrOffset + 2
  ];

  return { verts, indices };
}


/**
 * Fireflies
 */
const fireflyGeometry = new THREE.BufferGeometry();
const fireflyCount = 35
const positionArray = new Float32Array(fireflyCount * 3);
const scaleArray = new Float32Array(fireflyCount)

for(let i = 0; i < fireflyCount; i++){
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = (Math.random()) * 1.7
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}
fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
fireflyGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

const fireflyMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    uniforms: {
        uTime: {value: 0},
        uPixelRatio : {value: Math.min(window.devicePixelRatio, 2)},
        uSize: {value: 140}
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader
})
const fireflyMesh = new THREE.Points(
    fireflyGeometry,
    fireflyMaterial
)
scene.add(fireflyMesh)

gui.add(fireflyMaterial.uniforms.uSize, 'value').min(0).max(200).step(1).name('fireFlySize')


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
let radius = window.innerWidth < 720 ? 8 : 5;

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    if(sizes.width < 720) radius = 8;
    else radius = 4;

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    fireflyMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1.5
camera.position.y = 1.5
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

controls.update(); // compute angles first



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


debugObject.clearColor = 0x1a1a1a
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange((color)=>{renderer.setClearColor(color)})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    portalMaterial.uniforms.uTime.value = elapsedTime
    fireflyMaterial.uniforms.uTime.value = elapsedTime
    grassMaterial.uniforms.uTime.value = elapsedTime
    if (axeGroup) {
        axeGroup.position.y = (Math.abs(Math.sin(elapsedTime * 1.5 )) * 0.6) + 0.38
        axeGroup.rotation.z = - (Math.abs(Math.sin(elapsedTime * 1.5)) ) 
    }
    
    // Update controls
    // if(axeHandle)console.log(axeHandle.position.y)
    // camera.position.x = Math.cos(elapsedTime * 0.3) * radius;
    // camera.position.z = Math.sin(elapsedTime * 0.3) * radius;

    
    
    camera.lookAt(0, 0, 0);  
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()