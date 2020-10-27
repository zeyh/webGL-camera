//init shaders
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec4 a_Position;',
    'attribute vec4 a_Color;',
    'attribute vec4 a_Normal;',
    'attribute float a_Face;',
    'uniform mat4 u_modelMatrix;',
    'uniform mat4 u_normalMatrix;',
    'uniform int u_PickedFace;',
    'varying vec4 v_Color;',
    'void main() {',
    '    gl_Position = u_modelMatrix * a_Position;',
    '    vec3 lightDirection = normalize(vec3(0, 0, 0));',
    '    vec3 normal = normalize((u_normalMatrix * a_Normal).xyz);',
    '    float nDotL = max(dot(normal, lightDirection), 0.0);',
    
    '    int face = int(a_Face);',
    '    vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;',
    '    if(u_PickedFace == 0) {\n' + // In case of 0, insert the face number into alpha
    '        v_Color = vec4(color, a_Face/255.0);' ,
    '    } else {' ,
    '        v_Color =  vec4(color, a_Color.a);' ,
    '    }',
    // '    v_Color = a_Color;',
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
var g_angle01Rate = 1.2;       // rotation speed, in degrees/second                 
var g_angle02Rate = 40.0; 
var g_angle03Rate = 10.0; 
var g_angle01Min = 0;  
var g_angle01Max = 2.5; 
var g_angle02Min = 0;  
var g_angle02Max = 70; 
var g_angle03Min = 0;  
var g_angle03Max = 70; 
var g_rainNum = 3;
var g_time = 0;
var g_endSHOtime = 100;
var g_SHOgap = 0.1;
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
var g_isMouseUp = false;
var g_isMouseDown = false;
var g_damping1 = 20;
var g_colorFactor = 0.5;

