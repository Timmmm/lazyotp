import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { getAccounts, saveAccount, deleteAccount } from "../storage";
import { Account } from "../account";
import type { Request, ResponseGetImageUrls } from "../content/message_interface";
import jsQR from "jsqr";
import { URI } from "otpauth";

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
    const [newAccountUri, setNewAccountUri] = useState("");

    useEffect(() => {
        void loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const accs = await getAccounts();
        setAccounts(accs);
    };

    const handleAddAccount = async () => {
        if (newAccountName === "") {
            alert(
                "Please provide an account name. It can be anything (it's just for your reference) but must be unique."
            );
            return;
        }
        if (newAccountUri === "") {
            alert(
                "Please provide an OTP URI. This starts with 'otpauth://', you can auto-fill it using the QR code button."
            );
            return;
        }
        const newAccount: Account = {
            name: newAccountName,
            uri: newAccountUri,
        };
        try {
            await saveAccount(newAccount);
        } catch (e) {
            if (e instanceof Error) {
                alert(e.message);
            } else {
                alert(e);
            }
            return;
        }
        setNewAccountName("");
        setNewAccountUri("");
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
                        try {
                            const otp = URI.parse(code.data);

                            setNewAccountUri(code.data);
                            if (otp.label !== "") {
                                setNewAccountName(otp.label);
                            } else if (otp.issuer !== "") {
                                setNewAccountName(otp.issuer);
                            }
                            return;
                        } catch (_e) {
                            console.warn(_e);
                        }
                    }
                }

                alert("Couldn't find valid OTP QR code in page.");
            } catch (e) {
                alert(`Error scanning page. Try refreshing the page. Error: ${(e as Error).message}`);
            }
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", height: "100%" }}>
            {/* List of accounts. */}
            <div style={{ flex: 1, overflowY: "scroll" }}>
                {accounts.length === 0 && <p style={{ color: "#666" }}>No accounts yet. Add one below.</p>}
                {accounts.map((acc) => (
                    <div
                        key={acc.name}
                        style={{
                            background: "white",
                            padding: "12px",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "start",
                                marginBottom: "4px",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: "bold", marginTop: "4px" }}>{acc.name}</div>
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
                                    {acc.uri}
                                </div>
                            </div>
                            <button
                                onClick={() => void handleDelete(acc.name)}
                                style={{
                                    border: "none",
                                    background: "none",
                                    color: "red",
                                    cursor: "pointer",
                                    fontSize: "200%",
                                }}
                            >
                                🗑
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
                        placeholder="otpauth://..."
                        value={newAccountUri}
                        onInput={(e) => {
                            setNewAccountUri(e.currentTarget.value);
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
