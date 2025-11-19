# LazyOTP

Sometimes I am forced to use OTP (e.g. Google Authenticator), but I really don't want the hassle nor do I need the marginal extra security. I made this Chrome extension to deal with those situations.

It stores OTP secret tokens unencrypted in the browser, and you can insert a generated code into any edit box by right-clicking it. No tedious phone-digging required!

You probably shouldn't use this unless you understand the security implications.

## How to use it

1. Install from the Chrome Extension store.
2. Pin the extension.
3. Navigate to the OTP registration page that shows you a QR code.
4. Click the extension, then the QR code icon to auto-fill (or you can manually fill in the details if you know the secret). The account name doesn't matter; it's just for your reference.
5. When prompted for a OTP, right-click the edit box and select your account. It should enter the code.

## Why does it need access to all websites?

OTP is used everywhere so there aren't specific websites that this can be limited to.

## Developing

1. `npm install`
2. `npm run build`
3. In Chrome, Manage Extensions, enable Developer Mode (top right), then Install Unpacked (top left), then select the `dist` directory.
