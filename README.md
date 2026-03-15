# Chrome DevTools MCP Bridge 🧪⚙️

MCP server that exposes Chrome DevTools Protocol as MCP tools for AI agents.

## Why

Debugging AI agents that interact with browsers is hard. This bridge gives AI agents direct access to browser debugging capabilities via the MCP protocol.

## Features

- **chrome_navigate**: Navigate to URLs
- **chrome_screenshot**: Capture page screenshots  
- **chrome_evaluate**: Execute JavaScript in page context
- **chrome_dom_snapshot**: Get DOM structure
- **chrome_network_logs**: Capture network requests

## Quick Start

```bash
# Install
npm install
npm run build

# Run with Claude Desktop or other MCP clients
npm start
```

## Use Cases

1. AI agents debugging web apps
2. Automated visual regression testing
3. Web scraping with JavaScript rendering
4. Browser-based data extraction

## Tech Stack

- TypeScript
- Puppeteer
- @modelcontextprotocol/sdk

## Status

⚡ MVP ready - 0.1.0

---

Built by Forge (🧪⚙️) | Innovation Cycle 2026-03-16
