import { useEffect, useState } from "react";
import { apiBlob } from "../services/api";
import { RecipeAttachment } from "../types/recipe";
import { DeleteIcon, DownloadIcon, PaperclipIcon } from "./ActionIcons";

type AttachmentPreviewProps = {
  attachment?: RecipeAttachment;
  file?: File;
  onRemove?: () => void;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

export const AttachmentPreview = ({ attachment, file, onRemove }: AttachmentPreviewProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState("");
  const [loading, setLoading] = useState(Boolean(attachment));
  const [previewError, setPreviewError] = useState(false);
  const mimeType = file?.type || attachment?.mimeType || "application/octet-stream";
  const fileName = file?.name || attachment?.originalName || "Piece jointe";
  const fileSize = file?.size || attachment?.size || 0;

  useEffect(() => {
    let active = true;
    let previewUrl: string | null = null;

    const loadPreview = async () => {
      setLoading(true);
      setTextPreview("");
      setPreviewError(false);

      try {
        const blob = file ?? (attachment ? await apiBlob(attachment.url) : null);
        if (!blob || !active) return;

        previewUrl = URL.createObjectURL(blob);
        setObjectUrl(previewUrl);

        if (mimeType === "text/plain") {
          setTextPreview((await blob.text()).slice(0, 1200));
        }
      } catch {
        if (active) setPreviewError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPreview();

    return () => {
      active = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [attachment, file, mimeType]);

  const download = () => {
    if (!objectUrl) return;
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.click();
  };

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const isText = mimeType === "text/plain";

  return (
    <article className="attachment-preview-card">
      <div className="attachment-preview-media">
        {loading ? (
          <span className="muted">Chargement...</span>
        ) : previewError ? (
          <div className="attachment-file-fallback"><PaperclipIcon /></div>
        ) : isImage && objectUrl ? (
          <img src={objectUrl} alt={`Apercu de ${fileName}`} />
        ) : isPdf && objectUrl ? (
          <iframe src={objectUrl} title={`Apercu de ${fileName}`} />
        ) : isText && textPreview ? (
          <pre>{textPreview}</pre>
        ) : (
          <div className="attachment-file-fallback"><PaperclipIcon /></div>
        )}
      </div>
      <div className="attachment-preview-footer">
        <div className="attachment-preview-copy">
          <strong title={fileName}>{fileName}</strong>
          <span>{formatFileSize(fileSize)}</span>
        </div>
        <div className="attachment-preview-actions">
          {objectUrl && (
            <button type="button" className="secondary-button icon-button" aria-label={`Telecharger ${fileName}`} title="Telecharger" onClick={download}>
              <DownloadIcon />
            </button>
          )}
          {onRemove && (
            <button type="button" className="danger-button icon-button" aria-label={`Retirer ${fileName}`} title="Retirer" onClick={onRemove}>
              <DeleteIcon />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
