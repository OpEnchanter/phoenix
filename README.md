# phoenix
A 2D game framework made for browser-based video games designed to mimic some design paradigms of the Unity game engine. Using Bun + Typescript and bundled with Vite. Uses the [Planck.js](https://piqnt.github.io/planck.js/docs/body.html) physics engine.

## Loading
The entrypoint into the application must be loaded in a HTML document.

```html
<!DOCTYPE html>
<html>
    <head>
        <style>
            html {
                margin: 0;
                padding: 0;

                overflow-y: hidden;
            }
            body {
                padding: 0;
                margin: 0;

                width: 100vw;
                height: 100vh;
            }
            canvas {
                background: black;

                width: 100vw;
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <canvas></canvas>
        <script type="module" src="src/main.ts"></script>
    </body>
</html>
```

In this example, the HTML provides a canvas element, styled to fit the screen properly and loads the Typescript entrypoint.

## Features

### App
The application (`Phoenix.App`) is the basis for the entire engine and controls the rendering, physics loop and management of GameObjects.

```typescript
import * as Phoenix from "./lib/phoenix.ts"
const app: Phoenix.App = new App();

app.start();
```

This script will create a basic app and start it but will not render anything. Note that there must be a `<canvas>` in the main HTML document.

Some options can be supplied to the app upon loading it. See [ApplicationArguments](#applicationarguments)

### GameObject
GameObjects are simply the objects in the in-game scene, they can be added to and removed from the app's list of current objects and can have [Components](#component) attached to them

```typescript    
app.addObject(app.createObject())
```

This is an example of how to create an empty object, although components can be added to the object in the arguments of `app.createObject()`.

```typescript
app.addObject(app.createObject(
    new Phoenix.Component(),
    new Phoenix.Component(),
    new Phoenix.Component()
))
```

This object has 3 completely empty components attached to it. This is a demonstration of how the components system works as the `Phoenix.Component()` class is designed to be extended to create custom behaviour.

### Components
Without components, objects do not render, have a sprite, or even have a position. Components are able to provide behaviour to objects through scripts. Components have multiple distinct functions that can be overridden to create the aforementioned behaviour.

**Component Functions**

`onInitialized()` - Called when the object loads, best for fetching data from other components or objects. Called once.

`onDestroyed()` - Controls what the object does when it is removed from the app's objects array. Called once.

`onUpdate()` - Called every frame the object exists.

`onLateUpdate()` - Called every frame the object exists after `onUpdate()` finishes for all objects in the scene.

**Built-in Components**

`Phoenix.Transform(position: Vector2, rotation: number, scale: Vector2)` - Stores the position, rotation and scale of objects.

`Phoenix.Sprite(src: string)` - Stores a texture used for the object by the renderer.

`Phoenix.Renderer(depth: number)` - Stores the object's rendering depth and adds the texture retrieved from the first `Sprite` on the object along with the transformation from the first `Transform` on the object and the depth stored to the app's rendering buffer. A smaller depth value causes the texture to render later, appearing in front of others.

`Phoenix.BoxCollider(scale: Vector2)` - A simple rectangular collider. Physics objects collide with this but do not have any effect on it's position or rotation. A `Rigidbody` with `isStatic = true` will allow for more properties such as friction to be added.

`Phoenix.Rigidbody(density: number, friction: number, isStatic: boolean)` - Allows physics and other physical properties such as friction to be added to objects. If `isStatic` is true the object will not move and not be affected by other physics objects.


### ApplicationArguments
Arguments that can be supplied to the App.

```typescript
type ApplicationArguments = {
    targetFramerate: number,
    downscaleFactor: number,
    canvasSelector: string
}
```

Shown in the above example these areguments can include the target framerate, a factor to divide the resolution of the output by and a selector for the canvas. These arguments are not required to be added to the app, but can be to customize behaviour.

```typescript
const app: Phoenix.App = new Phoenix.App({
    targetFramerate: 120,
    downscaleFactor: 1,
    canvasSelector: ".myCanvas"
})
```

In this example, the app would attempt to run at 120 FPS and would try to find it's canvas by searching for the first element with the selector `.myCanvas` (class myCanvas).

### Vector2
A two dimensional vector. Stores `x` and `y` component.

```typescript
const myVec: Phoenix.Vector2 = new Phoenix.Vector2(0, 0)
```
Vector with x and y equal to 0.

### Logger
A helper class for writing fancy, colored logs to console easily.

`Phoenix.Logger.error(m: string)` -> `[Error] {m}`
`Phoenix.Logger.info(m: string)` -> `[Info] {m}`
`Phoenix.Logger.success(m: string)` -> `[Success] {m}`

### Transformation
A helper object for storing a transformation seperately from a `Transform` component. Stores position, rotation and scale.

```typescript
const transform: Phoenix.Transformation = new Phoenix.Transformation(
    new Phoenix.Vector2(0, 0),
    0,
    new Phoenix.Vector2(0, 0)
)
```
Creates a transform with position (0,0) rotation of 0deg and scale of 0x0.