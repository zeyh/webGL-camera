// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var mvpMatrixFromLight_t;
var mvpMatrixFromLight_p;
var viewProjMatrixFromLight;
var viewProjMatrix  = new Matrix4();  

var quatMatrix = new Matrix4();   
var qNew = new Quaternion(0, 0, 0, 1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0, 0, 0, 1);	// 'current' orientation (made from qNew)

var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; //eye position default
var g_LookX = 0.0, g_LookY = 0.0, g_LookZ = 0.0;
var g_LookUp = 0.0;
var g_speed = 1;

function drawScene_shadow(gl, shadowProgram,  [triangle, cube, thunder, groundGrid, semiSphere, axis, thunder2, axis2], currentAngle, viewProjMatrixFromLight) {
    //TODO
    // viewProjMatrix.scale(0.4 * g_viewScale, 0.4 * g_viewScale, 0.4 * g_viewScale); //scale everything

    // pushMatrix(g_modelMatrix);
    //     drawSingleThunder(gl, shadowProgram, [thunder2, axis], viewProjMatrixFromLight)
    //     mvpMatrixFromLight_t.set(g_mvpMatrix); // Used later
    // g_modelMatrix = popMatrix();

    // pushMatrix(g_modelMatrix);
    //     drawManyClouds(gl, shadowProgram, semiSphere, viewProjMatrix);
    //     mvpMatrixFromLight_p.set(g_mvpMatrix); // Used later
    // g_modelMatrix = popMatrix();
    // draw(gl, shadowProgram, thunder, viewProjMatrix);
    // mvpMatrixFromLight_p.set(g_mvpMatrix); // Used later
}
function drawAll_shadow(gl, shadowProgram, vbArr, currentAngle, viewProjMatrixFromLight) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    flyForward();
    gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);
    pushMatrix(viewProjMatrix);
    if (isFrustrum) {//changing between frustrum and perspective
        viewProjMatrix.setFrustum(params.left, params.right, params.top, params.bottom, params.near, params.far)
    } else {
        var aspectRatio = (gl.drawingBufferWidth / 2) / (gl.drawingBufferHeight);
        viewProjMatrix.setPerspective(40.0, aspectRatio, 1, 10);
    }
    viewProjMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); //center/look-at point
    drawScene_shadow(gl, shadowProgram, vbArr, currentAngle, viewProjMatrixFromLight)
    viewProjMatrix = popMatrix();

    gl.viewport(gl.canvas.width/2, 0, gl.canvas.width/2, gl.canvas.height); 
    viewProjMatrix.setOrtho(-3.0, 3.0, -3.0, 3.0, 0.01, 10.0); 
    viewProjMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); 
    drawScene_shadow(gl, shadowProgram, vbArr, currentAngle, viewProjMatrixFromLight)
}


var g_jointAngle2 = 0;
function drawScene(gl, normalProgram, [triangle, cube, thunder, groundGrid, semiSphere, axis, thunder2, axis2], currentAngle, viewProjMatrix) {
    viewProjMatrix.scale(0.4 * g_viewScale, 0.4 * g_viewScale, 0.4 * g_viewScale); //scale everything
    // pushMatrix(g_modelMatrix);
    // gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
    // drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjMatrix);
    // g_modelMatrix = popMatrix();

    pushMatrix(g_modelMatrix);
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
    drawJointAssemblies(gl, normalProgram, cube, viewProjMatrix);
    g_modelMatrix = popMatrix();
    
    pushMatrix(g_modelMatrix);
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
    drawJointAssemblies2(gl, normalProgram, cube, viewProjMatrix);
    g_modelMatrix = popMatrix();

    pushMatrix(g_modelMatrix);
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
    drawManyClouds(gl, normalProgram, semiSphere, viewProjMatrix);
    g_modelMatrix = popMatrix();
    
    pushMatrix(g_modelMatrix);
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
    drawThunderMotion(gl, normalProgram, [thunder, cube], viewProjMatrix);
    g_modelMatrix = popMatrix();
    
    pushMatrix(g_modelMatrix);
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
    drawSingleThunder(gl, normalProgram, [thunder2, axis], viewProjMatrix)
    g_modelMatrix = popMatrix();

    viewProjMatrix.rotate(-90.0, 1, 0, 0);
    viewProjMatrix.translate(0.0, 0.0, -0.6);
    viewProjMatrix.scale(0.4, 0.4, 0.4);
    draw(gl, normalProgram, groundGrid, viewProjMatrix);
    draw(gl, normalProgram, axis2, viewProjMatrix);

    
}

