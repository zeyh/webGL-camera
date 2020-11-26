let canvasWidth, canvasHeight = 0;

main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  let depth_texture_extension = gl.getExtension('WEBGL_depth_texture');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

// Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uShadowMapTransformMatrix;
    
    varying vec2 vTextureCoord;
    varying highp vec4 vTransformedNormal;
    varying vec4 vPosition;
    varying vec4 vVertexRelativeToLight;


    void main(void) {
      vPosition = uModelViewMatrix * aVertexPosition;
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
      vTransformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
      vVertexRelativeToLight = uShadowMapTransformMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  // Fragment shader program
  const fsSource = `
    precision mediump float;
    
    varying vec2 vTextureCoord;
    varying highp vec4 vTransformedNormal;
    varying vec4 vPosition;
    varying vec4 vVertexRelativeToLight;
    
    uniform highp float uIsSun;
    uniform highp float uIsHeadlight;
    uniform highp float uIsLightPole;
    uniform highp float uApplyShadow;

    uniform vec3 uSunDirectionalVector;
    uniform bool uSunUp;
    uniform vec3 uHeadlightPosition1;
    uniform vec3 uHeadlightPosition2;

    uniform vec3 uSunColor;
    uniform sampler2D uSampler;
    uniform sampler2D uShadowSampler;

     bool in_shadow(void) {
      vec3 vertex_relative_to_light = vVertexRelativeToLight.xyz / vVertexRelativeToLight.w;
      vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
      vec4 shadowmap_color = texture2D(uShadowSampler, vertex_relative_to_light.xy);
      float shadowmap_distance = shadowmap_color.r;

      if ( vertex_relative_to_light.z <= shadowmap_distance + 0.00004 ) {
        return false; 
      } else {
        return true;
      }
    }

    void main(void) {
      float z = gl_FragCoord.z;

      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      // Apply lighting effect
      
      highp vec3 ambientLight = vec3(0.7, 0.7, 0.7);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(uSunDirectionalVector);
      vec3 lightWeighting = ambientLight;
            
      highp float directional = max(dot(vTransformedNormal.xyz, directionalVector), 0.0);
      if (uIsSun < 0.5) {
        if (uSunUp) {
          lightWeighting += (directionalLightColor * (directional));
          if (in_shadow()) {
            lightWeighting = vec3(0.2, 0.2, 0.2);
          }
        } else {
          if (uIsHeadlight < 0.5 && uIsLightPole < 0.5) {
            lightWeighting = ambientLight*0.3;
            vec3 vSurfaceToLight1 = uHeadlightPosition1 - vPosition.xyz;
            vec3 vSurfaceToLight2 = uHeadlightPosition2 - vPosition.xyz;
            vec3 vSurfaceToLight3 = vec3(0, 0.1, -0.1) - vPosition.xyz;
            float distance1 = length(vSurfaceToLight1);
            float distance2 = length(vSurfaceToLight2);
            float distance3 = length(vSurfaceToLight3);
            vec3 nStoL1 = normalize(vSurfaceToLight1);
            vec3 nStoL2 = normalize(vSurfaceToLight2);
            vec3 nStoL3 = normalize(vSurfaceToLight3);
            float weight1 = max(dot(vTransformedNormal.xyz, nStoL1), 0.0)/(distance1*24.0);
            float weight2 = max(dot(vTransformedNormal.xyz, nStoL2), 0.0)/(distance2*24.0);
            float weight3 = max(dot(vTransformedNormal.xyz, nStoL3), 0.0)/(distance3*12.0);
            if(distance1 > 0.0 && distance1 < 0.15){
            lightWeighting +=  directionalLightColor * weight1;
            }
            if(distance2 > 0.0 && distance2 < 0.15){
            lightWeighting +=  directionalLightColor * weight2;
            }
            if(distance3 > 0.0 && distance3 < 0.25){
            lightWeighting += directionalLightColor * weight3;
            }
          } else {
            lightWeighting = ambientLight;
            lightWeighting += directionalLightColor;
          }
        }
      } else {
        lightWeighting += directionalLightColor;
      }

      gl_FragColor = vec4(texelColor.rgb * lightWeighting, texelColor.a);
    }
  `;
  
  const vsShadowSource = `
    // Vertex Shader
    precision mediump int;
    precision highp float;
    
    attribute vec4 aVertexPosition;
    
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uShadowMapTransformMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  const fsShadowSource = `
    // Fragment shader program
    precision mediump int;
    precision highp float;
    
    void main() {    
      float z = gl_FragCoord.z;    
      gl_FragColor = vec4(z, 0.0, 0.0, 1.0);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const shaderShadowProgram = initShaderProgram(gl, vsShadowSource, fsShadowSource);


  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aTextureCoord and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      uShadowSampler: gl.getUniformLocation(shaderProgram, 'uShadowSampler'),
      sunDirectionalVector: gl.getUniformLocation(shaderProgram, 'uSunDirectionalVector'),
      isSun: gl.getUniformLocation(shaderProgram, 'uIsSun'),
      headlightPosition1: gl.getUniformLocation(shaderProgram, 'uHeadlightPosition1'),
      headlightPosition2: gl.getUniformLocation(shaderProgram, 'uHeadlightPosition2'),
      isHeadlight: gl.getUniformLocation(shaderProgram, 'uIsHeadlight'),
      isLightPole: gl.getUniformLocation(shaderProgram, 'uIsLightPole'),
      shadowMapTransformMatrix: gl.getUniformLocation(shaderProgram, 'uShadowMapTransformMatrix'),
      applyShadow: gl.getUniformLocation(shaderProgram, 'uApplyShadow')

    },
  };
  
  const shadowProgramInfo = {
    program: shaderShadowProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderShadowProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderShadowProgram, 'aTextureCoord'),
      vertexNormal: gl.getAttribLocation(shaderShadowProgram, 'aVertexNormal')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderShadowProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderShadowProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderShadowProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderShadowProgram, 'uSampler'),
      uShadowSampler: gl.getUniformLocation(shaderShadowProgram, 'uShadowSampler'),
      sunDirectionalVector: gl.getUniformLocation(shaderShadowProgram, 'uSunDirectionalVector'),
      isSun: gl.getUniformLocation(shaderShadowProgram, 'uIsSun'),
      headlightPosition1: gl.getUniformLocation(shaderShadowProgram, 'uHeadlightPosition1'),
      headlightPosition2: gl.getUniformLocation(shaderShadowProgram, 'uHeadlightPosition2'),
      isHeadlight: gl.getUniformLocation(shaderShadowProgram, 'uIsHeadlight'),
      isLightPole: gl.getUniformLocation(shaderShadowProgram, 'uIsLightPole'),
      shadowMapTransformMatrix: gl.getUniformLocation(shaderShadowProgram, 'uShadowMapTransformMatrix'),
      applyShadow: gl.getUniformLocation(shaderShadowProgram, 'uApplyShadow')
    },
  };

  var then = 0;

  const fieldOfView = 60 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1;
  const zFar = 2000;
   const projectionMatrix1 = mat4.create();
  const projectionMatrix2 = mat4.create();

  const shadowBuffer = Utils.createShadowFrameBuffer(gl, 512, 512);
  const shadowScene = new Scene(gl, shadowProgramInfo, projectionMatrix2, true /* isForShadow */, null, mat4.create());
  // mat4.perspective(projectionMatrix,
  //   fieldOfView,
  //   aspect,
  //   zNear,
  //   zFar);

  const scene = new Scene(gl, programInfo, projectionMatrix1, false /* isForShadow */, shadowBuffer, projectionMatrix2);

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
 
    drawScene(gl, scene, shadowScene, shadowBuffer, deltaTime);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

//
// Draw the scene.
//
function drawScene(gl, scene, shadowScene, shadowBuffer, deltaTime) {
  shadowScene.update(deltaTime);
  scene.update(deltaTime);

  // Shadow Map Render 
  gl.bindFramebuffer(gl.FRAMEBUFFER,  shadowBuffer);
  clearBuffer(gl);
  gl.viewport(0, 0, shadowBuffer.width, shadowBuffer.height);
  shadowScene.draw();

  // Real render
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  clearBuffer(gl);
  gl.viewport(0, 0, canvasWidth, canvasHeight);
  scene.draw();
}
function clearBuffer(gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
