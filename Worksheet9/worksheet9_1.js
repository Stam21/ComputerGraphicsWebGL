// @ts-nocheck
var gl;
var textureLoc1;
var theta=0;
var yaxis=-1;
var step=0.001;
var rotation=true;
var ka,kd,ks,alpha,le;
var kaSlider,kdSlider,ksSlider,alphaSlider,leSlider;

function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

function setupViewport(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.6, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}


function cancelAnimationFrame(){
    rotation = false;
}

function startAnimationFrame(){
    rotation = true;
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
        vertexBuffer: createEmptyArrayBuffer(gl, program.position, 3, gl.FLOAT),
        textureBuffer: createEmptyArrayBuffer(gl, program.vTexture, 2, gl.FLOAT),
        indexBuffer: gl.createBuffer()
    };
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
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(drawingParams.indices), gl.STATIC_DRAW);

    return drawingParams;
}

function useBuffers(gl, model) {
    
    const vertices = [
        //large
        vec3(-2, -1, -1),
        vec3(2, -1, -1),
        vec3(2, -1, -5),
        vec3(-2, -1, -5)
    ];

    const tex = [
        //ground
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, 1),
        vec2(1, -1)
    ];

    const indices = [
        0, 1, 2, 0, 2, 3  // Indices for the ground quad
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
}

function render(gl, program, program2, model, model2, drawingParams) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    var model = initVertexBuffers(gl, program);
    useBuffers(gl,model);
    
    var eye = vec3(0.0, 0.0, 0.0);
    var at = vec3(0, 0, 0);
    var up = vec3(0, 4, 0);

    var near = 1;
    var far = 10.0;
    var fovy = 70.0;
    var aspect = gl.canvas.width / gl.canvas.height;
    var perspectiveMatrix = perspective(fovy, aspect, near, far);

    let uLocationM = gl.getUniformLocation(program, 'modelViewMatrix');
    gl.uniformMatrix4fv(uLocationM, false, flatten(mat4()));

    let uLocationP = gl.getUniformLocation(program, 'projectionViewMatrix');
    gl.uniformMatrix4fv(uLocationP, false, flatten(perspectiveMatrix));

    gl.uniform1i(textureLoc1, 0);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    

    gl.useProgram(program2);

    if (g_objDoc && g_objDoc.isMTLComplete()) {
        drawingParams = onReadComplete(gl, model2, g_objDoc);
    }

    if (drawingParams) {
        var model2 = initVertexBuffersObject(gl, program2);
        gl.bindBuffer(gl.ARRAY_BUFFER, model2.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingParams.vertices, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, model2.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingParams.colors, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, model2.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingParams.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model2.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(drawingParams.indices), gl.STATIC_DRAW);
        
        if (rotation) {
            yaxis = yaxis + step;
        }
        

        if (yaxis >= 0.5) {
            step = -0.001;
        }
        else if (yaxis <= -1) {
            step = 0.001;
        }

        let uLocationMO = gl.getUniformLocation(program2, 'modelViewMatrix');
        let uLocationPO = gl.getUniformLocation(program2, 'projectionViewMatrix');
        var modelViewMatrix = [
            translate(0, yaxis, -3),
            scalem(0.25, 0.25, 0.25),
        ].reduce(mult);

       
        mvMatrix = lookAt(eye, at, up);
        gl.uniformMatrix4fv(uLocationMO, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(uLocationPO, false, flatten(perspectiveMatrix));
        gl.depthFunc(gl.LESS);
        gl.drawElements(gl.TRIANGLES, drawingParams.indices.length, gl.UNSIGNED_INT, 0);
        
    }

    window.requestAnimationFrame(() => render(gl, program, program2, model, model2, drawingParams));
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

    var program2 = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
    gl.useProgram(program2);
    program2.vPosition = gl.getAttribLocation(program2, 'vPosition');
    program2.vColor = gl.getAttribLocation(program2, 'vColor');
    program2.vNormal = gl.getAttribLocation(program2, 'vNormal');
    var model2 = initVertexBuffersObject(gl, program2);

   
    
    var program = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    gl.useProgram(program);

    program.position = gl.getAttribLocation(program, 'position');
    program.vTexture = gl.getAttribLocation(program, 'vTexture');

    // Initialize and set parameters for the textures
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    textureLoc1 = gl.getUniformLocation( program, "tmap");
    gl.uniform1i(textureLoc1, 0);
    image = document.createElement('img');
    image.onload = function() {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = 'textures/xamp23.png';
    var model = initVertexBuffers(gl, program);
    
    useBuffers(gl,model);

    var drawingParams = null;

    // Render the scene after all textures have been loaded
    readOBJFile('./teapot/teapot.obj', 1, false, (objDoc) => {
        g_objDoc = objDoc;
        render(gl, program, program2, model, model2, drawingParams);
    });
    
}