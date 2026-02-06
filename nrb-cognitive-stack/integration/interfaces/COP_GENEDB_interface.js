'use strict';

/**
 * COP ↔ GeneDB Interface — Memory recall and store operations.
 */

function recallGenes(geneDB, query) {
  if (query.hash) {
    const gene = geneDB.retrieve(query.hash);
    return gene ? [gene] : [];
  }
  if (query.type) {
    return geneDB.retrieveByType(query.type);
  }
  return geneDB.getAll();
}

function storeGene(geneDB, data, source) {
  return geneDB.store(data, source || 'runtime');
}

module.exports = { recallGenes, storeGene };
