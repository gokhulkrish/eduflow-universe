export async function generatePdfOnServer(serverUrl: string, data: any, qrBase64?: string) {
  const server = String(serverUrl).replace(/\/$/, "");
  const res = await fetch(`${server}/certificates/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, qrBase64 }),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  return blob;
}

export async function generateSignedPdfOnServer(serverUrl: string, data: any, qrBase64?: string) {
  const server = String(serverUrl).replace(/\/$/, "");
  const res = await fetch(`${server}/certificates/generate-signed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, qrBase64 }),
  });
  if (!res.ok) throw new Error(await res.text());
  const signature = res.headers.get('x-certificate-signature');
  const blob = await res.blob();
  return { blob, signature };
}
