function setupViewport(gl,canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupVertexBufferCube(gl,program){
    var indices = [
        0, 1, 1, 2, 2, 3, 3, 0, // front
        2, 3, 3, 7, 7, 6, 6, 2, // right
        0, 3, 3, 7, 7, 4, 4, 0, // down
        1, 2, 2, 6, 6, 5, 5, 1, // up
        4, 5, 5, 6, 6, 7, 7, 4, // back
        0, 1, 1, 5, 5, 4, 4, 0 // left
        ];
        
    var vertices = [
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(1.0, 0.0, 0.0, 1.0),
        vec4(1.0, 1.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0),
        vec4(1.0, 0.0, 1.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0)
    ];
        
    var eye = vec3(1, 1, 1); // Position the camera in an isometric view
    var at = vec3(0, 0, 0); // Look at the center of the cube
    var up = vec3(0, 1, 0); // Set the up direction along the y-axis

    // Create the view matrix using lookAt
    var modelView = lookAt(eye, at, up);

    // Define the orthographic projection matrix
    var left = -1.0;
    var right = 1.0;
    var bottom = -1.0;
    var top = 1.0;
    var near = -1.0;
    var far = 2.0;

    var projectionMatrix = ortho(left, right, bottom, top, near, far);

    // Multiply the projection matrix by the model-view matrix
    var modelViewProjectionMatrix = mult(projectionMatrix, modelView);
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewProjectionMatrix));

    
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    var coord = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(coord, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.LINES, 48, gl.UNSIGNED_INT, 0);

}
