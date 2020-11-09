//Done: ‘Ground Plane’ Grid
//Done: Double pendulum
//Done: View Control
//Done: Two Side-by-Side Viewports 
//Done: Add some 3D Models
//Done: More Additional, Separate, jointed assemblies
//Done: Perspective Camera
//Done: Re-sizable Webpage
//Done: Mouse-Drag Rotation of 3D Object using quaternion
//Done: Show 3D World Axes and add some 3D Model Axes
//*Almost: orthographic Camera
//*Almost: position and move your camera in the x,y plane (z=0) 


'use strict';
var g_drawingMode = "triangle";
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var mvpMatrix = new Matrix4();
var quatMatrix = new Matrix4();       
var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var u_ModelMatrix, u_NormalMatrix, u_ProjMatrix, u_ViewMatrix;
var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; //eye position default
var g_LookX = 0.0, g_LookY = 0.0, g_LookZ = 0.0;
var g_LookUp = 0.0;
var g_speed = 1;
var g_angle01 = 0.0;
var g_viewScale = 1;
var g_cloudAngle = 1, g_cloudAngleRate = 1.2,  g_cloudAngleMin = 0,  g_cloudAngleMax = 2.5;
var g_jointAngle = 0, g_jointAngleRate = 1.0,  g_jointAngleMin = -135,  g_jointAngleMax = 135;  
var g_time = 0, g_endSHOtime = 100, g_SHOgap = 0.1, g_damping1 = 20;
var canvas;




function drawAll(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // writeHtml(); //write eye/lookat value at html
    flyForward();
    //perspective scene on the left // ! x++:right y++:up z++:far because setted lookat up as (0,1,0)
    gl.viewport(0, 0, gl.canvas.width/2, gl.canvas.height); 
    if(isFrustrum){//changing between frustrum and perspective
        projMatrix.setFrustum(params.left, params.right, params.top, params.bottom, params.near, params.far)
    }else{
        var aspectRatio = (gl.drawingBufferWidth/2) / (gl.drawingBufferHeight);
        projMatrix.setPerspective(40.0, aspectRatio, 1, 1000);
    }
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); //center/look-at point
    modelMatrix.setScale(1,1,1);
    drawScene(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix);


    //orth scene on the right
    modelMatrix.setScale(1,1,1);
    gl.viewport(gl.canvas.width/2, 0, gl.canvas.width/2, gl.canvas.height); 
    projMatrix.setOrtho(-2.0, 2.0, -2.0, 2.0, 0.001, 2000.0);
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); 
    drawScene(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);

}

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

