// @ts-nocheck

var ka,kd,ks,alpha,le;
var kaSlider,kdSlider,ksSlider,alphaSlider,leSlider;
var orbit = true;

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
        vertexBuffer: createEmptyArrayBuffer(gl, program.vPosition, 3, gl.FLOAT),
        colorBuffer: createEmptyArrayBuffer(gl, program.vColor, 4, gl.FLOAT),
        normalBuffer: createEmptyArrayBuffer(gl, program.vNormal, 3, gl.FLOAT),
        indexBuffer: gl.createBuffer()
    };
}

function readOBJFile(fileName, scale, reverse, callback) {
    fetch(fileName, { mode: 'no-cors' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(fileString => {
            onReadOBJFile(fileString, fileName, scale, reverse, callback);
        })
        .catch(err => console.error(err));
}

function onReadOBJFile(fileString, fileName, scale, reverse, callback) {
    var objDoc = new OBJDoc(fileName);
    var result = objDoc.parse(fileString, scale, reverse);

    if (!result) {
        console.log("OBJ file parsing error");
    } else {
        callback(objDoc);
    }
}

function onReadComplete(gl, model, objDoc) {
    var drawingParams = objDoc.getDrawingInfo();

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingParams.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingParams.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingParams.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(drawingParams.indices), gl.STATIC_DRAW);

    return drawingParams;
}

function render(gl, program, model, drawingParams, theta) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (orbit) {
        theta += 0.005;
    }
    var radius = 0.01;
    var eye = vec3(
        radius * Math.cos(theta),
        1.0,
        radius * Math.sin(theta)
    );

    var at = vec3(0.0, 1.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    
    var lightPosition = vec4(-5, -2, -5, 0.0);

    gl.uniform4fv( gl.getUniformLocation(program,"ka"),ka );
    gl.uniform4fv( gl.getUniformLocation(program,"kd"),kd );
    gl.uniform4fv( gl.getUniformLocation(program,"ks"),ks );
    gl.uniform1f( gl.getUniformLocation(program,"shininess"), alpha );
    gl.uniform4fv( gl.getUniformLocation(program,"Le"), le );
    gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"),lightPosition );

    var modelViewMatrix = lookAt(eye, at, up);

    var left = -5.0;
    var right = 5.0;
    var bottom = -5.0;
    var top = 5.0;
    var near = 0.01;
    var far = 100.0;
    var projectionMatrix = ortho(left, right, bottom, top, near, far);

    var fovy = 45.0;
    var aspect = gl.canvas.width / gl.canvas.height;
    var perspectiveMatrix = perspective(fovy, aspect, near, far);

    var proj = mult(perspectiveMatrix, projectionMatrix);

    let uLocationM = gl.getUniformLocation(program, 'modelView');
    gl.uniformMatrix4fv(uLocationM, false, flatten(modelViewMatrix));

    let uLocationP = gl.getUniformLocation(program, 'perspectiveMatrix');
    gl.uniformMatrix4fv(uLocationP, false, flatten(proj));

    if (!drawingParams && g_objDoc && g_objDoc.isMTLComplete()) {
        drawingParams = onReadComplete(gl, model, g_objDoc);
    }

    if (drawingParams) {
        gl.drawElements(gl.TRIANGLES, drawingParams.indices.length, gl.UNSIGNED_INT, 0);
    }

    window.requestAnimationFrame(() => render(gl, program, model, drawingParams, theta));
}

function start() { 
    var canvas = document.getElementById("gl-canvas");
    var gl = setupWebGL(canvas);
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    setupViewport(gl, canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram(program);

    program.vPosition = gl.getAttribLocation(program, 'vPosition');
    program.vColor = gl.getAttribLocation(program, 'vColor');
    program.vNormal = gl.getAttribLocation(program, 'vNormal');
    
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

    var model = initVertexBuffers(gl, program);
    var drawingParams = null;
    var theta = 0.0;

    readOBJFile('./model/human.obj', 1, false, (objDoc) => {
        g_objDoc = objDoc;
        render(gl, program, model, drawingParams, theta);
    });
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


