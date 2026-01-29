class Cube {
    constructor() {
        this.type='cube';
        this.color = [1, 1, 1, 1];

        this.matrix = new Matrix4();
    }

    render() {
        let rgba = this.color;

        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements)

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

        Triangle3D.draw( [1,1,1,   0,1,0,   0,1,1], col4);
        Triangle3D.draw( [1,1,1,   1,1,0,   0,1,0], col4);

        Triangle3D.draw( [1,1,1,   1,0,0,   1,1,0], col5);
        Triangle3D.draw( [1,1,1,   1,0,1,   1,0,0], col5);

        Triangle3D.draw( [1,1,1,   0,0,1,   1,0,1], col6);
        Triangle3D.draw( [1,1,1,   0,1,1,   0,0,1], col6);

        Triangle3D.draw( [])
    }

    multColor(rgba, m) {
        return [rgba[0]*m, rgba[1]*m, rgba[2]*m, rgba[3]];
    }
}

class Triangle3D {
    constructor(corners, rgb = [1, 0.5, 0.5, 1]) {
        this.type = "triangle";
        this.corners = [...corners];
        this.color = [...rgb, 1];
    }

    render() {
        Triangle3D.draw(this.corners, this.color);
    }

    static draw(corners, color = [1, 0.5, 1, 1]) {
        var n = corners.length/2; // The number of vertices

        // Create a buffer object
        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.error('Failed to create the buffer object');
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write date into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, ...color);

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}
