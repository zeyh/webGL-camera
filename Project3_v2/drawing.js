// Coordinate transformation matrix
var viewProjMatrix = new Matrix4();  
var viewProjMatrixFromLight = new Matrix4();  
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_jointAngle2 = 0;
var gl, canvas;

var mvpMatrixFromLight_t = new Matrix4(); // A model view projection matrix from light source (for triangle)
var mvpMatrixFromLight_p = new Matrix4(); // A model view projection matrix from light source (for plane)


function drawScene_shadow(gl, shadowProgram,  [triangle, cube, thunder, groundGrid, semiSphere, axis, thunder2, axis2, groundPlane,sphere], currentAngle, viewProjMatrixFromLight) {
    drawTriangle(gl, shadowProgram, triangle, currentAngle, viewProjMatrixFromLight);
    mvpMatrixFromLight_t.set(g_mvpMatrix); // Used later
    drawSphere(gl, shadowProgram, sphere, viewProjMatrixFromLight);
    mvpMatrixFromLight_p.set(g_mvpMatrix); // Used later
}
function drawAll_shadow(gl, shadowProgram, vbArr, currentAngle, viewProjMatrixFromLight) {
    viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 200.0);
    viewProjMatrixFromLight.lookAt(LIGHT[0], LIGHT[1], LIGHT[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    drawScene_shadow(gl, shadowProgram, vbArr, currentAngle, viewProjMatrixFromLight);
}

function drawScene(gl, normalProgram, [triangle, cube, thunder, groundGrid, semiSphere, axis, thunder2, axis2, groundPlane, sphere], currentAngle, viewProjMatrix) {
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
    drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjMatrix);
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
    drawSphere(gl, normalProgram, sphere, viewProjMatrix);
}
function drawAll(gl, normalProgram, vbArr, currentAngle, viewProjMatrix) {
    viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    drawScene(gl, normalProgram, vbArr, currentAngle, viewProjMatrix) ;

}


function drawTriangle(gl, program, triangle, angle, viewProjMatrix) {
    // Set rotate angle to model matrix and draw triangle
    g_modelMatrix.setRotate(angle, 0, 1, 0);
    draw(gl, program, triangle, viewProjMatrix);
}

function drawSphere(gl, program, sphere, viewProjMatrix) {
    // Set scaling and translation to model matrix and draw sphere
    g_modelMatrix.setScale(3.0, 3.0, 3.0);
    g_modelMatrix.translate(0.0, -0.7, 0.0);
    draw(gl, program, sphere, viewProjMatrix);
}

// * universial drawing function
function draw(gl, program, o, viewProjMatrix) {
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    if (program.a_Color != undefined)
        // If a_Color is defined to attribute
        initAttributeVariable(gl, program.a_Color, o.colorBuffer);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);
    if (o.indexBuffer != undefined) {
        gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
    } else {
        gl.drawArrays(gl.LINES, 0, o.numIndices);
    }
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}
