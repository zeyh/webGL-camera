// * ==================Load VBOs====================================
function initVertexBuffersForShape1(gl) { //semi-sphere
    var vertices = new Float32Array([   
        1.0, 1.0, 1.0,  
        -1.0, 1.0, 1.0,  
        -2.5,-2.5, 2.5,   
        2.5, -2.5, 2.5,    // v0-v1-v2-v3 front
        0,   0,  2,
        
        1.0, 1.0, 1.0,   
        2.5,-2.5, 2.5,   
        2.5,-2.5,-2.5,   
        1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
        2,0,0,

        1.0, 1.0, 1.0,   
        1.0, 1.0,-1.0,  
        -1.0, 1.0,-1.0,  
        -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        0,1.5,0,

        -1.0, 1.0, 1.0,  
        -1.0, 1.0,-1.0,  
        -2.5,-2.5,-2.5,  
        -2.5,-2.5, 2.5,    // v1-v6-v7-v2 left
        -2,0,0,

        // v7-v4-v3-v2 down
        -2.5,-2.5,-2.5,   //20
        2.5,-2.5,-2.5,    //21
        2.5,-2.5, 2.5,    //22
        -2.5,-2.5, 2.5,   //23

        -2.8,-4,-2.8,   //24
        2.8,-4,-2.8,    //25
        2.8,-4, 2.8,    //26
        -2.8,-4, 2.8,   //27
        0,-5,0,     //28
        



        2.5,-2.5,-2.5,  
        -2.5,-2.5,-2.5,  
        -1.0, 1.0,-1.0,   
        1.0, 1.0,-1.0,     // v4-v7-v6-v5 back
        0.0,   0.0,   -2,
    ]);

    var indices = new Uint8Array([
        0, 1, 4, 
        0, 3, 4,  
        1,2,4,
        2,3,4, // front

        5,6,9, 
        5,8,9,
        6,7,9,
        7,8,9,  // right

        10,11,14,
        10,13,14,
        11,12,14,
        12,13,14,    // up

        15,16,19,
        15,18,19,
        16,17,19,
        17,18,19,   // left

        20,24,27,
        20,23,27,
        23,22,27,
        22,27,26,
        22,26,25,
        22,25,21,
        25,21,20,
        25,24,20,
        25,24,28,
        25,26,28,
        24,27,28,
        27,26,28,
        28,26,25, // down


        29,30,33,
        29,32,33,
        30,31,33,
        31,32,33, // back

    ]);
 
    var normals = new Float32Array([
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        0.0, 0.0, 1.0, 

        1.0, 0.0, 0.0,  
        1.0, 0.0, 0.0,  
        1.0, 0.0, 0.0,  
        1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        1.0, 0.0, 0.0,

        0.0, 1.0, 0.0,  
        0.0, 1.0, 0.0,  
        0.0, 1.0, 0.0,  
        0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        0.0, 1.0, 0.0, 

        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        -1.0, 0.0, 0.0,

        0.0,-1.0, 0.0,  
        0.0,-1.0, 0.0,  
        0.0,-1.0, 0.0,  
        0.0,-1.0, 0.0, // v7-v4-v3-v2 down
        0.0,-1.0, 0.0,
        0.0,-1.0, 0.0,
        0.0,-1.0, 0.0,
        0.0,-1.0, 0.0,
        0.0,-1.0, 0.0,

        0.0, 0.0,-1.0,  
        0.0, 0.0,-1.0,  
        0.0, 0.0,-1.0,  
        0.0, 0.0,-1.0,  // v4-v7-v6-v5 back
        0.0, 0.0,-1.0,  
    ]);

    var colors = new Float32Array([   
        81/255, 173/255, 207/255, 0.8,
        250/255, 220/255, 170/255, 0.8,
        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8, 
        250/255, 208/255, 191/255, 0.8, //front
        
        81/255, 173/255, 207/255,0.8,
        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8,
        81/255, 173/255, 207/255, 0.8, 
        232/255, 255/255, 255/255, 0.8, //right
        
        81/255, 173/255, 207/255, 0.8,
        81/255, 173/255, 207/255, 0.8,
        232/255, 255/255, 255/255,0.8,
        250/255, 220/255, 170/255, 0.8, 
        250/255, 220/255, 170/255, 0.8, //up
        
        250/255, 220/255, 170/255, 0.8,
        232/255, 255/255, 255/255, 0.8,
        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8, 
        250/255, 220/255, 170/255, 0.8, //left

        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8, 
        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8,
        42/255, 60/255, 87/255, 0.8,
        28/255, 48/255, 74/255, 0.8, 
        0/255, 88/255, 122/255, 0.8, //down

        15/255, 48/255, 87/255, 0.8,
        15/255, 48/255, 87/255, 0.8,
        232/255, 255/255, 255/255,0.8,
        81/255, 173/255, 207/255, 0.8, 
        232/255, 255/255, 255/255, 0.8, //back
         
    ]);

    var o = new Object(); // Utilize Object object to return multiple buffer
    // Write the vertex property to Buffer Objects
    o.vertexBuffer = initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position');
    o.normalBuffer = initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal');
    o.colorBuffer = initArrayBuffer(gl, colors, 4, gl.FLOAT, 'a_Color');
    o.indexBuffer = initIndexBuffer(gl, indices, gl.UNSIGNED_BYTE);
    o.numIndices = indices.length;
    if (!o.vertexBuffer ||  !o.colorBuffer || !o.normalBuffer || !o.indexBuffer){
        console.log("fail to Write the vertex property to Buffer Objects")
        return -1;
    }

    // // Unbind the buffer object
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initVertexBuffersForShape2(gl, opacity) { //⚡️
    var vertices = new Float32Array([   
        //front
        0.5, 2,    -0.5,  //0
        -1,  0,    0,  //1
        -0.5, -0.5,0,  //2
        -1,  -3,   -0.5,  //3
        1,   0,    0,  //4
        0,  0.2,   0,  //5

        -1,0,-1, //6
        0,0.2,-1,  //7

        -0.5, -0.5,-1, //6
        1,   0,-1,  //7
    ]);

    var indices = new Uint8Array([
        0,1,5,
        1,2,5,
        2,4,5,
        2,3,4,

        0,6,7,
        0,1,6,
        0,5,7,
        1,5,7,
        1,6,7,

        2,3,8,
        3,8,9,
        3,4,9,
        2,4,8,
        4,8,9,

        4,5,7,
        4,7,9,

        6,7,8,
        7,8,9,

        1,2,6,
        2,6,8,

    ]);
 
    var normals = new Float32Array([
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0,  

        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0, 

        0.0, 0.0, 1.0, 
        0.0, 0.0, 1.0, 


        0.0, 1.0, 0.0, 
        0.0, 1.0, 0.0, 

        0.0, 1.0, 0.0, 
        0.0, 1.0, 0.0, 
    ]);

    var colors = new Float32Array([   
        255/255, 255/255, 0/255, opacity, 
        255/255, 102/255, 0/255, opacity,

        204/255, 102/255, 51/255, opacity,
        204/255, 102/255, 0/255, opacity,

        255/255, 255/255, 230/255,  opacity, 
        255/255, 153/255, 51/255,opacity, //front

        204/255, 102/255, 51/255, opacity, //front
        255/255, 153/255, 51/255, opacity, //front

        255/255, 153/255, 51/255, opacity, //front
        255/255, 255/255, 153/255, opacity, //front     
    ]);

    var o = new Object(); // Utilize Object object to return multiple buffer
    // Write the vertex property to Buffer Objects
    o.vertexBuffer = initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position');
    o.normalBuffer = initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal');
    o.colorBuffer = initArrayBuffer(gl, colors, 4, gl.FLOAT, 'a_Color');
    o.indexBuffer = initIndexBuffer(gl, indices, gl.UNSIGNED_BYTE);
    o.numIndices = indices.length;
    if (!o.vertexBuffer ||  !o.colorBuffer || !o.normalBuffer || !o.indexBuffer){
        console.log("fail to Write the vertex property to Buffer Objects")
        return -1;
    }

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initVertexBuffersForShape3(gl) { // full sphere from Shadow_highp.js (c) 2012 matsuda and tanaka
    var SPHERE_DIV = 5;
  
    var i, ai, si, ci;
    var j, aj, sj, cj;
    var p1, p2;
  
    var vertices = [];
    var indices = [];
    var colors = [];
  
    // Generate coordinates
    for (j = 0; j <= SPHERE_DIV; j++) {
      aj = j * Math.PI / SPHERE_DIV;
      sj = Math.sin(aj);
      cj = Math.cos(aj);
      for (i = 0; i <= SPHERE_DIV; i++) {
        ai = i * 2 * Math.PI / SPHERE_DIV;
        si = Math.sin(ai);
        ci = Math.cos(ai);
        vertices.push(si * sj);  // X
        vertices.push(cj);       // Y
        vertices.push(ci * sj);  // Z
      }
    }
  
    // Generate indices
    for (j = 0; j < SPHERE_DIV; j++) {
      for (i = 0; i < SPHERE_DIV; i++) {
        p1 = j * (SPHERE_DIV+1) + i;
        p2 = p1 + (SPHERE_DIV+1);
  
        indices.push(p1);
        indices.push(p2);
        indices.push(p1 + 1);
  
        indices.push(p1 + 1);
        indices.push(p2);
        indices.push(p2 + 1);
      }
    }

    //colors
    for (j = 0; j <= SPHERE_DIV; j++) {
        for (i = 0; i <= SPHERE_DIV; i++) {
          colors.push( (j-1)/SPHERE_DIV  );  // X
          colors.push( ((j-1)/SPHERE_DIV + 0.05)*1);       // Y
          colors.push( ((j-1)/SPHERE_DIV + 0.2)*1);  // Z
          colors.push(1);
        }
      }

  
    var o = new Object(); // Utilize Object object to return multiple buffer objects together
  
    // Write vertex information to buffer object
    o.vertexBuffer = initArrayBuffer(gl, new Float32Array(vertices), 3, gl.FLOAT,  'a_Position');
    o.colorBuffer = initArrayBuffer(gl, new Float32Array(colors), 4, gl.FLOAT, 'a_Color');
    o.normalBuffer = initArrayBuffer(gl, new Float32Array(vertices), 3, gl.FLOAT, 'a_Normal');
    o.indexBuffer = initIndexBuffer(gl, new Uint8Array(indices), gl.UNSIGNED_BYTE);
    o.numIndices = indices.length;
    if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; 
  
  
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  
    return o;
}

function initVertexBuffersForShape4(gl) { //cube
    var vertices = new Float32Array([
        0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
        0.5, 1.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 1.0,-0.5, // v0-v3-v4-v5 right
        0.5, 1.0, 0.5,  0.5, 1.0,-0.5, -0.5, 1.0,-0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
       -0.5, 1.0, 0.5, -0.5, 1.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
       -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
        0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 1.0,-0.5,  0.5, 1.0,-0.5  // v4-v7-v6-v5 back
      ]);
    
      // Normal
      var normals = new Float32Array([
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
       -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
      ]);
      var colors = new Float32Array([   
        255/255, 255/255, 204/255,  1, 
        255/255, 236/255, 132/255, 1, 
        240/255, 248/255, 255/255, 1, 
        175/255, 190/255, 235/255, 1, 

        255/255, 255/255, 204/255,  1, 
        255/255, 236/255, 132/255, 1, 
        255/255, 255/255, 204/255, 1, 
        255/255, 255/255, 204/255, 1, 

        255/255, 255/255, 204/255,  1,
        255/255, 236/255, 132/255, 1, 
        175/255, 190/255, 235/255, 1, 
        255/255, 255/255, 204/255, 1, 

        255/255, 255/255, 204/255,  1,
        255/255, 255/255, 204/255, 1, 
        255/255, 255/255, 204/255, 1, 
        175/255, 220/255, 235/255, 1, 

        255/255, 255/255, 204/255,  1,
        255/255, 255/255, 204/255, 1, 
        240/255, 248/255, 255/255, 1, 
        175/255, 220/255, 235/255, 1, 

        240/255, 248/255, 255/255,  1, 
        255/255, 255/255, 204/255, 1, 
        255/255, 255/255, 204/255, 1, 
        175/255, 220/255, 235/255, 1,    
    ]);
      // Indices of the vertices
      var indices = new Uint8Array([
         0, 1, 2,   0, 2, 3,    // front
         4, 5, 6,   4, 6, 7,    // right
         8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);


    var o = new Object(); // Utilize Object object to return multiple buffer
    // Write the vertex property to Buffer Objects
    o.vertexBuffer = initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position');
    o.normalBuffer = initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal');
    o.colorBuffer = initArrayBuffer(gl, colors, 4, gl.FLOAT, 'a_Color');
    o.indexBuffer = initIndexBuffer(gl, indices, gl.UNSIGNED_BYTE);
    o.numIndices = indices.length;
    if (!o.vertexBuffer ||  !o.colorBuffer || !o.normalBuffer || !o.indexBuffer){
        console.log("fail to Write the vertex property to Buffer Objects")
        return -1;
    }

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initVertexBuffersForGroundGrid(gl){
    var floatsPerVertex = 3; // # of Float32Array elements used for each vertex
    var xcount = 100; // # of lines to draw in x,y to make the grid.
    var ycount = 100;
    var xymax = 50.0; // grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([1.0, 1.0, 0.3]); // bright yellow
    var yColr = new Float32Array([0.5, 1.0, 0.5]); // bright green.

    var vertices = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
    var xgap = xymax / (xcount - 1); // HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1); // (why half? because v==(0line number/2))
    // First, step thru x values as we make vertical lines of constant-x:
    for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {
        // put even-numbered vertices at (xnow, -xymax, 0)
        vertices[j] = -xymax + v * xgap; // x
        vertices[j + 1] = -xymax; // y
        vertices[j + 2] = 0.0; // z
        vertices[j + 3] = 1.0; // w.
        } else {
        // put odd-numbered vertices at (xnow, +xymax, 0).
        vertices[j] = -xymax + (v - 1) * xgap; // x
        vertices[j + 1] = xymax; // y
        vertices[j + 2] = 0.0; // z
        vertices[j + 3] = 1.0; // w.
        }
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {
        // put even-numbered vertices at (-xymax, ynow, 0)
        vertices[j] = -xymax; // x
        vertices[j + 1] = -xymax + v * ygap; // y
        vertices[j + 2] = 0.0; // z
        vertices[j + 3] = 1.0; // w.
        } else {
        // put odd-numbered vertices at (+xymax, ynow, 0).
        vertices[j] = xymax; // x
        vertices[j + 1] = -xymax + (v - 1) * ygap; // y
        vertices[j + 2] = 0.0; // z
        vertices[j + 3] = 1.0; // w.
        }
    }

    var floatsPerVertex2 = 3;
    var colors = new Float32Array(floatsPerVertex2 * 2 * (xcount + ycount));
    for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex2) {
        colors[j + 0] = xColr[0]; // red
        colors[j + 1] = xColr[1]; // grn
        colors[j + 2] = xColr[2]; // blu
    }
    for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex2) {
        colors[j + 0] = yColr[0]; // red
        colors[j + 1] = yColr[1]; // grn
        colors[j + 2] = yColr[2]; // blu
    }

    var o = new Object(); // Utilize Object object to return multiple buffer
    o.vertexBuffer = initArrayBuffer(gl, vertices, floatsPerVertex, gl.FLOAT, 'a_Position');
    o.colorBuffer = initArrayBuffer(gl, colors, floatsPerVertex2, gl.FLOAT, 'a_Color');
    o.normalBuffer = initArrayBuffer(gl, vertices, floatsPerVertex, gl.FLOAT, 'a_Normal');
    o.numIndices = vertices.length/floatsPerVertex;
    if (!o.vertexBuffer ||  !o.colorBuffer || !o.normalBuffer){
        console.log("fail to Write the vertex property to Buffer Objects")
        return -1;
    }

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

function initVertexBuffersForAxis(gl, axislength){
    // let axislength = 2;
    var floatsPerVertex = 4; //vertices are xyzw
    var floatsPerVertex2 = 3;//colors are rgb
    var vertices = new Float32Array([
        0.0,  0.0,  0.0, 1.0,	
        axislength,  0.0,  0.0, 1.0, 
        0.0,  0.0,  0.0, 1.0,
        0.0,  axislength,  0.0, 1.0,
        0.0,  0.0,  0.0, 1.0,	
        0.0,  0.0,  axislength, 1.0,
    ]);
    var colors = new Float32Array([   
        0.3,  0.3,  0.3,
        1.0,  0.3,  0.3,
        0.3,  0.3,  0.3,
        0.3,  1.0,  0.3,
        0.3,  0.3,  0.3,
        0.3,  0.3,  1.0,
    ]);
    var o = new Object(); // Utilize Object object to return multiple buffer
    o.vertexBuffer = initArrayBuffer(gl, vertices, floatsPerVertex, gl.FLOAT, 'a_Position');
    o.colorBuffer = initArrayBuffer(gl, colors, floatsPerVertex2, gl.FLOAT, 'a_Color');
    o.normalBuffer = initArrayBuffer(gl, vertices, floatsPerVertex, gl.FLOAT, 'a_Normal');
    o.numIndices = vertices.length/floatsPerVertex;
    if (!o.vertexBuffer ||  !o.colorBuffer || !o.normalBuffer){
        console.log("fail to Write the vertex property to Buffer Objects")
        return -1;
    }

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;

}

function initIndexBuffer(gl,data, type){
    // bind the index array
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the index buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    buffer.type = type;
    return buffer;
}

function initArrayBuffer(gl, data, num, type, attribute) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.num = num;
    buffer.type = type;

    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
    
    return buffer;
}

