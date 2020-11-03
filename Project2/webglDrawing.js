//Done: ‘Ground Plane’ Grid
//Done: Double pendulum
//Done: View Control
//Done: Two Side-by-Side Viewports 
//?Doing: Add some 3D Models
//Todo: More Additional, Separate, jointed assemblies
//Todo: Mouse-Drag Rotation of 3D Object using quaternion
//Todo: Show 3D World Axes and add some 3D Model Axes
//*Almost: Perspective Camera AND orthographic Camera
//*Almost: position and move your camera in the x,y plane (z=0) 
//*Almost: Re-sizable Webpage

'use strict';
var g_drawingMode = "triangle";
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var mvpMatrix = new Matrix4();
var u_ModelMatrix, u_NormalMatrix, u_ProjMatrix, u_ViewMatrix;
var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; //eye position default
var g_LookX = 0.0, g_LookY = 0.0, g_LookZ = 0.0;
var g_LookUp = 0.0;
var g_speed = 1;
var g_angle01 = 0.0;
var g_viewScale = 1;
var g_cloudAngle = 1, g_cloudAngleRate = 1.2,  g_cloudAngleMin = 0,  g_cloudAngleMax = 2.5; 
var g_time = 0, g_endSHOtime = 100, g_SHOgap = 0.1, g_damping1 = 20;
var canvas;

function drawAll(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    writeHtml() 
    //scene on the left
    gl.viewport(0, 0, gl.canvas.width/2, gl.canvas.height); 
    var aspectRatio = (gl.drawingBufferWidth/2) / (gl.drawingBufferHeight);
    projMatrix.setPerspective(42.0, aspectRatio, 1, 100);
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); //center/look-at point
    modelMatrix.setScale(1,1,1);

    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    drawScene(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix);


    //orth scene on the right
    modelMatrix.setScale(1,1,1);
    gl.viewport(gl.canvas.width/2, 0, gl.canvas.width/2, gl.canvas.height); 
    projMatrix.setOrtho(-10.0, 10.0, -10.0, 10.0, 0.0, 2000.0);
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); 
    drawScene(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);

}

// ! array order: thunder, cube, semiSphere, sphere
// ! x++:right y++:up z++:far
function drawClouds(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    var scaleFactor = 4;
    pushMatrix(modelMatrix);
        modelMatrix.translate(2, 0, 0);
        modelMatrix.scale(0.25,0.05,0.25);	
        let delay = 2.6;
        if(g_cloudAngle>delay){
            modelMatrix.scale(1+g_cloudAngle/scaleFactor,1+g_cloudAngle/scaleFactor, 1+g_cloudAngle/scaleFactor);
        }
        else{
            modelMatrix.scale(1+delay/scaleFactor,1+delay/scaleFactor, 1+delay/scaleFactor);
        }
        draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0.3, 0);
        modelMatrix.scale(0.2,0.1,0.2);	
        draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
        modelMatrix.translate(0.7, 0.5, 0);
        modelMatrix.scale(0.3,0.15,0.2);	
        draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
        modelMatrix.translate(-0.5, 0, 0);
        modelMatrix.scale(0.15,0.04,0.15);	
        draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();

}

