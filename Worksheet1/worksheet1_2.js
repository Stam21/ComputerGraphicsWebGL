function setupViewport(gl,canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupVertexBuffer(gl, shape,program) {
    // Vertex data initialization
    const vertices = [
        1,0,
        1,1,
        0,0
    ];

    const vertexColors = [
        0,1,0,
        0,0,1,
        1,0,0
    ]

    // Create a Float32Array from the vertices data
    const vertexData = new Float32Array(vertices);

    // Create and bind the vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

     // Get the attribute location and enable it
     var positionAttributeLocation = gl.getAttribLocation(program, "vPosition");
     gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(positionAttributeLocation);

    render(gl,vertices.length/2, shape)
    
}



function render(gl, numPoints, shape) {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw the points
    gl.drawArrays(shape, 0, numPoints);
}