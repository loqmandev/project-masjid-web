# H8 hero assets

Ported from approved sketch 107 H8, rounds 9–9d. Geometry is in source pixels on the 1254 × 1254 city. Never enlarge DOM layers to implement the zoom.

Regenerate the phone overlays after replacing the Explore screenshot (Pillow and numpy required):

```sh
python3 scripts/hero/warp-screen.py /path/to/light-mode-explore.png
```

This writes screen WebPs and diagnostic PNG masks into `public/hero/` and updates `geometry-r9.json`. Commit the WebPs and geometry; diagnostic masks are ignored. Also replace both `public/screens/02-explore{,@2x}.webp` variants for the floating phone and feature tile. The current dark screenshot is the approved temporary asset.

`hero-motion.js` retains the sketch’s camera, handoffs and WAAPI timings. Its renderer is mounted and disposed by the React effect in `Hero.tsx`. Static CSS backgrounds keep the rest composition available without JS or on failure. URL backgrounds can be LCP candidates, so the synchronous head motion gate suppresses them during normal-motion startup; source images load only after text paint and are painted to canvases. All animation and decode failures return to this state.
