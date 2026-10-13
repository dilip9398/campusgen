"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { avatarPresets, avatarUrl } from "@/lib/constants";

interface PhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  name?: string;
  label?: string;
}

function compressImage(file: File, maxWidth = 500, quality = 0.82): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, dataUrl });
          else reject(new Error("Image compression failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image"));
    };
    img.src = objectUrl;
  });
}

export function PhotoUpload({ value, onChange, name, label = "Your profile photo" }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = value || avatarUrl("Campus Kin");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setIsUploading(true);

    try {
      // 1. Client-side canvas compression down to ~40KB
      const { blob, dataUrl } = await compressImage(file);
      // Immediate local preview so UI updates without lag
      onChange(dataUrl);

      // 2. Upload compressed blob to /api/upload
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.url) {
        onChange(data.url);
      }
    } catch (err: unknown) {
      console.warn("Upload notice:", err);
      // Keep working preview even if remote upload encountered a temporary hiccup
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = "";
    }
  }

  return (
    <div className="photo-upload-container">
      <span className="form-label">{label}</span>
      <div className="photo-upload-main">
        <div className="photo-upload-preview">
          <img
            src={preview}
            alt="Profile photo preview"
            className="photo-upload-img"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {isUploading && (
            <div className="photo-upload-spinner" aria-label="Uploading...">
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}
        </div>

        <div className="photo-upload-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            aria-label="Upload photo from device"
          />

          <button
            type="button"
            className="device-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera size={16} />
            <span>{isUploading ? "Compressing & uploading..." : "Choose from device"}</span>
          </button>

          <p className="photo-upload-hint">
            PNG, JPG or WEBP from your phone or laptop.
          </p>

          <div className="preset-selector">
            <span className="preset-label">
              <Sparkles size={12} /> Or pick a preset:
            </span>
            <div className="preset-row">
              {avatarPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={value === avatarUrl(preset) ? "avatar-preset is-picked" : "avatar-preset"}
                  onClick={() => onChange(avatarUrl(preset))}
                  aria-label={`Use ${preset} avatar`}
                  title={`${preset} avatar`}
                >
                  <img src={avatarUrl(preset)} alt="" width={32} height={32} style={{ borderRadius: "50%" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {name && <input type="hidden" name={name} value={value} required />}
      {uploadError && <p className="form-alert">{uploadError}</p>}
    </div>
  );
}
