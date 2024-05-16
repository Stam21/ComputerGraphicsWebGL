var points = [];
var indices = [];
var index = 0;

function setupViewport(gl,canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.6, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupVertexBufferCube(gl,program,subdivision){
    
    points = [];
    indices = [];
    index = 0;

    var vertices = [
        vec4(0.0, 0.0, 1.0, 1),
        vec4(0.0, 0.942809, -0.333333, 1),
        vec4(-0.816497, -0.471405, -0.333333, 1),
        vec4(0.816497, -0.471405, -0.333333, 1)
    ];

    // Subdivide the tetrahedron to create a sphere
    divideTetrahedron(vertices[0], vertices[1], vertices[2], vertices[3], subdivision);

    var eye = vec3(0.0, 0.0 , 0.0);
    var at = vec3(0, 0, 0); // Look at the center of the sphere
    var up = vec3(0, 1, 0); // Set the up direction along the y-axis

    // Create the view matrix using lookAt
    var modelView = lookAt(eye, at, up);
    // Define the orthographic projection matrix
    var left = -3.0;
    var right = 3.0;
    var bottom = -3.0;
    var top = 3.0;
    var near = 0.2;
    var far = 10.0;

    var projectionMatrix = ortho(left, right, bottom, top, near, far);
    
    var fovy = 45.0;   // Vertical field of view in degrees
    var aspect = 1;  // Aspect ratio (width / height)

    // Call the perspective function to create the projection matrix
    var perspectiveMatrix = perspective(fovy, aspect, near, far);

    // Multiply the projection matrix by the model-view matrix
    var proj =  mult(perspectiveMatrix, projectionMatrix);
    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var projectionViewMatrixLoc = gl.getUniformLocation(program, "projectionViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(projectionViewMatrixLoc, false, flatten(proj));
    
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var coord = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(coord, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
}

function triangle(a, b, c) {
    points.push(a);
    points.push(b);
    points.push(c);
    indices.push(index+2, index, index + 1);
    index += 3;
}

function divideTetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a,b,c,count){
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
    
        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle(a, b, c);
    }
}