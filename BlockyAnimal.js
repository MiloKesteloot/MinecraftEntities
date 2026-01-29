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
    document.getElementById('yawSlide').addEventListener('input', function() {g_globalYawAngle = -this.value;})
    document.getElementById('pitchSlide').addEventListener('input', function() {g_globalPitchAngle = -this.value;})
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
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    buildModel();
}

function clearScreen() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function renderScene() {

    rscalls++;

    clearScreen();

    const scale = 1/140;
    const globalRotMat = new Matrix4().scale(scale, scale, scale).rotate(g_globalPitchAngle, 1, 0, 0).rotate(g_globalYawAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GloabalRotateMatrix, false, globalRotMat.elements)
 
    // parts = {};
    // parts.body = new Cube(0, 0, 0, 64, 24, 24,           0, 0, 0, "(Math.sin(g_seconds*2)+1) * 45", 0, 1, 0).col(255, 0, 0, 255);
    // parts.body.add(new Cube(0, 0, 40, 20, 40, 20,           0, 0, 40, "(Math.sin(g_seconds*2)+1) * -45", 1, 0, 0).col(0, 255, 0, 255));
    // parts.body.children[0].add(new Cube(0, 0, 40, 40, 20, 20).col(0, 0, 255, 255));

    buildModel();

    for (const key in parts) {
        parts[key].render();
    }
}

let variable;
let parts = {};

function buildModel() {
    parts = {};
    parts.body = new Cube(0, 0, 0, 64, 24, 24,          1000, 0, 0, "Math.sin(g_seconds*g_speed - 1.9) * 0.2", 0, 1, 0);
    let tail = parts.body;
    for (let i = 0; i < 12; i++) {
        tail = tail.add(new Cube(37 + 10*i, 0, -2.5, 10, 10, 10,      37 + 10*i - 5, 0, -2.5, "Math.sin(g_seconds*g_speed + " + i/2 + ") * 2", 0, 1, 0));
        tail.add((new Cube(37 + 10*i, 0, 4.5, 6, 2, 4)).col(125, 125, 125, 255));
    }
    let neck = parts.body;
    for (let i = 0; i < 5; i++) {
        neck = neck.add(new Cube(-37 - 10*i, 0, -2.5, 10, 10, 10,       -37 - 10*i + 5, 0, -2.5, "(Math.sin(g_seconds*g_speed + " + i/1.2 + ") + 0.3) * 4", 0, 1, 0));
        neck.add((new Cube(-37 - 10*i, 0, 4.5, 6, 2, 4)).col(125, 125, 125, 255));
    }
    const head = neck.add(new Cube(-90, 0, -2.5, 16, 16, 16,       -90, 0, -2.5, "(Math.sin(g_seconds*g_speed - 1) - 0.3) * 7", 0, 1, 0));
    head.add(new Cube(-106, 0, -4, 16, 12, 5)) // nose
    head.add(new Cube(-106, 0, -8.5, 16, 12, 4,          -98, 0, -8.5, "(Math.sin(g_seconds*g_speed)+1) * 8", 0, 1, 0)) // jaw


    // Mirrored things
    for (let i = 0; i < 2; i++) {
        const n = i * 2 - 1;

        head.add(new Cube(-110, 4 * n, -0.5, 4, 2, 2)) // nostril
        head.add(new Cube(-90, 4 * n, 7.5, 6, 2, 4).col(125, 125, 125, 255)) // ear

        // Eye
        const flat = 0.01;
        head.add(new Cube(-98 - flat, 4.5 * n, 1, flat, 3, 1).col(224, 121, 250, 255))
        head.add(new Cube(-98 - flat, 4 * n, 0, flat, 4, 1).col(224, 121, 250, 255))
        head.add(new Cube(-98 - flat*2, 4.5 * n, 1, flat, 1, 1).col(204, 0, 250, 255))
        head.add(new Cube(-98 - flat*2, 4 * n, 0, flat, 2, 1).col(204, 0, 250, 255))

        const forearm = parts.body.add(new Cube(-16, 16 * n, -6, 24, 8, 8,         -24, 16 * n, -6, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 - 13", 0, 1, 0));
        const wrist = forearm.add(new Cube(5, 16 * n, -7, 24, 6, 6,         -4, 16 * n, -7, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 - 30", 0, 1, 0));
        const foot = wrist.add(new Cube(18, 16 * n, -12, 4, 8, 16,         15, 16 * n, -7, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 + 43", 0, 1, 0));

        const thigh = parts.body.add(new Cube(33, 16 * n, -3, 32, 16, 16,         25, 16 * n, -3, "(Math.sin(g_seconds*g_speed) + 0.3) * 1 - 30", 0, 1, 0));
        const shin = thigh.add(new Cube(64, 16 * n, -3, 32, 12, 12,         54, 16 * n, -3, "(Math.sin(g_seconds*g_speed + 2)) * 1 + 30", 0, 1, 0));
        const backFoot = shin.add(new Cube(82, 16 * n, -12, 6, 18, 24,         79, 16 * n, -3, "(Math.sin(g_seconds*g_speed + 2)) * 1 + 40", 0, 1, 0));

        // Wings!
        const wingFrame1 = parts.body.add(new Cube(-20, 40 * n, 12, 8, 56, 8,      -20, 12*n, 12, "((Math.sin(g_seconds*g_speed + 2.2)) * 55 - 10) * " + n, 1, 0, 0).col(125, 125, 125, 255))
        const wingFrame2 = wingFrame1.add(new Cube(-18, 96 * n, 12, 4, 56, 4,      -20, 68*n, 12, "((Math.sin(g_seconds*g_speed + 1)) * 45 + 30) * " + n, 1, 0, 0).col(125, 125, 125, 255))
        wingFrame1.add(new Plane(12, 40 * n, 12, 56, 56, 1))
        wingFrame2.add(new Plane(12, 96 * n, 12, 56, 56, 1))
    }
}

function tick() {
    requestAnimationFrame(tick);

    g_seconds = performance.now()/1000.0-g_startTime
    
    

    renderScene();
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
let g_speed = 3.7;

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
