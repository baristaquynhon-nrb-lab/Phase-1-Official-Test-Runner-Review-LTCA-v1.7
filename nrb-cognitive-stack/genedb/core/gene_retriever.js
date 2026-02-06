'use strict';

/**
 * Gene Retriever — Retrieves genes from GeneDB storage.
 */

function retrieveByHash(geneStore, hash) {
  const gene = geneStore.find(g => g.hash === hash);
  if (gene) {
    gene.access_count = (gene.access_count || 0) + 1;
    gene.last_accessed = new Date().toISOString();
  }
  return gene || null;
}

function retrieveByType(geneStore, dataType) {
  return geneStore.filter(g => g.data && g.data.type === dataType);
}

function retrieveAll(geneStore) {
  return geneStore.sort((a, b) => a.hash.localeCompare(b.hash));
}

module.exports = { retrieveByHash, retrieveByType, retrieveAll };
