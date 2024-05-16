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
        vertexBuffer: createEmptyArrayBuffer(gl, program.vPosition, 3, gl.FLOAT),
        textureBuffer: createEmptyArrayBuffer(gl, program.vTexture, 2, gl.FLOAT),
        indexBuffer: gl.createBuffer(),
        colorsBuffer: createEmptyArrayBuffer(gl, program.vColor, 3, gl.FLOAT)
    };
}

function useBuffers(gl, model,program) {
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
    

    var texSize = 64;
    var rows = 8;
    var cols = 8;
    var texels = new Uint8Array(4*texSize*texSize);

    for (var i = 0; i < texSize; ++i){
        for(var j = 0; j < texSize; ++j){
            var patchx = Math.floor(i/(texSize/rows));
            var patchy = Math.floor(j/(texSize/cols));
            var c = (patchx%2 ^ patchy%2 ? 255 : 0);
            var ind = 4*(i*texSize+j);
            texels[ind] = c;
            texels[ind+1] = c;
            texels[ind+2] = c;
            texels[ind+3] = c;
        }
    }
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, texels);
    gl.uniform1i(gl.getUniformLocation(program, "tmap"), 0);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

function render(gl, program) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let modelViewMatrix = [
        mat4()
    ].reduce(mult);

    let proj = perspective(90, 1, 1, 50);

    let uLocationM = gl.getUniformLocation(program, 'modelView');
    gl.uniformMatrix4fv(uLocationM, false, flatten(modelViewMatrix));

    let uLocationP = gl.getUniformLocation(program, 'perspectiveMatrix');
    gl.uniformMatrix4fv(uLocationP, false, flatten(proj));

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
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
    gl.enable(gl.CULL_FACE);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram(program);

    program.vPosition = gl.getAttribLocation(program, 'vPosition');
    program.vTexture = gl.getAttribLocation(program, 'vTexture');
    program.vColor = gl.getAttribLocation(program, 'vColor');

    var model = initVertexBuffers(gl, program);
    
    useBuffers(gl,model,program);
    render(gl, program);
}

var gl;

var textures = [
    vec2(-1.5, 0.0),
    vec2(2.5, 0.0),
    vec2(2.5, 10.0),
    vec2(-1.5, 10.0)
];

var vertices = [
    vec3( -4.0, -1.0, -1.0 ),
    vec3(  4.0, -1.0, -1.0 ),
    vec3(  4.0, -1.0, -21.0),
    vec3( -4.0, -1.0, -21.0)
];

var indices = [0, 1, 2, 0, 2, 3];

const colors = [vec3(1, 1, 1), vec3(1, 1, 1), vec3(1, 1, 1), vec3(1, 1, 1)];