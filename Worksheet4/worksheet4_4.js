var points = [];
var indices = [];
var normals = [];
var index = 0; 
var theta= 0;
var radius = 0;
var iBuffer; 
var vertexBuffer;
var normalsBuffer;
var ka,kd,ks,alpha,le;
var orbit = true;

function setupViewport(gl,canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.6, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setupVertexBufferCube(gl,program,subdivision){
    points = [];
    normals = [];
    indices = [];
    index = 0;
    theta= 0;
    radius = 0;

    var kaSlider = document.getElementById("ka");
    var kdSlider = document.getElementById("kd");
    var ksSlider = document.getElementById("ks");
    var alphaSlider = document.getElementById("alpha");
    var leSlider = document.getElementById("Le");
    ka = vec4(kaSlider.value, kaSlider.value, kaSlider.value, 1.0);  
    kd = vec4(kdSlider.value, kdSlider.value, kdSlider.value, 1.0);  
    ks = vec4(ksSlider.value, ksSlider.value, ksSlider.value, 1.0);  
    alpha = alphaSlider.value; 
    le = vec4(leSlider.value, leSlider.value, leSlider.value, 1.0);

    kaSlider.addEventListener("input", function(event) {ka =  vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });
    kdSlider.addEventListener("input", function(event) {kd =  vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });
    ksSlider.addEventListener("input", function(event) { ks =  vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });
    alphaSlider.addEventListener("input", function(event) { alpha =  parseFloat(event.target.value); });
    leSlider.addEventListener("input", function(event) { le = vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });


    
    var vertices = [
        vec4(0.0, 0.0, 1.0, 1),
        vec4(0.0, 0.942809, -0.333333, 1),
        vec4(-0.816497, -0.471405, -0.333333, 1),
        vec4(0.816497, -0.471405, -0.333333, 1)
    ];

    // Subdivide the tetrahedron to create a sphere
    divideTetrahedron(vertices[0], vertices[1], vertices[2], vertices[3], subdivision);
    
   

    
    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var coord = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(coord, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var norm = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(norm);
}

function render() {
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    radius = 0.001;
    if (orbit) {
        theta += 0.03;
    }
    var eye = vec3(radius * Math.sin(theta), 0, radius * Math.cos(theta));
    var at = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);

    var lightPosition = vec4(0.0, 0.0, -1.0, 0.0 );

    gl.uniform4fv( gl.getUniformLocation(program,"ka"),ka );
    gl.uniform4fv( gl.getUniformLocation(program,"kd"),kd );
    gl.uniform4fv( gl.getUniformLocation(program,"ks"),ks );
    gl.uniform1f( gl.getUniformLocation(program,"shininess"), alpha );
    gl.uniform4fv( gl.getUniformLocation(program,"Le"), le );
    gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"),lightPosition );

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
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    
    requestAnimationFrame(render);
}

function triangle(a, b, c) {
    normals.push(a);
    normals.push(b);
    normals.push(c);
    points.push(a);
    points.push(b);
    points.push(c);
    indices.push(index, index + 1, index + 2);
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


function changeOrbitState(event) {
    orbit = !orbit;
    const button = event.target;
    button.textContent = orbit ? "Stop Rotation" : "Start Rotation";
}

document.addEventListener("DOMContentLoaded", function() {
    const button = document.getElementById("changeorbitButton");
    button.addEventListener("click", changeOrbitState);
});