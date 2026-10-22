// getRandomValues also works on HTTP LAN pages, where randomUUID may be unavailable.
export function createCustomerId() {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    crypto.getRandomValues(new Uint8Array(20)),
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
}
