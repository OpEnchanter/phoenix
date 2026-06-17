import chalk from "chalk";
import * as pl from "planck";
import * as THREE from "three";
import type { Vector } from "three/examples/jsm/Addons.js";

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
        console.log(`[${chalk.red("Error")}] ${m}`)
    }

    public static info(m: string) {
        console.log(`[${chalk.blue("Info")}] ${m}`)
    }

    public static success(m: string) {
        console.log(`[${chalk.blue("Success")}] ${m}`)
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

    constructor (src: string) {
        super()
        this.src = src;
    }
}

export class Renderer extends Component {
    transform: Transform | undefined = undefined;
    sprite: Sprite | undefined = undefined;

    mesh: THREE.Mesh | undefined = undefined;

    depth: number;

    constructor (depth: number) {
        super();
        this.depth = depth;
    }

    loadTexture(url: string): THREE.Texture {
        return new THREE.TextureLoader().load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
        })
    }

    public override onInitialized(): void {
        if (!this.parent) return
        this.transform = this.parent.getComponent(Transform);
        this.sprite = this.parent.getComponent(Sprite);

        if (!this.sprite) return

        const texture = this.loadTexture(this.sprite.src);

        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(this.transform?.scale.x, this.transform?.scale.y),
            new THREE.MeshBasicMaterial({
                map: texture,
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
            this.transform.position.y, 0
        )

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

        const boxColliders = this.getComponents(BoxCollider);

        const rb = this.getComponent(Rigidbody);
        const tf = this.getComponent(Transform);
        if (!tf) return
        const body = this.app.plWorld.createBody({
            type: (rb && !rb.isStatic) ? "dynamic" : "static",
            position: {x: tf.position.x / 32, y: tf.position.y / 32},
            angle: tf.rotation * (Math.PI / 180),
            
        })

        for (const b of boxColliders) {
            body.createFixture({
                shape: pl.Box(b.scale.x/64, b.scale.y/64),
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
    targetFramerate?: number,
    zoom?: number,
    renderScale?: Vector2
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

    renderTarget: THREE.WebGLRenderTarget;

    renderScale: Vector2 = new Vector2(2560, 1440)

    constructor (args: ApplicationArguments = {
        targetFramerate: 60,
        zoom: 1,
        renderScale: new Vector2(1920, 1080)
    }) {
        this.args = args

        // Physics
        this.plWorld = new pl.World({gravity: {x:0, y:-10}});


        // Rendering
        const LOW_W = this.args.renderScale!.x; const LOW_H = this.args.renderScale!.y
        this.renderTarget = new THREE.WebGLRenderTarget(LOW_W, LOW_H, {
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter
        })

        // Rendering objects
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.renderScene = new THREE.Scene();

        this.camera = new THREE.OrthographicCamera(
            -LOW_W / 2, LOW_W / 2,
            LOW_H / 2, -LOW_H / 2,
            0.1, 1000
        );
        this.camera.position.z = 10;

        // Scaling up to screen
        this.screenSpaceCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.renderer.setClearColor(THREE.Color.NAMES.blue);

        this.screenSpaceScene = new THREE.Scene;
        this.screenSpaceScene.add(new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.MeshBasicMaterial({ map: this.renderTarget.texture })
        ))

        this.resize();
        window.addEventListener("resize", () => {
            this.resize();
        })

        Logger.success("Application initialized successfully")
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

    public start() {
        if (this.renderer == null) {
            Logger.error("Failed to start, rendering context null");
            return;
        }

        this.isTicking = true;

        this.renderer.setAnimationLoop(() => {
            this.plWorld.step(1/this.args.targetFramerate!, 10, 6);
            this.update();

            this.renderer.setRenderTarget(this.renderTarget);
            this.renderer.render(this.renderScene, this.camera);
            
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.screenSpaceScene, this.screenSpaceCamera);
        })
    }

    public stop() {
        if (this.eventLoopIntervalID == null) {
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

        Logger.success(`Loading scene, ${name}`)

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