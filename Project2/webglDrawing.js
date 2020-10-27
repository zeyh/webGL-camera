'use strict';
var g_drawingMode = "triangle";
var g_mvpMatrix = new Matrix4();
var g_modelMatrix = new Matrix4();  
function main(){
    console.log("I'm in webglDrawing.js right now...");
    var canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // Set the vertex information
    // Assign the buffer object to the attribute variable
    gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.program.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (! gl.program.a_Position || !gl.program.a_Color || gl.program.a_Normal) {
      console.log('Failed to get the storage location');
      return false;
    }  

    // Specify gl drawing config
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(0.0); // each time we 'clear' our depth buffer, set all
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GREATER); // draw a pixel only if its depth value is 
    gl.enable (gl.BLEND);// Enable alpha blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function

    // Get the storage locations of uniform variables
    var u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix');
    var u_normalMatrix = gl.getUniformLocation(gl.program, 'u_normalMatrix');
    if (!u_modelMatrix || !u_normalMatrix) {
        console.log('Failed to get the storage location');
        return;
    }


    // // Create a local version of our model matrix in JavaScript
    // var modelMatrix = new Matrix4();  
    // Calculate the view projection matrix
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(20.0, 10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    // init Vertex Buffer
    var groundGrid = initVertexBuffersForGroundGrid(gl);
    if (! groundGrid) {
        console.log('Failed to set the vertex information of groundGrid');
        return;
    }
    var thunder = initVertexBuffersForShape2(gl);
    if (! thunder) {
        console.log('Failed to set the vertex information of groundGrid');
        return;
    }
    var currentAngle = 0.0;
    drawAll(gl, [groundGrid], currentAngle, u_modelMatrix, viewProjMatrix, u_normalMatrix); // Draw shapes
}

g_modelMatrix = new Matrix4();
function drawAll(gl, vbArray, currentAngle, u_modelMatrix, viewProjMatrix, u_normalMatrix){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    console.log(vbArray[0])
    g_modelMatrix.translate(0.4, -0.4, 0.0);
    g_modelMatrix.scale(0.1, 0.1, 0.1); // shrink by 10X:
    draw(gl, vbArray[0], u_modelMatrix, g_modelMatrix)
}

function drawJoint(gl, shape, u_modelMatrix, g_modelMatrix, u_normalMatrix, viewProjMatrix){
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_modelMatrix, false, g_mvpMatrix.elements);
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_normalMatrix, false, g_normalMatrix.elements);
    draw(gl, shape, u_normalMatrix, g_normalMatrix);
}

function draw(gl, shape, u_modelMatrix, g_modelMatrix){ //general draw function
    initAttributeVariable(gl, gl.program.a_Position, shape.vertexBuffer);
    initAttributeVariable(gl, gl.program.a_Color, shape.colorBuffer);
    if (shape.normalBuffer != undefined){ // If a_Normal is defined to attribute
        initAttributeVariable(gl, gl.program.a_Normal, shape.normalBuffer);
        console.log("binding normal")
    }
    if (shape.indexBuffer != undefined){ 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        console.log("binding indices array")
    }
    //matrixLocation, false, viewProjectionMatrix*matrix
    gl.uniformMatrix4fv(u_modelMatrix, false, g_modelMatrix.elements); 
    if(shape.indexBuffer != undefined){
        if(g_drawingMode == "lines"){
            gl.drawElements(gl.LINE_STRIP, shape.numIndices, gl.UNSIGNED_BYTE, 0);
        }else{
            gl.drawElements(gl.TRIANGLES, shape.numIndices, gl.UNSIGNED_BYTE, 0);
            console.log("drawing triangles")
        }
    }
    else{
        console.log("drawArrays...");
        gl.drawArrays( gl.LINES,0,400); 
    }
}

function initAttributeVariable(gl, a_attribute, buffer) { // Assign the buffer objects and enable the assignment
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
    console.log("binding",a_attribute)
}