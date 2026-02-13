function normalizeId(rawId, index) {
  const normalized = String(rawId || `question_${index + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return normalized || `question_${index + 1}`;
}

export function normalizeQuestions(questions) {
  return questions.map((question, index) => ({
    ...question,
    id: normalizeId(question.id, index),
    label: (question.label || `Question ${index + 1}`).trim(),
    options: Array.isArray(question.options)
      ? question.options.map((option) => String(option).trim()).filter(Boolean)
      : [],
    type: question.type || "single",
    required: Boolean(question.required)
  }));
}

export function buildQuestionnaire(questions) {
  const normalized = normalizeQuestions(questions);
  const properties = {};
  const required = [];

  for (const question of normalized) {
    if (question.type === "text") {
      properties[question.id] = {
        type: "string",
        title: question.label,
        minLength: question.required ? 1 : undefined
      };
    }

    if (question.type === "single") {
      const hasOptions = question.options.length > 0;
      properties[question.id] = {
        type: "string",
        title: question.label,
        ...(hasOptions ? { enum: question.options } : {})
      };
    }

    if (question.type === "multi") {
      const hasOptions = question.options.length > 0;
      properties[question.id] = {
        type: "array",
        title: question.label,
        uniqueItems: true,
        items: {
          type: "string",
          ...(hasOptions ? { enum: question.options } : {})
        },
        minItems: question.required ? 1 : 0
      };
    }

    if (question.required) {
      required.push(question.id);
    }
  }

  const schema = {
    type: "object",
    properties,
    required
  };

  const uischema = {
    type: "VerticalLayout",
    elements: normalized.map((question) => ({
      type: "Control",
      scope: `#/properties/${question.id}`
    }))
  };

  return { schema, uischema, normalizedQuestions: normalized };
}
