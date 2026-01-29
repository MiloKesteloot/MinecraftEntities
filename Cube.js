class Cube {
    constructor(corners, rgb) {
        this.type = "triangle";
        this.corners = [...corners];
        this.color = [...rgb, 1];
    }

    render() {
        var n = this.corners.length/2; // The number of vertices

        // Create a buffer object
        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write date into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.corners), gl.STATIC_DRAW);

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, ...this.color);

        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}