import * as Phoenix from "./lib/phoenix.ts"
import * as pl from "planck";

class TestInteraction extends Phoenix.Component {
    rigidbody: Phoenix.Rigidbody | undefined = undefined;
    body: pl.Body | undefined = undefined;

    exp: number;

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
        if (this.parent?.app.getKey("w")) {
            console.log("imp")
            this.body.applyLinearImpulse({x:(Math.random()-0.5)*this.exp, y:0}, {x: this.body.getPosition().x, y: this.body.getPosition().y})
        }
    }
}

export class Scene extends Phoenix.Scene {
    public override onLoad(app: Phoenix.App): void {
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 35; y++) {
                app.addObject(app.createObject(
                    new Phoenix.Transform(new Phoenix.Vector2(x*26,825-y*25), 0, new Phoenix.Vector2(25, 25)),
                    new Phoenix.Sprite("assets/brick.png"),
                    new Phoenix.Renderer(0),
                    new Phoenix.BoxCollider(new Phoenix.Vector2(25, 25)),
                    new Phoenix.Rigidbody(0.1, 1, false),
                    new TestInteraction((Math.abs(x-2.5))/10 + (y**2)/350)
                ))
            }
        }

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0,-80), 0, new Phoenix.Vector2(2000, 100)),
            new Phoenix.Sprite("assets/null.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(2000, 100)),
            new Phoenix.Rigidbody(1, 1, true)
        ))
    }
}