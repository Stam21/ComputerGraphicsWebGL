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
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
    return buffer;
}

function initVertexBuffers(gl, program) {
    return {
        vertexBuffer: createEmptyArrayBuffer(gl, program.vPosition, 4, gl.FLOAT),
        normalBuffer: createEmptyArrayBuffer(gl, program.vNormal, 4, gl.FLOAT),
        indexBuffer: gl.createBuffer()
    };
}


function useBuffers(gl, model) {
    
    var vertices = [
        vec4(0.0, 0.0, 1.0, 1),
        vec4(0.0, 0.942809, -0.333333, 1),
        vec4(-0.816497, -0.471405, -0.333333, 1),
        vec4(0.816497, -0.471405, -0.333333, 1)
    ];

    // Subdivide the tetrahedron to create a sphere
    divideTetrahedron(vertices[0], vertices[1], vertices[2], vertices[3], 5);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

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

function render(gl, program) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    radius = 0.001;
    // Set initial rotation angles
    if (orbit){
        theta += 0.02; // Rotate around the x-axis
    }
    var eye = vec3(
        radius * Math.sin(theta),
        0,
        radius * Math.cos(theta)
    );
    var at = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);

    var lightPosition = vec4(0.0, 0.0, -1.0, 0.0 );

    // Create the view matrix using lookAt
    var modelViewMatrix = lookAt(eye, at, up);
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

    gl.uniform4fv( gl.getUniformLocation(program,"ka"),ka );
    gl.uniform4fv( gl.getUniformLocation(program,"kd"),kd );
    gl.uniform4fv( gl.getUniformLocation(program,"ks"),ks );
    gl.uniform1f( gl.getUniformLocation(program,"shininess"), alpha );
    gl.uniform4fv( gl.getUniformLocation(program,"Le"), le );
    gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"),lightPosition );


    let uLocationM = gl.getUniformLocation(program, 'modelViewMatrix');
    gl.uniformMatrix4fv(uLocationM, false, flatten(modelViewMatrix));

    let uLocationP = gl.getUniformLocation(program, 'projectionViewMatrix');
    gl.uniformMatrix4fv(uLocationP, false, flatten(proj));

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    animationId = window.requestAnimationFrame(() => render(gl, program));
}

async function loadCubemapImages(gl, cubemap) {
    for (let i = 0; i < 6; ++i) {
        await new Promise((resolve) => {
            var image = document.createElement('img');
            const t = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            image.onload = function (event) {
                gl.texImage2D(t, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, event.target);
                resolve();
            };
            image.src = cubemap[i];
        });
    }
}

async function start() { 

    if (animationId) {
        window.cancelAnimationFrame(animationId);
    }
    var canvas = document.getElementById("gl-canvas");
    var gl = setupWebGL(canvas);
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    setupViewport(gl, canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram(program);

    kaSlider = document.getElementById("ka");
    kdSlider = document.getElementById("kd");
    ksSlider = document.getElementById("ks");
    alphaSlider = document.getElementById("alpha");
    leSlider = document.getElementById("Le");

    kaSlider.addEventListener("input", function(event) {ka =  vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });
    kdSlider.addEventListener("input", function(event) {kd =  vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });
    ksSlider.addEventListener("input", function(event) { ks =  vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });
    alphaSlider.addEventListener("input", function(event) { alpha =  parseFloat(event.target.value); });
    leSlider.addEventListener("input", function(event) { le = vec4(parseFloat(event.target.value),parseFloat(event.target.value),parseFloat(event.target.value),1.0); });

    
    ka = vec4(kaSlider.value, kaSlider.value, kaSlider.value, 1.0);  
    kd = vec4(kdSlider.value, kdSlider.value, kdSlider.value, 1.0);  
    ks = vec4(ksSlider.value, ksSlider.value, ksSlider.value, 1.0);  
    alpha = alphaSlider.value; 
    le = vec4(leSlider.value, leSlider.value, leSlider.value, 1.0);

    program.vPosition = gl.getAttribLocation(program, 'vPosition');
    program.vNormal = gl.getAttribLocation(program, 'vNormal');

    var model = initVertexBuffers(gl, program);
    
    useBuffers(gl,model);

    var cubemap = ['textures/cm_left.png', // POSITIVE_X
                    'textures/cm_right.png', // NEGATIVE_X
                    'textures/cm_top.png', // POSITIVE_Y
                    'textures/cm_bottom.png', // NEGATIVE_Y
                    'textures/cm_back.png', // POSITIVE_Z
                    'textures/cm_front.png']; // NEGATIVE_Z

    var wrapModeSelect = document.getElementById("wrapMode");
    var filterModeSelect = document.getElementById("filterMode");

    var wrapMode = wrapModeSelect.value === "REPEAT" ? gl.REPEAT : gl.CLAMP_TO_EDGE;

    var filterModeMin;
    var filterModeMag;
    switch (filterModeSelect.value) {
        case "NEAREST":
            filterModeMag = gl.NEAREST;
            filterModeMin = gl.NEAREST;
            break;
        case "LINEAR":
            filterModeMag = gl.LINEAR;
            filterModeMin = gl.LINEAR;
            break;
        case "NEAREST_MIPMAP_NEAREST":
            filterModeMag = gl.NEAREST_MIPMAP_NEAREST;
            filterModeMin = gl.NEAREST_MIPMAP_NEAREST;
            break;
        case "LINEAR_MIPMAP_NEAREST":
            filterModeMag = gl.LINEAR_MIPMAP_NEAREST;
            filterModeMin = gl.LINEAR_MIPMAP_NEAREST;
            break;
        case "NEAREST_MIPMAP_LINEAR":
            filterModeMag = gl.NEAREST_MIPMAP_LINEAR;
            filterModeMin = gl.NEAREST_MIPMAP_LINEAR;
            break;
        case "LINEAR_MIPMAP_LINEAR":
            filterModeMag = gl.LINEAR_MIPMAP_LINEAR;
            filterModeMin = gl.LINEAR_MIPMAP_LINEAR;
            break;
        default:
            filterModeMag = gl.NEAREST;
            filterModeMin = gl.NEAREST;
    }
    // Initialize and set parameters for the texture
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, wrapMode);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, wrapMode);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    try {
        await loadCubemapImages(gl, cubemap);

        // Set the texture unit for the shader
        gl.uniform1i(gl.getUniformLocation(program, 'tmap'), 0);

        // Render the scene after all textures have been loaded
        render(gl, program);
    } catch (error) {
        console.error('Error loading images:', error);
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


var gl;
var animationId;
var normals = [];
var points = [];
var index = 0;
var indices = [];
var ka,kd,ks,alpha,le;
var kaSlider,kdSlider,ksSlider,alphaSlider,leSlider;
var theta= 0;
var radius = 0;
var orbit = true;