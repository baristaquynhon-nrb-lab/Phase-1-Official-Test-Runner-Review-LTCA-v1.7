'use strict';

const { encodeGene } = require('./gene_encoder');
const { retrieveByHash, retrieveByType, retrieveAll } = require('./gene_retriever');
const { consolidate } = require('./memory_consolidator');

/**
 * GeneDB Engine — Main coordinator for the GeneDB memory subsystem.
 */

class GeneDBEngine {
  constructor() {
    this.store = [];
  }

  store(data, source) {
    const gene = encodeGene(data, source);
    this.store.push(gene);
    return gene;
  }

  retrieve(hash) {
    return retrieveByHash(this.store, hash);
  }

  retrieveByType(dataType) {
    return retrieveByType(this.store, dataType);
  }

  getAll() {
    return retrieveAll(this.store);
  }

  consolidate(options) {
    const result = consolidate(this.store, options);
    this.store = result.genes;
    return result;
  }

  size() {
    return this.store.length;
  }
}

module.exports = { GeneDBEngine };
