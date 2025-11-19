import { getAccounts } from "../storage";
import { Secret, TOTP } from "otpauth";

// Add a context menu entry for each account.
const updateContextMenus = async () => {
    await chrome.contextMenus.removeAll();

    const accounts = await getAccounts();
    accounts.forEach((account) => {
        chrome.contextMenus.create({
            id: account.id,
            title: account.name,
            contexts: ["editable"],
        });
    });
};

// Update the context menus when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
    updateContextMenus();
});

// Update the context menus when the accounts are changed.
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.lazyotp_accounts) {
        updateContextMenus();
    }
});

// Called when the context menu is clicked.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const accountId = info.menuItemId;
    const accounts = await getAccounts();
    const account = accounts.find((a) => a.id === accountId);

    if (account !== undefined && tab?.id !== undefined) {
        let code: string;
        try {
            const totp = new TOTP({ secret: Secret.fromBase32(account.secret) });
            code = totp.generate();
        } catch (e) {
            code = "ERROR";
        }

        // TODO: Get the clicked element somehow.

        chrome.tabs.sendMessage(tab.id, { type: "FILL_OTP", code });
    }
});
