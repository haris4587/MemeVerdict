/** On-chain strings are untrusted; never turn a script/data URL into a link. */
export function evidenceHref(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href : undefined;
  } catch { return undefined; }
}
