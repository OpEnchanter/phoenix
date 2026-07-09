import * as Phoenix from "./lib/phoenix.ts";
import * as ImpulseComponentExample from "./ImpulseComponentExample.ts";
import * as ManyObjectsExample from "./ManyObjectsExample.ts";
import * as ControllableObjectExample from "./ControllableObjectExample.ts";

import * as THREE from "three";

const LitShader = `
    in vec2 fragTexCoord;

    uniform sampler2D uTex;
    uniform sampler2D uDepth;
    uniform vec2 uLightPos;
    uniform vec2 uLightScale;
    uniform float t;

    out vec4 fragColor;

    vec4 linearToSRGB(vec4 value) {
        return vec4(mix(pow(value.rgb, vec3(1.0 / 2.2)), value.rgb * 12.92, lessThanEqual(value.rgb, vec3(0.0031308))), value.a);
    }

    void main() {
        vec4 p1 = texture(uTex, fragTexCoord);
        vec2 lightRay = uLightPos - fragTexCoord;
        vec2 lightRaySegment = vec2(lightRay.x / 1024.0, lightRay.y / 1024.0);
        bool isOccluded = false;

        for (int i = 0; i < 1024; i++) {
            if (texture(uDepth, fragTexCoord + vec2(lightRaySegment.x * float(i), lightRaySegment.y * float(i))).r < 0.1) {
                isOccluded = true;
                break;
            }
        }

        if (!isOccluded) {
            float lightAffectAmount = 1.0 - min(1.0, (length(lightRay)*5.0));
            p1 += vec4(lightAffectAmount, lightAffectAmount, lightAffectAmount, 0);
        }
        
        fragColor = linearToSRGB(p1);
    }
`

let lightPos = [-128, 128]
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
            uLightPos: { value: lightPos },
            uLightScale: { value: [0.1, 0.1] }
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
    const p = new THREE.Vector3(lightPos[0], lightPos[1], 0);
    p.project(app.camera);

    const x = (p.x + 1) / 2
    const y = (p.y + 1) / 2

    app.screenSpaceShader.uniforms.uLightPos!.value = [x, y]
})

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() == "h") {
        cur = (cur + 1) % (max+1);
        app.loadScene(cur.toString());
    } else if (e.key.toLocaleLowerCase() == "r") {
        app.loadScene(cur.toString());
    }
})