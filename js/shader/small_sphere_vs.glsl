/*
 * https://github.com/ebrahma/threejs_div_testing/blob/b5aa918fba0da04e5b78ee6168450945b5630b71/js/three-lib/shaders/FresnelShader.js
 * @author alteredq / http://alteredqualia.com/
*/
uniform float u_refraction_ratio;
uniform float u_fresnel_bias;
uniform float u_fresnel_scale;
uniform float u_fresnel_power;

varying vec3 vReflect;
varying vec3 vRefract[3];
varying float vReflectionFactor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );

  vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );

  vec3 I = worldPosition.xyz - cameraPosition;

  vReflect = reflect( I, worldNormal );
  vRefract[0] = refract( normalize( I ), worldNormal, u_refraction_ratio );
  vRefract[1] = refract( normalize( I ), worldNormal, u_refraction_ratio * 0.99 );
  vRefract[2] = refract( normalize( I ), worldNormal, u_refraction_ratio * 0.98 );
  vReflectionFactor = u_fresnel_bias + u_fresnel_scale * pow( 1.0 + dot( normalize( I ), worldNormal ), u_fresnel_power );

  gl_Position = projectionMatrix * mvPosition;
}