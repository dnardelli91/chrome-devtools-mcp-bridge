import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer, { Browser, Page } from 'puppeteer';

class ChromeDevToolsMCPServer {
  private server: Server;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'chrome-devtools-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'chrome_navigate',
            description: 'Navigate to a URL in Chrome',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to navigate to' },
              },
              required: ['url'],
            },
          },
          {
            name: 'chrome_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Path to save screenshot' },
              },
            },
          },
          {
            name: 'chrome_evaluate',
            description: 'Execute JavaScript in the page context',
            inputSchema: {
              type: 'object',
              properties: {
                script: { type: 'string', description: 'JavaScript to execute' },
              },
              required: ['script'],
            },
          },
          {
            name: 'chrome_dom_snapshot',
            description: 'Get DOM structure as JSON',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'chrome_network_logs',
            description: 'Capture network requests',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Max requests to return' },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.ensureBrowser();
        
        switch (name) {
          case 'chrome_navigate':
            return await this.navigate(args.url as string);
          case 'chrome_screenshot':
            return await this.screenshot(args.path as string);
          case 'chrome_evaluate':
            return await this.evaluate(args.script as string);
          case 'chrome_dom_snapshot':
            return await this.domSnapshot();
          case 'chrome_network_logs':
            return await this.networkLogs(args.limit as number);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async ensureBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.page = await this.browser.newPage();
    }
  }

  private async navigate(url: string) {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.goto(url, { waitUntil: 'networkidle0' });
    return {
      content: [{ type: 'text', text: `Navigated to ${url}` }],
    };
  }

  private async screenshot(path: string) {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.screenshot({ path, fullPage: true });
    return {
      content: [{ type: 'text', text: `Screenshot saved to ${path}` }],
    };
  }

  private async evaluate(script: string) {
    if (!this.page) throw new Error('Page not initialized');
    const result = await this.page.evaluate(script);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }

  private async domSnapshot() {
    if (!this.page) throw new Error('Page not initialized');
    const dom = await this.page.evaluate(() => {
      const getOuterHTML = (el: Element) => el.outerHTML;
      return document.body.innerHTML.substring(0, 10000);
    });
    return {
      content: [{ type: 'text', text: dom.substring(0, 5000) }],
    };
  }

  private async networkLogs(limit = 10) {
    if (!this.page) throw new Error('Page not initialized');
    const client = await this.page.target().createCDPSession();
    await client.send('Network.enable');
    
    const requests: any[] = [];
    client.on('Network.requestWillBeSent', (params: any) => {
      if (requests.length < limit) {
        requests.push({
          url: params.request.url,
          method: params.request.method,
        });
      }
    });

    await new Promise(r => setTimeout(r, 1000));
    return {
      content: [{ type: 'text', text: JSON.stringify(requests, null, 2) }],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Chrome DevTools MCP Bridge running...');
  }
}

const server = new ChromeDevToolsMCPServer();
server.start().catch(console.error);
