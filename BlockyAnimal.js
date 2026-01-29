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
    
    document.getElementById('angleSlide').addEventListener('input', function() {g_globalAngle = this.value;})
}

let rscalls = 0;

function main() {
    setUpWebGL();

    connectVariablesToGLSL();

    setUpElements();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = move;

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    for (let i = 0; i < 20; i++) {
        const cube = new Cube();
        cube.color = [1, 0, 0, 1]
        
        cube.matrix.scale(0.2, 0.2, 0.2);
        cube.matrix.translate(0, -Math.sqrt(3)/2, 0);
        cube.matrix.rotate(55, -1, 0, 1);    
        
        g_points.push(cube);
    }

    renderScene();
}

function clearScreen() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function renderScene() {

    rscalls++;

    clearScreen();

    const globalRotMat = new Matrix4().translate(0, 0, 0.1).rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GloabalRotateMatrix, false, globalRotMat.elements)
 
    let len = g_points.length;
    for (let i = 0; i < len; i++) {
        let p = g_points[i];
        p.render();
    }

    // drawObjAndChildren(enderDragon.bones, new Matrix4());

    requestAnimationFrame(renderScene);
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

    for (let c of cubes) {

        console.log(c)
        
        drawCubePart(c.size, c.origin);
        if (c.mirror === true) {
            const newOrigin = [c.origin[0], -c.origin[1], c.origin[2]];
            drawCubePart(c.size, newOrigin);
        }
    }
}