// TODO: 👇 some physics' not right....
function draw2Bob(gl, [thunder, cube, sphere], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
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

// not used
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

function drawManyClouds(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    pushMatrix(modelMatrix);
        modelMatrix.setTranslate(2,1.6,-3)
        drawClouds(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);
        modelMatrix.setTranslate(-2,1.6,-5)
        drawClouds(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
    modelMatrix = popMatrix();

}

// Done: 👇 draw Quaterion Rotation + axis
function drawSingleThunder(gl, [thunder, axis], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    pushMatrix(modelMatrix);
        modelMatrix.scale(3, 10, 3);
        modelMatrix.translate(-4, 0, 0.25);
        quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);
        modelMatrix.concat(quatMatrix);
        drawJoint(gl, thunder, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);
        modelMatrix.translate(-0.5, -0.3, -0.5);
        modelMatrix.rotate(-90,1,0,0)
        drawJoint(gl, axis, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);  
    modelMatrix = popMatrix();
}

// Done: 👇 Draw 4 joint assemblies
function drawJointAssemblies(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    modelMatrix.setTranslate(-10.0+g_jointAngle/10, 2.0, 3.0+(g_jointAngle*1.5+2)/100);
    //base
    var baseHeight = 0.1;
    //seg1
    var seg1Length = 0.5;
    modelMatrix.translate(0.0, baseHeight, 0.0); 
    modelMatrix.rotate(g_jointAngle*50, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, seg1Length, 0.1);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg2
    var seg2Length = 0.5;
    modelMatrix.translate(0.0, seg1Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*40, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, seg2Length, 0.1);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg3
    var seg3Length = 0.4;
    modelMatrix.translate(0.0, seg2Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*30, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, seg3Length, 0.1);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg4
    var seg4Length = 0.4;
    modelMatrix.translate(0.0, seg3Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, seg4Length, 0.1);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg5
    var seg5Length = 0.6;
    modelMatrix.translate(0.0, seg4Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, seg5Length, 0.1);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg6
    var seg6Length = 0.7;
    modelMatrix.translate(0.0, seg5Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.1, seg6Length, 0.1);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();
}

function drawJointAssemblies2(gl, shape, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix){
    modelMatrix.setTranslate(3.5, 3.0, 1.0);
    //base
    var baseHeight = 0.1;
    //seg1
    var seg1Length = 0.5;
    modelMatrix.translate(0.0, baseHeight, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.05, seg1Length, 0.05);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg2
    var seg2Length = 0.5;
    modelMatrix.translate(0.0, seg1Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.05, seg2Length, 0.05);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg3
    var seg3Length = 0.4;
    modelMatrix.translate(0.0, seg2Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.05, seg3Length, 0.05);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg4
    var seg4Length = 0.4;
    modelMatrix.translate(0.0, seg3Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.05, seg4Length, 0.05);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg5
    var seg5Length = 0.6;
    modelMatrix.translate(0.0, seg4Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.05, seg5Length, 0.05);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();

    //seg6
    var seg6Length = 0.7;
    modelMatrix.translate(0.0, seg5Length, 0.0); 
    modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(modelMatrix);
        modelMatrix.scale(0.05, seg6Length, 0.05);
        drawJoint(gl, shape, u_NormalMatrix, normalMatrix, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix); 
    modelMatrix = popMatrix();
}

function drawScene(gl, vbArray, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix) {
    viewMatrix.scale(0.4*g_viewScale, 0.4*g_viewScale, 0.4*g_viewScale); //scale everything
    
    //draw shapes 
    // ! array order: groundGrid, 1.thunder, cube, semiSphere, sphere, 5.axis, thunder2, 7.axis2
    pushMatrix(modelMatrix); 
        modelMatrix.setTranslate(0, 10, -10);
        modelMatrix.scale(1, 1, 1);
        // drawRaindrops(gl, vbArray[4], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawThunderMotion(gl, [vbArray[1], vbArray[2], vbArray[4]], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        // draw2Bob(gl, [vbArray[1], vbArray[2], vbArray[4]], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawManyClouds(gl, vbArray[3], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawSingleThunder(gl, [vbArray[6],vbArray[5]], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix)
        drawJointAssemblies(gl, vbArray[2], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);
        drawJointAssemblies2(gl, vbArray[2], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);
    modelMatrix = popMatrix();

    //draw grid ground
    viewMatrix.rotate(-90.0, 1,0,0);
    viewMatrix.translate(0.0, 0.0, -0.6);	
    viewMatrix.scale(0.4, 0.4,0.4);
    draw(gl, vbArray[0], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);

    //draw world axis
    draw(gl, vbArray[7], u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix);
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
    setControlPanel(); //init DAT.GUI for controllers for frustrums


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
    // gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (!gl.getAttribLocation(gl.program, 'a_Position')) {
        console.log('Failed to get the storage location a_Position');
        return false;
    }
    if (!gl.program.a_Color) {
        console.log('Failed to get the storage location a_Color');
        return false;
    }
    // if (!gl.program.a_Normal) {
    //     console.log('Failed to get the storage location a_Normal');
    //     return false;
    // }


    // init Vertex Buffer
    var groundGrid = initVertexBuffersForGroundGrid(gl);
    if (!groundGrid) {
        console.log('Failed to set the vertex information of groundGrid');
        return;
    }
    var thunder = initVertexBuffersForShape2(gl, 1); //thunder Solid
    var thunder2 = initVertexBuffersForShape2(gl, 0.5); //thunder transparent
    var semiSphere = initVertexBuffersForShape1(gl); //semi-sphere
    var sphere = initVertexBuffersForShape3(gl); //full sphere
    var cube = initVertexBuffersForShape4(gl); //cube
    var axis = initVertexBuffersForAxis(gl, 2); //axis Short
    var axis2 = initVertexBuffersForAxis(gl, 80); //axis long for world 
    if (!thunder || !semiSphere || !sphere || !cube || !axis) {
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
    // resizeCanvas(gl, [groundGrid, thunder, cube, semiSphere, sphere],  u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix)
    var vbArray = [groundGrid, thunder, cube, semiSphere, sphere, axis, thunder2, axis2];
    var tick = function () {
        g_cloudAngle = animateCloud();
        g_jointAngle = animateJoints();
        g_time = showCurTime();
        drawAll(gl, vbArray,  u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix);
        resizeCanvas(gl, vbArray,  u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix)
        requestAnimationFrame(tick, canvas);
    }
    tick();
}