function changeColor(inputStr){
    if(g_colorFactor <= 0 && inputStr == '-'){
        alert("Cannot make any changes for now.")
        return;
    }
    if(g_colorFactor >= 1 && inputStr == '+'){
        alert("Cannot make any changes for now.")
        return;
    }
    if(g_colorFactor < 0 ){
        g_colorFactor = 0;
    }
    if(g_colorFactor > 1 ){
        g_colorFactor = 1;
    }
    if(inputStr == '+'){
        g_colorFactor += 0.1;
    }
    if(inputStr == '-'){
        g_colorFactor -= 0.1;
    }
}
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
function changeDamping(inputStr){
    if(g_damping1 <= 0 && inputStr == '-'){
        alert("There's no more fraction force! Please click the add button!")
        return;
    }
    if(g_damping1 < 0 ){
        g_damping1 = 0;
    }
    if(inputStr == '+'){
        g_damping1 +=5;
    }
    if(inputStr == '-'){
        g_damping1 -=5;
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
    if (! gl.program.a_Position || !gl.program.a_Color || gl.program.a_Normal) {
      console.log('Failed to get the storage location');
      return false;
    }  

    var shape1 = initVertexBuffersForShape1(gl);
    var shape2 = initVertexBuffersForShape2(gl);
    var shape3 = initVertexBuffersForShape3(gl);
    var shape4 = initVertexBuffersForShape4(gl);
    if (! shape1 || !shape2 || !shape3 || !shape4) {
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
    // gl.clearColor(0.1, 0.1, 0.2, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 0.0); //set the color to the input image bg from html
    // initBkgnd();
    gl.enable (gl.BLEND);// Enable alpha blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function
    gl.depthFunc(gl.LESS); //Enable 3D depth-test when drawing: don't over-draw at any pixel 
    gl.enable(gl.DEPTH_TEST); // unless the new Z value is closer to the eye than the old one..


    // Initialize selected surface //from PickFace.js (c) 2012 matsuda and kanda
    // TODO: Not working...
    var u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');
    var ctx = g_canvas.getContext("webgl", {preserveDrawingBuffer: true});
    gl.uniform1i(u_PickedFace, -1);  
    g_canvas.onmousedown = function(ev) {   // Mouse is pressed
        var x = ev.clientX, y = ev.clientY;
        var rect = ev.target.getBoundingClientRect(); //the rect canvas area
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            // If Clicked position is inside the <canvas>, update the selected surface
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            // var face = checkFace(gl, [shape1, shape2, shape3,shape4], x_in_canvas, y_in_canvas, u_PickedFace, viewProjMatrix, u_modelMatrix, u_normalMatrix);
            // gl.uniform1i(u_PickedFace, face); // Pass the surface number to u_PickedFace
            // drawAll(gl, [shape1, shape2, shape3,shape4], viewProjMatrix, u_modelMatrix, u_normalMatrix); 
        }
    }
    
    drawAll(gl, [shape1, shape2, shape3,shape4], viewProjMatrix, u_modelMatrix, u_normalMatrix); 
}


// * ==================Drawing====================================
function checkFace(gl, shapeArr, x, y, u_PickedFace, viewProjMatrix, u_modelMatrix, u_normalMatrix) {
    var pixels = new Uint8Array(4); // Array for storing the pixel value
    gl.uniform1i(u_PickedFace, 0);  // Draw by writing surface number into alpha value
    drawAll(gl, shapeArr, viewProjMatrix, u_modelMatrix, u_normalMatrix); 
    // Read the pixel value of the clicked position. pixels[3] is the surface number
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log(x)
    console.log(y)
    console.log(pixels)
    return pixels[3];
  }

function drawAll(gl, shapeArr, viewProjMatrix, u_modelMatrix, u_normalMatrix) { //draw all the shape
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clrColr = new Float32Array(4);
    clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
    
    //raindrops - changed with angle02
    pushMatrix(g_modelMatrix1);
        for(var i=0; i<g_rainNum; i++){
            let rainseed =  generateRainSeed();
            g_modelMatrix1.setTranslate(-0.7+g_angle02/100 + i*1/g_rainNum, rainseed, 0); 	
            g_modelMatrix1.scale(0.02, 0.05, 0.02);
            draw(gl, shapeArr[2], u_modelMatrix, g_modelMatrix1); 
        }
    g_modelMatrix1 = popMatrix();
    drawThunder(gl, [shapeArr[1], shapeArr[3]], u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix)
    drawClouds(gl, shapeArr[0], u_modelMatrix, g_modelMatrix1)
    // drawThunder(gl, [shapeArr[1], shapeArr[3]], u_modelMatrix, g_modelMatrix1)
}

var g_modelMatrix1 = new Matrix4(), g_mvpMatrix = new Matrix4();
var g_chainAngle1 = 0, g_chainAngle2 = 90;
function drawThunder(gl, [thunder, cube], u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix){
    // pushMatrix(g_modelMatrix1);
    // g_modelMatrix1 = popMatrix();
    g_modelMatrix1.setTranslate(0,0,0);
    g_modelMatrix1.rotate(g_angle03*0.8,  0.0, 1.0, 0.0); //adjust the position according to keyboard input <-->
    
    //base
    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.scale(0.3,1,0.3);
        g_modelMatrix1.translate(0,0,0);
        drawBox(gl, cube, u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix); 
    g_modelMatrix1 = popMatrix();

    //config dragging action
    let dragAngle = 40*g_xMdragTot;
    if(dragAngle > 40){ dragAngle = 40;}
    if(dragAngle < -40) { dragAngle = -40;}

    g_modelMatrix1.rotate(dragAngle,  0.0, 0.0, 1.0);

    let oscTime = Math.floor(g_time/100);
    let oscilateAngle = SHO(dragAngle);
    if(g_isDrag &&  g_yMclik > -0.7 && g_yMclik < 0.2 ){ //not confused with button clicking action
        oscilateAngle = SHO(dragAngle);
    }

    //string
    if(oscTime > g_endSHOtime/g_SHOgap-1){ 
        oscTime = g_endSHOtime/g_SHOgap-1;
        g_modelMatrix1.rotate(-1*dragAngle,  0.0, 0.0, 1.0);
        g_modelMatrix1.rotate(0,  0.0, 0.0, 1.0);
        g_last3 = Date.now();
    }
    else{
        g_modelMatrix1.rotate(oscilateAngle[oscTime+1]*80,  0.0, 0.0, 1.0);
        g_modelMatrix1.rotate(-1*dragAngle,  0.0, 0.0, 1.0);
    }
    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.scale(0.1,10,0.1);
        g_modelMatrix1.translate(0,-1,0);
        drawBox(gl, cube, u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix); 
    g_modelMatrix1 = popMatrix();
    
    //bob
    pushMatrix(g_modelMatrix1);
        // g_modelMatrix1.scale(1.8, 2, 1.8);
        g_modelMatrix1.scale(2.7, 3, 2.7);
        g_modelMatrix1.translate(0, -3.2, 0.55);
        drawShapeAdjust(gl, thunder, u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix, oscilateAngle[oscTime]*80); 
    g_modelMatrix1 = popMatrix();

   
}

function drawShapeAdjust(gl, shape, u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix, angle){
    g_modelMatrix1.rotate(20-1*angle,0,0,1);
    let oscilateAngle = SHO2(20); //another SHO motion for the bob over y axis //assuming alreays start at 20 degrees for now
    let oscTime = Math.floor(g_time/100);
    if(oscTime > g_endSHOtime/g_SHOgap-1){ 
        oscTime = g_endSHOtime/g_SHOgap-1;
        g_modelMatrix1.rotate(0,  0.0, 0.0, 1.0);
    }else{
        g_modelMatrix1.rotate(oscilateAngle[oscTime]*80,0,1,0);
    }
    
    drawBox(gl, shape, u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix);
}
function drawBox(gl, shape, u_modelMatrix, g_modelMatrix1, viewProjMatrix, u_normalMatrix){
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix1);
    gl.uniformMatrix4fv(u_modelMatrix, false, g_mvpMatrix.elements);
    g_normalMatrix.setInverseOf(g_modelMatrix1);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_normalMatrix, false, g_normalMatrix.elements);
    draw(gl, shape,  u_normalMatrix, g_normalMatrix);
}

