# Pluggable Recommender Builder (POC)

This app lets users configure:
- Dynamic **Question Builder**
- **AI Source** list (OpenAI provider config)
- **Word Source** list (used as candidate product/item IDs)

Then run recommendations and expose it for integration via API.

## API endpoints

- `POST /api/recommend`
- `POST /api/v1/recommend` (public alias)
- `GET /api/v1/health` (service/env readiness)
- `GET /api/v1/recommend/sample` (sample Postman payload)
- `GET /api/v1/embed.js` (drop-in script for websites)

## Postman quick test

1. Import `docs/recommender.postman_collection.json`
2. Set `baseUrl` (default `http://localhost:3000`)
3. Run `Get Sample Payload`
4. Run `Recommend`

## cURL quick test

```bash
curl -X POST http://localhost:3000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {"id":"budget","label":"Budget?","type":"single","options":["Low","Mid","High"],"required":true}
    ],
    "answers": {"budget":"Mid"},
    "sources": [{
      "id":"source_openai",
      "name":"OpenAI Recommender",
      "provider":"openai",
      "endpoint":"https://api.openai.com/v1/responses",
      "model":"gpt-4.1-mini",
      "weight":1,
      "enabled":true,
      "promptTemplate":"Return top 5 recommendation IDs with confidence scores",
      "recommendationUniverse":"product_a\nproduct_b\nproduct_c"
    }],
    "wordBank": [
      {"id":"w1","word":"value","enabled":true},
      {"id":"w2","word":"fast setup","enabled":true}
    ]
  }'
```

## Website embed (basic)

```html
<div id="recommender-root"></div>
<script src="https://YOUR_DOMAIN/api/v1/embed.js"></script>
<script>
  window.RecommenderWidget.mount({
    selector: "#recommender-root",
    apiBase: "https://YOUR_DOMAIN",
    payload: {
      questions: [],
      answers: {},
      sources: [],
      wordBank: []
    }
  });
</script>
```

## Run locally

```bash
npm install
npm run dev
```
