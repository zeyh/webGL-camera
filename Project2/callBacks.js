
// * HTML events
var g_isDrag = false;		// mouse-drag: true when user holds down mouse button
var g_xMclik = 0.0;		// last mouse button-down position (in CVV coords)
var g_yMclik = 0.0;
var g_xMdragTot = 0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot = 0.0;


function writeHtml() {
    document.getElementById('EyeAt').innerHTML =
        'Eye: (' + g_EyeX.toFixed(3) + ', ' + g_EyeY.toFixed(3) + ', ' + g_EyeZ.toFixed(3) + ")";
    document.getElementById('LookAt').innerHTML =
        'Look At: (' + g_LookX.toFixed(3) + ', ' + g_LookY.toFixed(3) + ', ' + g_LookZ.toFixed(3) + ")";
}
function initWindow() {
    window.addEventListener('resize', resizeCanvas, false);

}
function resizeCanvas(gl, arr, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix) {
    canvas = document.getElementById('webgl');
    canvas.width = window.innerWidth * 1;
    canvas.height = window.innerHeight * 7 / 10;
    // console.log("(width, height):", window.innerWidth, window.innerHeight)
    //adding a overall drawing function here
    drawAll(gl, arr, u_ProjMatrix, projMatrix, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix);
}
function clearDrag() {
    // Called when user presses 'Clear' button in our webpage
    g_xMdragTot = 0.0;
    g_yMdragTot = 0.0;
}

// * ===================Keyboard event-handling Callbacks===========
// ref: https://keycode.info/ http://learnwebgl.brown37.net/07_cameras/camera_rotating_motion.html
function keyAD(ev) {
    if (ev.keyCode == 68) { // d
        g_EyeX += 0.1 * g_speed;
        g_LookX += 0.1 * g_speed;
    } else if (ev.keyCode == 65) { // a
        g_EyeX -= 0.1 * g_speed;
        g_LookX -= 0.1 * g_speed;
    } else { return; }
}

function keyWS(ev) {
    if (ev.keyCode == 83) { // w moving forward
        g_EyeZ += 0.1 * g_speed;
        g_LookZ += 0.1 * g_speed;

    } else if (ev.keyCode == 87) { // s moving backward
        g_EyeZ -= 0.1 * g_speed;
        g_LookZ -= 0.1 * g_speed;
    } else { return; }
}

function keyQE(ev) {
    if (ev.keyCode == 81) { // q
        g_EyeY += 0.1 * g_speed;
        g_LookY += 0.1 * g_speed;
    } else if (ev.keyCode == 69) { // e
        g_EyeY -= 0.1 * g_speed;
        g_LookY -= 0.1 * g_speed;

    } else { return; }
}

function keyArrowRotateRight(ev) {
    if (ev.keyCode == 39) { // ->
        g_LookX += 0.05 * g_speed; //unstable rate of rotation
    } else if (ev.keyCode == 37) { // <-
        g_LookX -= 0.05 * g_speed;
    } else { return; }
}

function keyArrowRotateUp(ev) {//change x from -1 to 1
    if (ev.keyCode == 38) { // up ^
        g_LookY += 0.05 * g_speed;
    } else if (ev.keyCode == 40) { // down v
        g_LookY -= 0.05 * g_speed;
    } else { return; }
}



// * ===================Keyboard event-handling Callbacks===========
function mouseWheel(en) {
    if (en.deltaY < 0) {
        g_viewScale -= 0.01;
    }
    else if (en.deltaY > 0) {
        g_viewScale += 0.01;
    }
}

function myMouseDown(ev) {
    var rect = ev.target.getBoundingClientRect();
    var xp = ev.clientX - rect.left;
    var yp = canvas.height - (ev.clientY - rect.top);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width / 2) / (canvas.width / 2);
    var y = (yp - canvas.height / 2) / (canvas.height / 2);

    g_isDrag = true;										
    g_xMclik = x;												
    g_yMclik = y;


};

function myMouseMove(ev) {
    if (g_isDrag == false) return;				

    var rect = ev.target.getBoundingClientRect();	
    var xp = ev.clientX - rect.left;								
    var yp = canvas.height - (ev.clientY - rect.top);	

    var x = (xp - canvas.width / 2) /  (canvas.width / 2);		
    var y = (yp - canvas.height / 2) /  (canvas.height / 2);

    // find how far we dragged the mouse:
    g_xMdragTot += (x - g_xMclik);					
    g_yMdragTot += (y - g_yMclik);
    dragQuat(x - g_xMclik, y - g_yMclik);
    g_xMclik = x;													
    g_yMclik = y;
};

function myMouseUp(ev) {
    var rect = ev.target.getBoundingClientRect();	
    var xp = ev.clientX - rect.left;								
    var yp = canvas.height - (ev.clientY - rect.top);	


    var x = (xp - canvas.width / 2) /   (canvas.width / 2);		
    var y = (yp - canvas.height / 2) /	(canvas.height / 2);

    g_isDrag = false;										
    g_xMdragTot += (x - g_xMclik);
    g_yMdragTot += (y - g_yMclik);
    dragQuat(x - g_xMclik, y - g_yMclik);
    // console.log("yclick: ", g_yMclik)
    
};

function dragQuat(xdrag, ydrag) {
    //from controlQuaterion.js
    var res = 5;
    var qTmp = new Quaternion(0, 0, 0, 1);
    var dist = Math.sqrt(xdrag * xdrag + ydrag * ydrag);
    qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist * 150.0); // (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
    qTmp.multiply(qNew, qTot);			// apply new rotation to current rotation. 
    qTot.copy(qTmp);
};
