
//some useful functions related to drawing and animation here


"use strict";

function drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix) {
    mvpMatrix.set(projMatrix);
    mvpMatrix.multiply(viewMatrix);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_ModelMatrix, false, mvpMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_ModelMatrix, false, normalMatrix.elements);
    draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix);
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
            // console.log("drawing triangles")
        }
    }
    else {
        // console.log("drawArrays...");
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
    // console.log(Math.floor(elapsed/1000))
    return elapsed;
}