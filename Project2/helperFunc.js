
//some useful functions related to drawing and animation here
"use strict";
var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
    var m2 = new Matrix4(m);
    g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
    return g_matrixStack.pop();
}


function drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix) {
    pushMatrix(modelMatrix);   // Save the model matrix
        mvpMatrix.set(projMatrix);
        mvpMatrix.multiply(viewMatrix);
        mvpMatrix.multiply(modelMatrix);
        gl.uniformMatrix4fv(u_ModelMatrix, false, mvpMatrix.elements);
        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
        draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix);
    modelMatrix = popMatrix();
}

function draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix) { //general draw function
    initAttributeVariable(gl, gl.program.a_Position, shape.vertexBuffer);
    initAttributeVariable(gl, gl.program.a_Color, shape.colorBuffer);
    if (shape.normalBuffer != undefined) { // If a_Normal is defined to attribute
        initAttributeVariable(gl, gl.program.a_Normal, shape.normalBuffer);
    }
    if (shape.indexBuffer != undefined) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
    }

   
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    if (shape.indexBuffer != undefined) {
        if (g_drawingMode == "lines") {
            gl.drawElements(gl.LINE_STRIP, shape.numIndices, gl.UNSIGNED_BYTE, 0);
        } else {
            gl.drawElements(gl.TRIANGLES, shape.numIndices, gl.UNSIGNED_BYTE, 0);
        }
    }
    else {
        gl.drawArrays(gl.LINES, 0, shape.numIndices);
    }
}

function initAttributeVariable(gl, a_attribute, buffer) { // Assign the buffer objects and enable the assignment
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}



function radToDeg(r) {
    return r * 180 / Math.PI;
}

function degToRad(d) {
    return d * Math.PI / 180;
}

// animations =================================
var g_lastCloud = Date.now();
var isForward = true;
function animateCloud() {
    var now = Date.now();  // Calculate the elapsed time
    var elapsed = now - g_lastCloud;
    g_lastCloud = now; 
    var newAngle = 0;
    if(newAngle < 0 || newAngle > 3){ return 1;}
    if(isForward){
      newAngle = g_cloudAngle + (g_cloudAngleRate * elapsed) / 1000.0;
    }
    if(newAngle > g_cloudAngleMax){ isForward = false;}
    if(!isForward){
      newAngle = g_cloudAngle - (g_cloudAngleRate * elapsed) / 1000.0;
    } 
    if(newAngle < g_cloudAngleMin){ isForward = true;}
    return newAngle;
}

var g_last3 = Date.now();
function showCurTime() {
    if(g_isDrag){
        g_last3 = Date.now();
    }
    var now = Date.now();  // Calculate the elapsed time
    var elapsed = now - g_last3;
    return elapsed;
}

var g_last4J = Date.now();
var isForward2 = true;
function animateJoints() {
    var now = Date.now();  // Calculate the elapsed time
    var elapsed = now - g_last4J;
    g_last4J = now; 
    var newAngle = 0;
    if(isForward2){
      newAngle = g_jointAngle + (g_jointAngleRate * elapsed) / 360.0;
    }
    if(newAngle > g_jointAngleMax){ isForward2 = false;}
    if(!isForward2){
      newAngle = g_jointAngle - (g_jointAngleRate * elapsed) / 360.0;
    } 
    if(newAngle < g_jointAngleMin){ isForward2 = true;}
    return newAngle;
}