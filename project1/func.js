//init shaders
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec4 a_Position;',
    'attribute vec4 a_Color;',
    'attribute vec4 a_Normal;',
    'uniform mat4 u_modelMatrix;',
    'uniform mat4 u_normalMatrix;',
    'varying vec4 v_Color;',
    'void main() {',
    '    gl_Position = u_modelMatrix * a_Position;',
    '    vec3 lightDirection = normalize(vec3(0, 0, 0));',
    '    vec3 normal = normalize((u_normalMatrix * a_Normal).xyz);',
    '    float nDotL = max(dot(normal, lightDirection), 0.0);',
    '    v_Color = a_Color;',
    '}'
    ].join('\n');

var FSHADER_SOURCE = [
    '#ifdef GL_ES',
    '  precision mediump float;',
    '#endif',
    'varying vec4 v_Color;',
    'void main() {',
    '  gl_FragColor = v_Color;',
    '}',
    ].join('\n');

// * for WebGL 
var gl;                 // WebGL's rendering context; value set in main()
var g_canvas; 

// * matrix 
var g_modelMatrix1 = new Matrix4(); // Coordinate transformation matrix1
var g_modelMatrix2 = new Matrix4(); // Coordinate transformation matrix2
var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals
var g_modelMatLoc;                  // that uniform's location in the GPU

