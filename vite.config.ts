import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import sharp from "sharp";
import { writeFile } from "fs/promises";

// Set manifest version to package.json version.
import { version } from "./package.json";
manifest.version = version;

// Generate extension icon PNGs.
const ICON_SIZES = [16, 32, 48, 128];

const genIcons = () => ({
    name: "sharp",
    transform: async () => {
        await Promise.all(
            ICON_SIZES.map((size) =>
                sharp("icons/icon.svg")
                    .resize(size)
                    .png()
                    .toBuffer()
                    .then((file) => writeFile(`icons/icon-${size.toFixed()}.png`, file))
            )
        );
    },
});

export default defineConfig({
    plugins: [genIcons(), preact(), crx({ manifest })],
    build: {
        minify: false,
    },
});
