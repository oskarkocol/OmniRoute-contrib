import test from "node:test";
import assert from "node:assert/strict";

import { getModelsByProviderId } from "../../open-sse/config/providerModels.ts";
import { getModelSpec } from "../../src/shared/constants/modelSpecs.ts";
import { getPricingForModel } from "../../src/shared/constants/pricing.ts";

const EXPECTED_MODELS = ["gpt-5.6", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"];

test("OpenAI API catalog exposes the public GPT-5.6 family and keeps GPT-5.4", () => {
  const models = getModelsByProviderId("openai");

  assert.deepEqual(
    models.slice(0, EXPECTED_MODELS.length).map((model) => model.id),
    EXPECTED_MODELS
  );

  for (const modelId of EXPECTED_MODELS) {
    const model = models.find((entry) => entry.id === modelId);
    assert.ok(model, `openai must expose ${modelId}`);
    assert.equal(model.contextLength, 1050000);
    assert.equal(model.maxInputTokens, 922000);
    assert.equal(model.maxOutputTokens, 128000);
    assert.equal(model.toolCalling, true);
    assert.equal(model.supportsReasoning, true);
    assert.equal(model.supportsVision, true);

    const spec = getModelSpec(modelId);
    assert.equal(spec?.contextWindow, 1050000);
    assert.equal(spec?.maxOutputTokens, 128000);
  }

  for (const retainedModelId of ["gpt-5.4", "gpt-5.4-pro", "gpt-5.4-mini", "gpt-5.4-nano"]) {
    assert.ok(
      models.some((model) => model.id === retainedModelId),
      `${retainedModelId} must remain`
    );
  }
});

test("OpenAI API GPT-5.6 pricing matches the published standard tier", () => {
  const expectedPricing = {
    "gpt-5.6": { input: 2, cached: 0.2, cache_creation: 2.5, output: 10 },
    "gpt-5.6-sol": { input: 2, cached: 0.2, cache_creation: 2.5, output: 10 },
    "gpt-5.6-terra": { input: 2, cached: 0.2, cache_creation: 2.5, output: 12 },
    "gpt-5.6-luna": { input: 0.2, cached: 0.02, cache_creation: 0.25, output: 1.2 },
  };

  for (const [modelId, expected] of Object.entries(expectedPricing)) {
    const pricing = getPricingForModel("openai", modelId);
    assert.ok(pricing, `missing openai pricing for ${modelId}`);
    assert.equal(pricing.input, expected.input, `${modelId} input`);
    assert.equal(pricing.cached, expected.cached, `${modelId} cached`);
    assert.equal(pricing.cache_creation, expected.cache_creation, `${modelId} cache creation`);
    assert.equal(pricing.output, expected.output, `${modelId} output`);
  }
});
