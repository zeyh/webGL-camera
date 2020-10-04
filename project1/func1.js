//init shaders
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec3 a_Position;',
    'attribute vec3 a_Color;',
    'varying vec3 v_Color;',
    'uniform mat4 u_ModelMatrix;',
    'void main() {',
    '    gl_Position = u_ModelMatrix * vec4(a_Position, 1.0);',
    '    gl_PointSize = 10.0;',
    '    v_Color = a_Color;',
    '}'
    ].join('\n');

var FSHADER_SOURCE = [
    'precision mediump float;',
    'varying vec3 v_Color;',
    'void main() {',
    '   gl_FragColor = vec4(v_Color, 1.0);',
    '}',
    ].join('\n');

var ANGLE_STEP = 30.0;  // -- Rotation angle rate (degrees/second)
var gl;                 // WebGL's rendering context; value set in main()
var g_nVerts;           // # of vertices in VBO; value set in main()

function main(){
    console.log("in js file...")
    var canvas = document.getElementById('basic-surface'); //get canvas id
    gl = getWebGLContext(canvas); //connect GL to canvas object
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    //init shaders //https://www.youtube.com/watch?v=33gn3_khXxw&list=PLjcVFFANLS5zH_PeKC6I8p0Pt1hzph_rt&index=5
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    // var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    // gl.shaderSource(vertexShader, VSHADER_SOURCE);
    // gl.shaderSource(fragmentShader, FSHADER_SOURCE);
    // gl.compileShader(vertexShader);
	// if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	// 	console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
	// 	return;
	// }
	// gl.compileShader(fragmentShader);
	// if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	// 	console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
	// 	return;
    // }
    // var program = gl.createProgram();
    // gl.attachShader(program, vertexShader);
	// gl.attachShader(program, fragmentShader);
    // gl.linkProgram(program);
    // if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	// 	console.error('Failed to link program.');
	// 	return;
    // }
    // gl.validateProgram(program);
	// if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
	// 	console.error('ERROR validating program!', gl.getProgramInfoLog(program));
	// 	return;
	// }

    // Get handle to graphics system's storage location of u_ModelMatrix
    var u_ModelLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelLoc) { 
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }
    var modelMatrix = new Matrix4(); // Create a local version of our model matrix in JavaScript 
    modelMatrix.setIdentity();
    gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements); // Transfer modelMatrix values to the u_ModelMatrix variable in the GPU


    // Write buffer full of vertices to the GPU, and make it available to shaders
    g_nVerts = initVertexBuffers(gl);//setting up
    if (g_nVerts < 0) {
        console.log('Failed to load vertices into the GPU');
        return;
    }

    //draw
    gl.enable(gl.DEPTH_TEST);  //Enable 3D depth-test when drawing
    // gl.clearColor(0.75, 0.85, 0.8, 1.0);
	// gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    // gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
    var currentAngle = 0.0;
    var tick = function() {
        currentAngle = animate(currentAngle);  // Update the rotation angle
        draw(currentAngle, modelMatrix, u_ModelLoc);   // Draw shapes
        // console.log('currentAngle=',currentAngle);
        requestAnimationFrame(tick, canvas);                                        
    };
    tick();							             
}

function draw(currentAngle, modelMatrix, u_ModelLoc) {
    gl.clearColor(0.5, 0.5, 0.5, 1.0); //set canvas color
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    
    modelMatrix.setTranslate(0, 0, 0.0);   
    modelMatrix.scale(1,1,-1);	// convert to left-handed coord sys to match WebGL display canvas.
    modelMatrix.scale(0.5, 0.5, 0.5);
    modelMatrix.rotate(currentAngle, 1, 1, 1);  // Make new drawing axes that
    gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements); // Pass our current matrix to the vertex shaders:
    
    // gl.drawArrays(gl.TRIANGLES, 0, 23); //LINE_LOOP //start at 0 draw to 36
    gl.drawElements(gl.TRIANGLES, g_nVerts-1, gl.UNSIGNED_SHORT, 0); //boxIndices.length-1
    // gl.drawElements(gl.LINE_LOOP, 35, gl.UNSIGNED_SHORT, 0); //boxIndices.length-1

}