// * angle config
var ANGLE_STEP = 3.0;           // The increments of rotation angle (degrees)
var g_angle01 = 1;              // The rotation angle of part 1
var g_angle02 = 25.0;          // The rotation angle of part 2
var g_angle03 = 0.0;          // The rotation angle of part 2
var g_angle01Rate = 2;       // rotation speed, in degrees/second                 
var g_angle02Rate = 40.0; 
var g_angle03Rate = 20.0; 
var g_angle01Min = 0;  
var g_angle01Max = 70; 
var g_angle02Min = 0;  
var g_angle02Max = 70; 
var g_angle03Min = 0;  
var g_angle03Max = 70; 
var g_rainNum = 3;
// * Animation config
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    		// Timestamp for most-recently-drawn image; 
// * HTML events
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;		// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;  
var seed;
var drawingMode = "triangles";
function changeNum(inputStr){
    if(g_rainNum == 0 && inputStr == '-'){
        alert("It's not rainy anymore! Please try the + button")
        return;
    }
    if(g_rainNum < 0 ){
        g_rainNum = 0;
    }
    if(inputStr == '+'){
        g_rainNum ++;
    }
    if(inputStr == '-'){
        g_rainNum --;
    }
}
function changeSpeed(inputStr){
    if(g_angle02Rate == 0 && inputStr == '-'){
        alert("It's not windy anymore! Please try the + button")
        return;
    }
    if(g_angle02Rate < 0 ){
        g_angle02Rate = 0;
    }
    if(inputStr == '+'){
        g_angle02Rate += 10;
    }
    if(inputStr == '-'){
        g_angle02Rate -= 10;
    }
}
function changeMode(){
    console.log(drawingMode)
    if(drawingMode == "triangles"){
        drawingMode = "lines";
    }else{
        drawingMode = "triangles";
    }
}
function main() {
    console.log("now I'm in js file...");
    g_canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    var gl = getWebGLContext(g_canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }


    // Set the vertex information
    // Assign the buffer object to the attribute variable
    gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.program.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (! gl.program.a_Position) {
      console.log('Failed to get the storage location');
      return false;
    }


    var shape1 = initVertexBuffersForShape1(gl);
    var shape2 = initVertexBuffersForShape2(gl);
    var shape3 = initVertexBuffersForShape3(gl);
    if (! shape1 || !shape2 || !shape3) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Get the storage locations of uniform variables
    var u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix');
    var u_normalMatrix = gl.getUniformLocation(gl.program, 'u_normalMatrix');
    if (!u_modelMatrix || !u_normalMatrix) {
        console.log('Failed to get the storage location');
        return;
    }

    // Calculate the view projection matrix
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(50.0, g_canvas.width / g_canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(20.0, 10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    // Register the event handler to be called when keys are pressed
    window.addEventListener("mousedown", myMouseDown); 
    window.addEventListener("mousemove", myMouseMove); 
    window.addEventListener("mouseup", myMouseUp);	
    document.onkeydown = function(ev){ keydown(ev, gl, shape1, viewProjMatrix, u_modelMatrix, u_normalMatrix); };

    // Set the clear color and enable the depth test
    gl.clearColor(0.1, 0.1, 0.2, 1.0);
    gl.enable (gl.BLEND);// Enable alpha blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function
    gl.depthFunc(gl.LESS); //Enable 3D depth-test when drawing: don't over-draw at any pixel 
    gl.enable(gl.DEPTH_TEST); // unless the new Z value is closer to the eye than the old one..


    // drawAll(gl, [shape1, shape2], viewProjMatrix, u_modelMatrix); 
    // ! Animation
    var tick = function() {
        seed = Math.random();
        g_angle02 = animate2();  // Update the rotation angle
        g_angle01 = animate1();  // Update the rotation angle
        drawAll(gl, [shape1, shape2, shape3], viewProjMatrix, u_modelMatrix); 
        document.getElementById('CurAngleDisplay').innerHTML= 
            'g_angle02= '+g_angle02.toFixed(5);    //reports current angle value:
        document.getElementById('Mouse').innerHTML=
            'Mouse Drag totals (CVV coords):\t'+
            g_xMdragTot.toFixed(5)+', \t'+g_yMdragTot.toFixed(5);//display our current mouse-dragging state:	        
        requestAnimationFrame(tick, g_canvas);    //Request that the browser re-draw the webpage
    };
    tick();	

}


// TODO: 7. user-adjustable color for one 3D part (Weekend)
// TODO: 8. Scene Graph & report pdf (Weekend)

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
        81/255, 173/255, 207/255, 1,
        250/255, 220/255, 170/255, 1,
        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1, 
        250/255, 208/255, 191/255, 1, //front
        
        81/255, 173/255, 207/255, 1,
        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1,
        81/255, 173/255, 207/255, 1, 
        232/255, 255/255, 255/255, 1, //right
        
        81/255, 173/255, 207/255, 1,
        81/255, 173/255, 207/255, 1,
        232/255, 255/255, 255/255,1,
        250/255, 220/255, 170/255, 1, 
        250/255, 220/255, 170/255, 1, //up
        
        250/255, 220/255, 170/255, 1,
        232/255, 255/255, 255/255, 1,
        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1, 
        250/255, 220/255, 170/255, 1, //left

        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1, 
        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1,
        42/255, 60/255, 87/255, 1,
        28/255, 48/255, 74/255, 1, 
        0/255, 88/255, 122/255, 1, //down

        15/255, 48/255, 87/255, 1,
        15/255, 48/255, 87/255, 1,
        232/255, 255/255, 255/255,1,
        81/255, 173/255, 207/255, 1, 
        232/255, 255/255, 255/255, 1, //back
         
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

function initVertexBuffersForShape2(gl) { //⚡️
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
        204/255, 102/255, 0/255, 1,
        204/255, 102/255, 51/255, 1,

        204/255, 102/255, 51/255, 1,
        255/255, 255/255, 0/255, 1, 

        255/255, 255/255, 200/255,  1, 
        255/255, 153/255, 51/255,1, //front

        204/255, 102/255, 51/255, 1, //front
        255/255, 153/255, 51/255, 1, //front

        255/255, 153/255, 51/255, 1, //front
        255/255, 255/255, 153/255, 1, //front
 
         
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

    // colors
    for (j = 0; j <= SPHERE_DIV; j++) {
        for (i = 0; i <= SPHERE_DIV; i++) {
          colors.push( (j-1)/SPHERE_DIV  );  // X
          colors.push( (j-1)/SPHERE_DIV + 0.05);       // Y
          colors.push( (j-1)/SPHERE_DIV + 0.2);  // Z
          colors.push(1);
        }
      }
  
    var o = new Object(); // Utilize Object object to return multiple buffer objects together
  
    // Write vertex information to buffer object
    o.vertexBuffer = initArrayBuffer(gl, new Float32Array(vertices), 3, gl.FLOAT);
    o.colorBuffer = initArrayBuffer(gl, new Float32Array(colors), 4, gl.FLOAT);
    o.normalBuffer = initArrayBuffer(gl, new Float32Array(vertices), 3, gl.FLOAT);
    o.indexBuffer = initIndexBuffer(gl, new Uint8Array(indices), gl.UNSIGNED_BYTE);
    o.numIndices = indices.length;
    if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; 
  
  
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  
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

    return buffer;
}


// * ==================Drawing====================================
function drawAll(gl, shapeArr, viewProjMatrix, u_modelMatrix) { //draw all the shape
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clrColr = new Float32Array(4);
    clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);

    //raindrops - changed with angle02
    pushMatrix(g_modelMatrix1);
        for(var i=0; i<g_rainNum; i++){
            let seed3 = Math.random();
            g_modelMatrix1.setTranslate(-0.7+g_angle02/100 + i*1/g_rainNum, -1*seed3+0.1, 0); 	
            g_modelMatrix1.scale(0.02, 0.05, 0.02);
            draw(gl, shapeArr[2], u_modelMatrix, g_modelMatrix1); 
        }
    g_modelMatrix1 = popMatrix();
    
    //thunder
    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.setTranslate(0, -0.2, 0); 
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.12, 0.12, 0.12);
        drawShapeDraggable(gl, shapeArr[1], u_modelMatrix, g_modelMatrix1); 
    g_modelMatrix1 = popMatrix();
    
    drawClouds(gl, shapeArr[0], u_modelMatrix, g_modelMatrix1)
}

