//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

var floatsPerVertex = 6;	// # of Float32Array elements used for each vertex
// (x,y,z)position + (r,g,b)color


function main() {
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

    gl.enable(gl.DEPTH_TEST);
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to specify the vertex information');
        return;
    }


    gl.clearColor(0.25, 0.2, 0.25, 1.0);
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    if (!u_ViewMatrix || !u_ProjMatrix) {
        console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
        return;
    }


    var viewMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    draw(gl, u_ViewMatrix, viewMatrix);   // Draw the triangles
}

function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 100;			// # of lines to draw in x,y to make the grid.
    var ycount = 100;
    var xymax = 50.0;			// grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
    var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.

    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax / (xcount - 1);		// HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1);		// (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {	// put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j] = -xymax + (v) * xgap;	// x
            gndVerts[j + 1] = -xymax;								// y
            gndVerts[j + 2] = 0.0;									// z
        }
        else {				// put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j] = -xymax + (v - 1) * xgap;	// x
            gndVerts[j + 1] = xymax;								// y
            gndVerts[j + 2] = 0.0;									// z
        }
        gndVerts[j + 3] = xColr[0];			// red
        gndVerts[j + 4] = xColr[1];			// grn
        gndVerts[j + 5] = xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {		// put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j] = -xymax;								// x
            gndVerts[j + 1] = -xymax + (v) * ygap;	// y
            gndVerts[j + 2] = 0.0;									// z
        }
        else {					// put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j] = xymax;								// x
            gndVerts[j + 1] = -xymax + (v - 1) * ygap;	// y
            gndVerts[j + 2] = 0.0;									// z
        }
        gndVerts[j + 3] = yColr[0];			// red
        gndVerts[j + 4] = yColr[1];			// grn
        gndVerts[j + 5] = yColr[2];			// blu
    }
}

function initVertexBuffers(gl) {
    makeGroundGrid();
    mySiz = gndVerts.length;

    var verticesColors = new Float32Array(mySiz);
    i = 0;
    gndStart = i;						// next we'll store the ground-plane;
    for (j = 0; j < gndVerts.length; i++, j++) {
        verticesColors[i] = gndVerts[j];
    }

    // Create a vertex buffer object (VBO)
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write vertex information to buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);
    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    return mySiz / floatsPerVertex;	// return # of vertices
}

var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25;
function draw(gl, u_ViewMatrix, viewMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0,  														// Viewport lower-left corner
        0,															// (x,y) location(in pixels)
        gl.drawingBufferWidth / 2, 				// viewport width, height.
        gl.drawingBufferHeight / 2);
    // Set the matrix to be used for to set the camera view
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, 	// eye position
        0, 0, 0, 								// look-at point (origin)
        0, 1, 0);								// up vector (+y)
    // Pass the view projection matrix
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    // Draw the scene:
    drawMyScene(gl, u_ViewMatrix, viewMatrix);


    // Draw in the SECOND of several 'viewports'
    gl.viewport(gl.drawingBufferWidth / 2, 			
        0, 													
        gl.drawingBufferWidth / 2, 				
        gl.drawingBufferHeight / 2);
    viewMatrix.setLookAt(-g_EyeX, g_EyeY, g_EyeZ, 
        0, 0, 0, 									
        0, 1, 0);									
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    drawMyScene(gl, u_ViewMatrix, viewMatrix);


}

function drawMyScene(myGL, myu_ViewMatrix, myViewMatrix) {
    myViewMatrix.rotate(-90.0, 1, 0, 0);	
    myViewMatrix.translate(0.0, 0.0, -0.6);
    myViewMatrix.scale(0.4, 0.4, 0.4);		
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);

    myGL.drawArrays(myGL.LINES,	 0, gndVerts.length / floatsPerVertex);		

}
