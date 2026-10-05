/**
 * Render the Linux application icons from their vector source.
 *
 * A freedesktop desktop entry and the AppImage payload carry one launcher PNG, and electron-builder
 * derives every smaller launcher size from it. X11 keeps a window's icon in `_NET_WM_ICON`
 * instead, and that property cannot hold a bitmap as large as the launcher icon: a bigger image is
 * dropped and the window then shows no icon at all, which costs both the title bar and the taskbar
 * entry their icon. The build therefore commits a window-sized copy as well.
 *
 * Linux and Windows both present a flat rounded board on a desktop launcher, so they share one
 * vector source; only macOS needs its own proportion, which `resources/icon-macos.svg` owns.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/** Vector source and committed outputs of the Linux application icons. */
export const LINUX_ICON_PATHS = {
  source: fileURLToPath(new URL('../resources/icon-windows.svg', import.meta.url)),
  application: fileURLToPath(new URL('../resources/icon-linux.png', import.meta.url)),
  window: fileURLToPath(new URL('../resources/icon-linux-window.png', import.meta.url)),
} as const

/** Edge length of the launcher icon; electron-builder derives every smaller launcher size from it. */
const APPLICATION_EDGE = 1024
/** Edge length of the window icon; X11 drops a 256-pixel `_NET_WM_ICON` on this build. */
const WINDOW_EDGE = 128
const SOURCE_DENSITY = 72

/**
 * Rasterize the application icon at one edge length.
 * @param source - Complete vector source of the icon.
 * @param edge - Output edge length in pixels.
 * @returns The encoded PNG stream.
 */
export async function renderLinuxIcon(source: Buffer, edge: number): Promise<Buffer> {
  return sharp(source, { density: SOURCE_DENSITY }).resize(edge, edge).png().toBuffer()
}

async function main(): Promise<void> {
  const source = await readFile(LINUX_ICON_PATHS.source)
  await writeFile(LINUX_ICON_PATHS.application, await renderLinuxIcon(source, APPLICATION_EDGE))
  await writeFile(LINUX_ICON_PATHS.window, await renderLinuxIcon(source, WINDOW_EDGE))
  console.info(`linux icon: wrote ${LINUX_ICON_PATHS.application} at ${APPLICATION_EDGE} px and ${LINUX_ICON_PATHS.window} at ${WINDOW_EDGE} px`)
}

if (process.argv[1] !== undefined && import.meta.filename === resolve(process.argv[1])) await main()
