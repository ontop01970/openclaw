# OpenClaw Custom Integrations

This directory contains community-contributed integration guides for extending OpenClaw with additional providers and services.

## Available Integrations

### [SearXNG Web Search Provider](./searxng-search-provider.md)

Add self-hosted SearXNG as a web search provider to OpenClaw.

**Features:**

- 🔒 Privacy-focused and self-hosted
- 🆓 No API keys or rate limits
- 🔍 Aggregates results from multiple search engines
- ⚡ Full control over search behavior

**Status:** ✅ Tested and working (v2026.2.27+)

**Quick Start:**

```bash
# 1. Run SearXNG
docker run -d --name openclaw-searxng -p 55001:8080 searxng/searxng:latest

# 2. Configure OpenClaw
pnpm openclaw config set tools.web.search.provider searxng
pnpm openclaw config set tools.web.search.searxng.baseUrl http://localhost:55001
```

See the [full guide](./searxng-search-provider.md) for detailed implementation steps.

---

## Contributing Your Integration

Have you integrated OpenClaw with another service? Share your guide!

1. Create a new `.md` file in this directory
2. Follow the structure of existing guides
3. Include:
   - Clear prerequisites
   - Step-by-step implementation
   - Configuration examples
   - Troubleshooting tips
   - Testing instructions

## Integration Guidelines

**Good candidates for integration guides:**

- Self-hosted alternatives to commercial APIs
- Privacy-focused services
- Cost-saving alternatives
- Regional or specialized providers
- Custom deployment configurations

**Considerations:**

- Ensure compatibility with current OpenClaw version
- Test thoroughly before documenting
- Include version information and changelog
- Add security and performance notes
- Provide troubleshooting for common issues

## Getting Help

- **Documentation:** https://docs.openclaw.ai/
- **GitHub:** https://github.com/openclaw/openclaw
- **Discord:** [OpenClaw Community](https://discord.gg/openclaw)

---

**Note:** These are community integrations. For official support, consider submitting a pull request to add your integration to the main OpenClaw codebase.
