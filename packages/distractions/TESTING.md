# Testing OpenAI Integration

## Quick Start

### 1. Set up your OpenAI API Key

Since you're using direnv:

```bash
# Copy the example envrc file
cp .envrc.example .envrc

# Edit .envrc and add your OpenAI API key
# Replace sk-your-api-key-here with your actual key

# Allow direnv to load the file
direnv allow
```

Or if you prefer `.env`:

```bash
cp .env.example .env
# Edit .env and add your key
```

Get your API key from: <https://platform.openai.com/api-keys>

### 2. Run the Integration Test

```bash
npx tsx scripts/test-openai-integration.ts
```

This will:

- Test OpenAI integration with 3 sample civics questions
- Generate 5 distractors per question
- Apply quality filtering and similarity detection
- Show results and performance metrics

### 3. Run Full Generation (Optional)

To generate distractors for ALL civics questions:

```bash
npx tsx src/cli/index.ts
```

Options:

- `--target-count N` - Generate N distractors per question (5-20)
- `--use-openai` / `--no-use-openai` - Enable/disable OpenAI
- `--filter-similar` / `--no-filter-similar` - Similarity filtering
- `--help` - Show all options

### 4. Review Output

The generated file will be at: `data/questions-with-distractors.json`

## What to Look For

### Good Distractors:

- ✅ Plausible but incorrect
- ✅ Related to the topic/domain
- ✅ Appropriate difficulty level
- ✅ Formatted consistently with correct answer
- ✅ Diverse (not repetitive)

### Bad Distractors:

- ❌ Obviously wrong or silly
- ❌ Unrelated to the topic
- ❌ Too easy or too hard
- ❌ Poorly formatted
- ❌ Repetitive across questions

## Cost Estimation

With gpt-5-mini pricing (as of Oct 2024):

- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

For 100 questions with 5 distractors each:

- Estimated cost: $0.50 - $2.00
- Actual cost depends on prompt length and response size

Check your usage at: <https://platform.openai.com/usage>

## Troubleshooting

### "OPENAI_API_KEY not found"

- If using direnv: Make sure you created `.envrc` and ran `direnv allow`
- If using .env: Make sure you created `.env` file
- Check that the API key starts with `sk-`
- Verify the file is in `packages/distractions/` directory
- Test with: `echo $OPENAI_API_KEY` (should show your key)

### "Rate limit exceeded"

- Reduce `OPENAI_REQUESTS_PER_MINUTE` in `.env`
- Default is 60/min, try 30 or lower
- Free tier has lower limits than paid

### "Invalid API key"

- Verify the key is correct (no extra spaces)
- Check that the key is active at platform.openai.com
- Make sure your OpenAI account has credits

### Poor Quality Distractors

- Try adjusting `OPENAI_TEMPERATURE` (default 0.7)
  - Lower (0.3-0.5) = more conservative
  - Higher (0.8-1.0) = more creative
- Increase `OPENAI_MAX_TOKENS` if responses seem cut off
- Check the prompts in `src/services/OpenAIDistractorService.ts`

## Next Steps

After validating the integration:

1. Review the Phase 2 Assessment document
2. Implement remaining enhancements (Option A)
3. Run full generation on all questions
4. Deploy to production

## Support

- OpenAI API Docs: <https://platform.openai.com/docs>
- Effect-TS Docs: <https://effect.website>
- Project Issues: Check PLAN.md and Phase 2 plans/
