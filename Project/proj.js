var textureModel;
var textureLoc1;
var fb;
var gl;
var ka, kd, ks, alpha, le;
var resizedImage;
var kaSlider, kdSlider, ksSlider, alphaSlider, leSlider;
var g_objDoc = null;
let animationId;
var txt , settings;

var orbit = false;
var thetaLight= 0.0;
var shadowSize = 512;
var light_rotation=true;
var light_view = false;
var canvas;
var programGround,programHuman,programShadow;
var lastX, lastY;
var dragging = false;
var currentAngle = [0, 0];
var eyeDistance = 0.99; // Initial distance from eye to look-at point
var lookAtDisplacement = vec2(0, 0); // Initial displacement of look-at point
var q_rot,q_inc;
var lastMousePos = null;
var lastUpdateTime = null;
var spinThreshold = 200; // Time threshold to stop spinning in milliseconds
var modelViewMatrix;


function cancelLightAnimationFrame(){
    light_rotation = false;
}

function startLightAnimationFrame(){
    light_rotation = true;
}

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
        texCoordBuffer: createEmptyArrayBuffer(gl, program.vTexCoord, 2, gl.FLOAT),
        normalBuffer: createEmptyArrayBuffer(gl, program.vNormal, 3, gl.FLOAT),
        indexBuffer: gl.createBuffer()
    };
}