function drawClouds(gl, shape, u_modelMatrix, g_modelMatrix1){
    //clouds
    var scaleFactor = 20;
    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.setTranslate(0.5, 0.46, 0);
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.13, 0.08, 0.1);
        let delay = 2.6;
        if(g_angle01>delay){
            g_modelMatrix1.scale(1+g_angle01/scaleFactor,1+g_angle01/scaleFactor, 1+g_angle01/scaleFactor);
        }
        else{
            g_modelMatrix1.scale(1+delay/scaleFactor,1+delay/scaleFactor, 1+delay/scaleFactor);
        }
        drawMovable(gl, shape, u_modelMatrix, g_modelMatrix1); 
    g_modelMatrix1 = popMatrix();

    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.setTranslate(0, 0.6, 0); 
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.12, 0.12, 0.12);
        delay = 2;
        if(g_angle01>delay){
            g_modelMatrix1.scale(1+g_angle01/scaleFactor,1+g_angle01/scaleFactor, 1+g_angle01/scaleFactor);
        }
        else{
            g_modelMatrix1.scale(1+delay/scaleFactor,1+delay/scaleFactor, 1+delay/scaleFactor);
        }
        drawMovable(gl, shape, u_modelMatrix, g_modelMatrix1); 
    g_modelMatrix1 = popMatrix();

    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.setTranslate(-0.4, 0.4, -0.5);
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.12, 0.06, 0.1);
        delay = 1.5;
        if(g_angle01>delay){
            g_modelMatrix1.scale(1+g_angle01/scaleFactor,1+g_angle01/scaleFactor, 1+g_angle01/scaleFactor);
        }
        else{
            g_modelMatrix1.scale(1+delay/scaleFactor,1+delay/scaleFactor, 1+delay/scaleFactor);
        }
        drawMovable(gl, shape, u_modelMatrix, g_modelMatrix1);       
    g_modelMatrix1 = popMatrix();

    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.setTranslate(-0.75, 0.32, 1);
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.1, 0.06, 0.3);
        g_modelMatrix1.scale(0.5+g_angle01/10,0.5+g_angle01/10,0.5+g_angle01/10);
        drawMovable(gl, shape, u_modelMatrix, g_modelMatrix1); 
    g_modelMatrix1 = popMatrix();
}

