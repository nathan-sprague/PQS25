import * as THREE from 'three';
// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';


const size = [640, 480];
const globeSize = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(size[0], size[1]);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene(); {
    const ambientLight = new THREE.AmbientLight(0x808080); // Soft ambient light
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set(0,20,0);
    spotLight.lookAt(0,0,0)

    spotLight.castShadow = false;
    spotLight.intensity = 100;
    scene.add(spotLight)

}

const camera = new THREE.PerspectiveCamera(75, size[0] / size[1], 0.1, 1000);
camera.position.set( 0.5, 0.5, 1 );
camera.lookAt(0, 0, 0);

scene.background = new THREE.Color(0x87CEEB);

// Render the scene
renderer.render(scene, camera);

let rotationX = 0; // Pitch (up and down)
let rotationY = 0; // Yaw (left and right)
const movement = {forward: false, backward: false, left: false, right: false , up: false, down: false};
const moveSpeed = 0.02;

let mouseDown = false;
const sensitivity = 0.006;
var yaw = 0;
var pitch = 0;
let tractorModel = undefined;
let partNum = 0;

let parts = {};

function handleMouseMove(event) {

    if (document.pointerLockElement === document.body){


        const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        rotationY -= deltaX * sensitivity; 
        rotationX -= deltaY * sensitivity;

        rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

        // console.log(rotationX, rotationY);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationX);
        quaternion.multiply(pitchQuaternion);
        camera.quaternion.copy(quaternion);

    }
}

function handleClick(event){
    console.log(document.body)
    const element = document.body;
    if (document.pointerLockElement !== element)  {
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
        return;
    }
}

function handleMouseUp(event){
    mouseDown = false;
}
function handleMouseDown(event){
    mouseDown = false;
}

function meshChange(){
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const material2 = new THREE.MeshBasicMaterial({ color: 0x000000 });

    let i =0;
    tractorModel.children.forEach(child => {
        if (child.isMesh) {
            
            if (i==partNum){
                child.material = material;
                child.position.y+=2;
            } else if (i==partNum-1){
                child.material = material;
                child.position.y-=2;
            } else if (i==partNum-2){
                child.material = material2;
                child.position.y-=2;
            }
            i+=1;
        }
    });
    partNum++;
    // while (partNum < tractorModel.children.length && parts[partNum] != undefined){
    //     partNum++;
    // }
    console.log(partNum, "/", tractorModel.children.length);
    
}

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW': movement.forward = true; break;
    case 'KeyS': movement.backward = true; break;
    case 'KeyA': movement.left = true; break;
    case 'KeyD': movement.right = true; break;
    case 'ShiftLeft': movement.down = true; break;
    case 'ShiftRight': movement.down = true; break;
    case 'Space': movement.up = true; break;
    case 'KeyN': transformMesh(1, 0, 0); break;
    case 'KeyM': transformMesh(-1, 0, 0); break;
    case 'ArrowUp': transformMesh(0, 1, 0); break;
    case 'ArrowDown': transformMesh(0, -1, 0); break;
    case 'ArrowLeft': transformMesh(0, 0, -1); break;
    case 'ArrowRight': transformMesh(0, 0, 1); break;
    // case 'Enter': meshChange(); break;
    case 'Enter': exportToGLB(); break;// meshChange(); break;
  }
  // console.log(event.code);
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': movement.forward = false; break;
    case 'KeyS': movement.backward = false; break;
    case 'KeyA': movement.left = false; break;
    case 'KeyD': movement.right = false; break;
    case 'ShiftLeft': movement.down = false; break;
    case 'ShiftRight': movement.down = false; break;
    case 'Space': movement.up = false; break;
  }
});


async function exportToGLB() {
    const exporter = new GLTFExporter();
    try {
        const result = await exporter.parseAsync(tractorModel, { binary: true });

        // Save the GLB file
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'model.glb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("GLB Export Success:", blob);
    } catch (error) {
        console.error("GLB Export Error:", error);
    }
}


