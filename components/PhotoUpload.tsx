"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, Sparkles, Upload } from "lucide-react";
import { avatarPresets, avatarUrl } from "@/lib/constants";

interface PhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  name?: string;
  label?: string;
}

export function PhotoUpload({ value, onChange, name = "avatar_url", label = "Your profile photo" }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = value || avatarUrl("Campus Kin");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setIsUploading(true);

    // Instant local preview
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

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
      console.warn("Upload endpoint warning, retaining local image preview:", err);
      // Even if server upload has an issue, local data URL is already set and working
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
          <Image
            src={preview}
            alt="Profile photo preview"
            fill
            unoptimized
            sizes="110px"
            className="photo-upload-img"
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
            <span>Choose from device</span>
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
                  <Image src={avatarUrl(preset)} alt="" width={32} height={32} unoptimized />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <input type="hidden" name={name} value={value} required />
      {uploadError && <p className="form-alert">{uploadError}</p>}
    </div>
  );
}
