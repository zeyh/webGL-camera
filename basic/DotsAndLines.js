//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// MultiPoint.js (c) 2012 matsuda
// MultiPointJT.js  MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin
//						(converted to 2D->4D; 3 verts --> 6 verts; draw as
//						gl.POINTS and as gl.LINE_LOOP, change color.
//
// Vertex shader program.  
//  Each instance computes all the on-screen attributes for just one VERTEX,
//  specifying that vertex so that it can be used as part of a drawing primitive
//  depicted in the CVV coord. system (+/-1, +/-1, +/-1) that fills our HTML5
//  'canvas' object.
// In this program, we get info for one vertex in our Vertex Buffer Object (VBO) 
// through the 'attribute' variable a_Position, and use it.
// 
//   CHALLENGE: Change the program to get different pictures. See if you can:
//    --change the dot positions? 
//    --change the color of the dots-and-lines?
//    --change the number of dots?
//    --get all dots in one color, and all lines in another color?
//    --set each dot color individually? (what happens to the line colors?)
// also based on: chap5 ColoredMultiObjects.js
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
//   'uniform mat4 viewMatrix;\n' + //camera
//   'uniform mat4 projectionMatrix;\n' + 
  'void main() {\n' +
//   '  gl_Position = a_Position;\n' + //multiplying positions by matrices right to left
  '  gl_Position = u_ModelMatrix * a_Position;\n'+ 
  '  gl_PointSize = 10.0;\n' +
  '}\n';

// Fragment shader program
//  Each instance computes all the on-screen attributes for just one PIXEL
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(0.2, 0.6, 0.3, 0.5);\n' +
  '}\n';

// Easy-Access Global Variables-----------------------------
// (simplifies function calls. LATER: merge them into one 'myApp' object)
var ANGLE_STEP = 45.0;  // -- Rotation angle rate (degrees/second)
var gl;                 // WebGL's rendering context; value set in main()
var g_nVerts;           // # of vertices in VBO; value set in main()

function rescale(arr){
    console.log(arr.length);
    //takes a 1d array, ignore the w variable, rescale 1 to 0.5
    i=0;
    while(i<arr.length){
        for(j=0; j<3; j++){
            if(arr[i+j] == -1 || arr[i+j] == 1){ //all -1 or 1 case, did not handle others nor normalize
                arr[i+j] =  arr[i+j]/2;
            }           
        }
        i += 4;
    }
    return arr;
}

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas); //connect GL to canvas object
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
//   var vertexShader = gl.createShader(gl.VERTEX_SHADER);
//   gl.shaderSource(vertexShader, VSHADER_SOURCE);
//   var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
//   gl.shaderSource(fragmentShader, FSHADER_SOURCE);


  // Write buffer full of vertices to the GPU, and make it available to shaders
  g_nVerts = initVertexBuffers(gl);//setting up
  if (g_nVerts < 0) {
    console.log('Failed to load vertices into the GPU');
    return;
  }
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1); //RGB alpha //0,0,0,1 Black

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
    gl.enable(gl.DEPTH_TEST); 	
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
 
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  modelMatrix.setIdentity(); // (not req'd: constructor makes identity matrix)
  // Transfer modelMatrix values to the u_ModelMatrix variable in the GPU
  gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);

  // Draw 6 points. see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glDrawArrays.xml
  //starting vertices 0 drawing n vertices
  //line loop draw back to the beginning
  //LINE_STRIP not close
  //gl.drawElements() 
  gl.drawArrays(gl.TRIANGLES, 0, g_nVerts); // gl.drawArrays(mode, first, count)
			//mode: sets drawing primitive to use. Other valid choices: 
				// gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
				// gl.TRIANGLES, gl.TRIANGLES_STRIP, gl.TRIANGLE_FAN
			// first: index of 1st element of array.
			// count; number of elements to read from the array.

//   // That went well. Let's draw them again!
//   //draw the points
//   gl.drawArrays(gl.POINTS, 0, g_nVerts); // gl.drawArrays(mode, first, count)
// 			//mode: sets drawing primitive to use. Other valid choices: 
// 				// gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
// 				// gl.TRIANGLES, gl.TRIANGLES_STRIP, gl.TRIANGLE_FAN
// 			// first: index of 1st element of array.
// 			// count; number of elements to read from the array.
    var tick = function() {
        currentAngle = animate(currentAngle);  // Update the rotation angle
        draw(currentAngle, modelMatrix, u_ModelLoc);   // Draw shapes
    //    console.log('currentAngle=',currentAngle);
        requestAnimationFrame(tick, canvas);   
                                            // Request that the browser re-draw the webpage
    };
    // AFTER that, call the function.
    tick();							// start (and continue) animation: 
                        // HOW?  Execution jumps to the 'tick()' function; it
                        // completes each statement inside the curly-braces {}
                        // and then goes on to the next statement.  That next
                        // statement calls 'tick()'--thus an infinite loop!

}

// var program = gl.createProgram();
// gl.attachShader(program, vertexShader);
// gl.attachShader(program, fragmentShader);
// gl.linkProgram(program);
// if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//     console.error('ERROR linking program!', gl.getProgramInfoLog(program));
//     return;
// }
// gl.validateProgram(program);
// if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
//     console.error('ERROR validating program!', gl.getProgramInfoLog(program));
//     return;
// }

