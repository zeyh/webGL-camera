// Adapted From: JointModel.js (c) 2012 matsuda from the textbook
// also from ControlMulti.js
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_modelMatrix;\n' +
  'uniform mat4 u_normalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_modelMatrix * a_Position;\n' +
  '  vec3 lightDirection = normalize(vec3(0.1, 0.1, 0.1));\n' + 
  '  vec3 normal = normalize((u_normalMatrix * a_Normal).xyz);\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  '  precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


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
var g_angle01 = 0;              // The rotation angle of part 1
var g_angle02 = 25.0;          // The rotation angle of part 2
var g_angle01Rate = 45.0;       // rotation speed, in degrees/second                 
var g_angle02Rate = 10.0; 
var g_angle02Min = 0;  
var g_angle02Max = 30; 

// * Animation config
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    		// Timestamp for most-recently-drawn image; 
// * HTML events
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;		// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;  

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
  var g_maxVerts = initVertexBuffers(gl);
  if (g_maxVerts < 0) {
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
//   document.onkeydown = function(ev){ keydown(ev, gl, g_maxVerts, viewProjMatrix, u_modelMatrix, u_normalMatrix); };
  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("mousedown", myMouseDown); 
  window.addEventListener("mousemove", myMouseMove); 
  window.addEventListener("mouseup", myMouseUp);	
  window.addEventListener("click", myMouseClick);				
  window.addEventListener("dblclick", myMouseDblClick); 

  // Set the clear color and enable the depth test
  gl.clearColor(0.2, 0.4, 0.5, 1.0);
  gl.enable (gl.BLEND);// Enable alpha blending
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function
  gl.depthFunc(gl.LESS); //Enable 3D depth-test when drawing: don't over-draw at any pixel 
  gl.enable(gl.DEPTH_TEST); // unless the new Z value is closer to the eye than the old one..

  // ! Animation
  var tick = function() {
    g_angle02 = animate2();  // Update the rotation angle
    g_angle01 = animate1(g_angle01);  // Update the rotation angle
    drawAll(gl, g_maxVerts, viewProjMatrix, u_modelMatrix); 
    document.getElementById('CurAngleDisplay').innerHTML= 
        'g_angle02= '+g_angle02.toFixed(5);    //reports current angle value:
    document.getElementById('Mouse').innerHTML=
        'Mouse Drag totals (CVV coords):\t'+
        g_xMdragTot.toFixed(5)+', \t'+g_yMdragTot.toFixed(5);//display our current mouse-dragging state:	        
    requestAnimationFrame(tick, g_canvas);    //Request that the browser re-draw the webpage
  };
  tick();	

}

// TODO: 3. change shape
// TODO: 4. add a new shape
// * ==================Load VBOs====================================
function initVertexBuffers(gl) {
  var vertices = new Float32Array([   // Vertex coordinates
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
   -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
 ]);

  var normals = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
  ]);

var colors = new Float32Array([     // Colors
    0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  // v0-v1-v2-v3 front(blue)
    0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  // v0-v3-v4-v5 right(green)
    1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  // v7-v4-v3-v2 down
    0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4   // v4-v7-v6-v5 back
]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Write the vertex property to buffers (coordinates and normals)
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')){
    console.log("initArrayBuffer a_Position")
    return -1;
  }
  if (!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')){
    console.log("initArrayBuffer a_Normal")
    return -1;
  }
  if (!initArrayBuffer(gl, colors, 4, gl.FLOAT, 'a_Color')){
    console.log("initArrayBuffer a_Color")
    return -1;
  }

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // bind the index array
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the index buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
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
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    return true;
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

// * ==================Drawing====================================
function drawAll(gl, n, viewProjMatrix, u_modelMatrix) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  clrColr = new Float32Array(4);
  clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);

  // bottom left part
  pushMatrix(g_modelMatrix1);
    g_modelMatrix1.setTranslate(-8, -12, 0); 
    g_modelMatrix1.scale(1, 8, 1);
    g_modelMatrix1.rotate(g_angle02, 0.0, 1.0, 0.0);   // Rotate around the y-axis
    drawBox(gl, n, viewProjMatrix, u_modelMatrix); // Draw lower part
  g_modelMatrix1 = popMatrix();

  pushMatrix(g_modelMatrix1);
    g_modelMatrix1.translate(-8.0, -4.0, 0.0); 　　
    g_modelMatrix1.rotate(g_angle02, 0.0, 1.0, 0.0);  // Rotate around the z-axis
    g_modelMatrix1.rotate(g_angle01, 0.0, 0.0, 1.0);  // Rotate around the z-axis
    g_modelMatrix1.scale(5, 5, 0.2);
    drawBox(gl, n, viewProjMatrix, u_modelMatrix); // Draw upper part

    g_modelMatrix1.translate(0.0, 0.0, 6.0); 
    drawBox(gl, n, viewProjMatrix, u_modelMatrix); // Draw upper part

    g_modelMatrix1.translate(0.0, 0.0, -12.0); 
    drawBox(gl, n, viewProjMatrix, u_modelMatrix); // Draw upper part
  g_modelMatrix1 = popMatrix();
 
  pushMatrix(g_modelMatrix1);
  //upper-right part 
    g_modelMatrix1.setTranslate(0.5, 0.5, 0); 
    g_modelMatrix1.scale(1,1,-1);	
    g_modelMatrix1.scale(0.2, 0.2,0.2);
    drawBoxDraggable(gl, n, u_modelMatrix, g_modelMatrix1); 
  g_modelMatrix1 = popMatrix();

}

