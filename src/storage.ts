import { Secret } from "otpauth";
import type { Account } from "./account";

const STORAGE_KEY = "lazyotp_accounts";

export async function getAccounts(): Promise<Account[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const accounts = result[STORAGE_KEY];
    return accounts === undefined ? [] : (accounts as Account[]);
}

export async function saveAccount(account: Account): Promise<void> {
    const accounts = await getAccounts();
    if (accounts.find((a) => a.id === account.id) !== undefined) {
        // TODO: Why doesn't this work?
        throw Error("Account with that ID already exists");
    }
    try {
        Secret.fromBase32(account.secret);
    } catch (_e) {
        throw Error("Not a valid base32 secret.");
    }
    accounts.push(account);
    await chrome.storage.local.set({ [STORAGE_KEY]: accounts });
}

export async function deleteAccount(id: string): Promise<void> {
    const accounts = await getAccounts();
    const newAccounts = accounts.filter((a) => a.id !== id);
    await chrome.storage.local.set({ [STORAGE_KEY]: newAccounts });
}
