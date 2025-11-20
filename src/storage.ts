import { TOTP, URI } from "otpauth";
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
        throw Error("An account with that name already exists.");
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
    if (otp instanceof TOTP) {
        return otp.generate();
    } else {
        // Need to increment the counter and save it back for counter-based codes.
        const code = otp.generate({ counter: account.counter });
        ++account.counter;
        await chrome.storage.local.set({ [STORAGE_KEY]: accounts });
        return code;
    }
}
