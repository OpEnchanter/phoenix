import * as Phoenix from "./lib/phoenix.ts"

export class Scene extends Phoenix.Scene {
    public override onLoad(app: Phoenix.App): void {
        for (let i = 0; i < 100; i++) {
            app.addObject(app.createObject(
                new Phoenix.Transform(new Phoenix.Vector2(0,30+i*15), Math.abs(Math.random())*90, new Phoenix.Vector2(25, 25)),
                new Phoenix.Sprite("assets/null.png"),
                new Phoenix.Renderer(0),
                new Phoenix.BoxCollider(new Phoenix.Vector2(25, 25)),
                new Phoenix.Rigidbody(1, 1, false)
            ))
        }

        app.addObject(app.createObject(
            new Phoenix.Transform(new Phoenix.Vector2(0, -83), 0, new Phoenix.Vector2(0, 0)),
            new Phoenix.TextRenderer("Hit H to go to the next scene", {fontSize: 32, backgroundColor: "#7fefcf", padding: 8}, 1)
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