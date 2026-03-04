# SearXNG Web Search Provider Integration

This guide explains how to integrate SearXNG as a web search provider in OpenClaw, allowing you to use your own self-hosted search instance instead of commercial APIs.

## Overview

SearXNG is a privacy-respecting, hackable metasearch engine that aggregates results from multiple search engines. This integration adds SearXNG as a 6th built-in search provider alongside Brave, Perplexity, Grok, Gemini, and Kimi.

**Benefits:**

- No API keys required
- Self-hosted and privacy-focused
- Aggregates results from multiple search engines
- Free to use with no rate limits
- Full control over search behavior

## Prerequisites

1. **SearXNG Instance Running**
   - Docker container: `searxng/searxng:latest`
   - Accessible at a local URL (e.g., `http://localhost:55001`)
   - JSON API enabled (`/search?format=json`)

   Example Docker setup:

   ```bash
   docker run -d \
     --name openclaw-searxng \
     -p 55001:8080 \
     -v searxng-config:/etc/searxng \
     searxng/searxng:latest
   ```

2. **OpenClaw Development Environment**
   - Node 22+
   - pnpm installed
   - OpenClaw repository cloned

## Implementation

### Step 1: Add SearXNG to Web Search Tool

Edit `src/agents/tools/web-search.ts`:

#### 1.1 Add SearXNG to the provider list (line ~25):

```typescript
export const SEARCH_PROVIDERS = [
  "brave",
  "perplexity",
  "grok",
  "gemini",
  "kimi",
  "searxng", // Add this line
] as const;
```

#### 1.2 Add SearXNG config type (around line 119-127):

```typescript
type SearXNGConfig = {
  baseUrl: string;
};

function getSearXNGConfig(config: AgentRuntimeConfig): SearXNGConfig {
  return {
    baseUrl: config.tools.web.search.searxng.baseUrl,
  };
}
```

#### 1.3 Implement the search function (around line 542-584):

```typescript
async function runSearXNGSearch(
  query: string,
  config: SearXNGConfig,
  options: {
    maxResults?: number;
    language?: string;
  },
): Promise<WebSearchResult[]> {
  const { baseUrl } = config;
  const { maxResults = 10, language } = options;

  // Build search URL
  const searchUrl = new URL("/search", baseUrl);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("pageno", "1");
  if (language) {
    searchUrl.searchParams.set("language", language);
  }

  const response = await fetch(searchUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`SearXNG search failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
    }>;
  };

  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  // Map results to WebSearchResult format
  return data.results.slice(0, maxResults).map((result) => ({
    title: result.title ?? "",
    url: result.url ?? "",
    snippet: result.content ?? "",
  }));
}
```

#### 1.4 Add SearXNG to provider detection (around line 1184-1240):

Find the section with provider detection and add:

```typescript
if (provider === "searxng") {
  return "searxng";
}
```

#### 1.5 Add SearXNG to the search dispatch logic (around line 1242-1261):

In the main search function, add the SearXNG case:

```typescript
if (provider === "searxng") {
  const searxngConfig = getSearXNGConfig(config);
  results = await runSearXNGSearch(query, searxngConfig, {
    maxResults: sliceEnd,
    language,
  });
}
```

#### 1.6 Update createWebSearchTool parameters (around line 1391-1422):

In the tool schema, ensure SearXNG doesn't require an API key. Find the conditional logic and add:

```typescript
const requiresApiKey =
	provider !== "searxng" &&
	provider !== "gemini" &&
	/* other conditions */;
```

#### 1.7 Update tool creation logic (around line 1507-1525):

Make sure SearXNG passes an empty string for apiKey:

```typescript
const results = await runWebSearch({
  query,
  provider,
  apiKey: apiKey ?? "", // Empty string is fine for SearXNG
  config,
  language,
  sliceEnd,
});
```

### Step 2: Update Configuration Schemas

#### 2.1 Edit `src/config/types.tools.ts` (lines 433-434, 477-481):

Add SearXNG to the provider union type:

```typescript
provider:
	| "brave"
	| "perplexity"
	| "grok"
	| "gemini"
	| "kimi"
	| "searxng"; // Add this
```

Add SearXNG config object:

```typescript
searxng: {
  baseUrl: string;
}
```

#### 2.2 Edit `src/config/zod-schema.agent-runtime.ts` (lines 257-310):

Add SearXNG to the Zod schema:

```typescript
provider: z.union([
	z.literal("brave"),
	z.literal("perplexity"),
	z.literal("grok"),
	z.literal("gemini"),
	z.literal("kimi"),
	z.literal("searxng"), // Add this
]),
```

Add SearXNG config schema:

```typescript
searxng: z.object({
	baseUrl: z.string().url(),
}),
```

#### 2.3 Edit `src/config/schema.help.ts` (lines 589-593):

Add help text for SearXNG configuration:

```typescript
"tools.web.search.searxng.baseUrl":
	"Base URL of your SearXNG instance (e.g., http://localhost:55001)",
