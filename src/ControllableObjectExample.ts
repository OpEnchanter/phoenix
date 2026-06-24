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

export class Scene extends Phoenix.Scene {
    public override onLoad(app: Phoenix.App): void {
        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, 0), 0, new Phoenix.Vector2(32, 32)),
            new Phoenix.Sprite("/assets/brick.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(32, 32)),
            new Phoenix.Rigidbody(1, 1, false),
            new ControllableComponent()
        ))

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0,-80), 0, new Phoenix.Vector2(2000, 100)),
            new Phoenix.Sprite("/assets/null.png"),
            new Phoenix.Renderer(0),
            new Phoenix.BoxCollider(new Phoenix.Vector2(2000, 100)),
            new Phoenix.Rigidbody(1, 1, true)
        ))
    }
}