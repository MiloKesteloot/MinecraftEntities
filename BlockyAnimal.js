// import {Triangle} from './Triangle.js';

let ctx;

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
let VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GloabalRotateMatrix;

attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;
void main() {
    gl_Position = u_GloabalRotateMatrix * u_ModelMatrix * a_Position;
    v_TexCoord = a_TexCoord;
}`;

// TODO Remove if for using texture vs color once they all use texture
// Fragment shader program
let FSHADER_SOURCE =`
precision mediump float;
uniform vec4 u_FragColor;
uniform sampler2D u_Sampler;
uniform int u_UseTexture;
varying vec2 v_TexCoord;
void main() {
    vec4 color;
    if (u_UseTexture == 1) {
        vec4 texColor = texture2D(u_Sampler, v_TexCoord);
        color = texColor * u_FragColor;
        if (color.a < 0.1) {
            discard;
        }
    } else {
        color = u_FragColor;
    }
    gl_FragColor = color;
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

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.DEPTH_TEST);
}

function getAttribLocation(program, name) {
    let attrib = gl.getAttribLocation(program, name);
    if (attrib < 0) {
        console.error('Failed to get the storage location of ' + name);
        return null;
    }
    return attrib;
}

function getUniformLocation(program, name) {
    let uniform = gl.getUniformLocation(program, name);
    if (!uniform) {
        console.error('Failed to get the storage location of ' + name);
        return null;
    }
    return uniform;
}

let texture;
let image;

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to intialize shaders.');
        return;
    }

    a_Position = getAttribLocation(gl.program, 'a_Position');
    a_TexCoord = getAttribLocation(gl.program, 'a_TexCoord');


    u_FragColor = getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GloabalRotateMatrix = getUniformLocation(gl.program, 'u_GloabalRotateMatrix');
    u_Sampler = getUniformLocation(gl.program, 'u_Sampler');
    u_UseTexture = getUniformLocation(gl.program, 'u_UseTexture');

    let identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_GloabalRotateMatrix, false, identityM.elements);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    image = new Image();
    
    image.onload = () => {
        // Flip the image's y axis
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Upload the image into the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };

    image.src = './mcpack/textures/entity/dragon/dragon.png';
    // image.src = './test.png';
}

let fpsElement;
let pauseButton;
let paused = false;

function setUpElements() {
    fpsElement = document.getElementById("fps");
    pauseButton = document.getElementById("pauseButton");
    document.getElementById('neckYawAngleSlide').addEventListener('input', function() {g_neckYawAngle = -this.value;})
    document.getElementById('neckPitchAngleSlide').addEventListener('input', function() {g_neckPitchAngle = -this.value;})
    document.getElementById('thighAngleSlide').addEventListener('input', function() {g_thighAngle = -this.value;})
    document.getElementById('calfAngleSlide').addEventListener('input', function() {g_calfAngle = -this.value;})
    document.getElementById('backFootAngleSlide').addEventListener('input', function() {g_backFootAngle = -this.value;})
    document.getElementById('forearmAngleSlide').addEventListener('input', function() {g_forearmAngle = -this.value;})
    document.getElementById('wristAngleSlide').addEventListener('input', function() {g_wristAngle = -this.value;})
    document.getElementById('footAngleSlide').addEventListener('input', function() {g_footAngle = -this.value;})
    document.getElementById('yawSlide').addEventListener('input', function() {g_globalYawAngle = -this.value;})
    document.getElementById('pitchSlide').addEventListener('input', function() {g_globalPitchAngle = -this.value;})
}

function pauseButtonClicked() {
    paused = !paused;
    if (paused) {
        pauseButton.value = "Play Animation";
    } else {
        pauseButton.value = "Pause Animation";
    }
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
    canvas.onmouseup = clickup;
    canvas.onmouseleave = exit;
    canvas.onwheel = scroll;

    // Specify the color for clearing <canvas>
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearColor(0, 0, 0, 1);
    // gl.clearColor(20/255, 16/255, 20/255, 1.0);

    buildModel();

    tick();
}

