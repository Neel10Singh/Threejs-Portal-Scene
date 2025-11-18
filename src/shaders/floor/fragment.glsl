uniform sampler2D uTexture;
// uniform sampler2D textures[4];

varying vec2 vUv;
varying vec3 vColor;

void main() {
  float contrast = 1.5;
  float brightness = 0.1;
  vec3 color = texture2D(uTexture, vUv).rgb * contrast;
  color = color + vec3(brightness, brightness, brightness);
  gl_FragColor.rgb = color;
  gl_FragColor.a = 1.0;
}
