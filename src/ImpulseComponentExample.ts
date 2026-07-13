import * as Phoenix from "./lib/phoenix.ts"
import * as pl from "planck";

class TestInteraction extends Phoenix.Component {
    rigidbody: Phoenix.Rigidbody | undefined = undefined;
    body: pl.Body | undefined = undefined;

    exp: number;

    used: boolean = false;

    constructor(explosiveness: number) {
        super();
        this.exp = explosiveness;
    }

    public override onInitialized(): void {
        if (!this.parent) return
        this.rigidbody = this.parent.getComponent(Phoenix.Rigidbody);
    }

    public override onUpdate(): void {
        if (!this.body) {this.body = this.rigidbody!.body; return;}
        if (this.parent?.app.getKey("w") && !this.used) {
            this.body.applyLinearImpulse({x:(Math.random()-0.5)*this.exp, y:0}, {x: this.body.getPosition().x, y: this.body.getPosition().y})
            this.body.applyAngularImpulse((Math.random()-0.5)*this.exp);
            this.used = true;
        }
    }
}

export class Scene extends Phoenix.Scene {
    public override onLoad(app: Phoenix.App): void {
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 15; y++) {
                app.addObject(app.createObject(
                    new Phoenix.Transform(new Phoenix.Vector2(x*26,355-y*26), 0, new Phoenix.Vector2(25, 25)),
                    new Phoenix.Sprite("assets/brick.png"),
                    new Phoenix.Renderer(0),
                    new Phoenix.BoxCollider(new Phoenix.Vector2(25, 25)),
                    new Phoenix.Rigidbody(0.1, 1, false),
                    new TestInteraction(((Math.abs(x-2.5))/10 + (y**2)/350 * 10))
                ))
            }
        }

        const bt1 = new Phoenix.TextSprite("Slow down time!", {fontSize: 32, backgroundColor: "#9a73ef", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(
                new Phoenix.Vector2(0, 496),
                0,
                new Phoenix.Vector2(bt1.texture!.width, bt1.texture!.height)
            ),
            bt1,
            new Phoenix.UIRenderer(0),
            new Phoenix.Button(() => {
                app.args.timescale = (app.args.timescale == 1) ? 0.1 : 1
            })
        ))

        const t1 = new Phoenix.TextSprite("Hello! Welcome to this demo!", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -83), 0, new Phoenix.Vector2(t1.texture!.width, t1.texture!.height)),
            t1,
            new Phoenix.Renderer(1)
        ));

        const t2 = new Phoenix.TextSprite("Hit W to apply a random impulse to the objects", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -147), 0, new Phoenix.Vector2(t2.texture!.width, t2.texture!.height)),
            t2,
            new Phoenix.Renderer(1)
        ));

        const t3 = new Phoenix.TextSprite("Hit H to go to the next scene", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -209), 0, new Phoenix.Vector2(t3.texture!.width, t3.texture!.height)),
            t3,
            new Phoenix.Renderer(1),
        ));

        const t4 = new Phoenix.TextSprite("Hit R to reset", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8});
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -273), 0, new Phoenix.Vector2(t4.texture!.width, t4.texture!.height)),
            t4,
            new Phoenix.Renderer(1),
        ));

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0,-80), 0, new Phoenix.Vector2(2000, 100)),
            new Phoenix.Sprite("assets/null.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(2000, 100)),
            new Phoenix.Rigidbody(1, 1, true)
        ))
    }
}