'use strict';

/**
 * Cultural Adaptation — Example of culture-aware response generation.
 */

const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const { generateSurface } = require('../../cop/surface/surface_generator_adapter');
const lexiconEn = require('../../cop/cil_runtime/lexicons/lexicon_en.json');
const lexiconVi = require('../../cop/cil_runtime/lexicons/lexicon_vi.json');
const templateMap = require('../../cop/surface/template_map.json');

console.log('Cultural Adaptation Examples\n');

// Same intent, different cultural context
const enFrame = runPipeline('I want to pray', { lexicon: lexiconEn });
const viFrame = runPipeline('tôi muốn cầu nguyện', { lexicon: lexiconVi });

const enSurface = generateSurface(enFrame, templateMap);
const viSurface = generateSurface(viFrame, templateMap);

console.log('[EN] Prayer request:');
console.log(`  Input: "I want to pray"`);
console.log(`  Response: "${enSurface.surface_text}"`);
console.log('');
console.log('[VI] Prayer request:');
console.log(`  Input: "tôi muốn cầu nguyện"`);
console.log(`  Response: "${viSurface.surface_text}"`);
