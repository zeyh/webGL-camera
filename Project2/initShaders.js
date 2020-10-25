//init shaders
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec4 a_Position;',
    'attribute vec4 a_Color;',
    'attribute vec4 a_Normal;',
    'attribute float a_Face;',
    'uniform mat4 u_modelMatrix;',
    'uniform mat4 u_normalMatrix;',
    'uniform int u_PickedFace;',
    'varying vec4 v_Color;',
    'void main() {',
    '    gl_Position = u_modelMatrix * a_Position;',
    '    vec3 lightDirection = normalize(vec3(0, 0, 0));',
    '    vec3 normal = normalize((u_normalMatrix * a_Normal).xyz);',
    '    float nDotL = max(dot(normal, lightDirection), 0.0);',
    
    '    int face = int(a_Face);',
    '    vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;',
    '    if(u_PickedFace == 0) {\n' + // In case of 0, insert the face number into alpha
    '        v_Color = vec4(color, a_Face/255.0);' ,
    '    } else {' ,
    '        v_Color =  vec4(color, a_Color.a);' ,
    '    }',
    // '    v_Color = a_Color;',
    '}'
    ].join('\n');

var FSHADER_SOURCE = [
    '#ifdef GL_ES',
    '  precision mediump float;',
    '#endif',
    'varying vec4 v_Color;',
    'void main() {',
    '  gl_FragColor = v_Color;',
    '}',
    ].join('\n');

'use strict';
function main() {
    console.log("now I'm in js file...");
    g_canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    var gl = getWebGLContext(g_canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
}