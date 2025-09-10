// Minimal LNURL-P / Lightning Address resolver
// Given a lightning address like name@domain.com and amount in sats,
// fetch an invoice (BOLT11) from the receiver's LNURL pay server.

export async function fetchInvoiceFromLightningAddress(lightningAddress: string, amountSats: number, comment?: string): Promise<string> {
  const [name, domain] = lightningAddress.split("@");
  if (!name || !domain) throw new Error("Invalid lightning address");

  const lnurlp = `https://${domain}/.well-known/lnurlp/${name}`;
  const res = await fetch(lnurlp);
  if (!res.ok) throw new Error("Failed to resolve lightning address");
  const data = await res.json();
  if (!data?.callback) throw new Error("Invalid LNURLP response");

  const amountMsat = Math.max(1, Math.floor(amountSats * 1000));
  const url = new URL(data.callback);
  url.searchParams.set("amount", String(amountMsat));
  if (comment) url.searchParams.set("comment", comment);

  const prRes = await fetch(url.toString());
  if (!prRes.ok) throw new Error("Failed to fetch invoice");
  const prData = await prRes.json();
  if (!prData?.pr) throw new Error("Invalid invoice response");
  return prData.pr as string;
}
