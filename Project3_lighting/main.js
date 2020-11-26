var canvas;
var normalProgram;

function main() {
    // Retrieve <canvas> element
    console.log("I'm in webglDrawing.js right now...");
    canvas = document.getElementById('webgl');
    // setControlPanel(); //init DAT.GUI for controllers for frustrums
    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders for regular drawing
    var normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { //bind normal program to gl.program too...
        console.log('Failed to intialize shaders.');
        return;
    }

    normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
    normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
    normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
    normalProgram.u_NormalMatrix = gl.getUniformLocation(normalProgram, 'u_NormalMatrix');
    if (normalProgram.a_Position < 0 || normalProgram.a_Color < 0 
        || !normalProgram.u_MvpMatrix ||
        !normalProgram.u_NormalMatrix) {
        console.log('Failed to get the storage location of attribute or uniform variable from normalProgram');
        return;
    }

    // ! Set the vertex information
    // var triangle = initVertexBuffersForTriangle(gl);
    // var cube = initVertexBuffersForShape4(gl);
    // var groundGrid = initVertexBuffersForGroundGrid(gl);
    // var thunder2 = initVertexBuffersForShape2(gl, 0.5);
    // var thunder = initVertexBuffersForShape2(gl, 1);
    // var semiSphere = initVertexBuffersForShape1(gl);
    // var axis = initVertexBuffersForAxis(gl, 2); //axis Short
    // var axis2 = initVertexBuffersForAxis(gl, 80); //axis long for world 
    var groundPlane = initVertexBuffersForGroundPlane(gl); //axis long for world 
    var sphere = initVertexBuffersForSphere(gl, 0.6);
    // var cube2 = initVertexBuffersForCube2(gl, 0.6);
    // if (!triangle || !cube || !groundGrid || !thunder 
    //     || !semiSphere || !axis || !groundPlane || !sphere ) {
    //     console.log('Failed to set the vertex information');
    //     return;
    // }
    if ( !sphere || !groundPlane) {
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


    // Set the clear color and enable the depth test
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.BLEND);// Enable alpha blending
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blending function conflict with shadow...?

    // var vbArray = [triangle, cube, thunder, groundGrid, semiSphere, axis, thunder2, axis2, groundPlane, sphere];
    var vbArray = [null, null, null, null, null, null, null, null, groundPlane, sphere];
    var tick = function () {
        canvas.width = window.innerWidth * 1; //resize canvas
        canvas.height = window.innerHeight * 7 / 10;
        currentAngle = animate(currentAngle);

        g_cloudAngle = animateCloud();
        if(!isStop){
            g_jointAngle = animateJoints();
        }
        g_time = showCurTime();


        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // ! for regular drawin
        gl.useProgram(normalProgram); // Set the shader for regular drawing
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
