'use strict';

/**
 * Hello COP — Simple COP usage example.
 */

const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const { generateSurface } = require('../../cop/surface/surface_generator_adapter');
const lexicon = require('../../cop/cil_runtime/lexicons/lexicon_en.json');
const templateMap = require('../../cop/surface/template_map.json');

// Process a simple input
const input = 'please help me';
console.log(`Input: "${input}"\n`);

// Run CIL Runtime
const meaningFrame = runPipeline(input, { lexicon });
console.log('Meaning Frame:');
console.log(JSON.stringify(meaningFrame, null, 2));

// Generate surface output
const surface = generateSurface(meaningFrame, templateMap);
console.log('\nSurface Output:');
console.log(JSON.stringify(surface, null, 2));
