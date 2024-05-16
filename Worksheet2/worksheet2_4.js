function drawPoints(gl, vertices,index, colors, bufferV, bufferC) {

    // Expand each point into a small triangle
    let x = vertices[vertices.length - 2];
    let y = vertices[vertices.length - 1];
    let halfSize = 0.03;

    let r = colors[colors.length - 4];
    let g = colors[colors.length - 3];
    let b = colors[colors.length - 2];
    let a = colors[colors.length - 1];
    const squareVertices = [
        x - halfSize, y - halfSize, // Vertex 1 (bottom-left)
        x + halfSize, y - halfSize, // Vertex 2 (bottom-right)
        x - halfSize, y + halfSize, // Vertex 3 (top-left)
        x - halfSize, y + halfSize, // Vertex 4 (top-left, repeated)
        x + halfSize, y - halfSize, // Vertex 5 (bottom-right, repeated)
        x + halfSize, y + halfSize  // Vertex 6 (top-right)
    ];

    const squareColors =  [
        r,g,b,a,
        r,g,b,a,
        r,g,b,a,
        r,g,b,a,
        r,g,b,a,
        r,g,b,a
    ];
   

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferV);
    gl.bufferSubData(gl.ARRAY_BUFFER,6* Float32Array.BYTES_PER_ELEMENT*(index),flatten(squareVertices));

    // // Get the attribute location and enable it
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferC);
    gl.bufferSubData(gl.ARRAY_BUFFER, 12* Float32Array.BYTES_PER_ELEMENT*(index), flatten(squareColors));
    
    render(gl,(index+2)*6, gl.TRIANGLES);
}

function drawTriangle(gl,vertices,index, colors, bufferV, bufferC) {
    // Create and bind the vertex buffer
    let vert = [];
    let clrs = [];
    vert.push(...vertices);
    vert.push(...vertices);
    clrs.push(...colors);
    clrs.push(...colors);
    var vertexData = flatten(vert);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferV);
    gl.bufferSubData(gl.ARRAY_BUFFER,6* Float32Array.BYTES_PER_ELEMENT*(index-2),vertexData);
    gl.bufferSubData(gl.ARRAY_BUFFER,6* Float32Array.BYTES_PER_ELEMENT*(index-4),vertexData);
    gl.bufferSubData(gl.ARRAY_BUFFER,6* Float32Array.BYTES_PER_ELEMENT*(index-6),vertexData);

    // // Get the attribute location and enable it
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferC);
    gl.bufferSubData(gl.ARRAY_BUFFER, 12* Float32Array.BYTES_PER_ELEMENT*(index-2), flatten(clrs));
    gl.bufferSubData(gl.ARRAY_BUFFER, 12* Float32Array.BYTES_PER_ELEMENT*(index-4), flatten(clrs));
    gl.bufferSubData(gl.ARRAY_BUFFER, 12* Float32Array.BYTES_PER_ELEMENT*(index-6), flatten(clrs));
    
    render(gl,(index-5)*6, gl.TRIANGLES);
}

function drawCircle(gl,vertices,colors,index, bufferV, bufferC) {
    // Create and bind the vertex buffer
    var vertexData = flatten(vertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferV);
    gl.bufferSubData(gl.ARRAY_BUFFER,6* Float32Array.BYTES_PER_ELEMENT*(index-2),vertexData);
    gl.bufferSubData(gl.ARRAY_BUFFER,6* Float32Array.BYTES_PER_ELEMENT*(index-4),vertexData);
    // // Get the attribute location and enable it
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferC);
    gl.bufferSubData(gl.ARRAY_BUFFER,12* Float32Array.BYTES_PER_ELEMENT*(index-2), flatten(colors));
    gl.bufferSubData(gl.ARRAY_BUFFER,12* Float32Array.BYTES_PER_ELEMENT*(index-4), flatten(colors));
    render(gl,(index+96)*6, gl.TRIANGLES);
}

function render(gl, numPoints, shape) {
    // Draw the points
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(shape, 0, numPoints);
}


function setupViewport(gl,canvas, color) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(color[0], color[1], color[2], color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
}