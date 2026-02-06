'use strict';

/**
 * BCPL Tagger — POS and semantic tagging for bilingual tokens.
 */

function tagToken(token, language) {
  return {
    token,
    language,
    pos: null,       // To be assigned by POS tagger
    semantic: null,  // To be assigned by semantic tagger
    timestamp: Date.now()
  };
}

function tagSentence(tokens, language) {
  return tokens.map(token => tagToken(token, language));
}

module.exports = { tagToken, tagSentence };
