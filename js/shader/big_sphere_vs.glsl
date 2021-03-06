float PI = 3.141592653589793238;

uniform vec2 pixels;
uniform float time;

varying vec2 vUv;
varying vec3 v_position;
varying vec4 v_world_position;


void main() {
  vUv = uv;
  v_position = position;
  v_world_position = modelMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}