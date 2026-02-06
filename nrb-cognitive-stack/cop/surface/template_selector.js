'use strict';

/**
 * Template Selector — Selects appropriate response template based on Meaning Frame.
 */

function selectTemplate(meaningFrame, templateMap) {
  const intent = meaningFrame.intent;
  const language = meaningFrame.language || 'en';
  const urgency = meaningFrame.urgency || 0;

  if (!templateMap[intent]) {
    return null;
  }

  const langTemplates = templateMap[intent][language];
  if (!langTemplates) {
    return null;
  }

  // Select urgent template if urgency >= 4
  if (urgency >= 4 && langTemplates.urgent) {
    return langTemplates.urgent;
  }

  return langTemplates.default || null;
}

module.exports = { selectTemplate };
