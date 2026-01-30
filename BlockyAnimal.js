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

    // Specify the color for clearing <canvas>
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    buildModel();

    tick();
}

function clearScreen() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function renderScene() {    
    rscalls++;

    clearScreen();

    const scale = 1/160;
    const globalRotMat = new Matrix4().scale(scale, scale, scale).rotate(g_globalPitchAngle, 1, 0, 0).rotate(g_globalYawAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GloabalRotateMatrix, false, globalRotMat.elements)
 
    parts = {};
    // parts.body = new Cube(0, 0, 0, 100, 100, 100).col(255, 0, 0, 255);
    // parts.body.applyTexture(
    //     "top",
    //     [0, 0, 512, 512]
    // );
    // parts.body.applyTexture(
    //     "bottom",
    //     [0, 0, 512, 512]
    // );
    // parts.body.applyTexture(
    //     "front",
    //     [0, 0, 512, 512]
    // );
    // parts.body.applyTexture(
    //     "back",
    //     [0, 0, 512, 512]
    // );
    // parts.body.applyTexture(
    //     "left",
    //     [0, 0, 512, 512]
    // );
    // parts.body.applyTexture(
    //     "right",
    //     [0, 0, 512, 512]
    // );

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
        neck = neck.add(new Cube(-37 - 10*i, 0, -2.5, 0.01, 0.01, 0.01,       -37 - 10*i + 5, 0, -2.5, g_neckYawAngle, 0, 0, 1))
        neck = neck.add(new Cube(-37 - 10*i, 0, -2.5, 10, 10, 10,       -37 - 10*i + 5, 0, -2.5, "(Math.sin(g_seconds*g_speed + " + i/1.2 + ") + 0.3) * 4 + " + g_neckPitchAngle, 0, 1, 0));
        neck.add((new Cube(-37 - 10*i, 0, 4.5, 6, 2, 4)).col(125, 125, 125, 255));
    }

    const head = neck.add(new Cube(-90, 0, -2.5, 16, 16, 16,       -90, 0, -2.5, "(Math.sin(g_seconds*g_speed - 1) - 0.3) * 7", 0, 1, 0));
    head.applyTexture("front", [17*8, 25*8+2, 19*8, 27*8]);
    head.add(new Cube(-106, 0, -4, 16, 12, 5)) // nose
    head.add(new Cube(-106, 0, -8.5, 16, 12, 4,          -98, 0, -8.5, "(Math.sin(g_seconds*g_speed)+1) * 8", 0, 1, 0)) // jaw


    // Mirrored things
    for (let i = 0; i < 2; i++) {
        const n = i * 2 - 1;

        head.add(new Cube(-110, 4 * n, -0.5, 4, 2, 2)) // nostril
        head.add(new Cube(-90, 4 * n, 7.5, 6, 2, 4).col(125, 125, 125, 255)) // ear

        // Eye
        // const flat = 0.01;
        // head.add(new Cube(-98 - flat, 4.5 * n, 1, flat, 3, 1).col(224, 121, 250, 255))
        // head.add(new Cube(-98 - flat, 4 * n, 0, flat, 4, 1).col(224, 121, 250, 255))
        // head.add(new Cube(-98 - flat*2, 4.5 * n, 1, flat, 1, 1).col(204, 0, 250, 255))
        // head.add(new Cube(-98 - flat*2, 4 * n, 0, flat, 2, 1).col(204, 0, 250, 255))

        const forearm = parts.body.add(new Cube(-16, 16 * n, -6, 24, 8, 8,         -24, 16 * n, -6, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 - 13 + " + g_forearmAngle, 0, 1, 0));
        const wrist = forearm.add(new Cube(5, 16 * n, -7, 24, 6, 6,         -4, 16 * n, -7, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 - 30 + " + g_wristAngle, 0, 1, 0));
        const foot = wrist.add(new Cube(18, 16 * n, -12, 4, 8, 16,         15, 16 * n, -7, "(Math.sin(g_seconds*g_speed) - 0.3) * 1 + 43 + " + g_footAngle, 0, 1, 0));

        const thigh = parts.body.add(new Cube(33, 16 * n, -3, 32, 16, 16,         25, 16 * n, -3, "(Math.sin(g_seconds*g_speed) + 0.3) * 1 - 30 + " + g_thighAngle, 0, 1, 0));
        const shin = thigh.add(new Cube(64, 16 * n, -3, 32, 12, 12,         54, 16 * n, -3, "(Math.sin(g_seconds*g_speed + 2)) * 1 + 30 + " + g_calfAngle, 0, 1, 0));
        const backFoot = shin.add(new Cube(82, 16 * n, -12, 6, 18, 24,         79, 16 * n, -3, "(Math.sin(g_seconds*g_speed + 2)) * 1 + 40 + " + g_backFootAngle, 0, 1, 0));

        // Wings!
        const wingFrame1 = parts.body.add(new Cube(-20, 40 * n, 12, 8, 56, 8,      -20, 12*n, 12, "((Math.sin(g_seconds*g_speed + 2.2)) * 55 - 10) * " + n, 1, 0, 0).col(125, 125, 125, 255))
        const wingFrame2 = wingFrame1.add(new Cube(-18, 96 * n, 12, 4, 56, 4,      -20, 68*n, 12, "((Math.sin(g_seconds*g_speed + 1)) * 45 + 30) * " + n, 1, 0, 0).col(125, 125, 125, 255))
        
        const flapClose = wingFrame1.add(new Plane(12, 40 * n, 12, 56, 56, 1));
        flapClose.transparent = true;
        if (n === 1) {
            flapClose.applyTexture("top", [0, 14*8, 7*8, 21*8]);
        } else {
            flapClose.applyTexture("top", [7*8, 14*8, 0, 21*8]);
        }
        const flapFar = wingFrame2.add(new Plane(12, 96 * n, 12, 56, 56, 1));
        flapFar.transparent = true;
        if (n === 1) {
            flapFar.applyTexture("top", [0, 7*8, 7*8, 14*8]);
        } else {
            flapFar.applyTexture("top", [7*8, 7*8, 0, 14*8]);
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

    rscalls = 0;
  }

  requestAnimationFrame(updateFPS);
}

requestAnimationFrame(updateFPS);
