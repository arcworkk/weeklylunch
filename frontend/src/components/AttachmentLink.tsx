import { MouseEvent, useState } from "react";
import { apiBlob } from "../services/api";
import { RecipeAttachment } from "../types/recipe";
import { PaperclipIcon } from "./ActionIcons";

export const AttachmentLink = ({ attachment }: { attachment: RecipeAttachment }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const blob = await apiBlob(attachment.url);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.originalName;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="attachment-link" disabled={loading} onClick={handleDownload}>
      <PaperclipIcon />
      <span>{attachment.originalName}</span>
    </button>
  );
};
