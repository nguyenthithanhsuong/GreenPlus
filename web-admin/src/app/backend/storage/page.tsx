"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SignedUploadResponse = {
  bucket: string;
  path: string;
  token: string;
};

export default function BackendStoragePage() {
  const [bucket, setBucket] = useState("product-images");
  const [folder, setFolder] = useState("products");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const generatedPath = useMemo(() => {
    if (!file) return "";
    const timestamp = Date.now();
    const cleanFolder = folder.trim().replace(/^\/+|\/+$/g, "");
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;
    return cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
  }, [file, folder]);

  const uploadFile = async () => {
    setError(null);
    setResult(null);

    if (!file) {
      setError("Please choose a file");
      return;
    }

    if (!bucket.trim()) {
      setError("Bucket is required");
      return;
    }

    if (!generatedPath) {
      setError("Could not generate file path");
      return;
    }

    setUploading(true);
    try {
      const signedResponse = await fetch("/api/storage/signed-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket: bucket.trim(),
          path: generatedPath,
        }),
      });

      const signedData = (await signedResponse.json()) as SignedUploadResponse | { error: string };
      if (!signedResponse.ok) {
        const message = "error" in signedData ? signedData.error : "Cannot create signed upload URL";
        throw new Error(message);
      }

      const { data, error: uploadError } = await supabase.storage
        .from(bucket.trim())
        .uploadToSignedUrl(generatedPath, (signedData as SignedUploadResponse).token, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setResult({
        uploaded: true,
        bucket: bucket.trim(),
        path: generatedPath,
        storageResponse: data,
      });
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-semibold">Storage Signed Upload Test</h1>
          <p className="mt-2 text-sm text-slate-600">
            Requests a signed upload token from server API and uploads file with browser client.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Bucket</span>
              <input
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2"
                placeholder="product-images"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Folder (optional)</span>
              <input
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2"
                placeholder="products"
              />
            </label>
          </div>

          <label className="text-sm block">
            <span className="mb-1 block font-medium">File</span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          {generatedPath && (
            <p className="text-xs text-slate-600">
              Upload path: <span className="font-mono">{generatedPath}</span>
            </p>
          )}

          <button
            onClick={() => {
              void uploadFile();
            }}
            disabled={uploading}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload via Signed URL"}
          </button>

          {error && <p className="text-sm text-rose-700">{error}</p>}
          {result && <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>}
        </section>
      </div>
    </main>
  );
}