function drawAll(gl, normalProgram, vbArr, currentAngle, viewProjMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    flyForward();
    

    gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);

    pushMatrix(viewProjMatrix);
    if (isFrustrum) {//changing between frustrum and perspective
        viewProjMatrix.setFrustum(params.left, params.right, params.top, params.bottom, params.near, params.far)
    } else {
        var aspectRatio = (gl.drawingBufferWidth / 2) / (gl.drawingBufferHeight);
        viewProjMatrix.setPerspective(40.0, aspectRatio, 1, 10);
    }
    viewProjMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); //center/look-at point
    drawScene(gl, normalProgram, vbArr, currentAngle, viewProjMatrix);
    viewProjMatrix = popMatrix();

    gl.viewport(gl.canvas.width/2, 0, gl.canvas.width/2, gl.canvas.height); 
    viewProjMatrix.setOrtho(-3.0, 3.0, -3.0, 3.0, 0.01, 10.0); 
    viewProjMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ, g_LookX, g_LookY, g_LookZ, 0, 1, 0); 
    drawScene(gl, normalProgram, vbArr, currentAngle, viewProjMatrix);


}

function drawManyClouds(gl, program, shape, viewProjMatrix){
    pushMatrix(g_modelMatrix);
        g_modelMatrix.setTranslate(2,1.6,-3)
        drawClouds(gl, program, shape, viewProjMatrix)
    g_modelMatrix = popMatrix();

    pushMatrix(g_modelMatrix);
        g_modelMatrix.setTranslate(-2,1.6,-5)
        drawClouds(gl, program, shape, viewProjMatrix)
    g_modelMatrix = popMatrix();

}

function drawThunderMotion(gl, program, [thunder, cube], viewProjMatrix){
    g_modelMatrix.setTranslate(2,1.3,-3);
    //base
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.3,0.3,0.3);
        g_modelMatrix.translate(0,0,0);
        draw(gl, program, cube, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //config dragging action
    let dragAngle = 40*g_xMdragTot;
    if(dragAngle > 40){ dragAngle = 40;}
    if(dragAngle < -40) { dragAngle = -40;}
    g_modelMatrix.rotate(dragAngle,  0.0, 0.0, 1.0);
    let oscTime = Math.floor(g_time/100);
    let oscilateAngle = SHO(dragAngle);
    if(g_isDrag){ //not confused with button clicking action
        oscilateAngle = SHO(dragAngle);
    }
    if(oscTime > g_endSHOtime/g_SHOgap-1){ 
        oscTime = g_endSHOtime/g_SHOgap-1;
        g_modelMatrix.rotate(-1*dragAngle,  0.0, 0.0, 1.0);
        g_modelMatrix.rotate(0,  0.0, 0.0, 1.0);
        g_last3 = Date.now();
    }else{
        g_modelMatrix.rotate(oscilateAngle[oscTime+1]*80,  0.0, 0.0, 1.0);
        g_modelMatrix.rotate(-1*dragAngle,  0.0, 0.0, 1.0);
    }
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.03,0.85,0.03);
        g_modelMatrix.translate(0,-1,0);
        draw(gl, program, cube, viewProjMatrix);
    g_modelMatrix = popMatrix();    

    //bob
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.2, 0.2, 0.2);
        g_modelMatrix.translate(0, -4.2, 0.25);
        let angle = oscilateAngle[oscTime]*80;
        g_modelMatrix.rotate(20-1*angle,0,0,1);

        let oscilateAngle2 = SHO2(20);
        let oscTime2 = Math.floor(g_time/100);
        if(oscTime2 > g_endSHOtime/g_SHOgap-1){ 
            oscTime2 = g_endSHOtime/g_SHOgap-1;
            g_modelMatrix.rotate(0,  0.0, 0.0, 1.0);
        }else{
            g_modelMatrix.rotate(oscilateAngle2[oscTime2]*80,0,1,0);
        }
        draw(gl, program, thunder, viewProjMatrix);
    g_modelMatrix = popMatrix();
}

function drawClouds(gl, program, shape, viewProjMatrix) {
    var scaleFactor = 4;
    pushMatrix(g_modelMatrix);
        g_modelMatrix.translate(2, 0, 0);
        g_modelMatrix.scale(0.25,0.05,0.25);	
        let delay = 2.6;
        if(g_cloudAngle>delay){
            g_modelMatrix.scale(1+g_cloudAngle/scaleFactor,1+g_cloudAngle/scaleFactor, 1+g_cloudAngle/scaleFactor);
        }
        else{
            g_modelMatrix.scale(1+delay/scaleFactor,1+delay/scaleFactor, 1+delay/scaleFactor);
        }
        draw(gl, program, shape, viewProjMatrix);
    g_modelMatrix = popMatrix();
    pushMatrix(g_modelMatrix);
        g_modelMatrix.translate(0, 0.3, 0);
        g_modelMatrix.scale(0.2,0.1,0.2);	
        draw(gl, program, shape, viewProjMatrix);
    g_modelMatrix = popMatrix();
    pushMatrix(g_modelMatrix);
        g_modelMatrix.translate(0.7, 0.5, 0);
        g_modelMatrix.scale(0.3,0.15,0.2);	
        draw(gl, program, shape, viewProjMatrix);
    g_modelMatrix = popMatrix();
    pushMatrix(g_modelMatrix);
        g_modelMatrix.translate(-0.5, 0, 0);
        g_modelMatrix.scale(0.15,0.04,0.15);	
        draw(gl, program, shape, viewProjMatrix);
    g_modelMatrix = popMatrix();
}

