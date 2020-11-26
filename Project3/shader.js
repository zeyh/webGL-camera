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

// ! Vertex shader program for regular drawing
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
