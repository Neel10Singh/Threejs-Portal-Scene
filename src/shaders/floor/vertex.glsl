varying vec2 vUv;

varying vec3 vColor;
uniform float uTime;

void main() {
    vUv = uv;
    vColor = color;
    vec3 cpos = position;

    float waveSize = 8.0;          // smaller field → smaller wave repetition
    float tipDistance = 0.02;      // used to be 0.3 (10× too high now)
    float centerDistance = 0.01; 

    float timeSpeed = 2.5;

    float heightFactor = color.x; // 0 → base, 1 → tip

    float bendAmount = mix(0.0, 0.03, heightFactor); // scales smoothly
    cpos.x += sin(uTime * timeSpeed + uv.x * waveSize) * bendAmount;

    float diff = position.x - cpos.x;

    vec4 worldPosition = vec4(cpos, 1.0);
    vec4 mvPosition = projectionMatrix * modelViewMatrix * vec4(cpos, 1.0);
    gl_Position = mvPosition;
}
