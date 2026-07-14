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

export const DefaultInstancedVertexShader = `
    out vec3 fragPosition;
    out vec2 fragTexCoord;
    out vec3 fragNormal;

    void main() {
        vec4 transformedPosition = instanceMatrix * vec4(position, 1.0);
        fragPosition = vec3(modelMatrix * transformedPosition);
        fragTexCoord = uv;
        fragNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * transformedPosition;
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

export class Matrix {
    data: number[][];

    constructor (data: number[][]) {
        this.data = data;
    }

    public multiply(other: Matrix) {
        if (!this.data[0]) return;
        const matrixARows: number = this.data.length;
        const matrixAColumns: number = this.data[0].length;

        if (!other.data[0]) return;
        const matrixBRows: number = other.data.length;
        const matrixBColumns: number = other.data[0].length;

        if (matrixAColumns != matrixBRows) {
            console.log("Matrix multiplication failed: matrices don't match");
            return;
        }

        const multiplied: number[][] = [];

        for (let r = 0; r < matrixARows; r++) {
            const row: number[] = []
            for (let c = 0; c < matrixBColumns; c++) {
                let num = 0;

                for (let x = 0; x < matrixAColumns; x++) {
                    num += this.data[r]![x]! * other.data[x]![c]!
                }

                row.push(num);
            }
            multiplied.push(row)
        }

        return new Matrix(multiplied);
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

    public onCollisionEnter() {}
    public onCollisionExit() {}
    public onCollisionStay() {}

    public onTriggerEnter() {}
    public onTriggerExit() {}
    public onTriggerStay() {}
}

// Built-in Components

export class Transform extends Component {

    // Local space transformation
    position: Vector2;
    rotation: number;
    scale: Vector2;

    // Global space transformation
    globalPosition: Vector2;
    globalRotation: number;
    globalScale: Vector2;

    constructor (postion: Vector2, rotation: number, scale: Vector2) {
        super()
        this.position = postion;
        this.rotation = rotation;
        this.scale = scale;

        this.globalPosition = new Vector2(this.position.x, this.position.y);
        this.globalRotation = this.rotation;
        this.globalScale = new Vector2(this.scale.x, this.scale.y);
    }

    public applyTransformation() {
        // Update the global position to the local position
        // Then later, (if applicable) apply parent's transformation, rotation and scale
        this.globalPosition.x = this.position.x;
        this.globalPosition.y = this.position.y;

        this.globalRotation = this.rotation;
        
        this.globalScale.x = this.scale.x;
        this.globalScale.y = this.scale.y;

        if (this.parent && this.parent!.parent && this.parent!.parent.getComponent(Transform)) {
            const tf = this.parent!.parent.getComponent(Transform)
            const parentTransformation = tf?.asTransformation();

            // Rotate around the origin of the parent based on the parent's rotation
            // and apply parent's position
            const toPosition = new Matrix([
                [1, 0, parentTransformation!.position.x],
                [0, 1, parentTransformation!.position.y],
                [0, 0, 1]
            ])

            const rotation = new Matrix([
                [Math.cos(parentTransformation!.rotation * (Math.PI / 180)), -Math.sin(parentTransformation!.rotation * (Math.PI / 180)), 0],
                [Math.sin(parentTransformation!.rotation * (Math.PI / 180)), Math.cos(parentTransformation!.rotation * (Math.PI / 180)), 0],
                [0, 0, 1]
            ])

            const pos = new Matrix([
                [this.position.x],
                [this.position.y],
                [1]
            ])

            const transformation = toPosition.multiply(rotation)
            const rotated = transformation?.multiply(pos)

            this.globalPosition.x = rotated!.data[0]![0]!
            this.globalPosition.y = rotated!.data[1]![0]!

            // Rotate by the parent's rotation (previous step only manipulates 2D position not object rotation)
            this.globalRotation += parentTransformation!.rotation;
        }
    }

    public override onInitialized(): void {
        this.applyTransformation();

        // If the object does not have a parent it's globalPosition will be equal to its localPosition (position)
        // Example: The scene root node will have no parent and therefore will use it's localPosition as it's globalPosition
    }

    public override onUpdate(): void {
        this.applyTransformation();
    }

    public asTransformation() {
        return new Transformation(new Vector2(this.globalPosition.x, this.globalPosition.y), this.globalRotation, this.globalScale);
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
    frameTextures: Record<string, Array<THREE.Texture>> = {};
    t: number = 0;
    rate: number = 60;

    currentAnimation: string = "";

    constructor(animations: Record<string, Array<string>>, rate?: number) {
        if (frames.length == 0) { super("CANVAS"); return; }
        super(animations[Object.keys(animations)[0]!]![0]!);

        this.currentAnimation = Object.keys(animations)[0]!;

        this.rate = rate ?? 15
        
        for (const animName of Object.keys(animations)) {
            this.frameTextures[animName] = [];
            for (const f of animations[animName]!) {
                this.frameTextures[animName].push(this.loadTexture(f));
            }
        }
    }

    public setAnimation(name: string) {
        this.currentAnimation = Object.keys(this.frameTextures)[0]!.includes(name) ? name : this.currentAnimation;
    }

    override onUpdate () {
        // Update sprite
        this.texture = this.frameTextures[this.currentAnimation]![Math.floor(this.t / this.rate) % this.frameTextures[this.currentAnimation]!.length];
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
        this.sprite = this.parent.getComponent(Sprite);

        if (!this.sprite) return

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
        const transformation = this.transform.asTransformation();
        this.mesh.position.set(
            transformation.position.x, 
            transformation.position.y,
            this.depth
        )

        const mat = (this.mesh.material as THREE.ShaderMaterial);
        if (this.sprite?.texture !== mat.uniforms.uTex!.value) {
            mat.uniforms.uTex!.value = this.sprite!.texture
        }

        this.mesh.rotation.set(
            0, 0,
            transformation.rotation * (Math.PI / 180)
        )
    }
}

export class InstancedRenderer extends Component {

    mesh: THREE.InstancedMesh | undefined = undefined;
    meshInstanceIds: number[] = [];
    positions: Vector2[] = [];

    transform: Transform | undefined = undefined;
    sprite: Sprite | undefined = undefined;

    count: number;
    scale: Vector2;

    constructor(positions: Array<Vector2>, scale: Vector2) {
        super()

        this.positions = positions;
        this.count = positions.length;
        this.scale = scale;
    }

    public override onInitialized(): void {
        this.transform = this.parent?.getComponent(Transform);
        this.sprite = this.parent?.getComponent(Sprite);
        if (!this.transform || !this.sprite) return;

        // Create BatchedMesh with texture and count of objects
        const geo = new THREE.PlaneGeometry(this.scale.x, this.scale.y);
        const texture = this.sprite.texture;
        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: DefaultInstancedVertexShader,
            fragmentShader: defaultShader.fragmentShader,
            uniforms: {
                uTex: { value: texture}
            },
            transparent: true
        })

        this.mesh = new THREE.InstancedMesh(geo, material, this.count);

        for (let c = 0; c < this.count; c++) {
            const position = this.positions[c]!

            const transformationMatrix = new THREE.Matrix4();
            transformationMatrix.compose(
                new THREE.Vector3(
                    position.x + this.transform.position.x,
                    position.y + this.transform.position.y,
                    2
                ),
                new THREE.Quaternion(),
                new THREE.Vector3( 1, 1, 1 )
            )

            this.mesh.setMatrixAt(c, transformationMatrix);
        }

        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

        this.parent!.app.renderScene.add(this.mesh);
    }

    public override onDestroyed(): void {
        this.parent?.app.renderScene.remove(this.mesh as THREE.Mesh);
        this.mesh?.geometry.dispose();
        (this.mesh?.material as THREE.Material).dispose();
        this.mesh?.dispose();
    }
}

export class BoxCollider extends Component {
    scale: Vector2;
    isTrigger: boolean;
    body: pl.Body | undefined;
    offset: Vector2;
    constructor (scale: Vector2, isTrigger?: boolean, offset?: Vector2) {
        super();
        this.scale = scale;
        this.isTrigger = isTrigger ? isTrigger : false;
        this.offset = offset ? offset : new Vector2(0,0);
    }

    public override onUpdate(): void {
        for (let edge = this.body?.getContactList(); edge; edge = edge.next) {
            const contact = edge.contact;

            if (contact.isTouching()) {
                if (this.isTrigger) {
                    this.parent!.isTriggered = true;
                } else {
                    this.parent!.isColliding = true;
                }
            }
        }
    }
}

export class CircleCollider extends Component {
    radius: number;
    isTrigger: boolean;
    body: pl.Body | undefined;
    offset: Vector2;
    constructor (radius: number, isTrigger?: boolean, offset?: Vector2) {
        super();
        this.radius = radius;
        this.isTrigger = isTrigger ? isTrigger : false;
        this.offset = offset ? offset : new Vector2(0,0);
    }

    public override onUpdate(): void {
        for (let edge = this.body?.getContactList(); edge; edge = edge.next) {
            const contact = edge.contact;

            if (contact.isTouching()) {
                if (this.isTrigger) {
                    this.parent!.isTriggered = true;
                } else {
                    this.parent!.isColliding = true;
                }
            }
        }
    }
}

export class Rigidbody extends Component {
    density: number;
    friction: number;

    isStatic: boolean;

    lockRotation: boolean;

    public body: pl.Body | undefined = undefined;

    transform: Transform | undefined = undefined;

    constructor (density: number, friction: number, isStatic: boolean, lockRotation?: boolean) {
        super();
        this.density = density;
        this.friction = friction;
        this.isStatic = isStatic;
        this.lockRotation = lockRotation ? lockRotation : false;
    }

    public override onInitialized(): void {
        this.transform = this.parent?.getComponent(Transform);
    }

    public override onUpdate(): void {
        if (!this.transform || !this.body) return
        if (this.isStatic) {
            this.body.setPosition({
                x: this.transform.globalPosition.x / 32,
                y: this.transform.globalPosition.y / 32
            })

            this.body.setAngle(this.transform.globalRotation * (Math.PI / 180))
        }
        if (!this.isStatic) {
            this.transform.globalPosition.x = this.body.getPosition().x * 32
            this.transform.globalPosition.y = this.body.getPosition().y * 32
            this.transform.globalRotation = this.body.getAngle() / (Math.PI / 180);
        }
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
        this.rendererCamera.position.setX(this.transform.globalPosition.x);
        this.rendererCamera.position.setY(this.transform.globalPosition.y);
        this.rendererCamera.setRotationFromEuler(new THREE.Euler(0, 0, this.transform.globalRotation * (Math.PI / 180)))
    }
} 

export class ParticleSystem extends Component {

    mesh: THREE.InstancedMesh | undefined = undefined;
    meshInstanceIds: number[] = [];
    positions: Vector2[] = [];
    velocities: Vector2[] = [];

    transform: Transform | undefined = undefined;

    spriteUrl: string;
    count: number;
    scale: Vector2;

    loadTexture(url: string): THREE.Texture {
        return new THREE.TextureLoader().load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
        })
    }

    constructor(particleSprite: string, count: number, scale: Vector2) {
        super()

        this.spriteUrl = particleSprite;
        this.count = count;
        this.scale = scale;
    }

    public override onInitialized(): void {
        this.transform = this.parent?.getComponent(Transform);
        if (!this.transform) return;

        // Create BatchedMesh with texture and count of objects
        const geo = new THREE.PlaneGeometry(this.scale.x, this.scale.y);
        const texture = this.loadTexture(this.spriteUrl);
        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: DefaultInstancedVertexShader,
            fragmentShader: defaultShader.fragmentShader,
            uniforms: {
                uTex: { value: texture}
            },
            transparent: true
        })

        this.mesh = new THREE.InstancedMesh(geo, material, this.count);

        for (let c = 0; c < this.count; c++) {
            const position = new Vector2(
                this.transform.globalPosition.x, 
                this.transform.globalPosition.y
            );

            const velocity = new Vector2(
                Math.random()*12 - 6, Math.random()*12
            );

            this.positions.push(position);
            this.velocities.push(velocity);

            const transformationMatrix = new THREE.Matrix4();
            transformationMatrix.compose(
                new THREE.Vector3(
                    position.x,
                    position.y,
                    2
                ),
                new THREE.Quaternion(),
                new THREE.Vector3( 1, 1, 1 )
            )

            this.mesh.setMatrixAt(c, transformationMatrix);
        }

        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

        this.parent!.app.renderScene.add(this.mesh);
    }

    public override onUpdate(): void {
        for (let i = 0; i < this.positions.length; i++) {
            const position = this.positions[i]!;
            const velocity = this.velocities[i]!;

            this.positions[i]!.x += velocity.x * 16/this.parent?.app.deltaTime!;
            this.positions[i]!.y += velocity.y * 16/this.parent?.app.deltaTime!;

            this.velocities[i]!.y -= 0.03 * this.parent?.app.deltaTime!;
            this.velocities[i]!.y *= 0.99;

            const transformationMatrix = new THREE.Matrix4();
            transformationMatrix.compose(
                new THREE.Vector3(
                    position.x,
                    position.y,
                    0
                ),
                new THREE.Quaternion(),
                new THREE.Vector3( 1, 1, 1 )
            )

            this.mesh?.setMatrixAt(i, transformationMatrix);
        }

        this.mesh!.instanceMatrix.needsUpdate = true;
    }

    public override onDestroyed(): void {
        this.parent?.app.renderScene.remove(this.mesh as THREE.Mesh);
        this.mesh?.geometry.dispose();
        (this.mesh?.material as THREE.Material).dispose();
        this.mesh?.dispose();
    }
}

export class UIRenderer extends Component {
    depth: number;

    transform: Transform | undefined;
    sprite: Sprite | undefined;

    shader: shaderOps = defaultShader;

    mesh: THREE.Mesh | undefined;

    constructor(depth: number, shaderOverride?: shaderOps) {
        super();
        this.depth = depth;
        this.shader = {
            fragmentShader: ScreenspaceDefaultFragmentShader,
            vertexShader: DefaultVertexShader,
            uniforms: defaultShader.uniforms,
            ...shaderOverride
        }
        if (shaderOverride) this.shader = shaderOverride;
    }

    public override onInitialized(): void {
        this.transform = this.parent?.getComponent(Transform);
        this.sprite = this.parent?.getComponent(Sprite);

        if (!this.transform || !this.sprite) return;

        const geo = new THREE.PlaneGeometry(this.transform.scale.x, this.transform.scale.y);
        const tex = this.sprite.texture;
        const mat = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: this.shader.vertexShader,
            fragmentShader: this.shader.fragmentShader,
            uniforms: {
                uTex: { value: tex},
                ...this.shader.uniforms
            },
            transparent: true
        });

        tex!.colorSpace = THREE.LinearSRGBColorSpace;

        this.mesh = new THREE.Mesh(geo, mat);

        this.parent?.app.screenSpaceScene.add(this.mesh);
    }

    public override onDestroyed(): void {
        this.parent?.app.screenSpaceScene.remove(this.mesh as THREE.Mesh);
        (this.mesh!.material as THREE.Material).dispose();
        this.mesh?.geometry.dispose();
    }

    public override onLateUpdate(): void {
        if (!this.transform) return;
        this.mesh?.position.set(
            this.transform.globalPosition.x,
            this.transform.globalPosition.y,
            this.depth
        )

        const mat = (this.mesh!.material as THREE.ShaderMaterial);
        if (this.sprite?.texture !== mat.uniforms.uTex!.value) {
            mat.uniforms.uTex!.value = this.sprite!.texture
        }

        this.mesh!.rotation.set(
            0, 0,
            this.transform.globalRotation * (Math.PI / 180)
        )
    }
}

export class Button extends Component {
    isHovered: boolean = false;
    isPressed: boolean = false;

    isPressedOld: boolean = false;

    transform: Transform | undefined;

    onClick: () => void = () => {};
    onHover: () => void = () => {};

    constructor(onClickCallback?: () => void, onHoverCallback?: () => void) {
        super();
        this.onClick = onClickCallback ? onClickCallback : this.onClick;
        this.onHover = onHoverCallback ? onHoverCallback : this.onHover;
    }

    public override onInitialized(): void {
        this.transform = this.parent?.getComponent(Transform);
    }

    public override onUpdate(): void {
        if (!this.transform) return;

        const mousePos: Vector2 = this.parent!.app.getMousePos();
        const pos: Vector2 = this.transform.globalPosition;
        const scale: Vector2 = this.transform.scale;

        this.isHovered = 
            (mousePos.x > pos.x - (scale.x / 2)) && (mousePos.x < pos.x + (scale.x / 2)) && // X-Axis
            (mousePos.y > pos.y - (scale.y / 2)) && (mousePos.y < pos.y + (scale.x / 2)) // Y-Axis

        this.isPressed = this.isHovered && this.parent!.app.getMouseDown();

        if (this.isPressed && !this.isPressedOld) {
            this.onClick();
        }

        if (this.isHovered) {
            this.onHover();

            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "default";
        }

        this.isPressedOld = this.isPressed;
    }
}

// Game Objects

export class GameObject {
    components: Array<Component> = []
    app: App;

    children: Array<GameObject> = [];

    parent: GameObject | undefined;

    childrenRemovalBuffer: GameObject[] = [];

    plBody: pl.Body | undefined;

    isColliding = false;
    isTriggered = false;

    isCollidingOld = false;
    isTriggeredOld = false;

    constructor (app: App, parent: GameObject | undefined) {
        this.app = app;
        this.parent = parent;
    }

    public onInitialized() {

        // Call component initialization
        for (const c of this.components) {
            c.onInitialized();
        }

        // Create planck bodies for physics interaction
        const rb = this.getComponent(Rigidbody);
        const tf = this.getComponent(Transform);
        if (!tf) return

        const tfm = tf.asTransformation();

        const body = this.app.plWorld.createBody({
            type: (rb && !rb.isStatic) ? "dynamic" : "static",
            position: {x: tfm.position.x / 32, y: tfm.position.y / 32},
            angle: tfm.rotation * (Math.PI / 180)
        })

        this.plBody = body;

        if (rb) body.setFixedRotation(rb?.lockRotation);

        const boxColliders = this.getComponents(BoxCollider);
        for (const b of boxColliders) {
            const fixture = body.createFixture({
                shape: pl.Box(b.scale.x/64, b.scale.y/64, pl.Vec2(b.offset.x/64, b.offset.y/64)),
                ...(rb && {density: rb.density, friction: rb.friction})
            });
            fixture.setSensor(b.isTrigger);

            b.body = body;
        }
        const circleColliders = this.getComponents(CircleCollider);
        for (const c of circleColliders) {
            const fixture = body.createFixture({
                shape: pl.Circle(pl.Vec2(c.offset.x/64, c.offset.y/64), c.radius / 64),
                ...(rb && {density: rb.density, friction: rb.friction})
            })
            fixture.setSensor(c.isTrigger);

            c.body = body;
        }

        body.resetMassData();

        if (rb) rb.body = body;

        // Initialize children
        for (const c of this.children) {
            c.onInitialized();
        }
    }

    public addComponent(component: Component) {
        component.parent = this;
        this.components.push(component);

        if (this.parent?.app.isTicking) {
            component.onInitialized();
        }
    }

    public addChild(child: GameObject) {
        child.parent = this;
        this.children.push(child);
    }

    public removeChild(child: GameObject) {
        this.children.splice(this.children.indexOf(child), 1)
    }

    public onDestroyed() {
        // Remove the physics bodyd
        (this.plBody && this.app.plWorld.destroyBody(this.plBody))

        // Call for all components to destroy
        for (const c of this.components) {
            c.onDestroyed();
        }

        // Call for all children to destroy recursively until end of scene graph
        for (const c of this.children) {
            c.onDestroyed();
        }

        // Once all children have destroyed, then remove this object from it's parent
        //this.parent?.children.splice(this.parent.children.indexOf(this), 1);
        for (const c of this.childrenRemovalBuffer) {
            this.removeChild(c);
        }
        this.childrenRemovalBuffer.length = 0;
        this.parent?.childrenRemovalBuffer.push(this)
    }

    public onUpdate() {
        this.isTriggered = false;
        this.isColliding = false;

        for (const c of this.components) {
            c.onUpdate();
        }

        for (const c of this.children) {
            c.onUpdate();
        }

        if (this.isColliding && !this.isCollidingOld) {
            for (const c of this.components) {
                c.onCollisionEnter();
            }
        }

        if (this.isColliding && this.isCollidingOld) {
            for (const c of this.components) {
                c.onCollisionStay();
            }
        }

        if (!this.isColliding && this.isCollidingOld) {
            for (const c of this.components) {
                c.onCollisionExit();
            }
        }

        if (this.isTriggered && !this.isTriggeredOld) {
            for (const c of this.components) {
                c.onTriggerEnter();
            }
        }

        if (this.isTriggered && this.isTriggeredOld) {
            for (const c of this.components) {
                c.onTriggerStay();
            }
        }

        if (!this.isTriggered && this.isTriggeredOld) {
            for (const c of this.components) {
                c.onTriggerExit();
            }
        }

        this.isCollidingOld = this.isColliding;
        this.isTriggeredOld = this.isTriggered;
    }

    public onLateUpdate() {
        for (const c of this.components) {
            c.onLateUpdate();
        }

        for (const c of this.children) {
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

class SceneGraphRoot extends GameObject {
    constructor (app: App) {
        super(app, undefined);

        this.components.push(
            new Transform(new Vector2(0,0), 0, new Vector2(1,1))
        )
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
    private mouseDown = false;

    frameIntervalCallbacks: Array<() => void> = [];

    objects: Array<GameObject> = [];
    sceneGraphRoot: SceneGraphRoot = new SceneGraphRoot(this);

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
        const HI_W = window.innerWidth; const HI_H = window.innerHeight;

        this.screenSpaceCamera = new THREE.OrthographicCamera(
            -HI_W / 2, 
            HI_W / 2, 
            HI_H / 2, 
            -HI_H / 2, 
            0.1, 100);
            
        this.screenSpaceCamera.position.set(0, 0, 10);

        this.renderer.setClearColor(this.args.clearColor!);

        this.screenSpaceScene = new THREE.Scene();

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
            new THREE.PlaneGeometry(HI_H * (16 / 9), HI_H),

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
        const w = this.renderScale.x; 
        const h = this.renderScale.y;

        this.camera.left = -w / 2 * this.args.zoom!;
        this.camera.right = w / 2 * this.args.zoom!;

        this.camera.top = h / 2 * this.args.zoom!;
        this.camera.bottom = -h / 2 * this.args.zoom!;
        this.camera.updateProjectionMatrix();

        const HI_W = window.innerWidth; const HI_H = window.innerHeight;
        this.renderer.setSize(HI_W, HI_H);

        this.screenSpaceCamera.left = -HI_W / 2;
        this.screenSpaceCamera.right = HI_W / 2;

        this.screenSpaceCamera.top = HI_H / 2;
        this.screenSpaceCamera.bottom = -HI_H / 2;
        this.screenSpaceCamera.updateProjectionMatrix();
    }

    public getKey(k: string) {
        return this.keys[k.toLowerCase()] as boolean
    }

    public getMousePos() {
        return this.mousePos;
    }

    public getMouseDown() {
        return this.mouseDown;
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
            this.mousePos.x = e.clientX - (window.innerWidth / 2);
            this.mousePos.y = -e.clientY + (window.innerHeight / 2);
        })

        document.addEventListener("mousedown", (e) => {
            this.mouseDown = true;
        })

        document.addEventListener("mouseup", (e) => {
            this.mouseDown = false;
        })

        // Begin measuring deltaTime
        this.oldTimestamp = Date.now();

        // Save running status
        this.isTicking = true;

        this.sceneGraphRoot.onInitialized();

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
        this.sceneGraphRoot.onUpdate();
        this.sceneGraphRoot.onLateUpdate();

        for (const o of this.objectAdditionBuffer) {
            this.sceneGraphRoot.addChild(o);
            o.onInitialized();
        }

        for (const o of this.objectRemovalBuffer) {
            o.onDestroyed();
        }

        this.objectAdditionBuffer.length = 0;
        this.objectRemovalBuffer.length = 0;
    }

    public addObject(object: GameObject) {
        if (this.isTicking) {
            this.objectAdditionBuffer.push(object);
        } else {
            this.sceneGraphRoot.addChild(object)
        }
    }

    public removeObject(object: GameObject) {
        if (this.isTicking) {
            this.objectRemovalBuffer.push(object);
        } else {
            object.onDestroyed();
        }
    }

    public createObject(...components: Component[]): GameObject {
        const obj = new GameObject(this, this.sceneGraphRoot);
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

        for (const o of this.sceneGraphRoot.children) {
            o.onDestroyed();
        }
        this.sceneGraphRoot.children.length = 0;

        this.scenes[name]!.onLoad(this);

        this.start();
    }

    public getScene() {
        return this.curScene;
    }
}