function initVertexBuffers(gl) {
//==============================================================================
  var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
  var sq2	= Math.sqrt(2.0);						 


// first, create an array with all our vertex attribute values:
//point w = 1, vector w = 0
// z is perpendicular to the screen
//normalize the obj file value
  var vertices = new Float32Array([
    //top //4 for each corner, and 2 shared vertices using index arrays
    -1.0, 1.0, -1.0, 1,
    -1.0, 1.0, 1.0, 1,
    1.0, 1.0, 1.0,  1,
    1.0, 1.0, -1.0,  1,

    // Left
    -1.0, 1.0, 1.0, 1,
    -1.0, -1.0, 1.0, 1,
    -1.0, -1.0, -1.0, 1,
    -1.0, 1.0, -1.0, 1,

    // Right
    1.0, 1.0, 1.0,   1,
    1.0, -1.0, 1.0,  1,
    1.0, -1.0, -1.0, 1,
    1.0, 1.0, -1.0,  1,

    // Front
    1.0, 1.0, 1.0,   1,
    1.0, -1.0, 1.0,  1,
    -1.0, -1.0, 1.0, 1,
    -1.0, 1.0, 1.0,  1,

    // Back
    1.0, 1.0, -1.0,  1,
    1.0, -1.0, -1.0, 1,
    -1.0, -1.0, -1.0, 1,
    -1.0, 1.0, -1.0, 1,

    // Bottom
    -1.0, -1.0, -1.0,  1,
    -1.0, -1.0, 1.0,   1,
    1.0, -1.0, 1.0,    1,
    1.0, -1.0, -1.0,   1,
  ]);
  vertices = rescale(vertices);

  var boxIndices =
  [
      // Top
      0, 1, 2, //idx 0,1,2's vertices form a triangle
      0, 2, 3,

      // Left
      5, 4, 6,
      6, 4, 7,

      // Right
      8, 9, 10,
      8, 10, 11,

      // Front
      13, 12, 14,
      15, 14, 12,

      // Back
      16, 17, 18,
      16, 18, 19,

      // Bottom
      21, 20, 22,
      22, 20, 23
  ];

  g_nVerts = 24; // The number of vertices
  console.log("THE N VALUE IS", g_nVerts);

  // Then in the Graphics hardware, create a vertex buffer object (VBO)
  var vertexBuffer = gl.createBuffer();	// get it's 'handle'
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // COPY data from our 'vertices' array into the vertex buffer object in GPU:
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); 

  //another buffer -----------------------
  // Then in the Graphics hardware, create a vertex buffer object (VBO)
  var idxBuffer = gl.createBuffer();	// get it's 'handle'
  if (!idxBuffer) {
    console.log('Failed to create the index');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer); //element array buffer for index arrays
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW); //new float32array

  // Connect a VBO Attribute to Shaders------------------------------------------
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
  // vertexAttributePointer(index, x,y,z,w size=4, type=FLOAT, 
  // NOT normalized, NO stride)

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  //set default matrix to uniform
//   var worldUniformLocation = gl.getUniformLocation(program, 'worldMatrix');
//   var viewUniformLocation = gl.getUniformLocation(program, 'viewMatrix');
//   var projectionUniformLocation = gl.getUniformLocation(program, 'projectionMatrix');

  // UNBIND the buffer object: we have filled the VBO & connected its attributes
  // to our shader, so no more modifications needed.
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return g_nVerts;
}


function draw(currentAngle, modelMatrix, u_ModelLoc) {
    //==============================================================================
      // Clear <canvas>  colors AND the depth buffer
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
      //-------Draw Spinning Tetrahedron
      modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
                              // (drawing axes centered in CVV), and then make new
                              // drawing axes moved to the lower-left corner of CVV. 
      modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
                                                                                      // to match WebGL display canvas.
      modelMatrix.scale(0.5, 0.5, 0.5);
                              // if you DON'T scale, tetra goes outside the CVV; clipped!
      modelMatrix.rotate(currentAngle, 0, 1, 0);  // Make new drawing axes that
     //modelMatrix.rotate(20.0, 0,1,0);
                              // that spin around y axis (0,1,0) of the previous 
                              // drawing axes, using the same origin.
    
      // DRAW TETRA:  Use this matrix to transform & draw 
      //						the first set of vertices stored in our VBO:
              // Pass our current matrix to the vertex shaders:
      gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
              // Draw just the first set of vertices: start at vertex 0...
      gl.drawArrays(gl.LINE_LOOP, 0, g_nVerts);
    //  gl.drawArrays(gl.LINE_LOOP, 0, 12);   // TRY THIS INSTEAD of gl.TRIANGLES... 

    }

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();
function animate(angle) {
    //==============================================================================
      // Calculate the elapsed time
      var now = Date.now();
      var elapsed = now - g_last;
      g_last = now;
      
      // Update the current rotation angle (adjusted by the elapsed time)
      //  limit the angle to move smoothly between +20 and -85 degrees:
    //  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
    //  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
      
      var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
      return newAngle %= 360;
}