function drawTriangle(gl, program, triangle, angle, viewProjMatrix) {
    // Set rotate angle to model matrix and draw triangle
    g_modelMatrix.setRotate(angle, 0, 1, 0);
    draw(gl, program, triangle, viewProjMatrix);
}

function drawJointAssemblies(gl, program, sphere, viewProjMatrix) {
    g_modelMatrix.setTranslate(3.5, 3.0, 1.0);    //base
    g_modelMatrix.rotate(g_jointAngle2, 0, 1, 0);
    var baseHeight = 0.1;
    //seg1
    var seg1Length = 0.5;
    g_modelMatrix.translate(0.0, baseHeight, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.05, seg1Length, 0.05);
        draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

   //seg2
   var seg2Length = 0.5;
   g_modelMatrix.translate(0.0, seg1Length, 0.0); 
   g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
   pushMatrix(g_modelMatrix);
       g_modelMatrix.scale(0.05, seg2Length, 0.05);
       draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg3
    var seg3Length = 0.4;
    g_modelMatrix.translate(0.0, seg2Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.05, seg3Length, 0.05);
        draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg4
    var seg4Length = 0.4;
    g_modelMatrix.translate(0.0, seg3Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.05, seg4Length, 0.05);
        draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg5
    var seg5Length = 0.6;
    g_modelMatrix.translate(0.0, seg4Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.05, seg5Length, 0.05);
        draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg6
    var seg6Length = 0.7;
    g_modelMatrix.translate(0.0, seg5Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.05, seg6Length, 0.05);
        draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();
}

function drawJointAssemblies2(gl, program, sphere, viewProjMatrix){
    g_modelMatrix.setTranslate(-10.0+g_jointAngle/10, 2.0, 3.0+(g_jointAngle*1.5+2)/100);
    g_modelMatrix.rotate(g_jointAngle2, 0, 1, 0);

    //base
    var baseHeight = 0.1;
    //seg1
    var seg1Length = 0.5;
    g_modelMatrix.translate(0.0, baseHeight, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*50, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.1, seg1Length, 0.1);
       draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg2
    var seg2Length = 0.5;
    g_modelMatrix.translate(0.0, seg1Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*40, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.1, seg2Length, 0.1);
       draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg3
    var seg3Length = 0.4;
    g_modelMatrix.translate(0.0, seg2Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*30, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.1, seg3Length, 0.1);
       draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg4
    var seg4Length = 0.4;
    g_modelMatrix.translate(0.0, seg3Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.1, seg4Length, 0.1);
       draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg5
    var seg5Length = 0.6;
    g_modelMatrix.translate(0.0, seg4Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.1, seg5Length, 0.1);
       draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();

    //seg6
    var seg6Length = 0.7;
    g_modelMatrix.translate(0.0, seg5Length, 0.0); 
    g_modelMatrix.rotate(g_jointAngle*10, 0.0, 0.0, 1.0);
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.1, seg6Length, 0.1);
       draw(gl, program, sphere, viewProjMatrix);
    g_modelMatrix = popMatrix();
}

function drawSingleThunder(gl, program, [thunder, axis], viewProjMatrix){
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(0.8, 0.8, 0.8);
        g_modelMatrix.translate(-1, 1, 0.25);
        quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);
        g_modelMatrix.concat(quatMatrix);
        draw(gl, program, thunder, viewProjMatrix);
        g_modelMatrix.translate(-0.5, -0.3, -0.5);
        g_modelMatrix.rotate(-90,1,0,0)
        draw(gl, program, axis, viewProjMatrix);
    g_modelMatrix = popMatrix();
}

function draw(gl, program, o, viewProjMatrix) {
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    if (program.a_Color != undefined) // If a_Color is defined to attribute
        initAttributeVariable(gl, program.a_Color, o.colorBuffer);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);
    if (o.indexBuffer != undefined) {
        gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
    }
    else {
        gl.drawArrays(gl.LINES, 0, o.numIndices);
    }
}


// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}