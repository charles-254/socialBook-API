/*
  Warnings:

  - The primary key for the `comments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `comment_id` column on the `comments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "comments" DROP CONSTRAINT "comments_pkey",
DROP COLUMN "comment_id",
ADD COLUMN     "comment_id" SERIAL NOT NULL,
ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("comment_id");
