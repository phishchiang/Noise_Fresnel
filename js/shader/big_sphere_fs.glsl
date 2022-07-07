float PI = 3.141592653589793238;

uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 v_position;
varying vec4 v_world_position;

// Noise Function
// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

float sin_pattern( vec2 uv, float offset ){
	return abs(sin( uv.x * 10.0) + offset);
}

float sin_offset_pattern( vec2 uv, float offset ){
	return smoothstep(
		0.0,
		0.5 + offset * 0.5,
		abs(0.5 * (sin( uv.x * 10.0) + offset * 2.0))
	);
}

// Calculation of the rotation matrix 2 of vector 2D rotation
mat2 rotate_2d_mat(float angle){
	return mat2(
		cos(angle), -sin(angle),
		sin(angle), cos(angle)
	);
}

// Calculation of the vector 2D by applying the rotation matrix 2 with original vector.
vec2 rotate_2d_vec(vec2 v, float a) {
	mat2 m = rotate_2d_mat(a);
	return m * v;
}


void main()	{
	vec3 color_primary = vec3(0.000, 0.188, 0.286);
	vec3 color_secondary = vec3(0.968, 0.498, 0.000);
	vec3 color_accent = vec3(0.917, 0.886, 0.717);

	float n = noise(v_position.xyz + time * 0.25);

  // // Just apply vector
	// vec2 base_uv = rotate_2d_vec(v_position.xy, n) * 0.1;

	// Apply matrix multiplication
	vec2 base_uv = rotate_2d_mat(n) * v_position.xy * 0.1;

	float pattern_01 = sin_pattern(base_uv, 0.5);
	float pattern_02 = sin_pattern(base_uv, 0.1);

	vec3 color_pattern_01 = mix(color_secondary, color_accent, pattern_01);
	vec3 color_pattern_02 = mix(color_pattern_01, color_primary, pattern_02);

	gl_FragColor = vec4(color_pattern_02, 1.);
}