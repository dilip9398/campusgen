"use client";

import { useRef, useState } from "react";
import { Camera, Check, Loader2, Sparkles } from "lucide-react";
import { avatarPresets, avatarUrl, formatAvatarUrl } from "@/lib/constants";

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
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return reject(new Error("Canvas context unavailable"));
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve({ blob, dataUrl });
          else reject(new Error("Image compression failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image file"));
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
      // 1. Client-side canvas compression down to ~35KB
      const { blob, dataUrl } = await compressImage(file);
      // Instant local preview
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
      // Keep local compressed preview working even if server encounters a hiccup
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
            src={formatAvatarUrl(preview)}
            alt="Profile photo preview"
            className="photo-upload-img"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = avatarUrl("Campus Kin");
            }}
          />
          {isUploading && (
            <div className="photo-upload-spinner" aria-label="Uploading...">
              <Loader2 className="animate-spin" size={24} />
              <span style={{ fontSize: "11px", marginTop: "4px" }}>Saving...</span>
            </div>
          )}
        </div>

        <div className="photo-upload-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
            aria-label="Upload photo from device"
          />

          <button
            type="button"
            className="device-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera size={16} />
            <span>{isUploading ? "Uploading photo..." : "Upload from device"}</span>
          </button>

          <p className="photo-upload-hint">
            Take a selfie or choose any image from phone or laptop.
          </p>

          <div className="preset-selector">
            <span className="preset-label">
              <Sparkles size={12} /> Or pick a student avatar:
            </span>
            <div className="preset-row">
              {avatarPresets.map((preset) => {
                const presetUrl = avatarUrl(preset);
                const isPicked = value === presetUrl;
                return (
                  <button
                    type="button"
                    key={preset}
                    className={isPicked ? "avatar-preset is-picked" : "avatar-preset"}
                    onClick={() => onChange(presetUrl)}
                    aria-label={`Use ${preset} avatar`}
                    title={`${preset} avatar`}
                  >
                    <img
                      src={presetUrl}
                      alt={preset}
                      width={32}
                      height={32}
                      style={{ borderRadius: "50%" }}
                    />
                    {isPicked && (
                      <span className="preset-check-badge">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {name && <input type="hidden" name={name} value={value || avatarUrl("Campus Kin")} />}
      {uploadError && <p className="form-alert">{uploadError}</p>}
    </div>
  );
}
