function setupViewport(gl,canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupVertexBufferCube(gl,program,canvas){
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
        
    var eye = vec3(1.0, 1.5, 1.0); // Position the camera in an isometric view
    var at = vec3(0, 0, 0); // Look at the center of the cube
    var up = vec3(0, 1, 0); // Set the up direction along the y-axis

    // Create the view matrix using lookAt
    var modelView = lookAt(eye, at, up);

    // Define the orthographic projection matrix
    var left = -8.0;
    var right = 8.0;
    var bottom = -8.0;
    var top = 8.0;
    var near = 0.2;
    var far = 10.0;

    var projectionMatrix = ortho(left, right, bottom, top, near, far);
    
    var fovy = -45.0;   // Vertical field of view in degrees
    var aspect = 1;  // Aspect ratio (width / height)

    // Call the perspective function to create the projection matrix
    var perspectiveMatrix = perspective(fovy, aspect, near, far);

    // Multiply the projection matrix by the model-view matrix
    var proj =  mult(perspectiveMatrix, projectionMatrix);
    var modelViewProjectionMatrix = mult(proj, modelView);
    modelViewProjectionMatrix = mult(translate(-0.7,0.0,0.0),modelViewProjectionMatrix);
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
    eye = vec3(1.0,0.5,0.5);
    at = vec3(0.5, 0.5, 0.5); // Look at the center of the cube
    // Create the view matrix using lookAt
    var modelView2 = lookAt(eye, at, up);
    var modelViewProjection = mult(proj, modelView2);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewProjection)); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, 48, gl.UNSIGNED_INT, 0);

    eye = vec3(1,0.5,1);
    at = vec3(0.5, 0.5, 0.5); // Look at the center of the cube
    // Create the view matrix using lookAt
    var modelView3 = lookAt(eye, at, up);
    // Apply a transformation to achieve two-point perspective (adjust the transformation as needed)
    modelViewProjection = mult(proj, modelView3);
    modelViewProjection = mult(translate(0.7,0.0,0.0),modelViewProjection);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewProjection)); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, 48, gl.UNSIGNED_INT, 0);
}
