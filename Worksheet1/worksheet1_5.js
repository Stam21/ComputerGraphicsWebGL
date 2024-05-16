function setupViewport(gl,canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupVertexBufferCircle(gl, shape,program) {

    const segments = 100; 
    const radius = 0.3;
    const vertices = [];

    // Center of the circle
    vertices.push(0.0,0.0);

    // Find vertices of the circle
    for (let i = 0; i <= segments; i++) {
        const angle = (i/segments) * Math.PI*2;
        const x = radius* Math.cos(angle);
        const y = radius* Math.sin(angle);
        vertices.push(x,y);
    }
    

    var amplitudeLoc = gl.getUniformLocation(program, "u_amplitude");
    var frequencyLoc = gl.getUniformLocation(program, "u_frequency");
    
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
    renderBounce(gl, shape,amplitudeLoc, frequencyLoc, vertices.length/2)
}

function renderBounce(gl, shape, amplitudeLoc, frequencyLoc , numPoints, amplitude = 0.7, frequency=0.1) {
    setTimeout(function() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        frequency += 0.09;
        gl.uniform1f(amplitudeLoc, amplitude);
        gl.uniform1f(frequencyLoc, frequency);
        gl.drawArrays(shape, 0, numPoints);
        requestAnimationFrame(function animate() {renderBounce(gl, shape, amplitudeLoc, frequencyLoc, numPoints, amplitude, frequency)});
    }, 20);
}