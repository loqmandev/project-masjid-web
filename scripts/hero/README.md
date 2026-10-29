# H8 hero assets

**UNUSED since 2026-10-29.** The homepage hero is static (owner decision, performance): the canvas animation,
`hero-motion.js` and the pre-warped phone overlays this tooling produced were removed from the site. The tool and
`geometry-r9.json` stay only as the record of how the overlays were made; nothing in `src/` or `public/` reads them.
To change the hero phone screen, replace `public/screens/02-explore{,-320,@2x}.webp` by hand (keep the three widths).

Ported from approved sketch 107 H8, rounds 9–9d. Geometry is in source pixels on the 1254 × 1254 city. Never enlarge DOM layers to implement the zoom.

Regenerate the phone overlays after replacing the Explore screenshot (Pillow and numpy required):

```sh
python3 scripts/hero/warp-screen.py /path/to/light-mode-explore.png
```

This writes screen WebPs and diagnostic PNG masks into `public/hero/` and updates `geometry-r9.json`. Commit the WebPs and geometry; diagnostic masks are ignored. Also replace both `public/screens/02-explore{,@2x}.webp` variants for the floating phone and feature tile. The current dark screenshot is the approved temporary asset.
