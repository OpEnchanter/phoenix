import * as Phoenix from "./lib/phoenix.ts"

const app: Phoenix.App = new Phoenix.App();

for (let i = 0; i < 50; i++) {
    app.addObject(app.createObject(
        new Phoenix.Transform(new Phoenix.Vector2(100+i,10), Math.abs(Math.random())*90, new Phoenix.Vector2(25, 25)),
        new Phoenix.Sprite("/assets/brick.png"),
        new Phoenix.Renderer(0),
        new Phoenix.BoxCollider(new Phoenix.Vector2(25, 25)),
        new Phoenix.Rigidbody(1, 1, false)
    ))
}

app.addObject(app.createObject(
    new Phoenix.Transform(new Phoenix.Vector2(0,500), 0, new Phoenix.Vector2(2000, 100)),
    new Phoenix.Sprite("/assets/null.png"),
    new Phoenix.Renderer(0),
    new Phoenix.BoxCollider(new Phoenix.Vector2(2000, 100)),
    new Phoenix.Rigidbody(1, 1, true)
))
app.start();