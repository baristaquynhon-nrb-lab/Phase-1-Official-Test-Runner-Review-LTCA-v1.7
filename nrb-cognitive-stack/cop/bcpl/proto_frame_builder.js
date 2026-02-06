'use strict';

/**
 * BCPL Proto Frame Builder — Constructs proto-frames from aligned, tagged data.
 */

function buildProtoFrame(alignedPair, enTags, viTags) {
  return {
    type: 'proto_frame',
    en: {
      text: alignedPair.en,
      tags: enTags
    },
    vi: {
      text: alignedPair.vi,
      tags: viTags
    },
    alignment_score: null,
    created: new Date().toISOString()
  };
}

function buildProtoFrameBatch(alignedPairs, tagSets) {
  return alignedPairs.map((pair, i) => {
    const tags = tagSets[i] || { en: [], vi: [] };
    return buildProtoFrame(pair, tags.en, tags.vi);
  });
}

module.exports = { buildProtoFrame, buildProtoFrameBatch };
