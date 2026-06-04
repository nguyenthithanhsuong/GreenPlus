"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, PlaySquare, X } from "lucide-react";

type GreenPostType = "blog" | "video" | "community";

type CreatePostModalProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; content: string; type: GreenPostType; files: File[] }) => Promise<void>;
};

const inferTypeFromFiles = (files: File[]): GreenPostType => {
  if (files.some((file) => file.type.startsWith("video/"))) {
    return "video";
  }

  if (files.some((file) => file.type.startsWith("image/"))) {
    return "blog";
  }

  return "community";
};

const CreatePostModal = ({ open, loading, onClose, onSubmit }: CreatePostModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inferredType = useMemo(() => inferTypeFromFiles(files), [files]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFiles([]);
    setError(null);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);

    if (!selected.length) {
      setFiles([]);
      setError(null);
      return;
    }

    const imageCount = selected.filter((item) => item.type.startsWith("image/")).length;
    const videoCount = selected.filter((item) => item.type.startsWith("video/")).length;
    const unknownCount = selected.length - imageCount - videoCount;

    if (unknownCount > 0) {
      setError("Chỉ hỗ trợ tệp ảnh hoặc video.");
      return;
    }

    if (videoCount > 1) {
      setError("Chỉ được chọn tối đa 1 video.");
      return;
    }

    if (videoCount === 1 && imageCount > 0) {
      setError("Không thể chọn video và ảnh cùng lúc.");
      return;
    }

    setError(null);
    setFiles(selected);
  };

  const submit = async () => {
    if (!content.trim()) {
      setError("Nội dung bài viết là bắt buộc.");
      return;
    }

     setError(null);

  await onSubmit({
    title: title.trim(),
    content: content.trim(),
    type: inferredType,
    files,
  });

  resetForm();
  };

  const previewUrls = useMemo(
  () =>
    files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    })),
  [files]
);

useEffect(() => {
  return () => {
    previewUrls.forEach(({ url }) => URL.revokeObjectURL(url));
  };
}, [previewUrls]);

if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Đóng modal tạo bài"
        onClick={() => {
  resetForm();
  onClose();
}}
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tạo bài Green Creator mới</h3>
            <p className="text-sm text-gray-500">Bài mới sẽ ở trạng thái pending sau khi đăng.</p>
          </div>
          <button
            type="button"
            onClick={() => {
  resetForm();
  onClose();
}}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700" htmlFor="gc-title">
              Tiêu đề
            </label>
            <input
              id="gc-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-400"
              placeholder="Nhập tiêu đề bài viết"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700" htmlFor="gc-content">
              Nội dung
            </label>
            <textarea
              id="gc-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={1000}
              rows={5}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-400"
              placeholder="Nhập nội dung bài viết"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{content.length}/1000 ký tự</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700" htmlFor="gc-files">
              Tệp đính kèm (tùy chọn)
            </label>
            <input
              id="gc-files"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={onFileChange}
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {files.length ? `Đã chọn ${files.length} tệp` : "Chưa chọn tệp"} • Loại tự động: {inferredType}
            </p>
          </div>

          {previewUrls.length ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-700">Xem trước</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {previewUrls.map(({ file, url }, index) => {
                  const currentFile = file;
                  if (!currentFile) {
                    return null;
                  }

                  return (
                    <div key={`${currentFile.name}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {currentFile.type.startsWith("image/") ? (
                        <img src={url} alt={currentFile.name} className="h-40 w-full object-cover" />
                      ) : currentFile.type.startsWith("video/") ? (
                        <video src={url} controls playsInline preload="metadata" className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-40 items-center justify-center text-gray-400">Không hỗ trợ xem trước</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {inferredType === "video" ? <PlaySquare className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
  resetForm();
  onClose();
}}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Đăng bài"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
