import { Server } from "@anthropic-ai/mcp-server";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class MakeMCPServer {
  constructor() {
    this.server = new Server("make-integration");
    this.makeApiUrl = "https://eu1.make.com/api/v2";
    this.apiToken = process.env.MAKE_API_TOKEN;
    
    this.setupHandlers();
  }

  setupHandlers() {
    // 获取场景列表
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "list_scenarios",
          description: "获取所有可用的 Make.com 场景",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "run_scenario",
          description: "执行指定的 Make.com 场景",
          inputSchema: {
            type: "object",
            properties: {
              scenarioId: {
                type: "string",
                description: "要执行的场景 ID"
              },
              data: {
                type: "object",
                description: "传递给场景的数据"
              }
            },
            required: ["scenarioId"]
          }
        },
        {
          name: "get_scenario_logs",
          description: "获取场景执行日志",
          inputSchema: {
            type: "object",
            properties: {
              scenarioId: {
                type: "string",
                description: "场景 ID"
              },
              limit: {
                type: "number",
                description: "返回的日志条数",
                default: 10
              }
            },
            required: ["scenarioId"]
          }
        }
      ]
    }));

    // 工具调用处理器
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "list_scenarios":
          return await this.listScenarios();
        
        case "run_scenario":
          return await this.runScenario(args.scenarioId, args.data);
        
        case "get_scenario_logs":
          return await this.getScenarioLogs(args.scenarioId, args.limit);
        
        default:
          throw new Error(`未知工具: ${name}`);
      }
    });

    // 资源处理器
    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: "make://scenarios",
          name: "Make.com 场景",
          description: "所有可用的自动化场景",
          mimeType: "application/json"
        }
      ]
    }));

    this.server.setRequestHandler("resources/read", async (request) => {
      const { uri } = request.params;
      
      if (uri === "make://scenarios") {
        const scenarios = await this.listScenarios();
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(scenarios, null, 2)
          }]
        };
      }
      
      throw new Error(`未知资源: ${uri}`);
    });
  }

  async listScenarios() {
    try {
      const response = await axios.get(`${this.makeApiUrl}/scenarios`, {
        headers: {
          "Authorization": `Token ${this.apiToken}`,
          "Content-Type": "application/json"
        }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            scenarios: response.data.scenarios.map(s => ({
              id: s.id,
              name: s.name,
              status: s.scheduling?.type || "inactive",
              lastRun: s.lastRun,
              folder: s.folder?.name
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`获取场景列表失败: ${error.message}`);
    }
  }

  async runScenario(scenarioId, data = {}) {
    try {
      const response = await axios.post(
        `${this.makeApiUrl}/scenarios/${scenarioId}/run`,
        { data },
        {
          headers: {
            "Authorization": `Token ${this.apiToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            executionId: response.data.executionId,
            message: "场景执行已启动"
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`执行场景失败: ${error.message}`);
    }
  }

  async getScenarioLogs(scenarioId, limit = 10) {
    try {
      const response = await axios.get(
        `${this.makeApiUrl}/scenarios/${scenarioId}/executions`,
        {
          params: { limit },
          headers: {
            "Authorization": `Token ${this.apiToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            logs: response.data.executions.map(exec => ({
              id: exec.id,
              status: exec.status,
              startedAt: exec.startedAt,
              finishedAt: exec.finishedAt,
              operations: exec.operations,
              errors: exec.errors
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`获取执行日志失败: ${error.message}`);
    }
  }

  async start() {
    await this.server.connect();
    console.log("Make.com MCP Server 已启动");
  }
}

// 启动服务器
const server = new MakeMCPServer();
server.start().catch(console.error);