function clearScreen() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function renderScene() {    
    rscalls++;

    clearScreen();

    const scale = 1/160 * g_globalScale;
    const globalRotMat = new Matrix4().scale(scale, scale, scale).rotate(g_globalPitchAngle, 1, 0, 0).rotate(g_globalYawAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GloabalRotateMatrix, false, globalRotMat.elements)
 
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
    parts.body.applyTexture("top", [8*8, 24*8, 3*8, 8*8]);
    parts.body.applyTexture("bottom", [11*8, 24*8, 3*8, 8*8]);
    parts.body.applyTexture(["left", "right"], [11*8, 21*8, 8*8, 3*8], 1);
    parts.body.applyTexture(["front", "back"], [8*8, 21*8, 8*3, 3*8]);
    for (let i = 0; i < 3; i++) {
        const blade = parts.body.add(new Cube(-20 + 20*i, 0, 15, 12, 2, 6));
        blade.applyTexture(["left", "right"], [256 - 5*8 + 4, 256 - 9*8 + 1 + 6, 12, -6], 1)
        blade.applyTexture(["front"], [256 - 5*8 + 4 + 12, 256 - 9*8 + 1, 2, 6])
        blade.applyTexture(["back"], [256 - 5*8 + 4 + 12 + 14, 256 - 9*8 + 1, 2, 6])
        blade.applyTexture(["top", "bottom"], [256 - 5*8 + 4 + 12, 256 - 9*8 + 1 + 6, 2, 12])
    }
    let tail = parts.body;
    for (let i = 0; i < 12; i++) {
        tail = tail.add(new Cube(37 + 10*i, 0, -2.5, 10, 10, 10,      37 + 10*i - 5, 0, -2.5, "Math.sin(g_seconds*g_speed + " + i/2 + ") * 2", 0, 1, 0));
        tail.applyTexture("all", [24*8 + 1*10, 16*8+4, 10, 10], (i*2+1)%4);
        tail.applyTexture("top", [24*8 + 1*10, 16*8+4 + 10, 10, 10]);
        tail.applyTexture("back", [24*8 + 1*10, 16*8+4, 10, 10]);
        const nob = tail.add((new Cube(37 + 10*i, 0, 4.5, 6, 2, 4)).col(125, 125, 125, 255));
        nob.applyTexture(["left", "right"], [6, 256 - 6, -6, -4], 1);
        nob.applyTexture(["back"], [6, 256 - 6 - 4, 2, 4]);
        nob.applyTexture(["top", "bottom"], [6, 256, 2, -6]);
        nob.applyTexture(["front"], [6, 256 - 6 + 2, 2, 4]);
    }
    let neck = parts.body;
    for (let i = 0; i < 5; i++) {
        neck = neck.add(new Cube(-37 - 10*i, 0, -2.5, 0.01, 0.01, 0.01,       -37 - 10*i + 5, 0, -2.5, g_neckYawAngle, 0, 0, 1))
        neck = neck.add(new Cube(-37 - 10*i, 0, -2.5, 10, 10, 10,       -37 - 10*i + 5, 0, -2.5, "(Math.sin(g_seconds*g_speed + " + i/1.2 + ") + 0.3) * 4 + " + g_neckPitchAngle, 0, 1, 0));
        neck.applyTexture("all", [24*8 + 1*10, 16*8+4, 10, 10], (i*2+1)%4);
        neck.applyTexture("top", [24*8 + 1*10, 16*8+4 + 10, 10, 10]);
        const nob = neck.add((new Cube(-37 - 10*i, 0, 4.5, 6, 2, 4)).col(125, 125, 125, 255));
        nob.applyTexture(["left", "right"], [0, 256 - 6, 6, -4], 1);
        nob.applyTexture(["front"], [6, 256 - 6 - 4, 2, 4]);
        nob.applyTexture(["top", "bottom"], [6, 256 - 6, 2, 6]);
        nob.applyTexture(["back"], [6, 256 - 6 + 2, 2, 4]);
    }

    const head = neck.add(new Cube(-90, 0, -2.5, 16, 16, 16,       -90, 0, -2.5, "(Math.sin(g_seconds*g_speed - 1) - 0.3) * 7", 0, 1, 0));
    {
        head.applyTexture("front", [16*8, 24*8+2, 2*8, 2*8]);
        head.applyTexture("top", [16*8, 26*8+2, 2*8, 2*8]);
        head.applyTexture("left", [18*8, 24*8+2, 2*8, 2*8], 3);
        head.applyTexture("right", [18*8, 24*8+2, 2*8, 2*8], 3);
        head.applyTexture("bottom", [18*8, 26*8+2, 2*8, 2*8]);
        head.applyTexture("back", [18*8, 26*8+2, 2*8, 2*8]);
    }
    const nose = head.add(new Cube(-106, 0, -4, 16, 12, 5,           )) // nose
    nose.applyTexture("top", [24*8, 24*8 + 4, 12, 16]);
    nose.applyTexture(["front", "back"], [24*8, 24*8 -1, 12, 5]);
    nose.applyTexture("bottom", [24*8 + 12, 24*8 + 4, 12, 16]);
    nose.applyTexture(["left", "right"], [24*8 + 12, 24*8 - 1, 16, 5], 1);
    const jaw = head.add(new Cube(-106, 0, -8.5, 16, 12, 4,          -98, 0, -8.5, "(Math.sin(g_seconds*g_speed)+1) * 8", 0, 1, 0)) // jaw
    jaw.applyTexture("top", [24*8, 24*8 - 1 - 16, 12, 16]);
    jaw.applyTexture("bottom", [24*8 + 12, 24*8 - 1 - 16, 12, 16]);
    jaw.applyTexture(["front", "back"], [24*8, 24*8 - 1 - 16 - 4, 12, 4]);
    jaw.applyTexture(["left", "right"], [24*8 - 16, 24*8 - 1 - 16 - 4, 12, 4], 1);

    // Mirrored things
    for (let i = 0; i < 2; i++) {
        const n = i * 2 - 1;

        nose.add(new Cube(-110, 4 * n, -0.5, 4, 2, 2)) // nostril
        const ear = head.add(new Cube(-90, 4 * n, 7.5, 6, 2, 4).col(125, 125, 125, 255)) // ear
        ear.applyTexture(["left", "right"], [0, 256 - 6, 6, -4], 1);
        ear.applyTexture(["front"], [6, 256 - 6 - 4, 2, 4]);
        ear.applyTexture(["top", "bottom"], [6, 256 - 6, 2, 6]);
        ear.applyTexture(["back"], [6, 256 - 6 + 2, 2, 4]);

        const forearm = parts.body.add(new Cube(-16, 12 * n, -6, 24, 8, 8,         -24, 16 * n, -6, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 - 13 + " + g_forearmAngle, 0, 1, 0));
        forearm.applyTexture(["top", "bottom", "left", "right"], [14*8, 15*8, 1*8, 3*8])
        forearm.applyTexture(["front", "back"], [15*8, 18*8, 1*8, 1*8])
        const wrist = forearm.add(new Cube(5, 12 * n, -7, 24, 6, 6,         -4, 16 * n, -7, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 - 30 + " + g_wristAngle, 0, 1, 0));
        wrist.applyTexture(["top", "bottom", "left", "right"], [256-8*4+2, 11*8, 6, 24])
        wrist.applyTexture(["front", "back"], [256-8*4+2 + 6, 14*8, 6, 6])
        const foot = wrist.add(new Cube(18, 12 * n, -12, 4, 8, 16,         15, 16 * n, -7, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 + 43 + " + g_footAngle, 0, 1, 0));
        foot.applyTexture(["front", "back"], [20*8, 16*8+8, 8, 16])
        foot.applyTexture("bottom", [20*8, 16*8+4+4, 8, -4])
        foot.applyTexture("top", [21*8, 16*8+4, 8, 4])
        foot.applyTexture(["left", "right"], [18*8, 16*8+4, 16, 4])

        const thigh = parts.body.add(new Cube(33, 16 * n, -3, 32, 16, 16,         25, 16 * n, -3, "(Math.sin(g_seconds*g_speed) + 0.3) * 1 - 30 + " + g_thighAngle, 0, 1, 0));
        thigh.applyTexture(["front", "back"], [8*2, 256-16, 16, 16]);
        thigh.applyTexture(["top", "bottom", "left", "right"], [8*2, 256-16-32, 16, 32]);
        const shin = thigh.add(new Cube(64, 16 * n, -3, 32, 12, 12,         54, 16 * n, -3, "(Math.sin(g_seconds*g_speed + 2)) * 1 + 30 + " + g_calfAngle, 0, 1, 0));
        shin.applyTexture(["front", "back"], [256 - 6*8, 256 - 12, 12, 12])
        shin.applyTexture(["top", "bottom", "left", "right"], [256 - 6*8, 256 - 12 - 32, 12, 32])
        const backFoot = shin.add(new Cube(82, 16 * n, -12, 6, 18, 24,         79, 16 * n, -3, "(Math.sin(g_seconds*g_speed + 2)) * 1 + 40 + " + g_backFootAngle, 0, 1, 0));
        backFoot.applyTexture(["front"], [17*8, 256-8*3, 18, 24]);
        backFoot.applyTexture(["back"], [17*8 + 18, 256-8*3, 18, 24]);
        backFoot.applyTexture(["bottom"], [17*8, 256-8*3, 18, -6]);
        backFoot.applyTexture(["top"], [17*8 + 18 + 24, 256-8*3, 18, -6]);
        backFoot.applyTexture(["left", "right"], [17*8 + 18, 256-8*3, 18, -6]);

        // Wings!
        const wingFrame1 = parts.body.add(new Cube(-20, 40 * n, 12, 8, 56, 8,      -20, 12*n, 12, "((Math.sin(g_seconds*g_speed + 2.2)) * 55 - 10) * " + n, 1, 0, 0).col(125, 125, 125, 255))
        wingFrame1.applyTexture(["left", "right"], [14*8, 19*8, 1*8, 1*8]);
        wingFrame1.applyTexture(["top", "bottom", "front", "back"], [15*8, 20*8, 7*8, 1*8]);
        const wingFrame2 = wingFrame1.add(new Cube(-18, 96 * n, 12, 4, 56, 4,      -20, 68*n, 12, "((Math.sin(g_seconds*g_speed + 1)) * 45 + 30) * " + n, 1, 0, 0).col(125, 125, 125, 255))
        wingFrame2.applyTexture(["left", "right"], [14*8, 14*8, 1*4, 1*4]);
        wingFrame2.applyTexture(["top", "bottom", "front", "back"], [15*8, 14*8, 7*8, 1*4]);
        const flapClose = wingFrame1.add(new Plane(12, 40 * n, 12, 56, 56, 1));
        flapClose.transparent = true;
        if (n === 1) {
            flapClose.applyTexture("top", [0, 14*8, 7*8,  7*8]);
        } else {
            flapClose.applyTexture("top", [7*8, 14*8, -7*8, 7*8]);
        }
        const flapFar = wingFrame2.add(new Plane(12, 96 * n, 12, 56, 56, 1));
        flapFar.transparent = true;
        if (n === 1) {
            flapFar.applyTexture("top", [0, 7*8, 7*8, 7*8]);
        } else {
            flapFar.applyTexture("top", [7*8, 7*8, -7*8, 7*8]);
        }
    }
}

function tick() {
    requestAnimationFrame(tick);

    if (!paused) {
        g_seconds = performance.now()/1000.0-g_startTime
    }
    
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
let g_globalScale = 1;
let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0-g_startTime;
let g_speed = 3.7;

// Animation thingies:
let g_neckYawAngle = 0;
let g_neckPitchAngle = 0;
let g_thighAngle = 0;
let g_calfAngle = 0;
let g_backFootAngle = 0;
let g_forearmAngle = 0;
let g_wristAngle = 0;
let g_footAngle = 0;

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

    rscalls = 0;
  }

  requestAnimationFrame(updateFPS);
}

requestAnimationFrame(updateFPS);

// Below code was hevily inspired by ChatGPT code

let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let dragSensitivity = 0.8;

function click(event) {
    dragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}
function move(event) {
    if (!dragging) {
        return;
    }
    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;
    dragX = deltaX * dragSensitivity;
    dragY = deltaY * dragSensitivity;
    g_globalYawAngle -= dragX;
    g_globalPitchAngle -= dragY;

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}
function clickup(event) {
    dragging = false;
}
function exit(event) {
    dragging = false;
}
function scroll(event) {
    const scroll = event.deltaY;
    g_globalScale *= (-scroll) * 0.001 + 1;
    event.preventDefault();
}
