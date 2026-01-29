// import {Triangle} from './Triangle.js';

let ctx;

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
let VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GloabalRotateMatrix;
void main() {
  gl_Position = u_GloabalRotateMatrix * u_ModelMatrix * a_Position;
}`;

// Fragment shader program
let FSHADER_SOURCE =`
precision mediump float;
uniform vec4 u_FragColor;
void main() {
  gl_FragColor = u_FragColor;
}
`;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GloabalRotateMatrix;

function setUpWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl"); // , {preserveDrawingBuffer: true}
    if (!gl) {
        console.error('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);

    // CubeMesh.init();

    tick();
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.error('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.error('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_FragColor) {
        console.error('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GloabalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GloabalRotateMatrix');
    if (!u_GloabalRotateMatrix) {
        console.error('Failed to get the storage location of u_GloabalRotateMatrix');
        return;
    }

    let identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_GloabalRotateMatrix, false, identityM.elements);    
}

let fpsElement;

function setUpElements() {
    fpsElement = document.getElementById("fps");
    document.getElementById('yawSlide').addEventListener('input', function() {g_globalYawAngle = this.value;})
    document.getElementById('pitchSlide').addEventListener('input', function() {g_globalPitchAngle = this.value;})
}

let rscalls = 0;

let animalModel;
let animalAnim;

function main() {
    setUpWebGL();

    connectVariablesToGLSL();

    setUpElements();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = move;

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function clearScreen() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function renderScene() {

    rscalls++;

    clearScreen();

    const globalRotMat = new Matrix4().translate(0, 0, 0.1).rotate(g_globalPitchAngle, 1, 0, 0).rotate(g_globalYawAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GloabalRotateMatrix, false, globalRotMat.elements)
 
    drawObjAndChildren(animalModel["minecraft:geometry"][0].bones, new Matrix4());
    
}

let variable;

function tick() {
    requestAnimationFrame(tick);
    if (!loadedModelAndAnim) return;
    g_seconds = performance.now()/1000.0-g_startTime
    variable = getAnimationVariables();
    renderScene();
}

function drawObjAndChildren(obj, matrix) {
    // matrix = matrix.copy();
    if (Array.isArray(obj)) {
        for (let o of obj) {
            drawObjAndChildren(o, matrix);
        }
        return;
    }
    const cubes = obj.cubes;
    if (cubes === undefined) return;

    let rotation = undefined;

    let time = 4;

    if (obj.rotation !== undefined) {
        rotation = [eval(obj.rotation[0]), obj.rotation[1], obj.rotation[2], obj.rotation[3]];
    }

    for (let c of cubes) {
        drawCubePart(c.size, c.origin, obj.pivot, rotation);
        if (c.mirror === true) {
            const newOrigin = [c.origin[0], -c.origin[1], c.origin[2]];
            drawCubePart(c.size, newOrigin, obj.pivot, rotation);
        }
    }
}

function drawCubePart(size, origin, pivot, rotation) {
    const cube = new Cube();
    cube.color = [1, 0, 0, 1];
    
    cube.matrix.scale(0.2, 0.2, 0.2);
    cube.matrix.scale(0.2, 0.2, 0.2);
    cube.matrix.scale(0.2, 0.2, 0.2);

    if (pivot !== undefined && rotation !== undefined) {

        // 1. move to pivot
        cube.matrix.translate(pivot[0], pivot[1], pivot[2]);

        // 2. rotate around pivot
        cube.matrix.rotate(rotation[0], rotation[1], rotation[2], rotation[3]);

        // 3. move back from pivot
        cube.matrix.translate(-pivot[0], -pivot[1], -pivot[2]);
    }

    // cube.matrix.rotate(rotation[0], rotation[1], rotation[2], rotation[3])
    cube.matrix.translate(origin[0], origin[1], origin[2]);
    cube.matrix.scale(size[0], size[1], size[2]);
    cube.render();
}

function sendTextToHTML(text, ID) {
    let htmlElm = document.getElementById(ID);
    htmlElm.innerHTML = text;
}

let g_points = [];
let g_selectedColor = [1, 1, 1, 1];
let g_globalYawAngle = -30;
let g_globalPitchAngle = -30;
let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0-g_startTime;

function click(event) {
    console.error("Click event is not defined");
}
function move(event) {
    // console.error("Move event is not defined");
}

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateFPS(now) {
  frameCount++;

  const delta = now - lastTime;

  // Update FPS about once per second
  if (delta >= 1000) {
    fps = (frameCount * 1000) / delta;
    fpsElement.textContent = `FPS: ${fps.toFixed(1)}`;

    frameCount = 0;
    lastTime = now;

    console.log(rscalls);
    rscalls = 0;
  }

  requestAnimationFrame(updateFPS);
}

requestAnimationFrame(updateFPS);

let loadedModelAndAnim = false;

loadAnimal("ender_dragon");

async function loadAnimal(animal) {
    animalModel = JSON.parse(await loadFileContents("./mcpack/models/entity/" + animal + ".geo.json"));
    animalAnim = JSON.parse(await loadFileContents("./mcpack/animations/" + animal + ".animation.json"));
    loadedModelAndAnim = true;
}

// Function from ChatGPT
async function loadFileContents(file) {

    // console.log(file);

    const response = await fetch(file); // or .json, .glsl, etc.
    let text = await response.text();
    return text;
}