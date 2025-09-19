import { baseSystemPrompt, personaPrompts, buildSystemPrompt, interviewModePrompt } from "../lib/hume";

test("baseSystemPrompt includes required sections", () => {
  expect(baseSystemPrompt).toMatch(/GOAL/);
  expect(baseSystemPrompt).toMatch(/REQUIRED FIELDS/);
  expect(baseSystemPrompt).toMatch(/OUTPUT/);
});

test("persona includes cynical", () => {
  expect(Object.keys(personaPrompts)).toContain("cynical");
});

test("buildSystemPrompt concatenates persona and interview mode", () => {
  const out = buildSystemPrompt("professional", true);
  expect(out).toContain(baseSystemPrompt);
  expect(out).toContain(personaPrompts.professional);
  expect(out).toContain(interviewModePrompt);
});