function initVertexBuffers(gl) {
    // var vertices = new Float32Array([
	//     // X, Y, Z           R, G, B
	// 	// Top
	// 	-1.0, 1.0, -1.0, 1,   0.5, 0.5, 0.5,   1,
	// 	-1.0, 1.0, 1.0, 1,      0.5, 0.5, 0.5, 1,
	// 	1.0, 1.0, 1.0,   1,     0.5, 0.5, 0.5, 1,
	// 	1.0, 1.0, -1.0,  1,     0.5, 0.5, 0.5, 1,
	// 	// Left
	// 	-1.0, 1.0, 1.0,  1,     0.75, 0.25, 0.5, 1,
	// 	-1.0, -1.0, 1.0,  1,    0.75, 0.25, 0.5, 1,
	// 	-1.0, -1.0, -1.0,  1,   0.75, 0.25, 0.5, 1,
	// 	-1.0, 1.0, -1.0,  1,    0.75, 0.25, 0.5, 1,
	// 	// Right
	// 	1.0, 1.0, 1.0,  1,     0.25, 0.25, 0.75, 1,
	// 	1.0, -1.0, 1.0,  1,    0.25, 0.25, 0.75, 1,
	// 	1.0, -1.0, -1.0,  1,   0.25, 0.25, 0.75, 1,
	// 	1.0, 1.0, -1.0,  1,    0.25, 0.25, 0.75, 1,
	// 	// Front
	// 	1.0, 1.0, 1.0,  1,     1.0, 0.0, 0.15,   1,
	// 	1.0, -1.0, 1.0, 1,      1.0, 0.0, 0.15,  1,
	// 	-1.0, -1.0, 1.0,  1,     1.0, 0.0, 0.15, 1,
	// 	-1.0, 1.0, 1.0,   1,    1.0, 0.0, 0.15,  1,
	// 	// Back
	// 	1.0, 1.0, -1.0, 1,      0.0, 1.0, 0.15,   1,
	// 	1.0, -1.0, -1.0,  1,     0.0, 1.0, 0.15,  1,
	// 	-1.0, -1.0, -1.0,  1,     0.0, 1.0, 0.15, 1,
	// 	-1.0, 1.0, -1.0,   1,    0.0, 1.0, 0.15,  1,
	// 	// Bottom
	// 	-1.0, -1.0, -1.0, 1,     0.5, 0.5, 1.0,   1,
	// 	-1.0, -1.0, 1.0,  1,     0.5, 0.5, 1.0,   1,
	// 	1.0, -1.0, 1.0,  1,      0.5, 0.5, 1.0,   1,
	// 	1.0, -1.0, -1.0,  1,     0.5, 0.5, 1.0,   1,
    // ]);
    var vertices = new Float32Array([
	    // X, Y, Z           R, G, B
		// Top
		-1.0, 1.0, -1.0,    0.5, 0.5, 0.5,   
		-1.0, 1.0, 1.0,      0.5, 0.5, 0.5, 
		1.0, 1.0, 1.0,      0.5, 0.5, 0.5, 
		1.0, 1.0, -1.0,      0.5, 0.5, 0.5, 
		// Left
		-1.0, 1.0, 1.0,        0.75, 0.25, 0.5,  
		-1.0, -1.0, 1.0,       0.75, 0.25, 0.5,  
		-1.0, -1.0, -1.0,      0.75, 0.25, 0.5,  
		-1.0, 1.0, -1.0,       0.75, 0.25, 0.5,  
		// Right
		1.0, 1.0, 1.0,        0.25, 0.25, 0.75,  
		1.0, -1.0, 1.0,       0.25, 0.25, 0.75,  
		1.0, -1.0, -1.0,      0.25, 0.25, 0.75,  
		1.0, 1.0, -1.0,       0.25, 0.25, 0.75,  
		// Front
		1.0, 1.0, 1.0,        1.0, 0.0, 0.15,    
		1.0, -1.0, 1.0,        1.0, 0.0, 0.15,   
		-1.0, -1.0, 1.0,        1.0, 0.0, 0.15,  
		-1.0, 1.0, 1.0,        1.0, 0.0, 0.15,   
		// Back
		1.0, 1.0, -1.0,        0.0, 1.0, 0.15,    
		1.0, -1.0, -1.0,        0.0, 1.0, 0.15,   
		-1.0, -1.0, -1.0,        0.0, 1.0, 0.15,  
		-1.0, 1.0, -1.0,        0.0, 1.0, 0.15,   
		// Bottom
		-1.0, -1.0, -1.0,       0.5, 0.5, 1.0,    
		-1.0, -1.0, 1.0,        0.5, 0.5, 1.0,    
		1.0, -1.0, 1.0,         0.5, 0.5, 1.0,    
		1.0, -1.0, -1.0,        0.5, 0.5, 1.0,    
	]);
	var indices = new Uint16Array([ 
		// Top
		0, 1, 2,
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
	]);
    console.log(indices.length);
    //create VBO in hardware
    // var colorBuffer = gl.createBuffer();
    // gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the index buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    //Connect a VBO Attribute to Shaders
    var a_PositionLoc = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_PositionLoc < 0) {
        console.log('Failed to get attribute storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(
		a_PositionLoc, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		false,
		6 * vertices.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.enableVertexAttribArray(a_PositionLoc);
    var a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_ColorLoc < 0) {
        console.log('Failed to get the attribute storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(
		a_ColorLoc, 
		3, 
		gl.FLOAT,
		false,
		6 * vertices.BYTES_PER_ELEMENT, 
		3 * vertices.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(a_ColorLoc);

    return indices.length;
}


var g_last = Date.now();
function animate(angle) {
  var now = Date.now(); // Calculate the elapsed time
  var elapsed = now - g_last;
  g_last = now;
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}
function spinUp() {
  ANGLE_STEP += 25; 
}
function spinDown() {
 ANGLE_STEP -= 25; 
}
function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}