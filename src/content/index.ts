import jsQR from "jsqr";

// Content injected into all pages.

// This is silly but the Chrome extension's context menu handler doesn't
// tell us which element is clicked, so we have to ask the page instead.

let g_contextElement: EventTarget | null = null;
document.addEventListener(
    "contextmenu",
    (event) => {
        g_contextElement = event.target;
    },
    { capture: true, passive: true }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FILL_OTP") {
        const el = g_contextElement;
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            // Replace text with OTP code.
            el.value = message.code;

            // Move cursor to end of inserted text
            el.selectionStart = el.selectionEnd = message.code.length;

            // Dispatch input event to trigger frameworks (React, etc.)
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
            alert("Not sure what you clicked on exactly. Was it an input?");
        }
    } else if (message.type === "GET_IMAGE_URLS") {
        const images = document.getElementsByTagName("img");
        const image_srcs: string[] = [];
        for (const img of images) {
            // Skip small or very large images.
            if (img.width < 50 || img.height < 50 || img.width > 1200 || img.height > 1200) {
                continue;
            }
            image_srcs.push(img.src);
        }

        let i = 4;
        if (i) {
            ++i;
        }

        console.warn(image_srcs);

        sendResponse({ image_srcs });
    }
});
