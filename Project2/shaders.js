//init shaders
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec4 a_Position;',
    'attribute vec4 a_Color;',
    'attribute vec4 a_Normal;',
    'uniform mat4 u_modelMatrix;',
    'uniform mat4 u_normalMatrix;',
    'varying vec4 v_Color;',
    'void main() {',
    '    gl_Position = u_modelMatrix * a_Position;',
    '    vec3 lightDirection = normalize(vec3(0, 0, 0));',
    '    vec3 normal = normalize((u_normalMatrix * a_Normal).xyz);',
    '    float nDotL = max(dot(normal, lightDirection), 0.0);',
    '    v_Color = a_Color;',
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
