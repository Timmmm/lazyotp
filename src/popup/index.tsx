import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { getAccounts, saveAccount, deleteAccount } from "../storage";
import { Account } from "../account";
import type { Request, ResponseGetImageUrls } from "../content/message_interface";
import jsQR from "jsqr";

function loadImageFromBlob(blob: Blob): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    throw new Error("CanvasRenderingContext2D not available");
                }

                ctx.drawImage(img, 0, 0);
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

                URL.revokeObjectURL(url);
                resolve(data);
            } catch (err) {
                URL.revokeObjectURL(url);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(err);
            }
        };

        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(e);
        };

        img.src = url;
    });
}

const App = () => {
    // List of accounts.
    const [accounts, setAccounts] = useState<Account[]>([]);
    // Edit boxes for new account.
    const [newAccountName, setNewAccountName] = useState("");
    const [newAccountSecret, setNewAccountSecret] = useState("");

    useEffect(() => {
        void loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const accs = await getAccounts();
        setAccounts(accs);
    };

    const handleAddAccount = async () => {
        // TODO: Disable the button instead.
        if (!newAccountName || !newAccountSecret) {
            return;
        }
        const newAccount: Account = {
            id: Date.now().toString(),
            name: newAccountName,
            secret: newAccountSecret.replace(/\s/g, "").toUpperCase(),
        };
        try {
            await saveAccount(newAccount);
        } catch (e) {
            alert((e as Error).message);
            return;
        }
        setNewAccountName("");
        setNewAccountSecret("");
        await loadAccounts();
    };

    const handleDelete = async (id: string) => {
        await deleteAccount(id);
        await loadAccounts();
    };

    const handleScanQR = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id !== undefined) {
            try {
                const request: Request = { type: "GET_IMAGE_URLS" };
                const response: ResponseGetImageUrls = await chrome.tabs.sendMessage(tab.id, request);

                const blobs: Blob[] = await Promise.all(
                    // Must use same-origin for CORS reasons.
                    response.image_srcs.map((u: string) => fetch(u, { mode: "same-origin" }).then((r) => r.blob()))
                );

                const images = await Promise.all(blobs.map((b) => loadImageFromBlob(b)));

                for (const image of images) {
                    // Skip small or very large images.
                    if (image.width < 50 || image.height < 50 || image.width > 1200 || image.height > 1200) {
                        continue;
                    }
                    const code = jsQR(image.data, image.width, image.height);

                    if (code !== null && code.data.startsWith("otpauth://")) {
                        const uri = new URL(code.data);
                        const secret = uri.searchParams.get("secret");
                        const labelPart = uri.pathname.split(":").pop();
                        const label = labelPart !== undefined ? decodeURIComponent(labelPart) : null;
                        const issuer = uri.searchParams.get("issuer");

                        if (secret !== null && secret !== "") {
                            setNewAccountSecret(secret);
                            if (issuer !== null && issuer !== "") {
                                setNewAccountName(issuer);
                            } else if (label !== null && label !== "") {
                                setNewAccountName(label);
                            } else {
                                // TODO: New Account N+1
                                setNewAccountName("New Account");
                            }
                            break;
                        }
                    }
                }
            } catch (e) {
                alert(`Could not scan page. Try refreshing the page. Error: ${(e as Error).message}`);
            }
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", height: "100%" }}>
            {/* List of accounts. */}
            <div style={{ flex: 1, overflowY: "scroll" }}>
                {accounts.length === 0 && <p style={{ color: "#666" }}>No accounts yet.</p>}
                {accounts.map((acc) => (
                    <div
                        key={acc.id}
                        style={{
                            background: "white",
                            padding: "12px",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "bold", marginTop: "4px" }}>{acc.name}</span>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    wordBreak: "break-all",
                                    marginTop: "4px",
                                    fontFamily: "monospace",
                                    userSelect: "all",
                                }}
                            >
                                {acc.secret}
                            </div>
                            <button
                                onClick={() => void handleDelete(acc.id)}
                                style={{ border: "none", background: "none", color: "red", cursor: "pointer" }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Add new account. */}
            <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Account Name (e.g. Google)"
                        value={newAccountName}
                        onInput={(e) => {
                            setNewAccountName(e.currentTarget.value);
                        }}
                        style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                    />
                    <input
                        type="text"
                        placeholder="Secret Key"
                        value={newAccountSecret}
                        onInput={(e) => {
                            setNewAccountSecret(e.currentTarget.value);
                        }}
                        style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                    />
                </div>
                <button
                    onClick={() => void handleScanQR()}
                    style={{
                        padding: "10px",
                        background: "#339721",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                    title="Scan QR Code from Page"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                        <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                        <rect x="7" y="7" width="3" height="3"></rect>
                        <rect x="14" y="7" width="3" height="3"></rect>
                        <rect x="7" y="14" width="3" height="3"></rect>
                        <rect x="14" y="14" width="3" height="3"></rect>
                    </svg>
                </button>
            </div>
            <button
                onClick={() => void handleAddAccount()}
                style={{
                    padding: "10px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            >
                Add Account
            </button>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(<App />, document.getElementById("app")!);
