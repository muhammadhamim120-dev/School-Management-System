// Client-side file upload helper. Uses the generic /api/upload endpoint and
// returns the public URL of the stored file. Bypasses the JSON api-client
// (which hard-sets Content-Type) so the browser can set the multipart boundary.

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Upload failed");
  return json.data.url as string;
}
