import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'


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

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

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
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

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
    if (axeGroup) {
        axeGroup.position.y = (Math.abs(Math.sin(elapsedTime * 1.5 )) * 0.6) + 0.38
        axeGroup.rotation.z = - (Math.abs(Math.sin(elapsedTime * 1.5)) ) 
    }
    
    // Update controls
    // if(axeHandle)console.log(axeHandle.position.y)
    controls.update()
    camera.position.x = Math.cos(elapsedTime * 0.5) * 5;
    camera.position.z = Math.sin(elapsedTime * 0.5) * 5;

    camera.lookAt(0, 0, 0);  

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()