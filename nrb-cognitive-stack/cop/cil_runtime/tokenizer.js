'use strict';

/**
 * CIL Runtime Tokenizer — Input segmentation and normalization.
 */

function detectLanguage(text) {
  const viPattern = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;
  return viPattern.test(text) ? 'vi' : 'en';
}

function normalize(text) {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function tokenize(input) {
  const normalized = normalize(input);
  const language = detectLanguage(normalized);
  const tokens = normalized.split(/\s+/).map((raw, index) => ({
    raw,
    index,
    language
  }));
  return {
    original: input,
    normalized,
    language,
    tokens,
    token_count: tokens.length
  };
}

module.exports = { tokenize, detectLanguage, normalize };
