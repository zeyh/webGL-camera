//init shaders
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec4 a_Position;',
    'attribute vec4 a_Color;',
    'attribute vec4 a_Normal;',
    'uniform mat4 u_ModelMatrix;',
    'uniform mat4 u_NormalMatrix;',
    'uniform mat4 u_ViewMatrix;',
    'uniform mat4 u_ProjMatrix;',
    'varying vec4 v_Color;',
    'void main() {',
    '    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;',
    '    vec3 lightDirection = normalize(vec3(0, 0, 0));',
    '    vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);',
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
