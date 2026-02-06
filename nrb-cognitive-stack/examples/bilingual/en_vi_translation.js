'use strict';

/**
 * EN/VI Translation — Example of bilingual processing.
 */

const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const { generateSurface } = require('../../cop/surface/surface_generator_adapter');
const lexiconEn = require('../../cop/cil_runtime/lexicons/lexicon_en.json');
const lexiconVi = require('../../cop/cil_runtime/lexicons/lexicon_vi.json');
const templateMap = require('../../cop/surface/template_map.json');

const examples = [
  { text: 'please help me', lexicon: lexiconEn, lang: 'EN' },
  { text: 'xin giúp tôi', lexicon: lexiconVi, lang: 'VI' }
];

console.log('Bilingual Processing Examples\n');

for (const { text, lexicon, lang } of examples) {
  const frame = runPipeline(text, { lexicon });
  const surface = generateSurface(frame, templateMap);
  console.log(`[${lang}] Input: "${text}"`);
  console.log(`  Language detected: ${frame.language}`);
  console.log(`  Surface output: "${surface.surface_text}"`);
  console.log('');
}
