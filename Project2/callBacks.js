var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
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
            // console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
            
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
            // console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
            
            g_isDrag = false;											// CLEAR our mouse-dragging flag, and
            // accumulate any final bit of mouse-dragging we did:
            g_xMdragTot += (x - g_xMclik);
            g_yMdragTot += (y - g_yMclik);
            console.log("yclick: ", g_yMclik)
            // Report new mouse position:
            document.getElementById('MouseAtResult').innerHTML = 
              'Mouse At: '+x.toFixed(5)+', '+y.toFixed(5);
            // console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',g_xMdragTot,',\t',g_yMdragTot);
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
    
    // function keydown(ev, gl, shape, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    //     // from JointModel.js (c) 2012 matsuda
    //     switch (ev.keyCode) {
    //       case 38: // Up arrow key -> the positive rotation of joint1 around the z-axis
    //         if (g_chainAngle1 < 360.0) g_chainAngle1 += ANGLE_STEP;
    //         break;
    //       case 40: // Down arrow key -> the negative rotation of joint1 around the z-axis
    //         if (g_chainAngle1 > -360.0) g_chainAngle1 -= ANGLE_STEP;
    //         break;
    //       case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
    //         g_angle03 = (g_angle03 + ANGLE_STEP) % 360;
    //         break;
    //       case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
    //       g_angle03 = (g_angle03 - ANGLE_STEP) % 360;
    //         break;
    //       default: return; // Skip drawing at no effective action
    //     }
    // }

    function keydown(ev, gl, u_ViewMatrix, viewMatrix,  u_ModelMatrix, modelMatrix, groundGrid) {
        //------------------------------------------------------
        //HTML calls this'Event handler' or 'callback function' when we press a key:
        
            if(ev.keyCode == 39) { // The right arrow key was pressed
        //      g_EyeX += 0.01;
                        g_EyeX += 0.1;		// INCREASED for perspective camera)
            } else 
            if (ev.keyCode == 37) { // The left arrow key was pressed
        //      g_EyeX -= 0.01;
                        g_EyeX -= 0.1;		// INCREASED for perspective camera)
            } else { return; } // Prevent the unnecessary drawing
            // drawGrid(gl, u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix, groundGrid); 
        }