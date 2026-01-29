class Shape {
    constructor(x, z, y, sx, sz, sy, px, pz, py, r, ax, az, ay) {
        this.type='cube';
        this.color = [0.2, 0.2, 0.2, 1];
        this.matrix = new Matrix4();
        this.nonScaleMatrix = new Matrix4(this.matrix);
        this.parent = null;
        this.children = [];

        this.position = [x, y, z];
        this.scale = [sx, sy, sz];
        this.pivot = [px, py, pz];
        this.rotation = [r, ax, ay, az];

        this.buildMatrix();
    }

    buildMatrix() {
        this.matrix.setIdentity();

        if (this.pivot[0] !== undefined) {

            // 1. move to pivot
            this.matrix.translate(this.pivot[0], this.pivot[1], this.pivot[2]);

            // 2. rotate around pivot
            this.matrix.rotate(eval(this.rotation[0]), this.rotation[1], this.rotation[2], this.rotation[3]);

            // 3. move back from pivot
            this.matrix.translate(-this.pivot[0], -this.pivot[1], -this.pivot[2]);
        }

        this.matrix.translate(this.position[0], this.position[1], this.position[2]);

        this.nonScaleMatrix = new Matrix4(this.matrix);

        this.matrix.scale(this.scale[0], this.scale[1], this.scale[2]);
    }

    getNonScaleMatrixTrain() {
        if (this.parent === null) {
            return new Matrix4(this.nonScaleMatrix);
        }

        return this.parent.getNonScaleMatrixTrain().multiply(this.nonScaleMatrix);
    }

    getPositionTrain() {
        if (this.parent === null) {
            return this.position;
        }

        const p = this.parent.getPositionTrain();
        return [this.position[0] + p[0], this.position[1] + p[1], this.position[2] + p[2]];
    }

    add(child) {
        child.parent = this;

        const parentPos = this.getPositionTrain();
        child.position[0] -= parentPos[0];
        child.position[1] -= parentPos[1];
        child.position[2] -= parentPos[2];
        if (child.pivot[0] !== undefined) {
            child.pivot[0] -= parentPos[0];
            child.pivot[1] -= parentPos[1];
            child.pivot[2] -= parentPos[2];
        }

        child.buildMatrix();

        this.children.push(child);
        return child;
    }

    col(r, g, b, a) {
        this.color = [r/255.0, g/255.0, b/255.0, a/255.0];
        return this;
    }

    render(parentMatrix = null) {
        
        let worldMatrix = new Matrix4();

        if (parentMatrix) {
            worldMatrix.set(parentMatrix);
            worldMatrix.multiply(this.matrix);
        } else {
            worldMatrix.set(this.matrix);
        }
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, worldMatrix.elements);

        this.subRender();

        for (const key in this.children) {
            this.children[key].render(this.getNonScaleMatrixTrain());
        }
    }

    subRender() {
        console.error("subRender() has not yet been set up yet on:");
        console.error(this);
    }

    multColor(rgba, m) {
        return [rgba[0]*m, rgba[1]*m, rgba[2]*m, rgba[3]];
    }
}

class Cube extends Shape {
    subRender() {
        let rgba = this.color;
        const col1 = rgba;
        const col2 = this.multColor(rgba, 0.85);
        const col3 = this.multColor(rgba, 0.7);
        const col4 = this.multColor(rgba, 0.55);
        const col5 = this.multColor(rgba, 0.4);
        const col6 = this.multColor(rgba, 0.35);

        Triangle3D.draw( [0,0,0,   1,1,0,   1,0,0], col1);
        Triangle3D.draw( [0,0,0,   0,1,0,   1,1,0], col1);

        Triangle3D.draw( [0,0,0,   0,1,1,   0,1,0], col2);
        Triangle3D.draw( [0,0,0,   0,0,1,   0,1,1], col2);

        Triangle3D.draw( [0,0,0,   1,0,1,   0,0,1], col3);
        Triangle3D.draw( [0,0,0,   1,0,0,   1,0,1], col3);

        Triangle3D.draw( [0,1,0,   0,1,1,   1,1,1], col4);
        Triangle3D.draw( [0,1,0,   1,1,1,   1,1,0], col4);

        Triangle3D.draw( [1,1,1,   1,0,0,   1,1,0], col5);
        Triangle3D.draw( [1,1,1,   1,0,1,   1,0,0], col5);

        Triangle3D.draw( [1,1,1,   0,0,1,   1,0,1], col6);
        Triangle3D.draw( [1,1,1,   0,1,1,   0,0,1], col6);
    }
}

