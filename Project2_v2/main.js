// adapted from Shadow_highp.js (c) 2012 matsuda and tanaka
// Vertex shader program for generating a shadow map
var SHADOW_VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '}\n';

// Fragment shader program for generating a shadow map
var SHADOW_FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'void main() {\n' +
    '  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\n' +
    '  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\n' +
    '  vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);\n' + // Calculate the value stored into each byte
    '  rgbaDepth -= rgbaDepth.gbaa * bitMask;\n' + // Cut off the value which do not fit in 8 bits
    '  gl_FragColor = rgbaDepth;\n' +
    '}\n';

// Vertex shader program for regular drawing
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_MvpMatrixFromLight;\n' +
    'varying vec4 v_PositionFromLight;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program for regular drawing
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision highp float;\n' +
    '#endif\n' +
    'uniform sampler2D u_ShadowMap;\n' +
    'varying vec4 v_PositionFromLight;\n' +
    'varying vec4 v_Color;\n' +
    // Recalculate the z value from the rgba
    'float unpackDepth(const in vec4 rgbaDepth) {\n' +
    '  const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));\n' +
    '  float depth = dot(rgbaDepth, bitShift);\n' + // Use dot() since the calculations is same
    '  return depth;\n' +
    '}\n' +
    'void main() {\n' +
    '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +
    '  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n' +
    '  float depth = unpackDepth(rgbaDepth);\n' + // Recalculate the z value from the rgba
    '  float visibility = (shadowCoord.z > depth + 0.0015) ? 0.7 : 1.0;\n' +
    '  gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' +
    '}\n';

var OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;
var LIGHT = [0, 7, 2]; // Light position(x, y, z)
var canvas;

function main() {
    // Retrieve <canvas> element
    console.log("I'm in webglDrawing.js right now...");
    canvas = document.getElementById('webgl');
    setControlPanel(); //init DAT.GUI for controllers for frustrums

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders for generating a shadow map
    var shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    if (shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) {
        console.log('Failed to get the storage location of attribute or uniform variable from shadowProgram');
        return;
    }

    // Initialize shaders for regular drawing
    var normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
    normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
    normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
    normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
    normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');
    if (normalProgram.a_Position < 0 || normalProgram.a_Color < 0 || !normalProgram.u_MvpMatrix ||
        !normalProgram.u_MvpMatrixFromLight || !normalProgram.u_ShadowMap) {
        console.log('Failed to get the storage location of attribute or uniform variable from normalProgram');
        return;
    }

    // ! Set the vertex information
    var triangle = initVertexBuffersForTriangle(gl);
    var cube = initVertexBuffersForShape4(gl);
    var groundGrid = initVertexBuffersForGroundGrid(gl);
    var thunder2 = initVertexBuffersForShape2(gl, 0.5);
    var thunder = initVertexBuffersForShape2(gl, 1);
    var semiSphere = initVertexBuffersForShape1(gl);
    var axis = initVertexBuffersForAxis(gl, 2); //axis Short
    var axis2 = initVertexBuffersForAxis(gl, 80); //axis long for world 
    if (!triangle || !cube || !groundGrid || !thunder || !semiSphere || !axis) {
        console.log('Failed to set the vertex information');
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

    // Initialize framebuffer object (FBO)  
    var fbo = initFramebufferObject(gl);
    if (!fbo) {
        console.log('Failed to initialize framebuffer object');
        return;
    }
    gl.activeTexture(gl.TEXTURE0); // Set a texture object to the texture unit
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

    // Set the clear color and enable the depth test
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);// Enable alpha blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function conflict with shadow...?

    viewProjMatrixFromLight = new Matrix4(); // Prepare a view projection matrix for generating a shadow map
    viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT, 1.0, 200.0);
    viewProjMatrixFromLight.lookAt(LIGHT[0], LIGHT[1], LIGHT[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

     // Prepare a view projection matrix for regular drawing
    // viewProjMatrix.setPerspective(45, canvas.width / canvas.height, 1.0, 100.0);
    // viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    var currentAngle = 0.0; // Current rotation angle (degrees)
    mvpMatrixFromLight_t = new Matrix4(); // A model view projection matrix from light source (for triangle)
    mvpMatrixFromLight_p = new Matrix4(); // A model view projection matrix from light source (for plane)
    
    var vbArray = [triangle, cube, thunder, groundGrid, semiSphere, axis, thunder2, axis2];
    var tick = function () {
        canvas.width = window.innerWidth * 1; //resize canvas
        canvas.height = window.innerHeight * 7 / 10;
        currentAngle = animate(currentAngle);
        g_cloudAngle = animateCloud();
        if(!isStop){
            g_jointAngle = animateJoints();
        }
        g_time = showCurTime();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);               // Change the drawing destination to FBO
        gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); // Set view port for FBO
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // Clear FBO    

        gl.useProgram(shadowProgram); // Set shaders for generating a shadow map
        // ! Draw the triangle and the plane (for generating a shadow map)
        drawAll_shadow(gl, shadowProgram, vbArray, currentAngle, viewProjMatrixFromLight);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);               // Change the drawing destination to color buffer
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer

        gl.useProgram(normalProgram); // Set the shader for regular drawing
        gl.uniform1i(normalProgram.u_ShadowMap, 0);  // Pass 0 because gl.TEXTURE0 is enabled



        // ! for regular drawin
        drawAll(gl, normalProgram, vbArray, currentAngle, viewProjMatrix)

        window.requestAnimationFrame(tick, canvas);
    };
    tick();
}







function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;

    // Define the error handling function
    var error = function () {
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        if (texture) gl.deleteTexture(texture);
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
        return null;
    }

    // Create a frame buffer object (FBO)
    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        console.log('Failed to create frame buffer object');
        return error();
    }

    // Create a texture object and set its size and parameters
    texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create texture object');
        return error();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Create a renderbuffer object and Set its size and parameters
    depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
    if (!depthBuffer) {
        console.log('Failed to create renderbuffer object');
        return error();
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    // Attach the texture and the renderbuffer object to the FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // Check if FBO is configured correctly
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.log('Frame buffer object is incomplete: ' + e.toString());
        return error();
    }

    framebuffer.texture = texture; // keep the required object

    // Unbind the buffer object
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return framebuffer;
}

var ANGLE_STEP = 40;   // The increments of rotation angle (degrees)

var last = Date.now(); // Last time that this function was called
function animate(angle) {
    var now = Date.now();   // Calculate the elapsed time
    var elapsed = now - last;
    last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}
