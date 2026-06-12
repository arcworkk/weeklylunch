import "dotenv/config";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { recipeThumbnailCatalog } from "../data/recipeThumbnailCatalog";
import { uploadRoot } from "../utils/recipeMedia";
import { prisma } from "../utils/prisma";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const USER_AGENT = "WeeklyLunch/1.0 recipe-thumbnail-import";
const extensionsByMimeType: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const wait = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const downloadImage = async (imageUrl: string) => {
  let response: Response | null = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    response = await fetch(imageUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(30_000)
    });

    if (response.ok || (response.status !== 429 && response.status < 500)) {
      break;
    }

    await response.body?.cancel();
    const retryAfter = Number(response.headers.get("retry-after") ?? 0) * 1_000;
    await wait(Math.max(retryAfter, attempt * 5_000));
  }

  if (!response?.ok) {
    throw new Error(`Image download failed with status ${response?.status ?? "unknown"}`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
  const extension = extensionsByMimeType[mimeType];

  if (!extension) {
    throw new Error(`Unsupported image type: ${mimeType || "unknown"}`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_SIZE) {
    throw new Error("Image exceeds the 10 MB limit");
  }

  const image = Buffer.from(await response.arrayBuffer());
  if (image.length === 0 || image.length > MAX_IMAGE_SIZE) {
    throw new Error("Downloaded image is empty or exceeds the 10 MB limit");
  }

  return { image, extension, mimeType };
};

const main = async () => {
  await fs.mkdir(uploadRoot, { recursive: true });

  let imported = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const entry of recipeThumbnailCatalog) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: entry.recipeId },
      select: { id: true, title: true, thumbnailStoredName: true }
    });

    if (!recipe || recipe.title !== entry.recipeTitle) {
      skipped += 1;
      continue;
    }

    if (recipe.thumbnailStoredName) {
      skipped += 1;
      continue;
    }

    let storedName: string | null = null;

    try {
      const { image, extension, mimeType } = await downloadImage(entry.imageUrl);
      storedName = `${randomUUID()}${extension}`;
      const temporaryPath = path.join(uploadRoot, `.${storedName}.tmp`);
      const storedPath = path.join(uploadRoot, storedName);

      await fs.writeFile(temporaryPath, image, { flag: "wx" });
      await fs.rename(temporaryPath, storedPath);

      const result = await prisma.recipe.updateMany({
        where: { id: recipe.id, thumbnailStoredName: null },
        data: {
          thumbnailStoredName: storedName,
          thumbnailOriginalName: `${recipe.id}${extension}`,
          thumbnailMimeType: mimeType
        }
      });

      if (result.count === 0) {
        await fs.rm(storedPath, { force: true });
        skipped += 1;
        continue;
      }

      imported += 1;
      console.log(`Thumbnail added: ${recipe.title}`);
      await wait(1_000);
    } catch (error) {
      if (storedName) {
        await fs.rm(path.join(uploadRoot, storedName), { force: true }).catch(() => undefined);
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push(`${recipe.title}: ${message}`);
    }
  }

  console.log(`Recipe thumbnails: ${imported} added, ${skipped} skipped`);

  if (failures.length > 0) {
    throw new Error(`Unable to import ${failures.length} thumbnail(s):\n${failures.join("\n")}`);
  }
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to enrich recipe thumbnails");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