function drawClouds(gl, shape, u_modelMatrix, g_modelMatrix1){
    //clouds
    var scaleFactor = 20;
    pushMatrix(g_modelMatrix1);
        g_modelMatrix1.setTranslate(0.5, 0.56, 0);
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.12, 0.08, 0.1);
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
        g_modelMatrix1.setTranslate(0, 0.7, 0); 
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.11, 0.12, 0.12);
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
        g_modelMatrix1.setTranslate(-0.4, 0.5, -0.5);
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.11, 0.06, 0.1);
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
        g_modelMatrix1.setTranslate(-0.75, 0.42, 1);
        g_modelMatrix1.scale(1,1,-1);	
        g_modelMatrix1.scale(0.1, 0.06, 0.3);
        g_modelMatrix1.scale(0.5+g_angle01/10,0.5+g_angle01/10,0.5+g_angle01/10);
        drawMovable(gl, shape, u_modelMatrix, g_modelMatrix1); 
    g_modelMatrix1 = popMatrix();
}

function drawShapeDraggable(gl, shape, u_modelMatrix, g_modelMatrix1) { 
    //perp-axis rotation for object:
    var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
    // g_modelMatrix1.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
    if(g_yMdragTot > 0.7){ g_yMdragTot = 0.7;}
    g_modelMatrix1.translate(g_xMdragTot*8,g_yMdragTot*8,0.0);
    g_modelMatrix1.rotate(g_angle03, 0.0, 1.0, 0.0); 
    draw(gl, shape,  u_modelMatrix, g_modelMatrix1);
}

function drawShapeRotateDraggable(gl, shape, u_modelMatrix, g_modelMatrix1) { 
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
        gl.drawElements(gl.LINE_STRIP, shape.numIndices, gl.UNSIGNED_BYTE, 0);
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
function SHO(dragAngle){ //underdamped with t is time
    let initAngle = 0; //init angle to start with
    let t_stop = g_endSHOtime; //ending time
    let h = g_SHOgap; //incremental step

    //constant
    let m = 100 //mass
    let g = 10; //gravity constant
    let L = 5; //length of string
    let b = g_damping1; //underdamping factor  < 2mw_0

    //an array from 0 to 100(end)
    let t = [t_stop/h]; 
    t[0] = 0;
    for(let i=1; i<t_stop/h; i++){
        t[i] = t[i-1]+h;
    }
    //an array of 0 from 1 to length of t
    let theta = [t.length]; 
    let angelDerivative = (dragAngle*3.14/180)*3.14; //change degree to rad
    theta[0] = 0;
    theta[1] = theta[0] + angelDerivative*h;

    for(let i=0; i<t.length-2;i++){
        theta[i+2] =  2*theta[i+1] - theta[i] - 
                      h*h*g*Math.sin(theta[i+1])/L 
                      + (b*h/m)*(theta[i]-theta[i+1]); //for t in the middle
    }
    return theta;

}

function SHO2(dragAngle){ //underdamped with t is time
    let initAngle = 0; //init angle to start with
    let t_stop = g_endSHOtime; //ending time
    let h = g_SHOgap; //incremental step

    //constant
    let m = 100 //mass
    let g = 10; //gravity constant
    let L = 2; //length of string
    let b = 5; //underdamping factor  < 2mw_0

    //an array from 0 to 100(end)
    let t = [t_stop/h]; 
    t[0] = 0;
    for(let i=1; i<t_stop/h; i++){
        t[i] = t[i-1]+h;
    }
    //an array of 0 from 1 to length of t
    let theta = [t.length]; 
    let angelDerivative = (dragAngle*3.14/180)*3.14;
    theta[0] = initAngle;
    theta[1] = theta[0] + angelDerivative*h;

    for(let i=0; i<t.length-2;i++){
        theta[i+2] =  2*theta[i+1] - theta[i] - 
                      h*h*g*Math.sin(theta[i+1])/L 
                      + (b*h/m)*(theta[i]-theta[i+1]); //for t in the middle
    }
    return theta;

}

function generateRainSeed(){
    //generate a random vertial y value
    let seed3 = Math.random();
    let vertical = -1*seed3+0.3;
    if(vertical < -0.7){ //not falling out of certain range
        vertical = 0;
    }
    return vertical;
}

var g_last3 = Date.now();
function showCurTime() {
    if(g_isDrag && g_yMclik > -0.7 && g_yMclik < 0.2 ){
        g_last3 = Date.now();
    }
    var now = Date.now();  // Calculate the elapsed time
    var elapsed = now - g_last3;
    // console.log(Math.floor(elapsed/1000))
    return elapsed;
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
    if(newAngle < 0 || newAngle > 3){ return 1;}
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


