"use client";

import { useMemo, useState } from "react";
import { JsonForms } from "@jsonforms/react";
import { vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { shadcnRenderers } from "@/components/jsonforms/renderers";
import { buildQuestionnaire } from "@/lib/questionnaire";
import { Bot, Database, ListChecks, Plus, Sparkles, Trash2 } from "lucide-react";

const defaultQuestions = [
  {
    id: "purpose",
    label: "What is your goal?",
    type: "single",
    options: ["Buy to live", "Buy as investment", "Rent short-term", "Rent long-term"],
    required: true
  },
  {
    id: "budget_range",
    label: "What is your budget range?",
    type: "single",
    options: ["Under $150,000", "$150,000-$300,000", "$300,000-$600,000", "$600,000+"],
    required: true
  },
  {
    id: "property_type",
    label: "Preferred property type",
    type: "multi",
    options: ["Condo", "Townhouse", "Single-family", "Apartment", "Duplex", "Lot/Land"],
    required: true
  },
  {
    id: "bedrooms",
    label: "How many bedrooms?",
    type: "single",
    options: ["Studio", "1", "2", "3", "4+"],
    required: true
  },
  {
    id: "bathrooms",
    label: "How many bathrooms?",
    type: "single",
    options: ["1", "2", "3+"],
    required: false
  },
  {
    id: "location_preference",
    label: "Preferred location type",
    type: "multi",
    options: ["City center", "Suburban", "Near schools", "Near transport", "Waterfront", "Gated community"],
    required: true
  },
  {
    id: "timeline",
    label: "When do you need to move?",
    type: "single",
    options: ["Immediately", "1-3 months", "3-6 months", "6+ months"],
    required: true
  },
  {
    id: "must_have_amenities",
    label: "Must-have amenities",
    type: "multi",
    options: ["Parking", "Balcony", "Pool", "Pet-friendly", "Gym", "Security", "Elevator", "Furnished"],
    required: false
  }
];

const defaultSources = [
  {
    id: "source_openai",
    name: "OpenAI Recommender",
    provider: "openai",
    endpoint: "https://api.openai.com/v1/responses",
    model: "gpt-4.1-mini",
    weight: 1,
    enabled: true,
    promptTemplate: "Return top 5 recommendation IDs with confidence scores",
    recommendationUniverse: ""
  }
];

const defaultWordBank = [
  { id: "item_1", word: "listing_riverside_2br", enabled: true },
  { id: "item_2", word: "listing_metro_studio", enabled: true },
  { id: "item_3", word: "listing_greenfield_3br", enabled: true },
  { id: "item_4", word: "listing_summit_townhouse", enabled: true },
  { id: "item_5", word: "listing_harbor_condo_lux", enabled: true }
];


function emptyQuestion(index) {
  return {
    id: `question_${index + 1}`,
    label: `Question ${index + 1}`,
    type: "single",
    options: ["Option A", "Option B"],
    required: false
  };
}

function emptySource(index) {
  return {
    id: `source_${index + 1}`,
    name: `Source ${index + 1}`,
    provider: "openai",
    endpoint: "https://api.openai.com/v1/responses",
    model: "gpt-4.1-mini",
    weight: 1,
    enabled: true,
    promptTemplate: "",
    recommendationUniverse: ""
  };
}

export default function HomePage() {
  const [questions, setQuestions] = useState(defaultQuestions);
  const [sources, setSources] = useState(defaultSources);
  const [wordBank, setWordBank] = useState(defaultWordBank);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState([]);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { schema, uischema } = useMemo(() => buildQuestionnaire(questions), [questions]);
  const renderers = useMemo(() => [...vanillaRenderers, ...shadcnRenderers], []);

  const updateQuestion = (index, patch) => {
    setQuestions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateQuestionOptions = (index, text) => {
    updateQuestion(index, { options: text.split("\n") });
  };

  const updateSource = (index, patch) => {
    setSources((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateWord = (index, patch) => {
    setWordBank((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const runRecommendation = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers, sources, wordBank })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed");

      setResult(payload.recommendations || []);
      setIssues(payload.issues || []);
    } catch (runError) {
      setError(runError.message || "Request failed");
      setResult([]);
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const apiPayloadExample = JSON.stringify(
    {
      questions,
      answers,
      sources,
      wordBank
    },
    null,
    2
  );

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8">
      <section className="mb-6 rounded-2xl border border-border/70 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pluggable Recommender Builder</h1>
            <p className="text-sm text-muted-foreground">
              Build dynamic questions, configure AI/word sources, and plug into chatbot or website via API.
            </p>
          </div>
          <Badge variant="secondary" className="gap-2 px-3 py-1">
            <Bot className="h-3.5 w-3.5" /> API-First Engine
          </Badge>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-4 w-4" /> Question Builder
            </CardTitle>
            <CardDescription>Define your dynamic questions and render them live through JSON Forms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div key={`question_${index}`} className="space-y-3 rounded-lg border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Question ID</Label>
                    <Input value={question.id} onChange={(event) => updateQuestion(index, { id: event.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select
                      value={question.type}
                      onChange={(event) =>
                        updateQuestion(index, {
                          type: event.target.value,
                          options: event.target.value === "text" ? [] : question.options
                        })
                      }
                    >
                      <option value="single">Single Select</option>
                      <option value="multi">Multi Select</option>
                      <option value="text">Text</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input value={question.label} onChange={(event) => updateQuestion(index, { label: event.target.value })} />
                </div>

                {question.type !== "text" ? (
                  <div className="space-y-1">
                    <Label>Options (one per line)</Label>
                    <Textarea
                      rows={4}
                      value={(question.options || []).join("\n")}
                      onChange={(event) => updateQuestionOptions(index, event.target.value)}
                    />
                    {(question.options || []).filter((option) => String(option).trim().length > 0).length === 0 ? (
                      <p className="text-xs text-destructive">
                        Add at least 1 option for {question.type === "multi" ? "multi-select" : "single-select"}.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={question.required}
                      onCheckedChange={(value) => updateQuestion(index, { required: Boolean(value) })}
                    />
                    Required
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => setQuestions((prev) => [...prev, emptyQuestion(prev.length)])}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Live Intake</CardTitle>
            <CardDescription>Preview how end users answer your generated questionnaire.</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonForms
              schema={schema}
              uischema={uischema}
              data={answers}
              renderers={renderers}
              cells={vanillaCells}
              onChange={({ data }) => setAnswers(data)}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Database className="h-4 w-4" /> AI Source
            </CardTitle>
            <CardDescription>Configure one or more AI recommendation sources.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.map((source, index) => (
              <div key={`${source.id}_${index}`} className="space-y-3 rounded-lg border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input value={source.name} onChange={(event) => updateSource(index, { name: event.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Provider</Label>
                    <Select value={source.provider} onChange={(event) => updateSource(index, { provider: event.target.value })}>
                      <option value="openai">openai</option>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Endpoint</Label>
                    <Input value={source.endpoint} onChange={(event) => updateSource(index, { endpoint: event.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Model</Label>
                    <Input value={source.model} onChange={(event) => updateSource(index, { model: event.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Prompt Template</Label>
                  <Textarea rows={3} value={source.promptTemplate} onChange={(event) => updateSource(index, { promptTemplate: event.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Candidate Universe (optional, one ID per line)</Label>
                  <Textarea
                    rows={4}
                    placeholder={"product_a\nproduct_b\nproduct_c"}
                    value={source.recommendationUniverse || ""}
                    onChange={(event) => updateSource(index, { recommendationUniverse: event.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={source.enabled} onCheckedChange={(value) => updateSource(index, { enabled: Boolean(value) })} />
                    Enabled
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSources((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => setSources((prev) => [...prev, emptySource(prev.length)])}>
              <Plus className="mr-2 h-4 w-4" /> Add AI Source
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="h-4 w-4" /> Item Source
            </CardTitle>
            <CardDescription>Products/items the AI is allowed to recommend (one item per entry).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wordBank.map((entry, index) => (
              <div key={`${entry.id}_${index}`} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-12">
                <div className="space-y-1 sm:col-span-8">
                  <Label>Item ID or name</Label>
                  <Input
                    placeholder="e.g. product_a"
                    value={entry.word}
                    onChange={(event) => updateWord(index, { word: event.target.value })}
                  />
                </div>
                <div className="flex items-end sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={entry.enabled} onCheckedChange={(value) => updateWord(index, { enabled: Boolean(value) })} />
                    Enabled
                  </label>
                </div>
                <div className="flex items-end sm:col-span-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setWordBank((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => setWordBank((prev) => [...prev, { id: `word_${prev.length + 1}`, word: "", enabled: true }])}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Run Recommendation</CardTitle>
            <CardDescription>Run the configured engine using the intake answers above.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runRecommendation} disabled={isLoading} className="w-full">
              {isLoading ? "Running..." : "Run Engine"}
            </Button>

            {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

            {issues.length > 0 ? (
              <div className="rounded-md border border-border bg-muted/40 p-3">
                {issues.map((issue) => (
                  <p key={issue.code} className="text-sm">{issue.message}</p>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              {result.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recommendations yet.</p>
              ) : (
                result.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.id}</p>
                      <Badge>{Number(item.score || 0).toFixed(2)}</Badge>
                    </div>
                    {Array.isArray(item.reasons) && item.reasons.length > 0 ? (
                      <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                        {item.reasons.slice(0, 3).map((reason, idx) => (
                          <li key={`${item.id}_reason_${idx}`}>{reason}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">API Integration</CardTitle>
            <CardDescription>Use this endpoint to plug into chatbots or websites.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <span className="font-semibold">POST</span> <code>/api/recommend</code>
            </p>
            <pre className="max-h-[360px] overflow-auto rounded-md border border-border bg-muted/50 p-3 text-xs">
{apiPayloadExample}
            </pre>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