// TODO: 👇
function drawDoublePen(gl, [thunder, cube, sphere], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    modelMatrix.setTranslate(5,4,0);
    modelMatrix.scale(10,10,10)
    // * drawJoint(gl, cube, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    // * draw(gl, cube, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    //base
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.03,0.01,0.03);
        modelMatrix.translate(0,0,0); 
        drawJoint(gl, cube, u_NormalMatrix, normalMatrix,u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

   
    let dragAngle = -1*30*g_xMdragTot;
    if(dragAngle > 40){ dragAngle = 40;}
    if(dragAngle < -40) { dragAngle = -40;}

    let oscTime = Math.floor(g_time/200);
    let oscilateAngle = penMotion(degToRad(dragAngle), 0);
    if(g_isDrag){ 
        oscilateAngle = penMotion(degToRad(dragAngle), 0);
    }

    
    if(oscTime > g_endSHOtime/g_SHOgap-1){ 
        oscTime = g_endSHOtime/g_SHOgap-1;
        modelMatrix.rotate(dragAngle,  0.0, 0.0, 1.0);
        g_last3 = Date.now();
    }else{
        modelMatrix.rotate(oscilateAngle[0][oscTime+1]*80,  0.0, 0.0, 1.0);
    }
    //rod1
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.003,0.1,0.003);
        // modelMatrix.translate(1,1,1); 
        drawJoint(gl, cube, u_NormalMatrix, normalMatrix,u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //middle ball
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.011,0.011,0.011);
        modelMatrix.translate(0,10,0); 
        drawJoint(gl, sphere, u_NormalMatrix, normalMatrix,u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //rod2
    // modelMatrix.rotate(oscilateAngle[1][oscTime+1]*80,  0.0, 0.0, 1.0);
    // modelMatrix.rotate(-1*oscilateAngle[0][oscTime+1]*80,0,0,1);
    modelMatrix.rotate(oscilateAngle[1][oscTime+1]*80,  0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.003,0.2,0.003);
        modelMatrix.translate(0,0,0); 
        // modelMatrix.rotate(20-1*oscilateAngle[0][oscTime+1]*80,0,0,1);
        // modelMatrix.rotate(oscilateAngle[1][oscTime+1]*80,  0.0, 0.0, 1.0);
        drawJoint(gl, cube, u_NormalMatrix, normalMatrix,u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    // //middle ball
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.021,0.021,0.021);
        modelMatrix.translate(0,10,0); 
        drawJoint(gl, sphere, u_NormalMatrix, normalMatrix,u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();
}

function drawRaindrops(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    draw(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
}

function drawThunderMotion(gl, [thunder, cube], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    modelMatrix.setTranslate(2,1.3,-3);
    //base
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.3,0.3,0.3);
        modelMatrix.translate(0,0,0);
        drawJoint(gl, cube, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //config dragging action
    let dragAngle = 40*g_xMdragTot;
    if(dragAngle > 40){ dragAngle = 40;}
    if(dragAngle < -40) { dragAngle = -40;}
    modelMatrix.rotate(dragAngle,  0.0, 0.0, 1.0);
    let oscTime = Math.floor(g_time/100);
    let oscilateAngle = SHO(dragAngle);
    if(g_isDrag){ //not confused with button clicking action
        oscilateAngle = SHO(dragAngle);
    }
    if(oscTime > g_endSHOtime/g_SHOgap-1){ 
        oscTime = g_endSHOtime/g_SHOgap-1;
        modelMatrix.rotate(-1*dragAngle,  0.0, 0.0, 1.0);
        modelMatrix.rotate(0,  0.0, 0.0, 1.0);
        g_last3 = Date.now();
    }else{
        modelMatrix.rotate(oscilateAngle[oscTime+1]*80,  0.0, 0.0, 1.0);
        modelMatrix.rotate(-1*dragAngle,  0.0, 0.0, 1.0);
    }
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.03,0.85,0.03);
        modelMatrix.translate(0,-1,0);
        drawJoint(gl, cube, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //bob
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.2, 0.2, 0.2);
        modelMatrix.translate(0, -4.2, 0.25);
        let angle = oscilateAngle[oscTime]*80;
        modelMatrix.rotate(20-1*angle,0,0,1);

        let oscilateAngle2 = SHO2(20);
        let oscTime2 = Math.floor(g_time/100);
        if(oscTime2 > g_endSHOtime/g_SHOgap-1){ 
            oscTime2 = g_endSHOtime/g_SHOgap-1;
            modelMatrix.rotate(0,  0.0, 0.0, 1.0);
        }else{
            modelMatrix.rotate(oscilateAngle2[oscTime2]*80,0,1,0);
        }
        drawJoint(gl, thunder, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();
    
}
function drawAnotherClouds(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    pushMatrix(modelMatrix);
        modelMatrix.setTranslate(2,1.6,-3)
        drawClouds(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
        modelMatrix.setTranslate(-2,1.6,-5)
        drawClouds(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();

}

function drawSingleThunder(gl, thunder, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    pushMatrix(modelMatrix);
        modelMatrix.scale(1, 6, 1);
        modelMatrix.translate(-12, -1.2, 0.25);
        let oscilateAngle2 = SHO2(40);
        let oscTime2 = Math.floor(g_time/100);
        if(oscTime2 > g_endSHOtime/g_SHOgap-1){ 
            oscTime2 = g_endSHOtime/g_SHOgap-1;
            modelMatrix.rotate(0,  0.0, 0.0, 1.0);
        }else{
            modelMatrix.rotate(oscilateAngle2[oscTime2]*80,0,1,0);
        }
        drawJoint(gl, thunder, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();
}

function drawScene(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix) {
    viewMatrix.scale(0.4*g_viewScale, 0.4*g_viewScale, 0.4*g_viewScale); //scale everything
    
    //draw shapes
    pushMatrix(modelMatrix); 
        modelMatrix.setTranslate(0, 10, -10);
        modelMatrix.scale(1, 1, 1);
        // drawRaindrops(gl, vbArray[4], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawThunderMotion(gl, [vbArray[1], vbArray[2], vbArray[4]], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawDoublePen(gl, [vbArray[1], vbArray[2], vbArray[4]], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        // drawClouds(gl, vbArray[3], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawAnotherClouds(gl, vbArray[3], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawSingleThunder(gl, vbArray[1], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)

    modelMatrix = popMatrix();

    //draw grid ground
    viewMatrix.rotate(-90.0, 1,0,0);
    viewMatrix.translate(0.0, 0.0, -0.6);	
    viewMatrix.scale(0.4, 0.4,0.4);
    draw(gl, vbArray[0], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);

}

function main() {
    console.log("I'm in webglDrawing.js right now...");
    canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    resizeCanvas(gl, canvas)


    // Specify gl drawing config
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.BLEND);// Enable alpha blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function
    gl.enable(gl.DEPTH_TEST); 

    // Get the storage locations of uniform variables
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    if (!u_ModelMatrix || !u_NormalMatrix || !u_ViewMatrix || !u_ProjMatrix) {
        console.log('Failed to get the storage location');
        return;
    }

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
    var thunder = initVertexBuffersForShape2(gl); //thunder
    var semiSphere = initVertexBuffersForShape1(gl); //semi-sphere
    var sphere = initVertexBuffersForShape3(gl); //full sphere
    var cube = initVertexBuffersForShape4(gl); //cube
    if (!thunder || !semiSphere || !sphere || !cube) {
        console.log('Failed to set the vertex information of objects');
        return;
    }

    window.addEventListener("mousedown", myMouseDown); 
    window.addEventListener("mousemove", myMouseMove); 
    window.addEventListener("mouseup", myMouseUp);
    window.addEventListener("wheel", mouseWheel);
    document.onkeydown = function (ev) { 
        keyAD(ev);
        keyWS(ev);
        keyQE(ev);
        keyArrowRotateRight(ev);
        keyArrowRotateUp(ev);
    };

    var tick = function () {
        g_cloudAngle = animateCloud();
        g_time = showCurTime();
        drawAll(gl, [groundGrid, thunder, cube, semiSphere, sphere],  u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix);
        requestAnimationFrame(tick, canvas);
    }
    tick();
}



