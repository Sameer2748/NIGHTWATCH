-- CreateTable
CREATE TABLE "StatusPage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StatusPageToWebsite" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StatusPageToWebsite_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusPage_slug_key" ON "StatusPage"("slug");

-- CreateIndex
CREATE INDEX "_StatusPageToWebsite_B_index" ON "_StatusPageToWebsite"("B");

-- AddForeignKey
ALTER TABLE "StatusPage" ADD CONSTRAINT "StatusPage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusPageToWebsite" ADD CONSTRAINT "_StatusPageToWebsite_A_fkey" FOREIGN KEY ("A") REFERENCES "StatusPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusPageToWebsite" ADD CONSTRAINT "_StatusPageToWebsite_B_fkey" FOREIGN KEY ("B") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
