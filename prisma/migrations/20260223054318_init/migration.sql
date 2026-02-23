-- CreateTable
CREATE TABLE "Aduan" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "nim" TEXT,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aduan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendaftaran" (
    "id" TEXT NOT NULL,
    "firstChoice" TEXT NOT NULL,
    "secondChoice" TEXT,
    "fullName" TEXT NOT NULL,
    "nim" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "instagram" TEXT,
    "motivation" TEXT,
    "experience" TEXT,
    "availability" TEXT[],
    "portfolio" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pendaftaran_pkey" PRIMARY KEY ("id")
);
