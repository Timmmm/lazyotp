export interface Account {
    name: string;
    // Token URI (toptauth://...).
    uri: string;
    // Counter for HOTP tokens.
    counter: number;
}
