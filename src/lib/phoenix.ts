import chalk from "chalk";
import * as pl from "planck";

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
    texture: HTMLImageElement;

    constructor (src: string) {
        super()
        const img = new window.Image();
        img.src = src;
        this.texture = img;
    }
}

export class Renderer extends Component {
    transform: Transform | undefined = undefined;
    sprite: Sprite | undefined = undefined;

    depth: number;

    constructor (depth: number) {
        super();
        this.depth = depth;
    }

    public override onInitialized(): void {
        if (!this.parent) return
        this.transform = this.parent.getComponent(Transform);
        this.sprite = this.parent.getComponent(Sprite);
    }

    public override onUpdate(): void {
        this.parent?.app.drawBuffer.push({
            src: this.sprite?.texture,
            transform: this.transform?.asTransformation(),
            depth: this.depth
        } as DrawRequest);
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
        this.transform.position.x = this.body.getPosition().x * 32 - this.transform.scale.x / 2
        this.transform.position.y = this.body.getPosition().y * 32 - this.transform.scale.y / 2
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
            position: {x: (tf.position.x + tf.scale.x / 2)/32, y: (tf.position.y + tf.scale.y / 2)/32},
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
    downscaleFactor?: number,
    canvasSelector?: string
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

    constructor (args: ApplicationArguments = {
        targetFramerate: 60,
        downscaleFactor: 1,
        canvasSelector: "canvas"
    }) {
        this.args = args

        this.plWorld = new pl.World({gravity: {x:0, y:10}});

        // Find <canvas> and get context
        this.canvas = document.querySelector(this.args.canvasSelector!) as HTMLCanvasElement;
        this.resizeCanvas();
        
        if (!this.canvas) {
            Logger.error("Canvas not found");
        } else {
            this.ctx = this.canvas.getContext("2d");
        }

        Logger.success("Application initialized successfully")
    }

    public start() {
        if (this.ctx == null) {
            Logger.error("Failed to start, rendering context null");
            return;
        }

        this.isTicking = true;

        this.eventLoopIntervalID = setInterval(() => {
            this.plWorld.step(1/this.args.targetFramerate!, 10, 6);
            this.resizeCanvas();

            for (const o of this.objects) {
                o.onUpdate()
            }

            for (const o of this.objects) {
                o.onLateUpdate()
            }

            this.draw();

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
        }, 1000/this.args.targetFramerate!)
    }

    public stop() {
        if (this.eventLoopIntervalID == null) {
            Logger.error("Failed to stop, application not running")
            return;
        }

        this.isTicking = false;
        clearInterval(this.eventLoopIntervalID);
    }

    private resizeCanvas() {
        this.canvas!.width = document.body.clientWidth / this.args.downscaleFactor!;
        this.canvas!.height = document.body.clientHeight / this.args.downscaleFactor!;
    }

    public draw() {
        this.ctx!.imageSmoothingEnabled = false;
        this.ctx!.fillStyle = "#9aafef";
        this.ctx!.fillRect(0, 0, this.canvas!.width, this.canvas!.height)
        const sorted = this.drawBuffer.sort((a, b) => b.depth - a.depth);
        for (const call of sorted) {
            const t = call.transform;
            const cx = call.transform.position.x + t.scale.x / 2
            const cy = call.transform.position.y + t.scale.y / 2

            this.ctx!.save()
            this.ctx!.scale(call.transform.scale.x / Math.abs(call.transform.scale.x), call.transform.scale.y / Math.abs(call.transform.scale.y))
            this.ctx!.translate(cx, cy)
            this.ctx!.rotate(call.transform.rotation * (Math.PI / 180))

            this.ctx!.drawImage(
                call.src, 
                -(call.transform.scale.x / 2), 
                -(call.transform.scale.y / 2), 
                call.transform.scale.x, call.transform.scale.y)

            this.ctx!.restore();
        }
        this.drawBuffer.length = 0;
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

        this.ctx!.fillStyle = "#9aafef";
        this.ctx!.fillRect(0, 0, this.canvas!.width, this.canvas!.height)

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