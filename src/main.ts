import * as Phoenix from "./lib/phoenix.ts";
import * as Example from "./ExampleScene.ts";
import * as Example2 from "./ExampleScene2.ts";

const app: Phoenix.App = new Phoenix.App({
    targetFramerate: 60,
    downscaleFactor: 4,
    canvasSelector: "canvas"
});

app.addScene("example", new Example.Scene())
app.addScene("example2", new Example2.Scene())

app.loadScene("example")

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() == "h") {
        app.loadScene((app.getScene() == "example") ? "example2" : "example");
    }
})