function drawShapeDraggable(gl, shape, u_modelMatrix, g_modelMatrix1) { 
    //perp-axis rotation for object:
    var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
    g_modelMatrix1.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
    draw(gl, shape,  u_modelMatrix, g_modelMatrix1);
}

function draw(gl, shape, u_modelMatrix, g_modelMatrix1){ //general draw function
    initAttributeVariable(gl, gl.program.a_Position, shape.vertexBuffer);
    initAttributeVariable(gl, gl.program.a_Normal, shape.normalBuffer);
    if (gl.program.a_Color != undefined){ // If a_Color is defined to attribute
        initAttributeVariable(gl, gl.program.a_Color, shape.colorBuffer);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);

    gl.uniformMatrix4fv(u_modelMatrix, false, g_modelMatrix1.elements);
    if(drawingMode == "lines"){
        gl.drawElements(gl.LINE_LOOP, shape.numIndices, gl.UNSIGNED_BYTE, 0);
    }
    else{
        gl.drawElements(gl.TRIANGLES, shape.numIndices, gl.UNSIGNED_BYTE, 0);
    }
}

function drawMovable(gl, shape, u_modelMatrix, g_modelMatrix1){ //draw key movements
    g_modelMatrix1.rotate(g_angle03, 0.0, 1.0, 0.0); 
    draw(gl, shape, u_modelMatrix, g_modelMatrix1)
}

function initAttributeVariable(gl, a_attribute, buffer) { // Assign the buffer objects and enable the assignment
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

// * ==================Animation====================================
function keydown(ev, gl, shape, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    // from JointModel.js (c) 2012 matsuda
    switch (ev.keyCode) {
      case 38: // Up arrow key -> the positive rotation of joint1 around the z-axis
        if (g_angle03 < 135.0) g_angle03 += ANGLE_STEP;
        break;
      case 40: // Down arrow key -> the negative rotation of joint1 around the z-axis
        if (g_angle03 > -135.0) g_angle03 -= ANGLE_STEP;
        break;
      case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
        g_angle03 = (g_angle03 + ANGLE_STEP) % 360;
        break;
      case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_angle03 = (g_angle03 - ANGLE_STEP) % 360;
        break;
      default: return; // Skip drawing at no effective action
    }
  }

var g_last2 = Date.now();
function animate3() {
    var now = Date.now();  // Calculate the elapsed time
    var elapsed = now - g_last2;
    g_last2 = now; 
    var newAngle = 0;
    if(isForward){
      newAngle = g_angle03 + (g_angle03Rate * elapsed) / 1000.0;
    }
    if(newAngle > g_angle03Max){ isForward = false;}
    if(!isForward){
      newAngle = g_angle03 - (g_angle03Rate * elapsed) / 1000.0;
    } 
    if(newAngle < g_angle03Min){ isForward = true;}
    return newAngle;
}

var g_last1 = Date.now();
function animate1() {
    var now = Date.now();  // Calculate the elapsed time
    var elapsed = now - g_last1;
    g_last1 = now; 
    var newAngle = 0;
    if(isForward){
      newAngle = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
    }
    if(newAngle > g_angle01Max){ isForward = false;}
    if(!isForward){
      newAngle = g_angle01 - (g_angle01Rate * elapsed) / 1000.0;
    } 
    if(newAngle < g_angle01Min){ isForward = true;}
    return newAngle;
}

var isForward = true;
var g_last = Date.now();
function animate2() {
  var now = Date.now();  // Calculate the elapsed time
  var elapsed = now - g_last;
  g_last = now; 
  var newAngle = 0;
  if(isForward){
    newAngle = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
  }
  if(newAngle > g_angle02Max){ isForward = false;}
  if(!isForward){
    newAngle = g_angle02 - (g_angle02Rate * elapsed) / 1000.0;
  } 
  if(newAngle < g_angle02Min){ isForward = true;}
  return newAngle;
}

// * ==================handle matrices=============================
var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}