function loadModel(){
    // return;
    const loader = new GLTFLoader();
    loader.load("./tractor3.glb", function (gltf) {
        const model = gltf.scene;
        console.log(model)
        // Adjust materials
        const unusedParts = {
            270: "engine", 23: "drivelinePart", 34: "drivelinePart", 83: "drivelinePart", 274: "drivelinePart", 280: "drivelinePart",
            281: "drivelinePart", 284:"drivelinePart", 276: "drivelinePart", 285: "drivelinePart", 325:"drivelinePart", 155: "drivelinePart", 217: "lowerBeltPulley",
            146: "clutchPart", 150: "clutchPart", 153: "clutchPart", 160: "clutchPart", 90: "transaxlePart",91:"transaxlePart", 28: "rightFenderSupport1", 29: "rightFenderSupport2", 33: "leftFenderSupport1", 
            79: "leftFenderSupport2", 124: "leftFootrestSupport1", 125: "leftFootrestSupport2", 126: "leftFootrestSupport3", 127: "leftFootrestSupport4",
            128: "rightFootrestSupport1", 129: "rightFootrestSupport2", 131: "rightFootrestSupport3", 132: "rightFootrestSupport4",

             // 81: "leftRearWheelHub", 82: "leftTire", 335: "leftFrontWheelHub", 345: "frontRightWheelHub", 346: "rightFrontTire", 334: "frontLeftWheelHub", 344: "frontRightWheelHub",
             // 346: "rightFrontTire", 143: "rightTire", 144: "leftHub", 346: "rightFrontTire",  337: "leftFrontTire", 60: "joystick"
             
        }
        parts = {0: "hitchBlock", 
                        3: "lowRightAxle4LinkMount", 4: "lowRight4link", 5: "lowRightFrame4linkMount", 8:"rightSteerKunckleBolt", 13: "lowerFrame4linkMount", 14: "airbag",
                        15: "topLeftAxle4Linktab", 16: "bottomLeftAxle4Linktab", 19: "ackermannTieRod", 20: "topRighttAxle4Linktab",
                        21: "bottomRightAxle4Linktab",  24: "steerActuatorMount", 25: "topAirbagMount", 26: "lefttSteerKunckleBolt",
                        27: "bottomAirbagMount", 30: "stupidSwitch", 31: "stupidSwitchMount",
                        32: "killSwitch", 35: "rightFender", 36: "seatMount", 37: "armrestSupport2",
                        38: "seat", 39: "seat", 56: "exhaustShieldSide", 60: "joystick", 67: "engine", 68: "leftArmrest", 69: "seat", 70: "rightArmrestMount", 72: "rightArmrest",
                        74: "seat", 75: "armrestSupport", 76: "armrestSupport1", 77: "leftFender", 78: "exhaustStack", 
                        80: "stupidSwitchMountTab", 81: "rightRearHub", 82: "leftTire",  84: "transaxlePart", 85: "transaxlePart",
                        87: "transaxlePart", 88: "transaxlePart", 130:"rightFootrest",
                        89: "engine", 101: "transaxleShiftLever", 111: "firewallTopTube", 122: "leftFootrest",
                        133: "leftBrakePedal", 135: "leftBrakePedalPart", 136: "leftBrakePedalReservoir", 137: "rightBrakePedal", 138: "rightBrakePedalReservoir", 139: "rightBrakePedalPart", 140: "hitchBasePlate",
                        141: "hitchAttachment", 142: "hitch", 143: "rightTire", 144: "leftRearHub", 168: "batteryCutoffSwitch", 169: "battery",
                        170: "batteryBox", 171: "batteryHolder", 172: "engineMount", 173: "topDrivelineShield", 174: "leftFirewallSupport", 175: "frontActuatorShield",
                        176: "beltShield", 179:"beltShieldSide", 180:"beltShieldSide", 181: "beltShieldSide", 189:"beltShieldRearPlate",
                        222: "rightFirewallPost", 224: "clutchPedal", 225: "clutchPedalReservoir", 226: "clutchPedalPart",
                        228: "wheelieBar", 231: "wheelieBar", 233: "wheelieBar", 235: "leftFrameRail", 237: "wheelieBar", 238: "wheelieBar", 241: "rightFrameRail",
                        272: "engine", 273: "rightFirewallSupport", 275: "lowerDrivelineShield", 
                        279: "towHitch", 282: "leftDrivelineFrameReinforcement",
                        283: "rightDrivelineFrameReinforcement",286: "firewallRightLbracket",
                        287: "ShiftKnob", 292: "leftFirewallPost", 303: "firewall", 304: "engine", 306: "engine", 311: "exhaustShieldSide", 312:"exhaustShield",
                        314: "firewallGrabHandle", 316: "actuator", 317: "actuator", 318: "actuator", 319:"actuator",
                        328: "actuator", 329: "actuator", 335: "leftFrontWheelHub", 337: "leftFrontTire", 338: "4linkmount", 339: "4linkmount",
                        340: "4link", 341: "frontRightsteeringknuckle", 342: "ackermannTieRodKnuckle", 345: "frontRightWheelHub", 346: "rightFrontTire",
                        348: "ackermannTieRodKnuckle", 351: "4linkmount", 352: "4linkmount", 353: "4link", 355: "4link", 356: "4linkmount", 357: "frontAxle", 
                        91: "transaxlePart",
                        96: "shifterPart", 102: "shifterPart", 120: "shifterPart", 177: "beltShieldPlate", 189: "beltShieldFrontPlate",
                        322: "actuator", 327: "actuator", 334: "frontLeftWheelHub", 344: "frontRightWheelHub"
                    }
        // parts = {82: "leftTire", 143: "rightTire", 144: "leftRearHub", 81: "rightRearHub"}
        // parts = {  345: "frontRightWheelHub", 346: "rightFrontTire", 344: "frontRightWheelHub",
        parts = {60: "joystick"};

        const tireColor = 0x303030;
        const gold = 0xdaaa00;
        const pedalColor = 0x303030;
        const lightGray = 0xc0c0c0;

        const colors = {"airbag": 0x101010, "towHitch": gold, "engine": 0x505050, "transaxlePart": 0x505050, 
                        "leftTire": tireColor, "rightFrontTire": tireColor, "leftFrontTire": tireColor, "exhaustShield": 0xc0c0c0, "exhaustShieldSide": 0xc0c0c0,
                        "clutchPedalPart": pedalColor, "clutchPedal": pedalColor, "leftBrakePedal": pedalColor, "rightBrakePedal": pedalColor,
                        "seat": 0x101010, "joystick": 0x080808, "shifterPart": 0x000000, "rightArmrest": gold, "engineMount": gold, 
                        "leftBrakePedalReservoir": lightGray, "rightBrakePedalReservoir": lightGray, "clutchPedalReservoir": lightGray, "firewall": gold,
                        "leftRearHub": lightGray, "rightRearHub": lightGray, "frontLeftWheelHub": lightGray, "frontRightWheelHub": lightGray, "leftFrontWheelHub": lightGray,
                        "actuator": lightGray, "topDrivelineShield": gold
                    };
        let i=0;
        model.position.set(0,0.5,0)

        const namesUsed = {}
        

        const childrenRemove = [];
        model.children.forEach(child => {
            if (child.isMesh) {
                // const material = new THREE.MeshPhongMaterial({ color:  0xff0000, emissive: 0x101010, shininess: 40, specular: 0xff0000});
                // child.material = material;
                // console.log("changed")
                if (unusedParts[i] != undefined){
                    // child.position.set(0,100,0);
                    childrenRemove.push(child)
                }else if (parts[i] == undefined){

                    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    // const material = new THREE.MeshPhongMaterial({ color:  0xff0000});
                    // child.material = material;
                    // child.position.set(0,100,0);
                    // console.log(i)
                    childrenRemove.push(child);

                } else {
                    // child.position.set(0,100,0);
                    if (colors[parts[i]] == undefined){
                        child.material.color.set(0x202020);
                    } else {
                        child.material.color.set(colors[parts[i]]);
                    }
                    child.material.specular = 0xffffff;

                    const n = parts[i];
                    if (namesUsed[i] != undefined){
                        namesUsed[i]++;
                        child.name = n + namesUsed[i];
                    } else {
                        namesUsed[i] = 1;
                        child.name = n

                    }

                }
                    
                    // child.material.color = new THREE.Color(1, 0/255, 0/255);
                    // child.material.metalness = 0.1;
                    // child.material.roughness = 0.9;
                    // scene.add(child);
                // } else {

                // }
                i+=1;
                // const material = new THREE.MeshBasicMaterial({ color: 0x303030 });
                // child.material = material;
                // child.material.color = new THREE.Color(1, 0/255, 0/255);
                
                // console.log(child.material)
            }
        });

        for (i of childrenRemove){
            model.remove(i);
        }
        console.log(model)

        scene.add(model);
        

        // Create a group and add both the model and the cube
        // const group = new THREE.Group();
        // group.add(model);
        
        // group.add(cube2)
        
        tractorModel = model;
    }, undefined, function (error) {
        console.error(error);
    });
}



