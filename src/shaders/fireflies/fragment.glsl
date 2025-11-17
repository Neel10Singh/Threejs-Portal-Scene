uniform float uTime;
varying float vVisibility;
varying float vScale;

void main(){

    float distanceToCenter = 0.05 / distance(gl_PointCoord, vec2(0.5)) - 0.1;
    float flicker = abs(sin(uTime * (2.0 + (vScale + vVisibility) * 0.4)));
    flicker = pow(flicker, 2.0);
    gl_FragColor = vec4(0.6, 0.6, 0.0, distanceToCenter * flicker);
}