function drawPoints(gl, vertices,index, bufferV) {

    // Expand each point into a small triangle
    let x = vertices[vertices.length - 2];
    let y = vertices[vertices.length - 1];
    let halfSize = 0.03;
    const squareVertices = [
        x - halfSize, y - halfSize, // Vertex 1 (bottom-left)
        x + halfSize, y - halfSize, // Vertex 2 (bottom-right)
        x - halfSize, y + halfSize, // Vertex 3 (top-left)
        x - halfSize, y + halfSize, // Vertex 4 (top-left, repeated)
        x + halfSize, y - halfSize, // Vertex 5 (bottom-right, repeated)
        x + halfSize, y + halfSize  // Vertex 6 (top-right)
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferV);
    gl.bufferSubData(gl.ARRAY_BUFFER,6* Float32Array.BYTES_PER_ELEMENT*(index),flatten(squareVertices));

    render(gl,(index+2)*6, gl.TRIANGLES);
}

function drawThreePoints(gl, index,bufferV) {
    // Vertex data initialization
    const vertices = [
        1,0,
        1,1,
        0,0
    ];
    let halfSize = 0.03;

    let squareVertices = [];

    // Iterate over each pair of x and y coordinates in vertices
    for (let i = 0; i < vertices.length; i += 2) {
        let x = vertices[i];
        let y = vertices[i + 1];
    
        // Define square vertices around the current x and y coordinates
        let square = [
            x - halfSize, y - halfSize, // Vertex 1 (bottom-left)
            x + halfSize, y - halfSize, // Vertex 2 (bottom-right)
            x - halfSize, y + halfSize, // Vertex 3 (top-left)
            x - halfSize, y + halfSize, // Vertex 4 (top-left, repeated)
            x + halfSize, y - halfSize, // Vertex 5 (bottom-right, repeated)
            x + halfSize, y + halfSize  // Vertex 6 (top-right)
        ];
    
        // Concatenate square vertices to the main squareVertices array
        squareVertices = squareVertices.concat(square);
    }


    gl.bindBuffer(gl.ARRAY_BUFFER, bufferV);
    gl.bufferSubData(gl.ARRAY_BUFFER,18* Float32Array.BYTES_PER_ELEMENT*(index-6),flatten(squareVertices));

    render(gl,(index)*18, gl.TRIANGLES)
    
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
