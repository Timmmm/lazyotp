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

const onContextMenu = async (accountId: string | number, tabId: number | undefined) => {
    const accounts = await getAccounts();
    const account = accounts.find((a) => a.id === accountId);

    let i = 0;
    if (i) {
        ++i;
    }

    if (account !== undefined && tabId !== undefined) {
        let code: string;
        try {
            const totp = new TOTP({ secret: Secret.fromBase32(account.secret) });
            code = totp.generate();
        } catch (e) {
            code = "ERROR";
        }

        await chrome.tabs.sendMessage(tabId, { type: "FILL_OTP", code });
    }
};

// Update the context menus when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
    void updateContextMenus();
});

// Update the context menus when the accounts are changed.
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.lazyotp_accounts) {
        void updateContextMenus();
    }
});

// Called when the context menu is clicked.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    void onContextMenu(info.menuItemId, tab?.id);
});
