import * as Phoenix from "./lib/phoenix.ts";
import * as ImpulseComponentExample from "./ImpulseComponentExample.ts";
import * as ManyObjectsExample from "./ManyObjectsExample.ts";
import * as ControllableObjectExample from "./ControllableObjectExample.ts";

const app: Phoenix.App = new Phoenix.App({
    zoom: 1/1,
    renderScale: new Phoenix.Vector2(1920, 1080),
    clearColor: 0x5cdbfd,
    timescale: 1
});


app.addScene("0", new ImpulseComponentExample.Scene())
app.addScene("1", new ManyObjectsExample.Scene())
app.addScene("2", new ControllableObjectExample.Scene())

app.loadScene("0")

let cur = 0;
let max = 2;

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() == "h") {
        cur = (cur + 1) % (max+1);
        app.loadScene(cur.toString());
    } else if (e.key.toLocaleLowerCase() == "r") {
        app.loadScene(cur.toString());
    }
})