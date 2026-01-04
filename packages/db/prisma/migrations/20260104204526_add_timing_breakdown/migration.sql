-- AlterTable
ALTER TABLE "WebsiteTick" ADD COLUMN     "dns_time_ms" INTEGER,
ADD COLUMN     "download_time_ms" INTEGER,
ADD COLUMN     "tcp_time_ms" INTEGER,
ADD COLUMN     "tls_time_ms" INTEGER,
ADD COLUMN     "ttfb_ms" INTEGER;