function readOBJFile(fileName, scaleObj, reverse, callback) {
    fetch(fileName, { mode: 'no-cors' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(fileString => {
            onReadOBJFile(fileString, fileName, scaleObj, reverse, callback);
        })
        .catch(err => console.error(err));
}

function onReadOBJFile(fileString, fileName, scaleObj, reverse, callback) {
    var objDoc = new OBJDoc(fileName);
    var result = objDoc.parse(fileString, scaleObj, reverse);

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

    gl.bindBuffer(gl.ARRAY_BUFFER, model.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingParams.texCoords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(drawingParams.indices), gl.STATIC_DRAW);

    return drawingParams;
}

function useBuffers(gl, model) {
    
    const vertices = [
        //large
        vec3(-2, -1, 2),
        vec3(2, -1, 2),
        vec3(2, -1, -2),
        vec3(-2, -1, -2)
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


function projectSphere(px,py) {
    // Calculate squared distance
    var d2 = Math.sqrt(px * px + py * py);

    // Check if d^2 is less than or equal to 2
    if (d2 <= 2) {
        // Calculate u using orthographic projection
        var uZ = Math.sqrt(2 - d2);
        return uZ;
    } else {
        // Calculate u using hyperbolic sheet
        var uZ = 1 / (Math.sqrt(2) * Math.sqrt(d2));
        return uZ;
    }
}

// Function to check if spinning should stop based on mouse position and time elapsed
function shouldStopSpin(currentMousePos) {
    if (!lastMousePos || !lastUpdateTime) return false;
    if (currentMousePos.x === lastMousePos.x && currentMousePos.y === lastMousePos.y) return true;
    return (performance.now() - lastUpdateTime) >= spinThreshold;
}


function render(gl,  programGround, programHuman, programShadow, modelGround, modelHuman,drawingParams, theta) {
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    

    if (orbit){
        theta -= 0.005;
    }
    else{
        theta = Math.PI/2
        // Perform spinning
        if (shouldStopSpin({ x: lastX, y: lastY })) {
            // Stop spinning
            q_inc.setIdentity();
        } else {
            // Continue spinning
            q_rot = q_rot.multiply(q_inc);
        }
        let up_q = q_rot.apply(vec3(0, 1, 0));
        let right = q_rot.apply(vec3(1, 0, 0));
        let front = q_rot.apply(vec3(0, 0, 0.5));
        let rot_eye = q_rot.apply(vec3(0, 0, 0));
        if (lookAtDisplacement[1] < -0.5) {
            lookAtDisplacement[1] = -0.5
        }
        else if (lookAtDisplacement[1] > 0.6) {
            lookAtDisplacement[1] = 0.6
        }
        lookAtDisplacement[0] = Math.max(lookAtDisplacement[0], -1);
        lookAtDisplacement[0] = Math.min(lookAtDisplacement[0], 1);
        let look_at = [scale(lookAtDisplacement[0], right), scale(lookAtDisplacement[1], up_q)].reduce(add)
        // Clamp the y-component of look_at to not fall below 0
        
        rot_eye = [rot_eye, look_at, scale(eyeDistance, front)].reduce(add)
        modelViewMatrix = [
            lookAt(rot_eye, look_at, up_q),
            scalem(0.5, 0.5, 0.5),
        ].reduce(mult);
    }

    if (light_rotation) {
        thetaLight += 0.01;
    }
    
    var radius = 2.5;
    
    var eyeX = radius * Math.cos(theta); // X-coordinate of the eye
    var eyeY = 1.0; // Keep the y-coordinate constant
    var eyeZ = radius * Math.sin(theta); // Z-coordinate of the eye

    var eye = vec3(eyeX, eyeY, eyeZ); // Define the eye position

    var at = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);

    var camMatrix = lookAt( eye, at, up);

    

    var near = 1;
    var far = 10.0;
    var fovy = 90.0;
    var aspect = gl.canvas.width / gl.canvas.height;
    var perspectiveMatrix = perspective(fovy, aspect, near, far);
    let lightX = 2.5*Math.sin(thetaLight);        
    let lightY = 4;
    let lightZ = 2.5*Math.cos(thetaLight);
    
    let lightPerspective = [
        perspectiveMatrix,
        lookAt(vec3(lightX, lightY, lightZ), vec3(0, 0, 0), vec3(0, 1, 0)),
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
        drawingParams = onReadComplete(gl, modelHuman, g_objDoc);
    }

    if (drawingParams) {
        if (!light_view) {
            gl.viewport(0, 0, shadowSize, shadowSize);
            gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
        }
        else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        gl.useProgram(programShadow);

        initArrayBuffer(gl, programShadow.position, modelHuman.vertexBuffer, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelHuman.indexBuffer);

        let uLocationMS = gl.getUniformLocation(programShadow, 'modelViewMatrix');
        gl.uniformMatrix4fv(uLocationMS, false, flatten(modelViewMatrix));

        let uLocationPS = gl.getUniformLocation(programShadow, 'projectionViewMatrix');
        gl.uniformMatrix4fv(uLocationPS, false, flatten(lightPerspective));

        gl.drawElements(gl.TRIANGLES, drawingParams.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(programHuman);
        initArrayBuffer(gl, programHuman.vPosition, modelHuman.vertexBuffer, 3);
        initArrayBuffer(gl, programHuman.vNormal, modelHuman.normalBuffer, 3);
        initArrayBuffer(gl, programHuman.vColor, modelHuman.colorBuffer, 4);
        initArrayBuffer(gl, programHuman.vTexCoord, modelHuman.texCoordBuffer, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelHuman.indexBuffer);


        var uKaLocation = gl.getUniformLocation(programHuman, "ka");
        var uKdLocation = gl.getUniformLocation(programHuman, "kd");
        var uKsLocation = gl.getUniformLocation(programHuman, "ks");
        var uAlphaLocation = gl.getUniformLocation(programHuman, "shininess");
        var uLeLocation = gl.getUniformLocation(programHuman, "Le");
        var uLightPositionLocation = gl.getUniformLocation(programHuman, "lightPosition");
        var uModelViewMatrixLocation = gl.getUniformLocation(programHuman, 'modelViewMatrix');
        var uProjectionViewMatrixLocation = gl.getUniformLocation(programHuman, 'projectionViewMatrix');
        var uLightViewMatrixLocation = gl.getUniformLocation(programHuman, 'lightViewMatrix');
        var uLightPerspectiveMatrixLocation = gl.getUniformLocation(programHuman, 'lightPerspectiveMatrix');

        gl.uniform4fv(uKaLocation, ka);
        gl.uniform4fv(uKdLocation, kd);
        gl.uniform4fv(uKsLocation, ks);
        gl.uniform1f(uAlphaLocation, alpha);
        gl.uniform4fv(uLeLocation, le);
        gl.uniform4fv(uLightPositionLocation, vec4(lightX, lightY, lightZ, 0.0));
        gl.uniformMatrix4fv(uModelViewMatrixLocation, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(uProjectionViewMatrixLocation, false, flatten(cameraPerspective));
        gl.uniformMatrix4fv(uLightViewMatrixLocation, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(uLightPerspectiveMatrixLocation, false, flatten(lightPerspective));
        

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

    animationId = window.requestAnimationFrame(() => render(gl, programGround, programHuman, programShadow,modelGround, modelHuman, drawingParams,theta));
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
    // gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.BACK);

    q_rot = new Quaternion();
    q_inc = new Quaternion();

    canvas.oncontextmenu = ev => {
        ev.preventDefault();
    }

    canvas.onmousedown = ev => {
        let x = ev.clientX,
            y = ev.clientY;

        if (ev.button == 0) {
            mode = 1;
            q_inc.setIdentity();
        } else if (ev.button == 2) {
            mode = 2;
        }

        // Start dragging if a mouse is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            dragging = true;
            lastX = ((x - rect.left) / (canvas.width - 1)) * 2 - 1;
            lastY = -(((y - rect.top) / (canvas.height - 1)) * 2 - 1);
        }
    };

    canvas.onmouseup = () => {
        mode = 0;
        dragging = false;
    };

    canvas.onmouseleave = () => {
        mode = 0;
        dragging = false;
    };

    canvas.onmousemove = ev => {
        let x = ev.clientX;
        let y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();
        if (dragging) {
            var p_x = ((x - rect.left) / (canvas.width - 1)) * 2 - 1;
            var p_y = -(((y - rect.top) / (canvas.height - 1)) * 2 - 1);

            let lastPos = vec3(lastX, lastY, projectSphere(lastX, lastY));
            let curPos = vec3(p_x, p_y, projectSphere(p_x, p_y));
            if (mode == 1) {
                q_inc = q_inc.make_rot_vec2vec(normalize(curPos), normalize(lastPos));
            } else if (mode == 2) {
                lookAtDisplacement = add(lookAtDisplacement, scale(Math.max(5, 0.25 * eyeDistance), vec2(subtract(lastPos, curPos))));
            }
            lastX = p_x, lastY = p_y;   
        }
        lastMousePos = { x: x, y: y };
        lastUpdateTime = performance.now(); 
    };

    canvas.onwheel = ev => {
        // Update eye distance based on mouse wheel scroll
        eyeDistance = Math.min(0.99, Math.max(0.01, eyeDistance - ev.deltaY * 0.0006));
    };

    programHuman = initShaders(gl, "vertex-shader-human", "fragment-shader-human");

    gl.useProgram(programHuman);

    programHuman.vPosition = gl.getAttribLocation(programHuman, 'vPosition');
    programHuman.vColor = gl.getAttribLocation(programHuman, 'vColor');
    programHuman.vNormal = gl.getAttribLocation(programHuman, 'vNormal');
    programHuman.vTexCoord = gl.getAttribLocation(programHuman, 'vTexCoord');
    programHuman.shadow = gl.getUniformLocation(programHuman, 'shadowMapHuman');
    gl.uniform1i(programHuman.shadow, 2);
    var model = initVertexBuffersObject(gl, programHuman);

    
    programShadow = initShaders(gl, "vertex-shader-shadow", "fragment-shader-shadow");
    gl.useProgram(programShadow);
    programShadow.position = gl.getAttribLocation(programShadow, 'vPosition');
    fb = initFramebufferObject(gl);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fb.texture);


    programGround = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    gl.useProgram(programGround);
    programGround.position = gl.getAttribLocation(programGround, 'position');
    programGround.vTexture = gl.getAttribLocation(programGround, 'vTexture');
    programGround.tex = gl.getUniformLocation(programGround, 'tMap');
    programGround.shadow = gl.getUniformLocation(programGround, 'shadowMap');

    var drawingParams = null;
    var theta = 0;

    kaSlider = document.getElementById("ka");
    kdSlider = document.getElementById("kd");
    ksSlider = document.getElementById("ks");
    alphaSlider = document.getElementById("alpha");
    leSlider = document.getElementById("Le");

    kaSlider.addEventListener("input", function(event) { ka = vec4(parseFloat(event.target.value), parseFloat(event.target.value), parseFloat(event.target.value), 1.0); });
    kdSlider.addEventListener("input", function(event) { kd = vec4(parseFloat(event.target.value), parseFloat(event.target.value), parseFloat(event.target.value), 1.0); });
    ksSlider.addEventListener("input", function(event) { ks = vec4(parseFloat(event.target.value), parseFloat(event.target.value), parseFloat(event.target.value), 1.0); });
    alphaSlider.addEventListener("input", function(event) { alpha = parseFloat(event.target.value); });
    leSlider.addEventListener("input", function(event) { le = vec4(parseFloat(event.target.value), parseFloat(event.target.value), parseFloat(event.target.value), 1.0); });


    ka = vec4(kaSlider.value, kaSlider.value, kaSlider.value, 1.0);
    kd = vec4(kdSlider.value, kdSlider.value, kdSlider.value, 1.0);
    ks = vec4(ksSlider.value, ksSlider.value, ksSlider.value, 1.0);
    alpha = alphaSlider.value;
    le = vec4(leSlider.value, leSlider.value, leSlider.value, 1.0);

    var imageGround = document.createElement('img');
        imageGround.onload = function() {
            // Initialize and set parameters for the textures
            var texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(programGround.tex, 0);
            gl.uniform1i(programGround.shadow, 1);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageGround);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    };
    imageGround.src = './textures/xamp23.png';
    var model2 = initVertexBuffers(gl, programGround);
    useBuffers(gl,model2);

    txt = document.getElementById("applyTexture");
    settings = document.getElementById("applySettings");
    txt.addEventListener("click", function () {loadTexture();});
    settings.addEventListener("click", function () {
        loadTextureAndRender(imageInit);
    });
    imageInit='./model/skin-6_diffuse.jpg';
    loadTextureAndRender(imageInit);


    // Add an event listener to the "Apply" button
    function loadTextureAndRender(imageLoad) {
        if (animationId) {
            window.cancelAnimationFrame(animationId); // Cancel the previous animation frame request
        }

        gl.useProgram(programHuman);
        imageHuman = document.createElement('img');
        imageHuman.crossorigin = 'anonymous';
        imageHuman.src = imageLoad;

        imageHuman.onload = function() {
            console.log("Apply Settings button clicked");
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
            textureModel = gl.createTexture();
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, textureModel);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageHuman);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterModeMag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterModeMin);
            
            // Set the texture unit for the shader
            gl.uniform1i(gl.getUniformLocation(programHuman, 'texMap'), 2);
            // Generate mipmaps if necessary
            // Mipmap generation code
            if (filterModeSelect.value !== "NEAREST" && filterModeSelect.value !== "LINEAR") {
                var ext = gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
                if (!ext) {
                    console.log('Mipmap extension not supported.');

                }
                gl.generateMipmap(gl.TEXTURE_2D);
            }
            readOBJFile('./model/human.obj', 1, false, (objDoc) => {
                g_objDoc = objDoc;
                render(gl, programGround, programHuman,programShadow, model2, model, drawingParams, theta);
            });
        };
    }

    function resizeImageToPowerOfTwo(image) {
        console.log(image);
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        // Find the nearest higher power of two for width and height
        var width = Math.pow(2, Math.ceil(Math.log2(image.width*0.4)));
        var height = Math.pow(2, Math.ceil(Math.log2(image.height*0.4)));

        // Set canvas dimensions to the nearest higher power of two
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        // Draw the image onto the canvas
        ctx.drawImage(image, 0, 0, width, height);

        // Create a new image with the resized dimensions
        var resizedImage = new Image();
        resizedImage.src = canvas.toDataURL();

        return resizedImage;
    }

    function loadTexture() {
        var fileInput = document.getElementById('textureInput');
        var uploadedFile = fileInput.files[0];
        if (uploadedFile) {
            var reader = new FileReader();
            reader.onload = function(event) {
                var img = new Image();
                img.onload = function() {
                    resizedImage = resizeImageToPowerOfTwo(img);
                    imageHuman.src = resizedImage.src;
                    imageInit = imageHuman.src;
                    loadTextureAndRender(imageInit);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(uploadedFile);
        } else {
            console.log("No image uploaded!")
        }
    }
}

function changeOrbitState(event) {
    orbit = !orbit;
    const buttonOrbit = event.target;
    buttonOrbit.textContent = orbit ? "Stop Rotation" : "Start Rotation";
}

function changeLightState(event) {
    light_view = !light_view;
    const buttonLight = event.target;
    buttonLight.textContent = light_view ? "Leave light view" : "Enter light view";
}


document.addEventListener("DOMContentLoaded", function() {
    const buttonOrbit = document.getElementById("changeorbitButton");
    buttonOrbit.addEventListener("click", changeOrbitState);
    const buttonLight = document.getElementById("lightView");
    buttonLight.addEventListener("click", changeLightState);
});

