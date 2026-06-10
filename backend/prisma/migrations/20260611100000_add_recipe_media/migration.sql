-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "thumbnailStoredName" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "thumbnailOriginalName" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "thumbnailMimeType" TEXT;

-- CreateTable
CREATE TABLE "RecipeAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecipeAttachment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RecipeAttachment_recipeId_idx" ON "RecipeAttachment"("recipeId");
