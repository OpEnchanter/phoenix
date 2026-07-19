import * as Phoenix from "./lib/phoenix.ts";
import * as ImpulseComponentExample from "./ImpulseComponentExample.ts";
import * as ControllableObjectExample from "./ControllableObjectExample.ts";

import * as THREE from "three";

const LitShader = `
    in vec2 fragTexCoord;

    const int MAX_LIGHTS = 1;
    uniform sampler2D uTex;
    uniform sampler2D uDepth;
    uniform int uNumLights;
    uniform vec2 uLightPositions[MAX_LIGHTS];
    uniform vec2 uLightScales[MAX_LIGHTS];
    uniform vec3 uLightColors[MAX_LIGHTS];
    uniform float t;

    out vec4 fragColor;

    vec4 linearToSRGB(vec4 value) {
        return vec4(mix(pow(value.rgb, vec3(1.0 / 2.2)), value.rgb * 12.92, lessThanEqual(value.rgb, vec3(0.0031308))), value.a);
    }

    void main() {
        vec4 p1 = vec4(0.0, 0.0, 0.0, 1.0);

        vec2 texSize = vec2(textureSize(uDepth, 0));
        vec2 texel = 1.0 / texSize;

        for (int l = 0; l < uNumLights; l++) {
            vec2 uLightPos = uLightPositions[l];
            vec2 uLightScale = uLightScales[l];

            vec2 lightRay = uLightPos - fragTexCoord;
            vec2 rayPx = lightRay * texSize;
            float rayLenPx = length(rayPx);
            vec2 dirPx = rayPx / max(rayLenPx, 1e-6);

            const float STEP_PX = 1.0;
            const float ABSORB = 0.1;

            float occlusionFactor = 1.0;

            for (int i = 0; i < 512; i++) {
                float marchedDist = float(i) * STEP_PX;
                if (marchedDist >= rayLenPx) break;

                vec2 marchedLinePx = dirPx * marchedDist;
                vec2 marchedLine = marchedLinePx * texel;
                
                vec2 uv = fragTexCoord + marchedLine;
                if (texture(uDepth, uv).r <= 0.1) {
                    occlusionFactor -= ABSORB;
                    if (occlusionFactor <= 0.0) { occlusionFactor = 0.0; break; } 
                }
            }

            float d = length(vec2(rayPx.x / 512.0, rayPx.y / 512.0));
            float lightAffectAmount = 1.0 - clamp(d, 0.5, 1.0);
            p1.rgb += occlusionFactor * lightAffectAmount * (texture(uTex, fragTexCoord).rgb * uLightColors[l]);
        }

        const float UNLIT_BRIGHTNESS = 0.7;

        p1 += texture(uTex, fragTexCoord) * UNLIT_BRIGHTNESS;

        vec3 bcol = texture(uTex, fragTexCoord).rgb;
        p1.rgb = vec3(min(p1.r, bcol.r),min(p1.g, bcol.g),min(p1.b, bcol.b));
        
        fragColor = linearToSRGB(p1);
    }
`

let lightPositions = [
    new THREE.Vector2(-128, 128), 
    new THREE.Vector2(64, 128)
]

let lightScales = [
    new THREE.Vector2(512.0, 512.0), 
    new THREE.Vector2(512, 512)
]

let lightColors = [
    new THREE.Vector3(1.0, 1.0, 1.0), 
    new THREE.Vector3(1.0,0.0,0)
]

const rScale = new Phoenix.Vector2(2560, 1440)

const app: Phoenix.App = new Phoenix.App({
    zoom: 1,
    renderScale: 1,
    clearColor: 0x5cdbfd,
    timescale: 1,
    shaderOverride: {
        vertexShader: Phoenix.DefaultVertexShader,
        fragmentShader: LitShader,
        uniforms: {
            uNumLights: { value: 1 },
            uLightPositions: { value: lightPositions },
            uLightScales: { value: lightScales },
            uLightColors: { value: lightColors }
        }
    }
});

app.addFrameIntervalCallback(() => {
    let lps = []
    for (const lightPos of lightPositions) {
        const p = new THREE.Vector3(lightPos.x, lightPos.y, 0);
        p.project(app.camera);

        const x = (p.x + 1) / 2
        const y = (p.y + 1) / 2
        lps.push(new THREE.Vector2(x, y))
    }

    app.screenSpaceShader.uniforms.uLightPositions!.value = lps

    let scls = []
    for (const lightScale of lightScales) {
        const x = lightScale.x! / rScale.x
        const y = lightScale.y! / rScale.y

        scls.push(new THREE.Vector2(x, y))
    }

    app.screenSpaceShader.uniforms.uLightScales!.value = scls
})


app.addScene("0", new ImpulseComponentExample.Scene())
app.addScene("1", new ControllableObjectExample.Scene())

app.loadScene("0")

let cur = 0;
let max = 1;

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() == "h") {
        cur = (cur + 1) % (max+1);
        app.loadScene(cur.toString());
    } else if (e.key.toLocaleLowerCase() == "r") {
        app.loadScene(cur.toString());
    }
})