function drawCubePart(size, origin) {
    const cube = new Cube();
    cube.color = [1, 0, 0, 1];
    
    cube.matrix.scale(0.2, 0.2, 0.2);
    cube.matrix.scale(0.2, 0.2, 0.2);
    cube.matrix.scale(0.2, 0.2, 0.2);

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
let g_globalAngle = 0;

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

const enderDragonJSON = `
{
    "description": {
    "identifier": "geometry.dragon",
    "visible_bounds_width": 14,
    "visible_bounds_height": 13,
    "visible_bounds_offset": [ 0, 2, 0 ],
    "texture_width": 256,
    "texture_height": 256
    },
    "bones": [
    {
        "name": "root",
        "pivot": [ 0.0, 24.0, 0.0 ]
    },
    {
        "name": "head",
        "pivot": [ 0.0, 24.0, 0.0 ],
        "cubes": [
        {
            "origin": [ -6.0, 20.0, -24.0 ],
            "size": [ 12.0, 5.0, 16.0 ],
            "uv": [ 176, 44 ]
        },
        {
            "origin": [ -8.0, 16.0, -10.0 ],
            "size": [ 16.0, 16.0, 16.0 ],
            "uv": [ 112, 30 ]
        },
        {
            "mirror": true,
            "origin": [ -5.0, 32.0, -4.0 ],
            "size": [ 2.0, 4.0, 6.0 ],
            "uv": [ 0, 0 ]
        },
        {
            "mirror": true,
            "origin": [ -5.0, 25.0, -22.0 ],
            "size": [ 2.0, 2.0, 4.0 ],
            "uv": [ 112, 0 ]
        },
        {
            "origin": [ 3.0, 32.0, -4.0 ],
            "size": [ 2.0, 4.0, 6.0 ],
            "uv": [ 0, 0 ]
        },
        {
            "origin": [ 3.0, 25.0, -22.0 ],
            "size": [ 2.0, 2.0, 4.0 ],
            "uv": [ 112, 0 ]
        }
        ]
    },
    {
        "name": "jaw",
        "parent": "head",
        "pivot": [ 0.0, 20.0, -8.0 ],
        "cubes": [
        {
            "origin": [ -6.0, 16.0, -24.0 ],
            "size": [ 12.0, 4.0, 16.0 ],
            "uv": [ 176, 65 ]
        }
        ]
    },
    {
        "name": "neck",
        "pivot": [ 0.0, 24.0, 0.0 ],
        "cubes": [
        {
            "origin": [ -5.0, 19.0, -5.0 ],
            "size": [ 10.0, 10.0, 10.0 ],
            "uv": [ 192, 104 ]
        },
        {
            "origin": [ -1.0, 29.0, -3.0 ],
            "size": [ 2.0, 4.0, 6.0 ],
            "uv": [ 48, 0 ]
        }
        ]
    },
    {
        "name": "body",
        "pivot": [ 0.0, 20.0, 8.0 ],
        "cubes": [
        {
            "origin": [ -12.0, -4.0, -8.0 ],
            "size": [ 24.0, 24.0, 64.0 ],
            "uv": [ 0, 0 ]
        },
        {
            "origin": [ -1.0, 20.0, -2.0 ],
            "size": [ 2.0, 6.0, 12.0 ],
            "uv": [ 220, 53 ]
        },
        {
            "origin": [ -1.0, 20.0, 18.0 ],
            "size": [ 2.0, 6.0, 12.0 ],
            "uv": [ 220, 53 ]
        },
        {
            "origin": [ -1.0, 20.0, 38.0 ],
            "size": [ 2.0, 6.0, 12.0 ],
            "uv": [ 220, 53 ]
        }
        ]
    },
    {
        "name": "wing",
        "pivot": [ -12.0, 19.0, 2.0 ],
        "cubes": [
        {
            "origin": [ -68.0, 15.0, -2.0 ],
            "size": [ 56.0, 8.0, 8.0 ],
            "uv": [ 112, 88 ]
        },
        {
            "origin": [ -68.0, 19.0, 4.0 ],
            "size": [ 56.0, 0.0, 56.0 ],
            "uv": [ -56, 88 ]
        }
        ]
    },
    {
        "name": "wingtip",
        "pivot": [ -56.0, 24.0, 0.0 ],
        "cubes": [
        {
            "origin": [ -112.0, 22.0, -2.0 ],
            "size": [ 56.0, 4.0, 4.0 ],
            "uv": [ 112, 136 ]
        },
        {
            "origin": [ -112.0, 24.0, 2.0 ],
            "size": [ 56.0, 0.0, 56.0 ],
            "uv": [ -56, 144 ]
        }
        ]
    },
    {
        "name": "wing1",
        "pivot": [ 12.0, 19.0, 2.0 ],
        "cubes": [
        {
            "origin": [ -44.0, 15.0, -2.0 ],
            "size": [ 56.0, 8.0, 8.0 ],
            "uv": [ 112, 88 ]
        },
        {
            "origin": [ -44.0, 19.0, 4.0 ],
            "size": [ 56.0, 0.0, 56.0 ],
            "uv": [ -56, 88 ]
        }
        ]
    },
    {
        "name": "wingtip1",
        "pivot": [ -56.0, 24.0, 0.0 ],
        "cubes": [
        {
            "origin": [ -112.0, 22.0, -2.0 ],
            "size": [ 56.0, 4.0, 4.0 ],
            "uv": [ 112, 136 ]
        },
        {
            "origin": [ -112.0, 24.0, 2.0 ],
            "size": [ 56.0, 0.0, 56.0 ],
            "uv": [ -56, 144 ]
        }
        ]
    },
    {
        "name": "rearleg",
        "pivot": [ -16.0, 8.0, 42.0 ],
        "cubes": [
        {
            "origin": [ -24.0, -20.0, 34.0 ],
            "size": [ 16.0, 32.0, 16.0 ],
            "uv": [ 0, 0 ]
        }
        ]
    },
    {
        "name": "rearleg1",
        "pivot": [ 16.0, 8.0, 42.0 ],
        "cubes": [
        {
            "origin": [ 8.0, -20.0, 34.0 ],
            "size": [ 16.0, 32.0, 16.0 ],
            "uv": [ 0, 0 ]
        }
        ]
    },
    {
        "name": "frontleg",
        "pivot": [ -12.0, 4.0, 2.0 ],
        "cubes": [
        {
            "origin": [ -16.0, -16.0, -2.0 ],
            "size": [ 8.0, 24.0, 8.0 ],
            "uv": [ 112, 104 ]
        }
        ]
    },
    {
        "name": "frontleg1",
        "pivot": [ 12.0, 4.0, 2.0 ],
        "cubes": [
        {
            "origin": [ 8.0, -16.0, -2.0 ],
            "size": [ 8.0, 24.0, 8.0 ],
            "uv": [ 112, 104 ]
        }
        ]
    },
    {
        "name": "rearlegtip",
        "pivot": [ 0.0, -8.0, -4.0 ],
        "cubes": [
        {
            "origin": [ -6.0, -38.0, -4.0 ],
            "size": [ 12.0, 32.0, 12.0 ],
            "uv": [ 196, 0 ]
        }
        ]
    },
    {
        "name": "rearlegtip1",
        "pivot": [ 0.0, -8.0, -4.0 ],
        "cubes": [
        {
            "origin": [ -6.0, -38.0, -4.0 ],
            "size": [ 12.0, 32.0, 12.0 ],
            "uv": [ 196, 0 ]
        }
        ]
    },
    {
        "name": "frontlegtip",
        "pivot": [ 0.0, 4.0, -1.0 ],
        "cubes": [
        {
            "origin": [ -3.0, -19.0, -4.0 ],
            "size": [ 6.0, 24.0, 6.0 ],
            "uv": [ 226, 138 ]
        }
        ]
    },
    {
        "name": "frontlegtip1",
        "pivot": [ 0.0, 4.0, -1.0 ],
        "cubes": [
        {
            "origin": [ -3.0, -19.0, -4.0 ],
            "size": [ 6.0, 24.0, 6.0 ],
            "uv": [ 226, 138 ]
        }
        ]
    },
    {
        "name": "rearfoot",
        "pivot": [ 0.0, -7.0, 4.0 ],
        "cubes": [
        {
            "origin": [ -9.0, -13.0, -16.0 ],
            "size": [ 18.0, 6.0, 24.0 ],
            "uv": [ 112, 0 ]
        }
        ]
    },
    {
        "name": "rearfoot1",
        "pivot": [ 0.0, -7.0, 4.0 ],
        "cubes": [
        {
            "origin": [ 9.0, -13.0, -16.0 ],
            "size": [ 18.0, 6.0, 24.0 ],
            "uv": [ 112, 0 ]
        }
        ]
    },
    {
        "name": "frontfoot",
        "pivot": [ 0.0, 1.0, 0.0 ],
        "cubes": [
        {
            "origin": [ -4.0, -3.0, -12.0 ],
            "size": [ 8.0, 4.0, 16.0 ],
            "uv": [ 144, 104 ]
        }
        ]
    },
    {
        "name": "frontfoot1",
        "pivot": [ 0.0, 1.0, 0.0 ],
        "cubes": [
        {
            "origin": [ -4.0, -3.0, -12.0 ],
            "size": [ 8.0, 4.0, 16.0 ],
            "uv": [ 144, 104 ]
        }
        ]
    }
    ]
}`;
const enderDragon = JSON.parse(enderDragonJSON);