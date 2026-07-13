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
            this.body.applyLinearImpulse({x:-1, y:0}, {x: this.body.getPosition().x, y: this.body.getPosition().y})
        } else if (this.parent?.app.getKey("d")) {
            this.body.applyLinearImpulse({x:1, y:0}, {x: this.body.getPosition().x, y: this.body.getPosition().y})
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
        this.transform.position.x += (this.targetTransform.globalPosition.x - this.transform.position.x) / 4;
        this.transform.position.y += (this.targetTransform.globalPosition.y - this.transform.position.y) / 4;
    }
}

class TestComponent extends Phoenix.Component {
    public override onCollisionEnter(): void {
        if (!this.parent) return
        console.log("TRIGGER")
        this.parent.onDestroyed();
    }
}

export class Scene extends Phoenix.Scene {
    public override onLoad(app: Phoenix.App): void {
        const player = app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, 0), 0, new Phoenix.Vector2(32, 32)),
            new Phoenix.Sprite("assets/brick.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(32, 32)),
            new Phoenix.Rigidbody(1, 4, false, true),
            new Phoenix.ParticleSystem("assets/brick.png", 10, new Phoenix.Vector2(24, 24)),
            new ControllableComponent()
        )

        player.addChild(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0,0), 0, new Phoenix.Vector2(16, 16)),
            new Phoenix.Sprite("assets/null.png"),
            new Phoenix.Renderer(1)
        ))

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(256, 0), 0, new Phoenix.Vector2(32, 32)),
            new Phoenix.Sprite("assets/brick.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(32, 32), false),
            new TestComponent()
        ));

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(164, 32), 0, new Phoenix.Vector2(64, 64)),
            new Phoenix.AnimatedSprite(["assets/brick.png", "assets/null.png"]),
            new Phoenix.UIRenderer(1)
        ))

        const st1 = new Phoenix.TextSprite("There are also elements rendered in screen space!", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8})
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, 128), 0, new Phoenix.Vector2(st1.texture!.width, st1.texture!.height)),
            st1,
            new Phoenix.UIRenderer(1)
        ))

        const st2 = new Phoenix.TextSprite("And particles!", {fontSize: 24, backgroundColor: "#7fefcf", padding: 8})
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, 72), 0, new Phoenix.Vector2(st2.texture!.width, st2.texture!.height)),
            st2,
            new Phoenix.UIRenderer(1)
        ))

        const t1 = new Phoenix.TextSprite("In this scene, there is a cube you can control...", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -83), 0, new Phoenix.Vector2(t1.texture!.width, t1.texture!.height)),
            t1,
            new Phoenix.Renderer(1)
        ));

        const t2 = new Phoenix.TextSprite("Hit A to move the cube left", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -147), 0, new Phoenix.Vector2(t2.texture!.width, t2.texture!.height)),
            t2,
            new Phoenix.Renderer(1)
        ));

        const t3 = new Phoenix.TextSprite("Hit D to move the cube right", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -209), 0, new Phoenix.Vector2(t3.texture!.width, t3.texture!.height)),
            t3,
            new Phoenix.Renderer(1)
        ));

        const t4 = new Phoenix.TextSprite("Hit W to jump", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});        
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -273), 0, new Phoenix.Vector2(t4.texture!.width, t4.texture!.height)),
            t4,
            new Phoenix.Renderer(1)
        ));

        const t5 = new Phoenix.TextSprite("Hit H to return to the first scene", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});    
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -337), 0, new Phoenix.Vector2(t5.texture!.width, t5.texture!.height)),
            t5,
            new Phoenix.Renderer(1)
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