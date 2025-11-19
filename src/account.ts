export interface Account {
    id: string;
    name: string;
    // Secret in base32.
    secret: string;
}
