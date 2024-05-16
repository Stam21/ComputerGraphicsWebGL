// @ts-nocheck
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

function setupViewport(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.6, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function createEmptyArrayBuffer(gl, attribute, num, type) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
    return buffer;
}

function initVertexBuffers(gl, program) {
    return {
        vertexBuffer: createEmptyArrayBuffer(gl, program.vPosition, 3, gl.FLOAT),
        textureBuffer: createEmptyArrayBuffer(gl, program.vTexture, 2, gl.FLOAT),
        indexBuffer: gl.createBuffer()
    };
}


function useBuffers(gl, model) {
    
    const vertices = [
        //large
        vec3(-2, -1, -1),
        vec3(2, -1, -1),
        vec3(2, -1, -5),
        vec3(-2, -1, -5),
        //small1
        vec3(0.25, -0.5, -1.25),
        vec3(0.75, -0.5, -1.25),
        vec3(0.75, -0.5, -1.75),
        vec3(0.25, -0.5, -1.75),
        //small2
        vec3(-1, -1, -2.5),
        vec3(-1, 0, -2.5),
        vec3(-1, 0, -3),
        vec3(-1, -1, -3)
    ];

    const tex = [
        //ground
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, 1),
        vec2(1, -1),
        //q1
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, 1),
        vec2(1, -1),
        //q2
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, 1),
        vec2(1, -1)
    ];

    const indices = [
        0, 1, 2, 0, 2, 3,  // Indices for the ground quad
        4, 5, 6, 4, 6, 7,  // Indices for the first red quad
        8, 9, 10, 8, 10, 11  // Indices for the second red quad
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
}

function render(gl, program) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta += 0.02;

    var eye = vec3(0.0, 0.0, 0.0);
    var at = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);

    // Create the view matrix using lookAt
    var modelViewMatrix = lookAt(eye, at, up);
    // Define the orthographic projection matrix
    var near = 0.1;
    var far = 50.0;
    var fovy = 90.0;   // Vertical field of view in degrees
    var aspect = 1;  // Aspect ratio (width / height)

    // Call the perspective function to create the projection matrix
    var perspectiveMatrix = perspective(fovy, aspect, near, far);

    let uLocationM = gl.getUniformLocation(program, 'modelViewMatrix');
    gl.uniformMatrix4fv(uLocationM, false, flatten(modelViewMatrix));

    let uLocationP = gl.getUniformLocation(program, 'projectionViewMatrix');
    gl.uniformMatrix4fv(uLocationP, false, flatten(perspectiveMatrix));

    gl.uniform1i(textureLoc1, 0);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

    let lightX = 2 * Math.sin(theta);        
    let lightY = 2;
    let lightZ = -2 + 2 * Math.cos(theta);
    let projectionMatrix = mat4(1);
    projectionMatrix[3][3] = 0;
    projectionMatrix[3][1] = 1 / -(lightY - (-1));
  
    mvMatrix = [
        translate(lightX, lightY, lightZ), 
        projectionMatrix, 
        translate(-lightX, -lightY, -lightZ)].reduce(mult);
    gl.uniformMatrix4fv(uLocationM, false, flatten(mvMatrix));
    gl.uniform1i(textureLoc2, 1);
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);

    mvMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(uLocationM, false, flatten(mvMatrix));
    gl.uniform1i(textureLoc2, 1);
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);

    window.requestAnimationFrame(() => render(gl, program));
}

function start() { 

    var canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    setupViewport(gl, canvas);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram(program);

    program.vPosition = gl.getAttribLocation(program, 'vPosition');
    program.vTexture = gl.getAttribLocation(program, 'vTexture');

    // Initialize and set parameters for the textures
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    textureLoc1 = gl.getUniformLocation( program, "tmap");
    gl.uniform1i(textureLoc1, 0);
    image = document.createElement('img');
    image.src = 'textures/xamp23.png';
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    textureLoc2 = gl.getUniformLocation( program, "tmap");
    gl.uniform1i(textureLoc2, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    var model = initVertexBuffers(gl, program);
    
    useBuffers(gl,model);

    // Render the scene after all textures have been loaded
    render(gl, program);
    
}

var gl;
var textureLoc1, textureLoc2
var theta=0;