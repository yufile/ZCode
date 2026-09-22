#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Icns, IcnsImage } from "@fiahfy/icns";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(desktopRoot, "..", "..");
const logoSvgPath = join(workspaceRoot, "packages/ui/src/assets/yu-code-logo.svg");
const iconSvgPath = join(workspaceRoot, "packages/ui/src/assets/yu-code-icon.svg");
const iconSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

async function loadSvg(path) {
  return loadImage(await readFile(path));
}

function renderPng(image, width, height) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toBuffer("image/png");
}

function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = Buffer.alloc(images.length * 16);
  let offset = header.length + entries.length;
  for (const [index, { size, png }] of images.entries()) {
    const entryOffset = index * 16;
    entries.writeUInt8(size >= 256 ? 0 : size, entryOffset);
    entries.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1);
    entries.writeUInt8(0, entryOffset + 2);
    entries.writeUInt8(0, entryOffset + 3);
    entries.writeUInt16LE(1, entryOffset + 4);
    entries.writeUInt16LE(32, entryOffset + 6);
    entries.writeUInt32LE(png.length, entryOffset + 8);
    entries.writeUInt32LE(offset, entryOffset + 12);
    offset += png.length;
  }

  return Buffer.concat([header, entries, ...images.map(({ png }) => png)]);
}

function buildIcns(images) {
  const icns = new Icns();
  for (const { size, osType } of images) {
    icns.append(IcnsImage.fromPNG(imagesBySize.get(size), osType));
  }
  return icns.data;
}

async function writeAsset(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
}

const [logoImage, iconImage] = await Promise.all([loadSvg(logoSvgPath), loadSvg(iconSvgPath)]);
const logoPng = renderPng(logoImage, 1024, 734);
const imagesBySize = new Map(iconSizes.map((size) => [size, renderPng(iconImage, size, size)]));

const squarePngTargets = [
  join(workspaceRoot, "public/icon_512@2x.png"),
  join(workspaceRoot, "packages/ui/src/assets/yu-code-icon.png"),
  join(workspaceRoot, "packages/web/public/yu-code-icon.png"),
  join(workspaceRoot, "packages/desktop/src/renderer/yu-code-icon.png"),
  join(desktopRoot, "build/icon.png"),
  join(desktopRoot, "build/icon_windows.png"),
  join(desktopRoot, "build/icon_installer.png"),
];
for (const target of squarePngTargets) {
  await writeAsset(target, imagesBySize.get(1024));
}
await writeAsset(join(workspaceRoot, "packages/ui/src/assets/yu-code-logo.png"), logoPng);

for (const directory of [
  join(workspaceRoot, "public/logo/icons"),
  join(desktopRoot, "build/icons"),
]) {
  for (const size of iconSizes) {
    await writeAsset(join(directory, `${size}x${size}.png`), imagesBySize.get(size));
  }
}

const icoImages = [16, 24, 32, 48, 64, 128, 256].map((size) => ({
  size,
  png: imagesBySize.get(size),
}));
const ico = buildIco(icoImages);
for (const target of [
  join(workspaceRoot, "public/logo/icons/icon.ico"),
  join(workspaceRoot, "packages/web/public/favicon.ico"),
  join(desktopRoot, "build/icon.ico"),
  join(desktopRoot, "build/icon_installer.ico"),
]) {
  await writeAsset(target, ico);
}

const icns = buildIcns([
  { size: 16, osType: "icp4" },
  { size: 32, osType: "icp5" },
  { size: 64, osType: "icp6" },
  { size: 128, osType: "ic07" },
  { size: 256, osType: "ic08" },
  { size: 512, osType: "ic09" },
  { size: 1024, osType: "ic10" },
  { size: 32, osType: "ic11" },
  { size: 64, osType: "ic12" },
  { size: 256, osType: "ic13" },
  { size: 512, osType: "ic14" },
]);
for (const target of [
  join(workspaceRoot, "public/logo/icons/icon.icns"),
  join(desktopRoot, "build/icon.icns"),
  join(desktopRoot, "build/icon_installer.icns"),
]) {
  await writeAsset(target, icns);
}

console.log(`Generated yuCode brand assets from ${logoSvgPath}`);
