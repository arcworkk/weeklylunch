import { ImgHTMLAttributes, useEffect, useState } from "react";
import { apiBlob } from "../services/api";
import { ImageIcon } from "./ActionIcons";

type AuthenticatedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null;
  fallbackClassName?: string;
};

export const AuthenticatedImage = ({
  src,
  alt,
  className,
  fallbackClassName = "recipe-media-fallback",
  ...props
}: AuthenticatedImageProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let nextObjectUrl: string | null = null;

    if (!src) {
      setObjectUrl(null);
      return;
    }

    void apiBlob(src)
      .then((blob) => {
        if (!active) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => active && setObjectUrl(null));

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [src]);

  if (!objectUrl) {
    return (
      <div className={fallbackClassName} role="img" aria-label={alt || "Recette sans image"}>
        <ImageIcon />
      </div>
    );
  }

  return <img {...props} src={objectUrl} alt={alt} className={className} />;
};
