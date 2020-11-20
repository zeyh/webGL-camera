class Utils {
    static loadTexture(gl, url, color) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
  
      const level = 0; 
      const internalFormat = gl.RGBA;
      const width = 1;
      const height = 1;
      const border = 0;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array(color);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);
  
      const image = new Image();
      image.crossOrigin = '';
      image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
          srcFormat, srcType, image);
  
        if (Utils.isPowerOf2(image.width) && Utils.isPowerOf2(image.height)) {
          // Yes, it's a power of 2. Generate mips.
          gl.generateMipmap(gl.TEXTURE_2D);
        } else {
  
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
      };
      image.src = url;
  
      return texture;
    }
  
    static isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }
    static createShadowFrameBuffer(gl, width, height) {
      let frame_buffer, color_buffer, depth_buffer, status;
  
      // Check for errors and report appropriate error messages
      function _errors(buffer, buffer_name) {
        let error_name = gl.getError();
        if (!buffer || error_name !== gl.NO_ERROR) {
          window.console.log("Error in _createFrameBufferObject,", buffer_name, "failed; ", error_name);
  
          // Reclaim any buffers that have already been allocated
          gl.deleteTexture(color_buffer);
          gl.deleteFramebuffer(frame_buffer);
  
          return true;
        }
        return false;
      }
  
      // Step 1: Create a frame buffer object
      frame_buffer = gl.createFramebuffer();
      if (_errors(frame_buffer, "frame buffer")) { return null; }
  
      // Step 2: Create and initialize a texture buffer to hold the colors.
      color_buffer = gl.createTexture();
      if (_errors(color_buffer, "color buffer")) { return null; }
      gl.bindTexture(gl.TEXTURE_2D, color_buffer);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);
      if (_errors(color_buffer, "color buffer allocation")) { return null; }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
      // Step 3: Create and initialize a texture buffer to hold the depth values.
      // Note: the WEBGL_depth_texture extension is required for this to work
      //       and for the gl.DEPTH_COMPONENT texture format to be supported.
      depth_buffer = gl.createTexture();
      if (_errors(depth_buffer, "depth buffer")) { return null; }
      gl.bindTexture(gl.TEXTURE_2D, depth_buffer);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
        gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      if (_errors(depth_buffer, "depth buffer allocation")) { return null; }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
      // Step 4: Attach the specific buffers to the frame buffer.
      gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_buffer, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_buffer, 0);
      if (_errors(frame_buffer, "frame buffer")) { return null; }
  
      // Step 5: Verify that the frame buffer is valid.
      status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        _errors(frame_buffer, "frame buffer status:" + status.toString());
      }
  
      // Unbind these new objects, which makes the default frame buffer the 
      // target for rendering.
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
      // Remember key properties of the frame buffer object so they can be
      // used later.
      frame_buffer.color_buffer = color_buffer;
      frame_buffer.depth_buffer = depth_buffer;
      frame_buffer.width = width;
      frame_buffer.height = height;
      return frame_buffer;
    }
  }
  
  class Car {
  
    constructor(gl, programInfo) {
      this.gl = gl;
      this.programInfo = programInfo;
      this.cubeBuffer = Cube.initBuffers(gl);
      this.cubeTexture = Utils.loadTexture(gl, '',[255, 0, 0, 255]);
      this.cylinderBuffer = Cylinder.initBuffers(gl);
      this.cylinderTexture = Utils.loadTexture(gl, '',[14.9, 12.2, 12.2, 255]);
      this.flatDiskBuffer = FlatDisk.initBuffers(gl);
      this.flatDiskTexture = Utils.loadTexture(gl, '',[0, 0, 255, 255]);
      this.headlightTranslation1 = [0.7, 0.0, 1.6];
      this.headlightTranslation2 = [-0.7, 0.0, 1.6];
    }
  
    draw(projectionMatrix, worldViewMatrix, sunDirectionalVector, headlightPosition1, headlightPosition2,shadowBuffer, shadowMapTransformMatrix) {
      const modelViewMatrix = mat4.clone(worldViewMatrix);
  
      const passengerMatrix = mat4.clone(modelViewMatrix);
      mat4.translate(passengerMatrix, passengerMatrix, [0.0, 0.7, 0.0]);
      mat4.scale(passengerMatrix, passengerMatrix, [1.0, 0.3, 1.0]);
  
      const chasisMatrix = mat4.clone(modelViewMatrix);
      mat4.scale(chasisMatrix, chasisMatrix, [1.0, 0.8, 1.5]);
  
      const tireMatrix1 = Car.getTireMatrix(modelViewMatrix, [1.3, -0.3, 0.85]);
      const tireMatrix2 = Car.getTireMatrix(modelViewMatrix, [1.3, -0.3, -0.85]);
      const tireMatrix3 = Car.getTireMatrix(modelViewMatrix, [-1.3, -0.3, -0.85]);
      const tireMatrix4 = Car.getTireMatrix(modelViewMatrix, [-1.3, -0.3, 0.85]);
  
      const headlightMatrix1 = Car.getHeadlightMatrix(modelViewMatrix, this.headlightTranslation1);
      const headlightMatrix2 = Car.getHeadlightMatrix(modelViewMatrix, this.headlightTranslation2);
  
      // Draw chasis
  
      Figure.draw(this.gl, this.programInfo, this.cubeBuffer, this.cubeTexture, projectionMatrix, chasisMatrix,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false,shadowBuffer, shadowMapTransformMatrix);
  
      // Draw wheels
      Figure.draw(this.gl, this.programInfo, this.cylinderBuffer, this.cylinderTexture, projectionMatrix, tireMatrix1,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.cylinderBuffer, this.cylinderTexture, projectionMatrix, tireMatrix2,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.cylinderBuffer, this.cylinderTexture, projectionMatrix, tireMatrix3,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.cylinderBuffer, this.cylinderTexture, projectionMatrix, tireMatrix4,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
  
      // Draw Headlights
      Figure.draw(this.gl, this.programInfo, this.flatDiskBuffer, this.flatDiskTexture, projectionMatrix,
        headlightMatrix1, sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, true
        /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.flatDiskBuffer, this.flatDiskTexture, projectionMatrix,
        headlightMatrix2, sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, true
        /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
    }
  
    static getTireMatrix(baseMatrix, translation) {
      const tireMatrix = mat4.clone(baseMatrix);
      mat4.translate(tireMatrix, tireMatrix, translation);
      mat4.scale(tireMatrix, tireMatrix, [0.2, 0.4, 0.4]);
      mat4.rotate(tireMatrix, tireMatrix, Math.PI / 2, [0.0, 0.0, 1.0]);
      return tireMatrix;
    }
  
    static getHeadlightMatrix(baseMatrix, translation) {
      const headlightMatrix = mat4.clone(baseMatrix);
      mat4.translate(headlightMatrix, headlightMatrix, translation);
      mat4.scale(headlightMatrix, headlightMatrix, [0.15, 0.15, 0.15]);
      mat4.rotate(headlightMatrix, headlightMatrix, Math.PI / 2, [1.0, 0.0, 0.0]);
      return headlightMatrix;
    }
  }
  
  class Disk {
    constructor(gl, programInfo) {
      this.gl = gl;
      this.programInfo = programInfo;
      this.flatDiskBuffer = FlatDisk.initBuffers(gl);
      this.flatDiskTexture = Utils.loadTexture(gl, '',[14.5, 79.6, 8.2, 255]);
      this.flatDiskTexture2 = Utils.loadTexture(gl, '',[10.5, 70.6, 2.2, 255]);
      this.flatDiskTexture3 = Utils.loadTexture(gl, '',[125, 125, 125, 255]);
      this.flatDiskTexture4 = Utils.loadTexture(gl, '',[14.5, 79.6, 8.2, 255]);
  
    }
  
    draw(projectionMatrix, worldViewMatrix, sunDirectionalVector, headlightPosition1, headlightPosition2,shadowBuffer,
         shadowMapTransformMatrix) {
      const modelViewMatrix = mat4.clone(worldViewMatrix);
  
  
  
      const diskMatrix1 = this.getFlatDiskMatrix(modelViewMatrix, [0.0, 0.05, 0.0]);
      const diskMatrix2 = this.getFlatDiskMatrix(modelViewMatrix, [0.0, -0.05, 0.0]);
      const diskMatrix3 = this.getFlatDiskMatrix(modelViewMatrix, [0.0, 0.050100, 0.0],[0.45,1.0,0.45]);
      const diskMatrix4 = this.getFlatDiskMatrix(modelViewMatrix, [0.0, 0.050200, 0.0],[0.25,1.0,0.25]);
  
  
      Figure.draw(this.gl, this.programInfo, this.flatDiskBuffer, this.flatDiskTexture, projectionMatrix, diskMatrix1,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.flatDiskBuffer, this.flatDiskTexture2, projectionMatrix, diskMatrix2,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.flatDiskBuffer, this.flatDiskTexture3, projectionMatrix, diskMatrix3,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.flatDiskBuffer, this.flatDiskTexture4, projectionMatrix, diskMatrix4,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
    }
  
    getFlatDiskMatrix(baseMatrix, translation,scale) {
      scale = scale || [0.6,1.0,0.6]
      const diskMatrix = mat4.clone(baseMatrix);
      mat4.scale(diskMatrix, diskMatrix, scale);
      mat4.translate(diskMatrix, diskMatrix, translation);
      return diskMatrix;
    }
    
  }
  
  class LightPole {
    constructor(gl, programInfo) {
      this.gl = gl;
      this.programInfo = programInfo;
      this.sphereBuffer = Sphere.initBuffers(gl);
      this.sphereTexture = Utils.loadTexture(gl, '',[255, 183, 76, 255]);
      this.cylinderBuffer = Cylinder.initBuffers(gl);
      this.cylinderTexture = Utils.loadTexture(gl, '',[169, 169, 169, 255]);
    }
  
    draw(projectionMatrix, worldViewMatrix, sunDirectionalVector, headlightPosition1, headlightPosition2,shadowBuffer, shadowMapTransformMatrix) {
      const modelViewMatrix = mat4.clone(worldViewMatrix);
  
      const sphereMatrix = mat4.clone(modelViewMatrix);
      mat4.translate(sphereMatrix, sphereMatrix, [0.0, 0.24, 0.0]);
      mat4.scale(sphereMatrix, sphereMatrix, [0.015, 0.015, 0.015]);
  
      const cylinderMatrix = mat4.clone(modelViewMatrix);
      mat4.translate(cylinderMatrix, cylinderMatrix, [0.0, 0.15, 0.0]);
      mat4.scale(cylinderMatrix, cylinderMatrix, [0.01, 0.1, 0.01]);
  
      Figure.draw(this.gl, this.programInfo, this.sphereBuffer, this.sphereTexture, projectionMatrix, sphereMatrix,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */, shadowBuffer, shadowMapTransformMatrix, true/* isLightPole */);
      Figure.draw(this.gl, this.programInfo, this.cylinderBuffer, this.cylinderTexture, projectionMatrix, cylinderMatrix,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false, /* isHeadlight */shadowBuffer, shadowMapTransformMatrix);
    }
  }
  
  class Sun {
    constructor(gl, programInfo) {
      this.gl = gl;
      this.programInfo = programInfo;
      this.sphereBuffer = Sphere.initBuffers(gl);
      this.sphereTexture = Utils.loadTexture(gl, '',[192, 189, 15, 255]);
    }
    updateColor(color){
      console.log(this.sphereTexture)
    }
  
    draw(projectionMatrix, worldViewMatrix, sunDirectionalVector, headlightPosition1, headlightPosition2,shadowBuffer, shadowMapTransformMatrix) {
      const modelViewMatrix = mat4.clone(worldViewMatrix);
      Figure.draw(this.gl, this.programInfo, this.sphereBuffer, this.sphereTexture, projectionMatrix, modelViewMatrix,
        sunDirectionalVector, true /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
    }
  }
  class Moon { 
    constructor(gl, programInfo) {
      this.gl = gl;
      this.programInfo = programInfo;
      this.sphereBuffer = Sphere.initBuffers(gl);
      this.sphereTexture = Utils.loadTexture(gl, '',[64, 64, 64, 255]);
    }
    updateColor(color){
      console.log(this.sphereTexture)
    }
  
    draw(projectionMatrix, worldViewMatrix, sunDirectionalVector, headlightPosition1, headlightPosition2,shadowBuffer, shadowMapTransformMatrix) {
      const modelViewMatrix = mat4.clone(worldViewMatrix);
      Figure.draw(this.gl, this.programInfo, this.sphereBuffer, this.sphereTexture, projectionMatrix, modelViewMatrix,
        sunDirectionalVector, true /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
    }
  }
  
  class Tree {
  
    constructor(gl, programInfo) {
      this.gl = gl;
      this.programInfo = programInfo;
      this.coneBuffer = Cone.initBuffers(gl);
      this.coneTexture = Utils.loadTexture(gl, '',[0, 255, 0, 255]);
      this.cylinderBuffer = Cylinder.initBuffers(gl);
      this.cylinderTexture = Utils.loadTexture(gl, '',[160, 80, 40, 255]);
    }
  
    draw(projectionMatrix, worldViewMatrix, sunDirectionalVector, headlightPosition1, headlightPosition2,shadowBuffer, shadowMapTransformMatrix) {
      const modelViewMatrix = mat4.clone(worldViewMatrix);
  
      const cylinderMatrix = mat4.clone(modelViewMatrix);
      mat4.scale(cylinderMatrix, cylinderMatrix, [0.2, 0.8, 0.2]);
  
      const coneMatrix = mat4.clone(modelViewMatrix);
      mat4.translate(coneMatrix, coneMatrix, [0.0, 0.8, 0.0]);
      mat4.scale(coneMatrix, coneMatrix, [0.5, 0.5, 0.5]);
  
      Figure.draw(this.gl, this.programInfo, this.coneBuffer, this.coneTexture, projectionMatrix, coneMatrix,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
      Figure.draw(this.gl, this.programInfo, this.cylinderBuffer, this.cylinderTexture, projectionMatrix, cylinderMatrix,
        sunDirectionalVector, false /* isSun */, headlightPosition1, headlightPosition2, false /* isHeadlight */,shadowBuffer, shadowMapTransformMatrix);
    }
  }