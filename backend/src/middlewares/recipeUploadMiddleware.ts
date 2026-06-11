import { randomUUID } from "node:crypto";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { uploadRoot } from "../utils/recipeMedia";

const imageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/gif",
  "image/avif"
]);
const imageExtensions = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const attachmentExtensions = /\.(?:avif|docx|gif|jpe?g|pdf|png|txt|webp)$/i;
const attachmentTypes = new Set([
  ...imageTypes,
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadRoot,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase().slice(0, 12);
    callback(null, `${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 6,
    fields: 20
  },
  fileFilter: (_req, file, callback) => {
    const allowed =
      file.fieldname === "thumbnail"
        ? imageTypes.has(file.mimetype) || imageExtensions.test(file.originalname)
        : file.fieldname === "attachments" &&
          (attachmentTypes.has(file.mimetype) || attachmentExtensions.test(file.originalname));

    if (!allowed) {
      const error = new Error("Unsupported recipe file type") as Error & { status: number };
      error.status = 400;
      callback(error);
      return;
    }

    callback(null, true);
  }
});

export const recipeUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "attachments", maxCount: 5 }
]);
