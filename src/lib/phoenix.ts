import chalk from "chalk";
import * as pl from "planck";
import * as THREE from "three";

const defaultLog = window.console.log;
window.console.log = (text: string, successValue?: number, namespace?: string, ) => {
    const sval = successValue ? successValue : 0;
    let msg = "";
    switch (sval) {
        case -1:
            msg = chalk.bgRedBright(chalk.black("err"))
            break
        case 1:
            msg = chalk.greenBright("success")
            break
        default:
            msg = chalk.blueBright("info")
            break
    }

    const txtnumsp = 17 - msg.length;
    for (let i = 0; i < txtnumsp; i++) { msg = `${msg} `; }

    if (!namespace) {
        const stack = new Error().stack;
        if (stack?.includes("three.js")) {
            namespace = "three.js"
        } else if (stack?.includes("planck.js")) {
            namespace = "planck.js"
        }
    }
    

    let nstxt = chalk.hex("#efdf9c").bold(namespace);
    const numsp = 40 - nstxt.length!;
    for (let i = 0; i < numsp; i++) { nstxt += " "; }

    defaultLog(`${nstxt} ${chalk.italic(msg)} ${text}`);
}

window.console.error = (text: string) => {
    window.console.log(text, -1);
}

window.console.info = (text: string) => {
    window.console.log(text, 0)
}

// Shader variables
type shaderOps = {
    vertexShader: string,
    fragmentShader: string,
    uniforms: Record<string, {value: any}>
}

export const DefaultVertexShader = `
    out vec3 fragPosition;
    out vec2 fragTexCoord;
    out vec3 fragNormal;

    void main() {
        fragPosition = vec3(modelMatrix * vec4(position, 1.0));
        fragTexCoord = uv;
        fragNormal = normalize(normalMatrix * normal);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

export const DefaultFragmentShader = `
    in vec2 fragTexCoord;

    uniform sampler2D uTex;
    uniform float t;

    out vec4 fragColor;

    void main() {
        vec4 p1 = texture(uTex, fragTexCoord);
        fragColor = p1;
    }
`

export const ScreenspaceDefaultFragmentShader = `
    in vec2 fragTexCoord;

    uniform sampler2D uTex;
    uniform float t;

    out vec4 fragColor;

    vec4 linearToSRGB(vec4 value) {
        return vec4(mix(pow(value.rgb, vec3(1.0 / 2.2)), value.rgb * 12.92, lessThanEqual(value.rgb, vec3(0.0031308))), value.a);
    }

    void main() {
        vec4 p1 = texture(uTex, fragTexCoord);
        
        fragColor = linearToSRGB(p1);
    }
