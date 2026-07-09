import * as Phoenix from "./lib/phoenix.ts";
import * as ImpulseComponentExample from "./ImpulseComponentExample.ts";
import * as ManyObjectsExample from "./ManyObjectsExample.ts";
import * as ControllableObjectExample from "./ControllableObjectExample.ts";

import * as THREE from "three";

const LitShader = `
    in vec2 fragTexCoord;

    uniform sampler2D uTex;
    uniform sampler2D uDepth;
    uniform vec2[2] uLightPositions;
    uniform vec2[2] uLightScales;
    uniform vec3[2] uLightColors;
    uniform float t;

    out vec4 fragColor;

    vec4 linearToSRGB(vec4 value) {
        return vec4(mix(pow(value.rgb, vec3(1.0 / 2.2)), value.rgb * 12.92, lessThanEqual(value.rgb, vec3(0.0031308))), value.a);
    }

    void main() {
        vec4 p1 = texture(uTex, fragTexCoord);

        for (int l = 0; l < 2; l++) {
            vec2 uLightPos = uLightPositions[l];
            vec2 uLightScale = uLightScales[l];

            vec2 lightRay = uLightPos - fragTexCoord;
            float rStepRes = max(2048.0, 64.0 * (1.0 / length(lightRay)));
            vec2 lightRaySegment = vec2(lightRay.x / 256.0, lightRay.y / 256.0);
            bool isOccluded = false;

            for (int i = 0; i < 1024; i++) {
                vec2 marchedLine = vec2(lightRaySegment.x * float(i), lightRaySegment.y * float(i));
                if (texture(uDepth, fragTexCoord + marchedLine).r < 0.1) {
                    isOccluded = true;
                    break;
                }

                if (length(marchedLine) > length(lightRay)) {
                    break;
                }

                if (length(marchedLine) < 0.0) {
                    break;
                }
            }

            if (!isOccluded) {
                float lightAffectAmount = 1.0 - clamp((sqrt(pow(lightRay.x / uLightScale.x,2.0) + pow(lightRay.y / uLightScale.y,2.0))*5.0), 0.4, 1.0);
                p1 += vec4(lightAffectAmount * uLightColors[l].x, lightAffectAmount * uLightColors[l].y, lightAffectAmount * uLightColors[l].z, 0);
            }
        }
        
        fragColor = linearToSRGB(p1);
    }
`

let lightPositions = [
    new THREE.Vector2(-128, 128), 
    new THREE.Vector2(64, 128)
]

let lightScales = [
    new THREE.Vector2(512, 512), 
    new THREE.Vector2(512, 512)
]

let lightColors = [
    new THREE.Vector3(1,0.3,0), 
    new THREE.Vector3(0,1,0.3)
]
const rScale = new Phoenix.Vector2(1920, 1080)

const app: Phoenix.App = new Phoenix.App({
    zoom: 1/1,
    renderScale: rScale,
    clearColor: 0x5cdbfd,
    timescale: 1,
    shaderOverride: {
        vertexShader: Phoenix.DefaultVertexShader,
        fragmentShader: LitShader,
        uniforms: {
            uLightPositions: { value: lightPositions },
            uLightScales: { value: lightScales },
            uLightColors: { value: lightColors }
        }
    }
});


app.addScene("0", new ImpulseComponentExample.Scene())
app.addScene("1", new ManyObjectsExample.Scene())
app.addScene("2", new ControllableObjectExample.Scene())

app.loadScene("0")

let cur = 0;
let max = 2;

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

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() == "h") {
        cur = (cur + 1) % (max+1);
        app.loadScene(cur.toString());
    } else if (e.key.toLocaleLowerCase() == "r") {
        app.loadScene(cur.toString());
    }
})