import * as Phoenix from "./lib/phoenix.ts"
import * as pl from "planck";

class ControllableComponent extends Phoenix.Component {
    rigidbody: Phoenix.Rigidbody | undefined = undefined;
    body: pl.Body | undefined = undefined;

    public override onInitialized(): void {
        if (!this.parent) return
        this.rigidbody = this.parent.getComponent(Phoenix.Rigidbody);
    }

    public override onUpdate(): void {
        if (!this.body) {this.body = this.rigidbody!.body; return;}
        if (this.parent?.app.getKey("w")) {
            this.body.applyLinearImpulse({x:0, y:1}, {x: this.body.getPosition().x, y: this.body.getPosition().y})
        }

        if (this.parent?.app.getKey("a")) {
            this.body.applyAngularImpulse(0.2, false)
        } else if (this.parent?.app.getKey("d")) {
            this.body.applyAngularImpulse(-0.2, false)
        }
    }
}

class CameraController extends Phoenix.Component {

    target: Phoenix.GameObject;
    targetTransform: Phoenix.Transform | undefined = undefined;

    transform: Phoenix.Transform | undefined = undefined;

    constructor(target: Phoenix.GameObject) {
        super()
        this.target = target;
    }

    public override onInitialized(): void {
        this.targetTransform = this.target.getComponent(Phoenix.Transform);
        this.transform = this.parent?.getComponent(Phoenix.Transform);
    }

    public override onUpdate(): void {
        if (!this.transform || !this.targetTransform) return
        this.transform.position.x += (this.targetTransform.position.x - this.transform.position.x) / 4;
        this.transform.position.y += (this.targetTransform.position.y - this.transform.position.y) / 4;
    }
}

export class Scene extends Phoenix.Scene {
    public override onLoad(app: Phoenix.App): void {
        const player = app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, 0), 0, new Phoenix.Vector2(32, 32)),
            new Phoenix.Sprite("assets/brick.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(32, 32)),
            new Phoenix.Rigidbody(1, 1, false),
            new ControllableComponent()
        )

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -83), 0, new Phoenix.Vector2(0, 0)),
            new Phoenix.TextRenderer("In this scene, there is a cube you can control...", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8}, 1)
        ));

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -147), 0, new Phoenix.Vector2(0, 0)),
            new Phoenix.TextRenderer("Hit A to spin the cube left", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8}, 1)
        ));

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -209), 0, new Phoenix.Vector2(0, 0)),
            new Phoenix.TextRenderer("Hit D to spin the cube right", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8}, 1)
        ));

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -273), 0, new Phoenix.Vector2(0, 0)),
            new Phoenix.TextRenderer("Hit W to jump", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8}, 1)
        ));

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -337), 0, new Phoenix.Vector2(0, 0)),
            new Phoenix.TextRenderer("Hit H to return to the first scene", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8}, 1)
        ));

        app.addObject(player)

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, 0), 0, new Phoenix.Vector2(0, 0)),
            new CameraController(player),
            new Phoenix.Camera()
        ))

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0,-80), 0, new Phoenix.Vector2(2000, 100)),
            new Phoenix.Sprite("assets/null.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(2000, 100)),
            new Phoenix.Rigidbody(1, 1, true)
        ))
    }
}