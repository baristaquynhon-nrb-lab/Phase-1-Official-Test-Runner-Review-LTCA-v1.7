'use strict';

/**
 * Memory Consolidator — Merges, deduplicates, and prunes gene storage.
 */

function deduplicateGenes(geneStore) {
  const seen = new Map();
  const deduplicated = [];

  for (const gene of geneStore) {
    if (!seen.has(gene.hash)) {
      seen.set(gene.hash, gene);
      deduplicated.push(gene);
    }
  }

  return {
    genes: deduplicated,
    duplicates_removed: geneStore.length - deduplicated.length
  };
}

function pruneStale(geneStore, maxAge) {
  const cutoff = Date.now() - maxAge;
  const pruned = geneStore.filter(gene => {
    if (gene.source === 'bcpl') return true; // Never prune BCPL genes
    const encodedAt = new Date(gene.encoded_at).getTime();
    return encodedAt > cutoff;
  });

  return {
    genes: pruned,
    pruned_count: geneStore.length - pruned.length
  };
}

function consolidate(geneStore, options = {}) {
  let result = deduplicateGenes(geneStore);
  if (options.maxAge) {
    const pruneResult = pruneStale(result.genes, options.maxAge);
    result.genes = pruneResult.genes;
    result.pruned_count = pruneResult.pruned_count;
  }
  return result;
}

module.exports = { deduplicateGenes, pruneStale, consolidate };