function drawBoxDraggable(gl, n, u_modelMatrix, g_modelMatrix1) {
  //perp-axis rotation for object:
  var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
  g_modelMatrix1.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
 
  gl.uniformMatrix4fv(u_modelMatrix, false, g_modelMatrix1.elements);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function drawBox(gl, n, viewProjMatrix, u_modelMatrix) { // Draw the cube
  // Calculate the model view project matrix and pass it to u_modelMatrix
  g_modelMatrix2.set(viewProjMatrix);
  g_modelMatrix2.multiply(g_modelMatrix1);
  gl.uniformMatrix4fv(u_modelMatrix, false, g_modelMatrix2.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

// * ==================Animation====================================
var g_last1 = Date.now();
function animate1(g_angle01) {
  var now = Date.now();  // Calculate the elapsed time
  var elapsed = now - g_last1;
  g_last1 = now; 

  var newAngle = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
  if(newAngle > 180.0) newAngle = newAngle - 360.0;
  if(newAngle <-180.0) newAngle = newAngle + 360.0;
  return newAngle;
}

var g_last = Date.now();
function animate2() {
  var now = Date.now();  // Calculate the elapsed time
  var elapsed = now - g_last;
  g_last = now; 

  var newAngle = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
  if(newAngle > g_angle02Max || newAngle < g_angle02Min ){
    g_angle02Rate = -1*g_angle02Rate;
  }
//   if(newAngle > g_angle02Max) newAngle = 0;
//   if(newAngle < g_angle02Min) newAngle = 0;
  return newAngle;
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
    
function myKeyDown(kev) {
    //===============================================================================
    // Called when user presses down ANY key on the keyboard;
    //
    // For a light, easy explanation of keyboard events in JavaScript,
    // see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
    // For a thorough explanation of a mess of JavaScript keyboard event handling,
    // see:    http://javascript.info/tutorial/keyboard-events
    //
    // NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
    //        'keydown' event deprecated several read-only properties I used
    //        previously, including kev.charCode, kev.keyCode. 
    //        Revised 2/2019:  use kev.key and kev.code instead.
    //
    // Report EVERYTHING in console:
      console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
                  "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
                  "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
    
    // and report EVERYTHING on webpage:
        document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
      document.getElementById('KeyModResult' ).innerHTML = ''; 
      // key details:
      document.getElementById('KeyModResult' ).innerHTML = 
            "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
        "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
        "<br>--kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
     
        switch(kev.code) {
            case "KeyP":
                console.log("Pause/unPause!\n");                // print on console,
                document.getElementById('KeyDownResult').innerHTML =  
                'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
                if(g_isRun==true) {
                  g_isRun = false;    // STOP animation
                  }
                else {
                  g_isRun = true;     // RESTART animation
                  tick();
                  }
                break;
            //------------------WASD navigation-----------------
            case "KeyA":
                console.log("a/A key: Strafe LEFT!\n");
                document.getElementById('KeyDownResult').innerHTML =  
                'myKeyDown() found a/A key. Strafe LEFT!';
                break;
        case "KeyD":
                console.log("d/D key: Strafe RIGHT!\n");
                document.getElementById('KeyDownResult').innerHTML = 
                'myKeyDown() found d/D key. Strafe RIGHT!';
                break;
            case "KeyS":
                console.log("s/S key: Move BACK!\n");
                document.getElementById('KeyDownResult').innerHTML = 
                'myKeyDown() found s/Sa key. Move BACK.';
                break;
            case "KeyW":
                console.log("w/W key: Move FWD!\n");
                document.getElementById('KeyDownResult').innerHTML =  
                'myKeyDown() found w/W key. Move FWD!';
                break;
            //----------------Arrow keys------------------------
            case "ArrowLeft": 	
                console.log(' left-arrow.');
                // and print on webpage in the <div> element with id='Result':
              document.getElementById('KeyDownResult').innerHTML =
                  'myKeyDown(): Left Arrow='+kev.keyCode;
                break;
            case "ArrowRight":
                console.log('right-arrow.');
              document.getElementById('KeyDownResult').innerHTML =
                  'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
              break;
            case "ArrowUp":		
                console.log('   up-arrow.');
              document.getElementById('KeyDownResult').innerHTML =
                  'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
                break;
            case "ArrowDown":
                console.log(' down-arrow.');
              document.getElementById('KeyDownResult').innerHTML =
                  'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
              break;	
        default:
          console.log("UNUSED!");
              document.getElementById('KeyDownResult').innerHTML =
                  'myKeyDown(): UNUSED!';
          break;
        }
}
    
function myKeyUp(kev) {
    //===============================================================================
    // Called when user releases ANY key on the keyboard; captures scancodes well
        console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}
    