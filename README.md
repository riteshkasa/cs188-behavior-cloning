# cs188-behavior-cloning

This repository contains a static website that summarizes a CS188 final project on object-aware robotic manipulation.

The site presents a visually engaging overview of a behavior cloning approach for teaching a robot to open kitchen cabinets in the RoboCasa365 simulation benchmark. It highlights:

- The cabinet-opening task and why it is challenging
- The use of imitation learning through behavior cloning
- The shift from a robot-only state to an object-aware 44-dimensional state vector
- Interactive sections that explain the training pipeline and the importance of handle-aware spatial features
- A placeholder section for a future demo video

## Visit Website via Github Pages

https://riteshkasa.github.io/cs188-behavior-cloning/#demo-view

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Serve it locally

From the repository root, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deployment

The site is ready to be hosted as a static project on GitHub Pages or Vercel.
