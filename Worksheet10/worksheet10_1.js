// @ts-nocheck
var gl;
var dragging = false;
var lastX, lastY;
var currentAngle = [0, 0];

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

function initVertexBuffersObject(gl, program) {
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
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(drawingParams.indices), gl.STATIC_DRAW);

    return drawingParams;
}


function render(gl, program, model, drawingParams) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var modelViewMatrix = [
        translate(0, -1, -10),
        rotateY(-currentAngle[1]),
        rotateX(-currentAngle[0]),
    ].reduce(mult);


    var near = 1;
    var far = 80.0;
    var fovy = 45.0;
    var aspect = gl.canvas.width / gl.canvas.height;
    var perspectiveMatrix = perspective(fovy, aspect, near, far);

    let uLocationM = gl.getUniformLocation(program, 'modelViewMatrix');
    gl.uniformMatrix4fv(uLocationM, false, flatten(modelViewMatrix));

    let uLocationP = gl.getUniformLocation(program, 'projectionViewMatrix');
    gl.uniformMatrix4fv(uLocationP, false, flatten(perspectiveMatrix));

    // let uLocationL = gl.getUniformLocation(program, 'lightEmission');
    // gl.uniform3fv(uLocationL, vec3());

    if (g_objDoc && g_objDoc.isMTLComplete()) {
        drawingParams = onReadComplete(gl, model, g_objDoc);
    }

    if (drawingParams) {
        gl.drawElements(gl.TRIANGLES, drawingParams.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    window.requestAnimationFrame(() => render(gl, program, model, drawingParams));
}

function start() { 

    var canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    setupViewport(gl, canvas);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    program.vPosition = gl.getAttribLocation(program, 'vPosition');
    program.vColor = gl.getAttribLocation(program, 'vColor');
    program.vNormal = gl.getAttribLocation(program, 'vNormal');
    var model = initVertexBuffersObject(gl, program);

    var drawingParams = null;

    canvas.onmousedown = ev => {
        let x = ev.clientX,
            y = ev.clientY;

        // Start dragging if a mouse is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            dragging = true;
            lastX = x;
            lastY = y;
        }
    };

    canvas.onmouseup = () => {
        dragging = false;
    };

    canvas.onmouseleave = () => {
        dragging = false;
    };

    canvas.onmousemove = ev => {
        let x = ev.clientX,
            y = ev.clientY;
        if (dragging) {
            var factor = 100 / canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // Limit x-axis rotation angle to -90 to 90 degrees
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };

    // Render the scene after all textures have been loaded
    readOBJFile('./teapot/teapot.obj', 1, false, (objDoc) => {
        g_objDoc = objDoc;
        render(gl, program, model, drawingParams);
    });

    
}