```

#### 2.4 Edit `src/config/schema.labels.ts` (line 224):

Add a UI label:

```typescript
"tools.web.search.searxng.baseUrl": "SearXNG Base URL",
```

### Step 3: Build and Configure

#### 3.1 Build OpenClaw with changes:

```bash
cd /home/paco/openclaw
pnpm build
```

#### 3.2 Configure OpenClaw to use SearXNG:

```bash
pnpm openclaw config set tools.web.search.provider searxng
pnpm openclaw config set tools.web.search.searxng.baseUrl http://localhost:55001
```

#### 3.3 Verify configuration:

```bash
pnpm openclaw config get tools.web.search
```

Expected output:

```json
{
  "provider": "searxng",
  "searxng": {
    "baseUrl": "http://localhost:55001"
  }
}
```

### Step 4: Run the Gateway

Stop any globally installed gateway service and run from the local build:

```bash
# Stop old service if running
systemctl --user stop openclaw-gateway
systemctl --user disable openclaw-gateway

# Run from local build
cd /home/paco/openclaw
nohup pnpm openclaw gateway run --bind loopback --port 18789 > /tmp/openclaw-gateway-local.log 2>&1 &
```

Verify the gateway is running:

```bash
pnpm openclaw channels status --probe
```

You should see "Gateway reachable."

## Configuration Options

### Required Settings

| Setting                            | Description               | Example                  |
| ---------------------------------- | ------------------------- | ------------------------ |
| `tools.web.search.provider`        | Set to "searxng"          | `searxng`                |
| `tools.web.search.searxng.baseUrl` | Your SearXNG instance URL | `http://localhost:55001` |

### Optional SearXNG Settings

Configure your SearXNG instance's `settings.yml` to customize:

- Enabled search engines
- Result format
- Safe search level
- Language preferences
- Rate limiting

Example minimal `settings.yml`:

```yaml
use_default_settings: true
server:
  secret_key: "your-secret-key-here"
  limiter: false
  image_proxy: true
search:
  safe_search: 0
  autocomplete: ""
enabled_plugins: []
disabled_plugins: []
```

## Testing

Test the integration by asking OpenClaw to search the web:

```bash
pnpm openclaw message send "Search the web for the latest news about AI"
```

Check the logs to verify SearXNG is being used:

```bash
tail -f /tmp/openclaw-gateway-local.log
```

## Troubleshooting

### Gateway Not Starting

**Symptom**: Gateway service fails with config validation errors.

**Cause**: Running old version without SearXNG support.

**Solution**: Make sure you're running from the local build, not the global install:

```bash
# Check which version is running
pnpm openclaw --version  # Should show 2026.2.27 or later

# Run from local build
cd /home/paco/openclaw
pnpm openclaw gateway run --bind loopback --port 18789
```

### SearXNG Connection Errors

**Symptom**: Search fails with connection timeout or refused errors.

**Solution**:

1. Verify SearXNG is running:

   ```bash
   docker ps | grep searxng
   curl http://localhost:55001/search?q=test&format=json
   ```

2. Check firewall/network settings
3. Ensure the URL in config matches your instance

### Empty Search Results

**Symptom**: Searches complete but return no results.

**Solution**:

1. Test SearXNG directly via curl:

   ```bash
   curl "http://localhost:55001/search?q=test&format=json"
   ```

2. Check SearXNG logs:

   ```bash
   docker logs openclaw-searxng
   ```

3. Verify search engines are enabled in SearXNG settings

## Security Considerations

1. **Do not expose SearXNG publicly** without authentication
2. Use `--bind loopback` to restrict gateway access to localhost
3. Consider using a reverse proxy with authentication if remote access is needed
4. Keep SearXNG updated to latest version
5. Review SearXNG's privacy settings and enabled engines

## Performance Tips

1. **Enable caching** in SearXNG settings to speed up repeated queries
2. **Limit enabled engines** to reduce response time
3. **Adjust timeout settings** based on your network
4. **Use Redis** for SearXNG caching in production

## Comparison with Other Providers

| Feature          | SearXNG           | Brave  | Perplexity |
| ---------------- | ----------------- | ------ | ---------- |
| API Key Required | ❌ No             | ✅ Yes | ✅ Yes     |
| Self-hosted      | ✅ Yes            | ❌ No  | ❌ No      |
| Cost             | Free              | Paid   | Paid       |
| Privacy          | High              | Medium | Medium     |
| Result Quality   | Good (aggregated) | High   | High       |
| Response Time    | Medium            | Fast   | Fast       |

## Further Reading

- [SearXNG Documentation](https://docs.searxng.org/)
- [SearXNG GitHub](https://github.com/searxng/searxng)
- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw Web Search Tool](https://docs.openclaw.ai/tools/web-search)

## Changelog

- **2026-02-28**: Initial integration guide created
  - Added SearXNG as 6th search provider
  - No API key required
  - Supports all standard web search features

## License

This integration follows OpenClaw's license. SearXNG is licensed under AGPL-3.0.

---

**Note**: This is a community integration guide. For official provider support, consider submitting a pull request to the OpenClaw repository.
