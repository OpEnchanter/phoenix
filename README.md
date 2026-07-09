# phoenix
A 2D game framework made for browser-based video games designed to mimic some design paradigms of the Unity game engine. Using Bun + Typescript and bundled with Vite. Uses the [Planck.js](https://piqnt.github.io/planck.js/docs/body.html) physics engine and [THREE.js](https://threejs.org/) for rendering.

The demos for this project are relatively simple, just showing off the features of the engine. Although with more time, this could be used to make a full game.

## Usage
The entrypoint into the application must be loaded in a HTML document.
In this example, the HTML provides a canvas element, styled to fit the screen properly and loads the Typescript entrypoint.

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

```typescript
import * as Phoenix from "./lib/phoenix.ts"

// Create an app instance with options supplied
app: Phoenix.App = new Phoenix.App({
    zoom: 1/1,
    renderScale: new Phoenix.Vector2(1920, 1080),
    clearColor: 0x5cdbfd,
    timescale: 1
})

// Add an object with a transform, sprite and renderer
app.addObject(app.createObject(
    new Phoenix.Transform(new Phoenix.Vector2(0, 0), 0, new Phoenix.Vector2(16, 16)),
    new Phoenix.Sprite("/assets/brick.png"),
    new Phoenix.Renderer(0)
))

app.start() // Start the app

```

This Typescript code will initialize an app, add an object and start the app.

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

### Component
Without components, objects do not render, have a sprite, or even have a position. Components are able to provide behaviour to objects through scripts. Components have multiple distinct functions that can be overridden to create the aforementioned behaviour.

**Component Functions**

`onInitialized()` - Called when the object loads, best for fetching data from other components or objects. Called once.

`onDestroyed()` - Controls what the object does when it is removed from the app's objects array. Called once.

`onUpdate()` - Called every frame the object exists.

`onLateUpdate()` - Called every frame the object exists after `onUpdate()` finishes for all objects in the scene.

**Built-in Components**

**Basic Components:**

- `Phoenix.Transform(position: Vector2, rotation: number, scale: Vector2)` - Stores the position, rotation and scale of objects.

- `Phoenix.Renderer(depth: number)` - Stores the object's rendering depth and adds the texture retrieved from the first `Sprite` on the object along with the transformation from the first `Transform` on the object and the depth stored to the app's rendering buffer. A smaller depth value causes the texture to render later, appearing in front of others.

- `Phoenix.Rigidbody(density: number, friction: number, isStatic: boolean)` - Allows physics and other physical properties such as friction to be added to objects. If `isStatic` is true the object will not move and not be affected by other physics objects.

**Sprites**

- `Phoenix.Sprite(src: string)` - Stores an image texture used for the object by the renderer.

- `Phoenix.CanvasSprite(canvas: HTMLCanvasElement)` - A sprite which uses an HTML canvas as it's source.

- `Phoenix.TextSprite(text: string, fontOverride?: fontOps)` - A sprite that displays text supplied to it in a string.

- `Phoenix.AnimatedSprite(frames: Array<string>, rate?: number)` - A sprite that swaps its texture between all the frames supplied to it sequentially. Can also be supplied a rate (in number of game frames each animation frame stays on screen).

**Colliders:**

- `Phoenix.BoxCollider(scale: Vector2)` - A simple rectangular collider. Physics objects collide with this but do not have any effect on it's position or rotation. A `Rigidbody` with `isStatic = true` will allow for more properties such as friction to be added.

- `Phoenix.CircleCollider(radius: number)` - A simple (circular) collider. Works exactly the same as the rectangular collider but circular!


### ApplicationArguments
Arguments that can be supplied to the App.

```typescript
type ApplicationArguments = {
    zoom?: number,
    renderScale?: Vector2,
    shaderOverride?: shaderOps,
    clearColor?: number,
    timescale?: number
};
```

Shown above is the type definition for the `ApplicationArguments`. These can modify many different features with regard to the application's function. All of these arguments are optional and have internal defaults to prevent crashes.

- **zoom** - Changes how zoomed-in the camera is on the scene.
- **renderScale** - The resolution that the output image is rendered at.
- **shaderOverride** - Overrides the screen-space shader. Allows for screen-wide effects. Uses GLSL3.
- **clearColor** - Changes the color that the application fills the screen with when clearing after each frame. Essentially a background
- **timeScale** - The speed at which time progresses, does not affect framerate. This changes the deltaTime which is used in physics calculations, so it will slow down physics as well as anything else `app.deltaTime` is used to calculate.

```typescript
const app: Phoenix.App = new Phoenix.App({
    zoom: 1/4,
    renderScale: new Phoenix.Vector2(360, 180),
    clearColor: 0x5cdbfd,
    timescale: 1/2
})
```

In this example, the app would render at a resolution of `360x180` and would be zoomed in 4x. It would also show a background color of light blue, and time would progress at half speed. There is no shader override so objects will maintain their unmodified appearance.

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

---

**Feature Checklist**

- Main Application Class
    - [x] Physics Initialization (planck.js)
    - [x] Renderer Initialization (three.js)
    - [x] Object Management (addition and removal)
    - [x] Start and Stop running game
    - [x] Timing (deltaTime)
    - [x] Screen Space Shader & Shader Override
    - [x] Keyboard Input Tracking
    - [x] Mouse Input Tracking

- Components
    - [x] Component Parent Class
    - [x] Transform
    - [x] Renderer
    - [x] Sprite
    - [x] Rigidbody
    - [x] Box Collider
    - [x] Circle Collider
    - [x] Camera
    - [x] Sprites
        - [x] Image Sprite
        - [x] Canvas Sprite
        - [x] Text Sprite
        - [x] Animated Sprite

- Objects
    - [x] Initialization
    - [x] Component Usage

- Generics
    - [x] Vector2
    - [x] Logger
    - [x] Transformation

---

*Silly statistics :3*

![Hackatime](https://hackatime.hackclub.com/api/v1/badge/U0ADGEN6745/OpEnchanter/phoenix)

---

*Made with :heart:*