`

const defaultShader: shaderOps = {
    vertexShader: DefaultVertexShader,
    fragmentShader: DefaultFragmentShader,
    uniforms: {}
}

const defaultScreenShader: shaderOps = {
    vertexShader: DefaultVertexShader,
    fragmentShader: ScreenspaceDefaultFragmentShader,
    uniforms: {}
}

// Generic Functions
export class Vector2 {
    x: number;
    y: number;

    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public magnitude(): number {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    public normalize() {
        const mag: number = this.magnitude();
        this.x /= mag;
        this.y /= mag;
    }
}

export class Logger {
    public static error(m: string) {
        console.log(m, -1, "phoenix")
    }

    public static info(m: string) {
        console.log(m, 0, "phoenix")
    }

    public static success(m: string) {
        console.log(m, 1, "phoenix")
    }
}

export class Transformation {
    position: Vector2;
    rotation: number;
    scale: Vector2;

    constructor (position: Vector2, rotation: number, scale: Vector2) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }
}

// Components
export class Component {
    parent: GameObject | undefined = undefined;

    public onInitialized() {}
    public onDestroyed() {}

    public onUpdate() {}
    public onLateUpdate() {}
}

// Built-in Components

export class Transform extends Component {
    position: Vector2;
    rotation: number;
    scale: Vector2;
    constructor (postion: Vector2, rotation: number, scale: Vector2) {
        super()
        this.position = postion;
        this.rotation = rotation;
        this.scale = scale;
    }

    public asTransformation() {
        return new Transformation(this.position, this.rotation, this.scale);
    }
}

export class Sprite extends Component {
    src: string;

    texture: THREE.Texture | undefined = undefined;

    loadTexture(url: string): THREE.Texture {
        return new THREE.TextureLoader().load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
        })
    }

    constructor (src: string) {
        super()
        this.src = src;
        if (src != "CANVAS") this.texture = this.loadTexture(src);
    }
}

export class CanvasSprite extends Sprite {
    constructor (canvas: HTMLCanvasElement) {
        super("CANVAS");

        this.texture = new THREE.CanvasTexture(canvas);
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.magFilter = THREE.NearestFilter;
    }
}

type fontOps = {
    fontSize?: number,
    fontFamily?: string,
    fontColor?: string,
    backgroundColor?: string,
    padding?: number
}

const defaultFont: fontOps = {
    fontSize: 64,
    fontFamily: "serif",
    fontColor: "black",
    backgroundColor: "transparent",
    padding: 0
}

export class TextSprite extends Sprite {
    private canvas: HTMLCanvasElement;

    constructor (text: string, fontOverride?: fontOps) {
        super("CANVAS");
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");

        const font = {...defaultFont, ...fontOverride};

        ctx!.font = `${font.fontSize}px ${font.fontFamily}`;

        const textMeasurements = ctx!.measureText(text);

        canvas.width = textMeasurements.width + (font.padding! * 2);
        canvas.height = font.fontSize! + (font.padding! * 2);

        ctx!.font = `${font.fontSize}px ${font.fontFamily}`;
        
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        ctx!.fillStyle = font.backgroundColor!;
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.fillStyle = font.fontColor!;
        ctx!.fillText(text, font.padding!, font.padding! + font.fontSize!);

        this.canvas = canvas;
        
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.magFilter = THREE.NearestFilter;
    }
}

export type Animation = {
    frames: Array<string>
    name: string
};

export class AnimatedSprite extends Sprite {
    frameTextures: Array<THREE.Texture> = [];
    t: number = 0;
    rate: number = 60;

    constructor(frames: Array<string>, rate?: number) {
        if (frames.length == 0) { super("CANVAS"); return; }
        super(frames[0]!);

        this.rate = rate ? rate : 15
        
        for (const f of frames) {
            this.frameTextures.push(this.loadTexture(f));
        }
    }

    override onUpdate () {
        // Update sprite
        this.texture = this.frameTextures[Math.floor(this.t / this.rate)  % this.frameTextures.length];
        this.t++;
    }
}

export class Renderer extends Component {
    transform: Transform | undefined = undefined;
    sprite: Sprite | undefined = undefined;

    mesh: THREE.Mesh | undefined = undefined;

    shader: shaderOps = defaultShader;

    depth: number;

    constructor (depth: number, shaderOverride?: shaderOps) {
        super();
        this.depth = depth;
        if (shaderOverride) this.shader = shaderOverride;
    }

    public override onInitialized(): void {
        if (!this.parent) return
        this.transform = this.parent.getComponent(Transform);

        // Search for any component derived from sprite
        this.sprite = this.sprite = this.parent.getComponent(Sprite);

        if (!this.sprite) return

        if (this.sprite instanceof TextSprite) console.log(this.sprite.texture?.height)

        const texture = this.sprite.texture;

        const geo = new THREE.PlaneGeometry(this.transform?.scale.x, this.transform?.scale.y)

        this.mesh = new THREE.Mesh(
            geo,
            new THREE.ShaderMaterial({
                glslVersion: THREE.GLSL3,
                vertexShader: this.shader.vertexShader,
                fragmentShader: this.shader.fragmentShader,
                uniforms: {
                    uTex: { value: texture},
                    ...this.shader.uniforms
                },
                transparent: true
            })
        )

        this.parent.app.renderScene.add(this.mesh)
    }

    public override onDestroyed(): void {
        if (!this.parent || !this.mesh) return
        this.parent.app.renderScene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }

    public override onLateUpdate(): void {
        if (!this.transform || !this.mesh || !this.parent) return
        this.mesh.position.set(
            this.transform.position.x, 
            this.transform.position.y,
            this.depth
        )

        const mat = (this.mesh.material as THREE.ShaderMaterial);
        if (this.sprite?.texture !== mat.uniforms.uTex!.value) {
            mat.uniforms.uTex!.value = this.sprite!.texture
        }

        this.mesh.rotation.set(
            0, 0,
            this.transform.rotation * (Math.PI / 180)
        )
    }
}

export class BoxCollider extends Component {
    scale: Vector2;

    constructor (scale: Vector2) {
        super();
        this.scale = scale;
    }
}

export class CircleCollider extends Component {
    radius: number;
    constructor (radius: number) {
        super();
        this.radius = radius;
    }
}

export class Rigidbody extends Component {
    density: number;
    friction: number;

    isStatic: boolean;

    public body: pl.Body | undefined = undefined;

    transform: Transform | undefined = undefined;

    constructor (density: number, friction: number, isStatic: boolean) {
        super();
        this.density = density;
        this.friction = friction;
        this.isStatic = isStatic;
    }

    public override onInitialized(): void {
        this.transform = this.parent?.getComponent(Transform);
    }

    public override onUpdate(): void {
        if (!this.transform || !this.body) return
        this.transform.position.x = this.body.getPosition().x * 32
        this.transform.position.y = this.body.getPosition().y * 32
        this.transform.rotation = this.body.getAngle() / (Math.PI / 180);
    }

    public override onDestroyed(): void {
        if (!this.parent || !this.body) return
        this.parent.app.plWorld.destroyBody(this.body);
    }
}

export class Camera extends Component {
    rendererCamera: THREE.Camera | undefined = undefined;
    transform: Transform | undefined = undefined;

    public override onInitialized(): void {
        this.rendererCamera = this.parent?.app.camera;
        this.transform = this.parent?.getComponent(Transform);
    }

    public override onUpdate(): void {
        if (!this.transform || !this.rendererCamera) return
        this.rendererCamera.position.setX(this.transform.position.x);
        this.rendererCamera.position.setY(this.transform.position.y);
        this.rendererCamera.setRotationFromEuler(new THREE.Euler(0, 0, this.transform.rotation * (Math.PI / 180)))
    }
} 

// Game Objects

export class GameObject {
    components: Array<Component> = []
    app: App;

    constructor (app: App) {
        this.app = app;
    }

    public onInitialized() {
        for (const c of this.components) {
            c.onInitialized();
        }

        const rb = this.getComponent(Rigidbody);
        const tf = this.getComponent(Transform);
        if (!tf) return
        const body = this.app.plWorld.createBody({
            type: (rb && !rb.isStatic) ? "dynamic" : "static",
            position: {x: tf.position.x / 32, y: tf.position.y / 32},
            angle: tf.rotation * (Math.PI / 180),
            
        })

        const boxColliders = this.getComponents(BoxCollider);
        for (const b of boxColliders) {
            body.createFixture({
                shape: pl.Box(b.scale.x/64, b.scale.y/64),
                ...(rb && {density: rb.density, friction: rb.friction})
            })
        }
        const circleColliders = this.getComponents(CircleCollider);
        for (const c of circleColliders) {
            body.createFixture({
                shape: pl.Circle(c.radius / 32),
                ...(rb && {density: rb.density, friction: rb.friction})
            })
        }

        if (rb) rb.body = body;
    }
    public onDestroyed() {
        for (const c of this.components) {
            c.onDestroyed();
        }
    }

    public onUpdate() {
        for (const c of this.components) {
            c.onUpdate();
        }
    }
    public onLateUpdate() {
        for (const c of this.components) {
            c.onLateUpdate();
        }
    }

    public getComponent<T>(k: new (...args: any[]) => T): T | undefined {
        for (const c of this.components) {
            if (c instanceof k) {
                return c as T;
            }
        }
    }

    public getComponents<T>(k: new (...args: any[]) => T): Array<T> {
        const cs: Array<T> = [];
        for (const c of this.components) {
            if (c instanceof k) {
                cs.push(c);
            }
        }
        return cs;
    }
}

// Engine Functions

export class Scene {
    public onLoad(app: App): void {}
}

type ApplicationArguments = {
    zoom?: number,
    renderScale?: Vector2,
    shaderOverride?: shaderOps,
    clearColor?: number,
    timescale?: number
}

type DrawRequest = {
    depth: number,
    src: HTMLImageElement,
    transform: Transformation
}

export class App {

    args: ApplicationArguments;
    drawBuffer: Array<DrawRequest> = [];
    objects: Array<GameObject> = [];
    ctx: CanvasRenderingContext2D | null = null;
    canvas: HTMLCanvasElement | null = null;
    
    eventLoopIntervalID: any = null;

    objectRemovalBuffer: Array<GameObject> = [];
    objectAdditionBuffer: Array<GameObject> = [];

    plWorld: pl.World;

    isTicking: boolean = false;

    scenes: Record<string, Scene> = {};

    curScene: string = "";

    renderer: THREE.WebGLRenderer;
    renderScene: THREE.Scene;
    camera: THREE.OrthographicCamera;

    screenSpaceScene: THREE.Scene;
    screenSpaceCamera: THREE.OrthographicCamera;
    screenSpaceShader: THREE.ShaderMaterial;

    renderTarget: THREE.WebGLRenderTarget;

    renderScale: Vector2 = new Vector2(2560, 1440);

    public deltaTime: number = 0;

    private oldTimestamp: number = 0;

    private keys: Record<string, boolean> = {};
    private mousePos = new Vector2(0, 0);

    frameIntervalCallbacks: Array<() => void> = [];

    constructor (args: ApplicationArguments) {

        const defaultArgs: ApplicationArguments = {
            zoom: 1,
            renderScale: new Vector2(1920, 1080),
            shaderOverride: defaultScreenShader,
            clearColor: THREE.Color.NAMES.black,
            timescale: 1
        };

        this.args = {...defaultArgs, ...args} as ApplicationArguments;

        // Physics
        this.plWorld = new pl.World({gravity: {x:0, y:-10}});
        Logger.info("Physics world loaded")


        // Rendering
        const LOW_W = this.args.renderScale!.x; const LOW_H = this.args.renderScale!.y
        this.renderTarget = new THREE.WebGLRenderTarget(LOW_W, LOW_H, {
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter,
            colorSpace: THREE.LinearSRGBColorSpace
        })
        this.renderTarget.depthTexture = new THREE.DepthTexture(LOW_W, LOW_H);
        this.renderTarget.depthTexture.type = THREE.UnsignedShortType;
        Logger.info("Render target loaded")

        // Rendering objects
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        Logger.info("Renderer loaded")

        this.renderScene = new THREE.Scene();

        this.camera = new THREE.OrthographicCamera(
            -LOW_W / 2, LOW_W / 2,
            LOW_H / 2, -LOW_H / 2,
            0.1, 1000
        );
        this.camera.position.z = 10;

        // Scaling up to screen
        this.screenSpaceCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.renderer.setClearColor(this.args.clearColor!);

        this.screenSpaceScene = new THREE.Scene;

        this.screenSpaceShader = new THREE.ShaderMaterial({ 
                glslVersion: THREE.GLSL3,
                uniforms: {
                    uTex: { value: this.renderTarget.texture },
                    uDepth: { value: this.renderTarget.depthTexture },
                    ...this.args.shaderOverride?.uniforms
                },
                vertexShader: this.args.shaderOverride ? this.args.shaderOverride.vertexShader : defaultShader.vertexShader,
                fragmentShader: this.args.shaderOverride ? this.args.shaderOverride.fragmentShader : defaultShader.fragmentShader
            })

        this.screenSpaceScene.add(new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),

            // Screen-space shader injection
            this.screenSpaceShader
        ))

        // Window resize handler
        this.resize();
        window.addEventListener("resize", () => {
            this.resize();
        })
        Logger.info("Resize handler loaded")

        Logger.success("Loading success")
    }

    private resize() {
        const xScaleFactor = Math.ceil(window.innerWidth / this.renderScale.x);
        const yScaleFactor = Math.ceil(window.innerHeight / this.renderScale.y);

        const w = this.renderScale.x * xScaleFactor; 
        const h = this.renderScale.y * yScaleFactor;
        this.renderer.setSize(w, h);

        this.camera.left = -w / 2 * this.args.zoom!;
        this.camera.right = w / 2 * this.args.zoom!;

        this.camera.top = h / 2 * this.args.zoom!;
        this.camera.bottom = -h / 2 * this.args.zoom!;
        this.camera.updateProjectionMatrix();
    }

    public getKey(k: string) {
        return this.keys[k.toLowerCase()] as boolean
    }

    public getMousePos() {
        return this.mousePos;
    }

    public start() {
        if (this.renderer == null) {
            Logger.error("Failed to start, rendering context null");
            return;
        }

        this.camera.position.setX(0);
        this.camera.position.setY(0);

        // Register input event handlers
        document.addEventListener("keydown", (e) => {
            this.keys[e.key.toLowerCase() as string] = true
        });

        document.addEventListener("keyup", (e) => {
            this.keys[e.key.toLowerCase() as string] = false
        });

        document.addEventListener("mousemove", (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        })

        // Begin measuring deltaTime
        this.oldTimestamp = Date.now();

        // Save running status
        this.isTicking = true;

        // Begin frame loop
        this.renderer.setAnimationLoop(() => {
            this.plWorld.step(this.deltaTime / 1000, 10, 6);
            this.update();

            for (const c of this.frameIntervalCallbacks) {
                c();
            }

            this.renderer.setRenderTarget(this.renderTarget);
            this.renderer.render(this.renderScene, this.camera);
            
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.screenSpaceScene, this.screenSpaceCamera);

            this.deltaTime = (Date.now() - this.oldTimestamp) * this.args.timescale!;
            this.oldTimestamp = Date.now();
        })
    }

    public addFrameIntervalCallback(c: () => void) {
        this.frameIntervalCallbacks.push(c);
    }

    public stop() {
        if (this.isTicking == false) {
            Logger.error("Failed to stop, application not running")
            return;
        }

        this.isTicking = false;
        this.renderer.setAnimationLoop(null);
    }

    private update() {
        for (const o of this.objects) {
            o.onUpdate()
        }

        for (const o of this.objects) {
            o.onLateUpdate()
        }

        for (const o of this.objectAdditionBuffer) {
            this.objects.push(o);
            o.onInitialized();
        }

        for (const o of this.objectRemovalBuffer) {
            o.onDestroyed();
            this.objects.splice(this.objects.indexOf(o), 1);
        }

        this.objectAdditionBuffer.length = 0;
        this.objectRemovalBuffer.length = 0;
    }

    public addObject(object: GameObject) {
        this.objectAdditionBuffer.push(object);
    }

    public removeObject(object: GameObject) {
        if (this.isTicking) {
            this.objectRemovalBuffer.push(object);
        } else {
            object.onDestroyed();
            this.objects.splice(this.objects.indexOf(object), 1);
        }
    }

    public createObject(...components: Component[]): GameObject {
        const obj = new GameObject(this);
        obj.app = this;
        for (const c of components) {
            c.parent = obj;
            obj.components.push(c);
        }
        return obj;
    }

    public addScene(name: string, scene: Scene) {
        this.scenes[name] = scene;
    }

    public loadScene(name: string) {
        if (!Object.keys(this.scenes).includes(name)) {
            Logger.error(`Scene, ${name} not found`)
            return
        }

        Logger.info(`Loading scene ${name}`)

        this.curScene = name;

        if (this.isTicking) {
            this.stop();
        }

        for (const o of this.objects) {
            o.onDestroyed();
        }
        this.objects.length = 0;

        this.scenes[name]!.onLoad(this);

        this.start();
    }

    public getScene() {
        return this.curScene;
    }
}