function makeGround(){
    const geometry = new THREE.PlaneGeometry(globeSize, globeSize);
    const material = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}


function makeCube(x,y,z){
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); 
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;
    return cube
}



function animate() {
    if (document.pointerLockElement !== document.body) {
    }

    // const direction = new THREE.Vector3();

    // if (movement.forward) {
    //     direction.z -= moveSpeed;
    // } if (movement.backward) {
    //     direction.z += moveSpeed;
    // } if (movement.left) {
    //     direction.x -= moveSpeed;
    // } if (movement.right) {
    //     direction.x += moveSpeed;
    // }

    // direction.applyEuler(camera.rotation);
    const direction = new THREE.Vector3();

    let forward = 0;
    let side = 0;
    if (movement.forward) {
        forward -= moveSpeed;
    } if (movement.backward) {
        forward += moveSpeed;
    } if (movement.left) {
        side -= moveSpeed;
    } if (movement.right) {
        side += moveSpeed;
    }
    direction.x = forward*Math.sin(rotationY) + side*Math.sin(rotationY+Math.PI/2);
    direction.z = forward*Math.cos(rotationY) + side*Math.cos(rotationY+Math.PI/2);

    direction.y = 0;
    camera.position.add(direction);

    if (movement.up){
        camera.position.y += moveSpeed;
    } if (movement.down){
        camera.position.y -= moveSpeed;
    }


    renderer.render(scene, camera);
    
}

document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
renderer.domElement.addEventListener('click', handleClick);

makeGround();
// const cubeExample = makeCube(1,1,1)
loadModel()
renderer.setAnimationLoop(animate);