class Plane extends Shape {
    subRender() {
        let rgba = this.color;
        const col4 = this.multColor(rgba, 0.55);
        Triangle3D.draw( [0,0.5,0,   0,0.5,1,   1,0.5,1], col4);
        Triangle3D.draw( [0,0.5,0,   1,0.5,1,   1,0.5,0], col4);
    }
}

class Triangle3D {
    constructor(corners, rgb = [1, 0.5, 0.5, 1]) {
        this.type = "triangle";
        this.corners = [...corners];
        this.color = [...rgb, 1];
    }

    // Claude gave me the idea for this reused vertex buffer
    static vertexBuffer = null;
    static initBuffer() {
        if (Triangle3D.vertexBuffer) return true;

        Triangle3D.vertexBuffer = gl.createBuffer();
        if (!Triangle3D.vertexBuffer) {
            console.error('Failed to create the buffer object');
            return false;
        }
        
        return true;
    }

    render() {
        Triangle3D.draw(this.corners, this.color);
    }

    static draw(corners, color = [1, 0.5, 1, 1]) {

        if (!Triangle3D.initBuffer()) return;

        corners = corners.map(x => x - 0.5);

        var n = corners.length/3; // The number of vertices

        gl.bindBuffer(gl.ARRAY_BUFFER, Triangle3D.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, ...color);

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}

// const CubeMesh = (() => {
//     const vertices = new Float32Array([
//         // front
//         0,0,0, 1,1,0, 1,0,0,
//         0,0,0, 0,1,0, 1,1,0,
//         // left
//         0,0,0, 0,1,1, 0,1,0,
//         0,0,0, 0,0,1, 0,1,1,
//         // bottom
//         0,0,0, 1,0,1, 0,0,1,
//         0,0,0, 1,0,0, 1,0,1,
//         // top
//         0,1,0, 0,1,1, 1,1,1,
//         0,1,0, 1,1,1, 1,1,0,
//         // right
//         1,1,1, 1,0,0, 1,1,0,
//         1,1,1, 1,0,1, 1,0,0,
//         // back
//         1,1,1, 0,0,1, 1,0,1,
//         1,1,1, 0,1,1, 0,0,1,
//     ]);

//     let buffer;

//     function init() {
//         buffer = gl.createBuffer();
//         gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//         gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
//     }

//     function bind() {
//         gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//         gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
//         gl.enableVertexAttribArray(a_Position);
//     }

//     return { init, bind };
// })();


// class Cube {
//     constructor() {
//         this.color = [1, 1, 1, 1];
//         this.matrix = new Matrix4();
//     }

//     render() {
//         gl.uniformMatrix4fv(
//             u_ModelMatrix,
//             false,
//             this.matrix.elements
//         );

//         const c = this.color;
//         const shades = [1, 0.85, 0.7, 0.55, 0.4, 0.35];

//         // Bind geometry ONCE
//         CubeMesh.bind();

//         let face = 0;
//         for (let s of shades) {
//             gl.uniform4f(
//                 u_FragColor,
//                 c[0] * s,
//                 c[1] * s,
//                 c[2] * s,
//                 c[3]
//             );

//             gl.drawArrays(gl.TRIANGLES, face * 6, 6);
//             face++;
//         }
//     }
// }
