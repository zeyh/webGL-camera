//Done: ‘Ground Plane’ Grid
//Done: Double pendulum
//?Doing: add some 3D Models
//Todo: More Additional, Separate, jointed assemblies
//Todo: Mouse-Drag Rotation of 3D Object using quaternion
//Todo: Show 3D World Axes and add some 3D Model Axes
//Todo: Two Side-by-Side Viewports in a Re-sizable Webpage
//Todo: Perspective Camera AND orthographic Camera
//Todo: position and move your camera in the x,y plane (z=0) 
//Todo: View Control

'use strict';
var g_drawingMode = "triangle";
var g_mvpMatrix = new Matrix4();
var g_modelMatrix = new Matrix4();
var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25;
function main() {
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

    // Specify gl drawing config
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(0.0); // each time we 'clear' our depth buffer, set all
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GREATER); // draw a pixel only if its depth value is 
    gl.enable(gl.BLEND);// Enable alpha blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function

    // Get the storage locations of uniform variables
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    if (!u_ModelMatrix || !u_NormalMatrix || !u_ViewMatrix || !u_ProjMatrix) {
        console.log('Failed to get the storage location');
        return;
    }

    var viewMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    var modelMatrix = new Matrix4();

    modelMatrix.setTranslate(0.75, 0, 0);
    viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    // Set the vertex information
    // Assign the buffer object to the attribute variable
    gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.program.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (!gl.program.a_Position || !gl.program.a_Color || gl.program.a_Normal) {
        console.log('Failed to get the storage location');
        return false;
    }


    // init Vertex Buffer
    var groundGrid = initVertexBuffersForGroundGrid(gl);
    if (!groundGrid) {
        console.log('Failed to set the vertex information of groundGrid');
        return;
    }
    var thunder = initVertexBuffersForShape2(gl);
    if (!thunder) {
        console.log('Failed to set the vertex information of groundGrid');
        return;
    }
    var currentAngle = 0.0;
    // drawAll(gl, [thunder], currentAngle, u_ModelMatrix, u_NormalMatrix, modelMatrix); // Draw shapes
    // drawGrid(gl, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix, groundGrid);
    document.onkeydown = function (ev) { keydown(ev, gl, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix, groundGrid); };

    var tick = function () {
        drawGrid(gl, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix, groundGrid, [thunder]);
        requestAnimationFrame(tick, canvas);
    }
    tick();
}

function drawAll(gl, vbArray, currentAngle, u_ModelMatrix, u_NormalMatrix, modelMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    pushMatrix(modelMatrix); 
        modelMatrix.setTranslate(0.4, -0.4, 0.0);
        modelMatrix.scale(10, 10, 10); // shrink by 10X:
        draw(gl, vbArray[0], u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();
}

function drawJoint(gl, shape, u_modelMatrix, g_modelMatrix, u_normalMatrix, viewProjMatrix) {
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_modelMatrix, false, g_mvpMatrix.elements);
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_normalMatrix, false, g_normalMatrix.elements);
    draw(gl, shape, u_normalMatrix, g_normalMatrix);
}

function draw(gl, shape, u_ModelMatrix, modelMatrix) { //general draw function
    initAttributeVariable(gl, gl.program.a_Position, shape.vertexBuffer);
    initAttributeVariable(gl, gl.program.a_Color, shape.colorBuffer);
    if (shape.normalBuffer != undefined) { // If a_Normal is defined to attribute
        initAttributeVariable(gl, gl.program.a_Normal, shape.normalBuffer);
    }
    if (shape.indexBuffer != undefined) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
    }
    //matrixLocation, false, viewProjectionMatrix*matrix
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

function drawGrid(gl, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix, shape, vbArray) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    initAttributeVariable(gl, gl.program.a_Position, shape.vertexBuffer);
    initAttributeVariable(gl, gl.program.a_Color, shape.colorBuffer);
    if (shape.normalBuffer != undefined) { // If a_Normal is defined to attribute
        initAttributeVariable(gl, gl.program.a_Normal, shape.normalBuffer);
    }
    if (shape.indexBuffer != undefined) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
    }

    // gl.viewport(0, 0, gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2);
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, 0, 0, 0, 0, 1, 0);

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    drawMyScene(gl, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix, shape.numIndices, vbArray);
}

function drawMyScene(gl, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix, vertexNum, vbArray) {
    pushMatrix(modelMatrix); 
        // modelMatrix.setTranslate(0.4, -0.4, 0.0);
        modelMatrix.scale(0.1, 0.1, 0.1); // shrink by 10X:
        draw(gl, vbArray[0], u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();

    // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    pushMatrix(modelMatrix); 
        viewMatrix.rotate(-90.0, 1, 0, 0);
        viewMatrix.translate(0.0, 0.0, -0.6);
        viewMatrix.scale(0.4, 0.4, 0.4);
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
        gl.drawArrays(gl.LINES, 0, vertexNum);
    modelMatrix = popMatrix(); 
}