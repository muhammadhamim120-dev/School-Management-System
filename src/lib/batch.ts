import { PrismaClient } from "@prisma/client";

// Batch database operation utilities for better performance

/**
 * Batch upsert multiple records using transactions
 * More efficient than individual upserts in a loop
 */
export async function batchUpsert<T extends { id?: string }>(
  prisma: PrismaClient,
  model: string,
  records: T[],
  uniqueFields: string[],
  batchSize: number = 100
): Promise<number> {
  let totalAffected = 0;

  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map((record) => {
        const where: Record<string, unknown> = {};
        uniqueFields.forEach((field) => {
          where[field] = (record as Record<string, unknown>)[field];
        });

        return (prisma as any)[model].upsert({
          where,
          update: record,
          create: record,
        });
      })
    );

    totalAffected += batch.length;
  }

  return totalAffected;
}

/**
 * Batch update multiple records using transactions
 * More efficient than individual updates in a loop
 */
export async function batchUpdate<T extends { id: string }>(
  prisma: PrismaClient,
  model: string,
  records: T[],
  batchSize: number = 100
): Promise<number> {
  let totalAffected = 0;

  // Process in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map((record) => {
        const { id, ...data } = record;
        return (prisma as any)[model].update({
          where: { id },
          data,
        });
      })
    );

    totalAffected += batch.length;
  }

  return totalAffected;
}

/**
 * Batch create multiple records using createMany
 * Most efficient for inserting new records
 */
export async function batchCreate<T>(
  prisma: PrismaClient,
  model: string,
  records: T[],
  batchSize: number = 1000
): Promise<number> {
  let totalCreated = 0;

  // Process in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const result = await (prisma as any)[model].createMany({
      data: batch,
      skipDuplicates: true,
    });

    totalCreated += result.count;
  }

  return totalCreated;
}

/**
 * Batch delete multiple records
 */
export async function batchDelete(
  prisma: PrismaClient,
  model: string,
  ids: string[],
  batchSize: number = 100
): Promise<number> {
  let totalDeleted = 0;

  // Process in batches
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    await (prisma as any)[model].deleteMany({
      where: { id: { in: batch } },
    });

    totalDeleted += batch.length;
  }

  return totalDeleted;
}

/**
 * Execute a batch operation with progress callback
 */
export async function batchWithProgress<T>(
  items: T[],
  processor: (batch: T[]) => Promise<void>,
  batchSize: number = 100,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const total = items.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
    onProgress?.(Math.min(i + batchSize, total), total);
  }
}
