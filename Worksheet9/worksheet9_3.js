// @ts-nocheck
var gl;
var fb;
var model2;
var textureLoc1;
var theta=0;
var yaxis=-1;
var step=0.001;
var obj_rotation=true;
var light_rotation=true;
var shadowSize = 1024;
let indices = [];
var canvas;
var light_view = false;

function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

function setupViewport(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.6, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}


function cancelObjAnimationFrame(){
    obj_rotation = false;
}

function startObjAnimationFrame(){
    obj_rotation = true;
}

function cancelLightAnimationFrame(){
    light_rotation = false;
}

function startLightAnimationFrame(){
    light_rotation = true;
}

function createEmptyArrayBuffer(gl, attribute, num, type) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
    return buffer;
}

function initArrayBuffer(gl, attribute, buffer, num) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, num, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
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

function initFramebufferObject(gl) {
    var framebuffer, texture, renderBuffer;

    framebuffer = gl.createFramebuffer();

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, shadowSize, shadowSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    framebuffer.texture = texture;

    renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16, shadowSize, shadowSize);

    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    while (e !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer object is incomplete: ' + e.toString());
        e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    }

    return framebuffer;
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

    indices = [
        0, 1, 2, 
        0, 2, 3  // Indices for the ground quad
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
}

function render(gl, programGround, programTeapot, programShadow, modelGround, modelTeapot, drawingParams) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     
    if (obj_rotation) {
        yaxis = yaxis + step;
    }
    if (light_rotation) {
        theta += 0.005;
    }
    

    if (yaxis >= 0.5) {
        step = -0.001;
    }
    else if (yaxis <= -1) {
        step = 0.001;
    }
    
    var eye = vec3(0.0, 0.0, 0.0);
    var at = vec3(0, 0, -3);
    var up = vec3(0, 1, 0);
    var camMatrix = lookAt(eye, at, up);


    var near = 1;
    var far = 20.0;
    var fovy = 90.0;
    var aspect = gl.canvas.width / gl.canvas.height;
    var perspectiveMatrix = perspective(fovy, aspect, near, far);


    var modelViewMatrix = [
        translate(0, yaxis, -3),
        scalem(0.25, 0.25, 0.25),
    ].reduce(mult);


    let lightX = 2 * Math.sin(theta);        
    let lightY = 3;
    let lightZ = -3 + 2 * Math.cos(theta);
    
    let lightPerspective = [
        perspectiveMatrix,
        lookAt(vec3(lightX, lightY, lightZ), vec3(0, 0, -3), vec3(0, 1, 0)),
    ].reduce(mult);

    let cameraPerspective = [
        perspectiveMatrix,
        camMatrix,
    ].reduce(mult);
    
    if (!light_view) {
        gl.viewport(0, 0, shadowSize, shadowSize);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    }
    else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.clearColor(0.2, 0.6, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(programShadow);

    initArrayBuffer(gl, programShadow.position, modelGround.vertexBuffer, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelGround.indexBuffer);
    // ADD buffers for shadow program
    let uLocationMS = gl.getUniformLocation(programShadow, 'modelViewMatrix');
    gl.uniformMatrix4fv(uLocationMS, false, flatten(mat4()));

    let uLocationPS = gl.getUniformLocation(programShadow, 'projectionViewMatrix');
    gl.uniformMatrix4fv(uLocationPS, false, flatten(lightPerspective));
        
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);


    if (!drawingParams && g_objDoc && g_objDoc.isMTLComplete()) {
        drawingParams = onReadComplete(gl, modelTeapot, g_objDoc);
    }

    if (drawingParams) {
        if (!light_view) {
            gl.viewport(0, 0, shadowSize, shadowSize);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        }
        else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        gl.useProgram(programShadow);

        initArrayBuffer(gl, programShadow.position, modelTeapot.vertexBuffer, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);

        let uLocationMS = gl.getUniformLocation(programShadow, 'modelViewMatrix');
        gl.uniformMatrix4fv(uLocationMS, false, flatten(modelViewMatrix));

        let uLocationPS = gl.getUniformLocation(programShadow, 'projectionViewMatrix');
        gl.uniformMatrix4fv(uLocationPS, false, flatten(lightPerspective));
            
        gl.drawElements(gl.TRIANGLES, drawingParams.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(programTeapot);
        initArrayBuffer(gl, programTeapot.vPosition, modelTeapot.vertexBuffer, 3);
        initArrayBuffer(gl, programTeapot.vNormal, modelTeapot.normalBuffer, 3);
        initArrayBuffer(gl, programTeapot.vColor, modelTeapot.colorBuffer, 4);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelTeapot.indexBuffer);
       

        let uLocationMT = gl.getUniformLocation(programTeapot, 'modelViewMatrix');
        let uLocationPT = gl.getUniformLocation(programTeapot, 'projectionViewMatrix');
        let uLocationLMT = gl.getUniformLocation(programTeapot, 'lightViewMatrix');
        let uLocationLPT = gl.getUniformLocation(programTeapot, 'lightPerspectiveMatrix');
        let uLocationLPos = gl.getUniformLocation(programTeapot, 'lightPosition');

        gl.uniformMatrix4fv(uLocationMT, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(uLocationPT, false, flatten(cameraPerspective));
        gl.uniformMatrix4fv(uLocationLMT, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(uLocationLPT, false, flatten(lightPerspective));
        gl.uniform3f(uLocationLPos, lightX, lightY, lightZ);
        
        if (!light_view){
            gl.drawElements(gl.TRIANGLES, drawingParams.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(programGround);
    
    initArrayBuffer(gl, programGround.position, modelGround.vertexBuffer, 3);
    initArrayBuffer(gl, programGround.vTexture, modelGround.textureBuffer, 2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelGround.indexBuffer);
    
    let uLocationM = gl.getUniformLocation(programGround, 'modelViewMatrix');
    gl.uniformMatrix4fv(uLocationM, false, flatten(mat4()));

    let uLocationP = gl.getUniformLocation(programGround, 'projectionViewMatrix');
    gl.uniformMatrix4fv(uLocationP, false, flatten(cameraPerspective));

    let uLocationLP = gl.getUniformLocation(programGround, 'lightPerspectiveMatrix');
    gl.uniformMatrix4fv(uLocationLP, false, flatten(lightPerspective));

    let uLocationLM = gl.getUniformLocation(programGround, 'lightViewMatrix');
    gl.uniformMatrix4fv(uLocationLM, false, flatten(mat4()));
    
    gl.uniform1i(programGround.tex, 0);
    gl.uniform1i(programGround.shadow, 1);
    if (!light_view){
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
    }
    

    window.requestAnimationFrame(() => render(gl, programGround, programTeapot, programShadow,modelGround, modelTeapot, drawingParams));
}

function start() { 

    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    // setupViewport(gl, canvas);
    gl.enable(gl.DEPTH_TEST);

    var programTeapot = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
    gl.useProgram(programTeapot);
    programTeapot.vPosition = gl.getAttribLocation(programTeapot, 'vPosition');
    programTeapot.vColor = gl.getAttribLocation(programTeapot, 'vColor');
    programTeapot.vNormal = gl.getAttribLocation(programTeapot, 'vNormal');
    programTeapot.shadow = gl.getUniformLocation(programTeapot, 'shadowMap');
    gl.uniform1i(programTeapot.shadow, 1);
    model2 = initVertexBuffersObject(gl, programTeapot);

    var programShadow = initShaders(gl, "vertex-shader-shadow", "fragment-shader-shadow");
    gl.useProgram(programShadow);
    programShadow.position = gl.getAttribLocation(programShadow, 'vPosition');
    fb = initFramebufferObject(gl);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fb.texture);

    
    var programGround = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    gl.useProgram(programGround);
    programGround.position = gl.getAttribLocation(programGround, 'position');
    programGround.vTexture = gl.getAttribLocation(programGround, 'vTexture');
    programGround.tex = gl.getUniformLocation(programGround, 'tMap');
    programGround.shadow = gl.getUniformLocation(programGround, 'shadowMap');

    
    image = document.createElement('img');
    image.onload = function() {
        // Initialize and set parameters for the textures
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programGround.tex, 0);
        gl.uniform1i(programGround.shadow, 1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    };
    image.src = 'textures/xamp23.png';
    var model = initVertexBuffers(gl, programGround);
    useBuffers(gl,model);

    var drawingParams = null;
    // Render the scene after all textures have been loaded
    readOBJFile('./teapot/teapot.obj', 1, false, (objDoc) => {
        g_objDoc = objDoc;
        render(gl, programGround, programTeapot,programShadow, model, model2, drawingParams);
    });
    
}

function changeOrbitState(event) {
    light_view = !light_view;
    const button = event.target;
    button.textContent = light_view ? "Leave light view" : "Enter light view";
}

document.addEventListener("DOMContentLoaded", function() {
    const button = document.getElementById("lightView");
    button.addEventListener("click", changeOrbitState);
});
