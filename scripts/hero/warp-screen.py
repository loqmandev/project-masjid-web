#!/usr/bin/env python3
"""Usage: python3 scripts/hero/warp-screen.py path/to/explore.webp

Pillow + numpy only. Fit by cover on a 9:20 plane, then inverse-map into
4x cropped overlays. Source-pixel crop registration lives in geometry-r9.json.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT.parents[1] / 'public' / 'hero'
PLANE = (720, 1600)
SCALE = 4
EDGE_SAMPLES = 4
MARGIN = 2


def inverse_homography(quad, plane=PLANE, padding=0):
    """Pillow maps destination pixels back to the unwarped screenshot."""
    rows, values = [], []
    width, height = plane
    for (x, y), (u, v) in zip(quad, [(0, 0), (width, 0), (width, height), (0, height)]):
        u, v = u + padding, v + padding
        rows.extend([[x, y, 1, 0, 0, 0, -u*x, -u*y], [0, 0, 0, x, y, 1, -v*x, -v*y]])
        values.extend([u, v])
    return tuple(np.linalg.solve(np.asarray(rows), np.asarray(values)))


def inside_quad(quad, rect, size):
    x, y, width, height = rect
    py, px = np.mgrid[:size[1], :size[0]]
    px, py = x + (px + .5) * width / size[0], y + (py + .5) * height / size[1]
    inside = np.ones((size[1], size[0]), dtype=bool)
    for (ax, ay), (bx, by) in zip(quad, quad[1:] + quad[:1]):
        inside &= (bx-ax)*(py-ay) - (by-ay)*(px-ax) >= 0
    return inside


def area_fit(image, size):
    """Prefilter the UI before a cubic warp, avoiding point-sampled speckles."""
    image = ImageOps.fit(image, PLANE, method=Image.Resampling.LANCZOS)
    if size[0] < image.width / 2:
        image = image.resize((size[0]*2, size[1]*2), Image.Resampling.BOX)
    return image.resize(size, Image.Resampling.BOX)


def warp_rgb(plane, quad, size):
    # Warp opaque RGB, with edge colour extended under transparent pixels.
    # Sampling never mixes the screen with an ivory/transparent matte; this
    # also supplies useful RGB to WebP's chroma filter outside the alpha edge.
    padding = 48
    bleed = Image.fromarray(np.pad(np.asarray(plane), ((padding, padding), (padding, padding), (0, 0)), mode='edge'))
    return bleed.transform(size, Image.Transform.PERSPECTIVE,
                           inverse_homography(quad, plane.size, padding), Image.Resampling.BICUBIC)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('screenshot', type=Path)
    args = parser.parse_args()
    geometry = json.loads((ROOT / 'geometry-r9.json').read_text())
    screenshot = ImageOps.exif_transpose(Image.open(args.screenshot)).convert('RGB')
    splash = Image.new('RGBA', PLANE, '#F7F6F0')
    symbol = Image.open(ROOT.parents[1] / 'public/brand/jm-symbol-on-light.png').convert('RGBA')
    symbol.thumbnail((230, 300), Image.Resampling.LANCZOS)
    splash.alpha_composite(symbol, ((720-symbol.width)//2, (1600-symbol.height)//2))
    for name, screen in geometry['screens'].items():
        painting = Image.open(ASSETS / Path(screen['painting']).with_suffix('.webp')).convert('RGB')
        quad = screen['quad']
        left, top = np.floor(np.min(quad, axis=0)).astype(int) - MARGIN
        right, bottom = np.ceil(np.max(quad, axis=0)).astype(int) + MARGIN
        rect = tuple(map(int, (left, top, right-left, bottom-top)))
        size = (rect[2]*SCALE, rect[3]*SCALE)
        local_quad = [[(x-left)*SCALE, (y-top)*SCALE] for x, y in quad]
        # Prefilter the UI below the output's Nyquist limit before the cubic
        # warp. The 4x glass retains sharp coverage; the 9:20 UI plane uses
        # 2.5 samples/source px so hairline map details do not become speckles.
        edge_width = max(np.linalg.norm(np.subtract(quad[1], quad[0])), np.linalg.norm(np.subtract(quad[2], quad[3])))
        units = max(1, int(np.ceil(edge_width*2.5/9)))
        plane_size = (units*9, units*20)
        explore = area_fit(screenshot, plane_size)
        yy, xx = np.mgrid[:explore.height, :explore.width]
        glare = np.exp(-((xx / explore.width + yy / explore.height - .85) / .19)**2) * .05
        pixels = np.asarray(explore).astype(float)
        explore = Image.fromarray(np.uint8(np.round(pixels * (1-glare[..., None]) + 255*glare[..., None])))

        # Coverage at 16 samples per source pixel (4x4 per output pixel).
        mask_plane = (plane_size[0]*EDGE_SAMPLES, plane_size[1]*EDGE_SAMPLES)
        rounded = Image.new('L', mask_plane)
        ImageDraw.Draw(rounded).rounded_rectangle((0, 0, mask_plane[0]-1, mask_plane[1]-1), radius=mask_plane[0]*35/720, fill=255)
        mask_quad = [[x*EDGE_SAMPLES, y*EDGE_SAMPLES] for x, y in local_quad]
        warped_mask = rounded.transform((size[0]*EDGE_SAMPLES, size[1]*EDGE_SAMPLES), Image.Transform.PERSPECTIVE,
                                        inverse_homography(mask_quad, mask_plane), Image.Resampling.BICUBIC)
        warped_mask = warped_mask.resize(size, Image.Resampling.BOX)
        inside = inside_quad(quad, rect, size)
        glass = np.asarray(warped_mask).copy()
        glass[~inside] = 0
        Image.fromarray(glass).save(ASSETS / f'screen-{name}-glass-mask.png')
        # Sample the actual painted fingers at the SAME resolution as the UI.
        # Include their brown ink contours, but never dilate warm pixels into
        # the ivory glass. The feather is inward and about one source pixel
        # wide; RGB is the untouched painting, not a blurred colour patch.
        fingers = painting.crop((left, top, right, bottom)).resize(size, Image.Resampling.LANCZOS)
        rgb = np.asarray(fingers).astype(np.int16)
        skin = (rgb[..., 0]-rgb[..., 1] > 8) & (rgb[..., 1]-rgb[..., 2] > 8) & (rgb[..., 0]-rgb[..., 2] > 28) & inside
        silhouette = Image.fromarray(np.uint8(skin) * 255)
        softened = np.asarray(silhouette.filter(ImageFilter.GaussianBlur(SCALE/3)))
        occlusion = np.minimum(np.where(skin, softened, 0), glass).astype(np.uint8)
        finger_overlay = fingers.convert('RGBA')
        finger_overlay.putalpha(Image.fromarray(occlusion))
        finger_overlay.save(ASSETS / f'screen-{name}-occlusion.webp', lossless=True, method=6)
        # Keep opaque glass under the feather so it cannot expose the original
        # ivory screen. Only fully opaque finger cores cut holes in the UI.
        # Splash and Explore share this exact alpha, including rounded corners.
        alpha = Image.fromarray(np.where(occlusion == 255, 0, glass).astype(np.uint8))
        alpha.save(ASSETS / f'screen-{name}-mask.png')
        for kind, plane in [('explore', explore), ('splash', splash)] if name == 'close' else [('explore', explore)]:
            plane = area_fit(plane.convert('RGB'), plane_size) if kind == 'splash' else plane
            warped = warp_rgb(plane, local_quad, size).convert('RGBA')
            warped.putalpha(alpha)
            warped.save(ASSETS / f'screen-{name}-{kind}.webp', quality=70, method=6)
            if kind == 'explore':
                composite = painting.convert('RGBA')
                preview = warped.resize((rect[2], rect[3]), Image.Resampling.LANCZOS)
                composite.alpha_composite(preview, (int(left), int(top)))
                composite.alpha_composite(finger_overlay.resize((rect[2], rect[3]), Image.Resampling.LANCZOS), (int(left), int(top)))
                composite.save(f'/tmp/h8-{name}-screen.png')
        screen['overlayRect'] = list(rect)
        screen['overlayScale'] = SCALE
        screen['overlayPixelSize'] = list(size)
        screen['alphaBounds'] = list(alpha.getbbox())
        screen['alphaBoundsSpace'] = 'overlay pixels, relative to overlayRect'
        screen['occludedPixels'] = int(np.sum(occlusion > 127))
        screen['occlusionAsset'] = f'screen-{name}-occlusion.webp'
        print(name, 'source rect', rect, 'overlay pixels', size, 'occluded overlay pixels', screen['occludedPixels'])
    (ROOT / 'geometry-r9.json').write_text(json.dumps(geometry, indent=2) + '\n')


if __name__ == '__main__':
    main()