// * ==================HTML Button Callbacks=========================
function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
  var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};
    
function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  g_angle01Rate += 25; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 g_angle01Rate -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(g_angle01Rate*g_angle01Rate > 1) {  // if nonzero rate,
    myTmp = g_angle01Rate;  // store the current rate,
    g_angle01Rate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
  	g_angle01Rate = myTmp;  // use the stored rate.
  }
}

// * ===================Mouse and Keyboard event-handling Callbacks===========
function myMouseDown(ev) {
    //==============================================================================
    // Called when user PRESSES down any mouse button;
    // 									(Which button?    console.log('ev.button='+ev.button);   )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
    
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
      var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
      var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
      var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
    //  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
      
        // Convert to Canonical View Volume (CVV) coordinates too:
      var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                               (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
        var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                                 (g_canvas.height/2);
    //	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
        
        g_isDrag = true;											// set our mouse-dragging flag
        g_xMclik = x;													// record where mouse-dragging began
        g_yMclik = y;
        // report on webpage
        document.getElementById('MouseAtResult').innerHTML = 
          'Mouse At: '+x.toFixed(5)+', '+y.toFixed(5);
};
    
function myMouseMove(ev) {
    //==============================================================================
    // Called when user MOVES the mouse with a button already pressed down.
    // 									(Which button?   console.log('ev.button='+ev.button);    )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
    
        if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
    
        // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
      var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
      var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
        var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
    //  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
      
        // Convert to Canonical View Volume (CVV) coordinates too:
      var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                               (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
        var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                                 (g_canvas.height/2);
    //	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);
    
        // find how far we dragged the mouse:
        g_xMdragTot += (x - g_xMclik);					// Accumulate change-in-mouse-position,&
        g_yMdragTot += (y - g_yMclik);
        // Report new mouse position & how far we moved on webpage:
        document.getElementById('MouseAtResult').innerHTML = 
          'Mouse At: '+x.toFixed(5)+', '+y.toFixed(5);
        document.getElementById('MouseDragResult').innerHTML = 
          'Mouse Drag: '+(x - g_xMclik).toFixed(5)+', '+(y - g_yMclik).toFixed(5);
    
        g_xMclik = x;													// Make next drag-measurement from here.
        g_yMclik = y;
};
    
function myMouseUp(ev) {
    //==============================================================================
    // Called when user RELEASES mouse button pressed previously.
    // 									(Which button?   console.log('ev.button='+ev.button);    )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
    
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
      var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
      var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
        var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
    //  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
      
        // Convert to Canonical View Volume (CVV) coordinates too:
      var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                               (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
        var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                                 (g_canvas.height/2);
        console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
        
        g_isDrag = false;											// CLEAR our mouse-dragging flag, and
        // accumulate any final bit of mouse-dragging we did:
        g_xMdragTot += (x - g_xMclik);
        g_yMdragTot += (y - g_yMclik);
        // Report new mouse position:
        document.getElementById('MouseAtResult').innerHTML = 
          'Mouse At: '+x.toFixed(5)+', '+y.toFixed(5);
        console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',g_xMdragTot,',\t',g_yMdragTot);
};
    
function myMouseClick(ev) {
    //=============================================================================
    // Called when user completes a mouse-button single-click event 
    // (e.g. mouse-button pressed down, then released)
    // 									   
    //    WHICH button? try:  console.log('ev.button='+ev.button); 
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
    //    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.
    
      // STUB
        console.log("myMouseClick() on button: ", ev.button); 
}	
    
function myMouseDblClick(ev) {
    //=============================================================================
    // Called when user completes a mouse-button double-click event 
    // 									   
    //    WHICH button? try:  console.log('ev.button='+ev.button); 
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
    //    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.
    
      // STUB
        console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	
