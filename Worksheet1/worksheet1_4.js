function setupViewport(gl,canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupVertexBuffer(gl, shape,program) {
    // Vertex data initialization
    const vertices = [
        //First triangle
        -0.5,-0.5,
        -0.5,0.5,
        0.5,0.5,

        //Second triangle
        -0.5,-0.5,
        0.5,0.5,
        0.5,-0.5
    ];

    var thetaLoc = gl.getUniformLocation(program, "theta");

    // Create a Float32Array from the vertices data
    const vertexData = new Float32Array(vertices);

    // Create and bind first vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    // Get the attribute location and enable it
    var positionAttributeLocation = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);
    renderRotation(gl, shape ,thetaLoc, vertices.length/2);
}

function renderRotation(gl, shape, thetaLoc, numPoints, theta=0.0) {
    setTimeout(function() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        theta += 0.01;
        gl.uniform1f(thetaLoc, theta);
        gl.drawArrays(shape, 0, numPoints);
        requestAnimationFrame(function animate() {renderRotation(gl, shape, thetaLoc, numPoints, theta)});
    }, 20);
}