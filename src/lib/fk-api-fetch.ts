/** Client-seitiger Fetch für FK-Modul mit /fk Prefix. */
export function fkApiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const url = input.startsWith("/") ? `/fk${input}` : input;
  return fetch(url, { credentials: "include", ...init });
}
