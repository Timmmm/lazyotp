import { URI } from "otpauth";
import type { Account } from "./account";

const STORAGE_KEY = "lazyotp_accounts";

export async function getAccounts(): Promise<Account[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const accounts = result[STORAGE_KEY];
    return accounts === undefined ? [] : (accounts as Account[]);
}

export async function saveAccount(account: Account): Promise<void> {
    const accounts = await getAccounts();
    if (accounts.find((a) => a.name === account.name) !== undefined) {
        throw Error("Account with that name already exists");
    }
    accounts.push(account);
    await chrome.storage.local.set({ [STORAGE_KEY]: accounts });
}

export async function deleteAccount(name: string): Promise<void> {
    const accounts = await getAccounts();
    const newAccounts = accounts.filter((a) => a.name !== name);
    await chrome.storage.local.set({ [STORAGE_KEY]: newAccounts });
}

export async function codeForAccount(name: string): Promise<string> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const accounts = result[STORAGE_KEY] as Account[] | undefined;
    if (accounts === undefined) {
        throw Error(`Unknown account: '${name}'`);
    }

    const account = accounts.find((a) => a.name === name);
    if (account === undefined) {
        throw Error(`Unknown account: '${name}'`);
    }

    const otp = URI.parse(account.uri);
    const code = otp.generate();
    // Need to save it back for counter-based codes.
    account.uri = URI.stringify(otp);
    return code;
}
