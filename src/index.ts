#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { config } from "dotenv";

// Load environment variables
config();

const server = new Server(
  {
    name: "dida365-mcp-servers",
    version: "1.0.6",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Get Dida365 configuration from environment variables
const DIDA365_TOKEN = process.env.DIDA365_TOKEN || "";
const DIDA_CLIENT_ID = process.env.DIDA_CLIENT_ID || "";
const DIDA_CLIENT_SECRET = process.env.DIDA_CLIENT_SECRET || "";
const DIDA_REDIRECT_URI = process.env.DIDA_REDIRECT_URI || "http://localhost:3000/callback";

// Dida365 API base URL
const DIDA_API_BASE = "https://api.dida365.com/api/v2";

// Helper function to make authenticated requests
async function makeDidaRequest(endpoint: string, method: string = "GET", data?: any) {
  try {
    const response = await axios({
      method,
      url: `${DIDA_API_BASE}${endpoint}`,
      headers: {
        "Authorization": DIDA365_TOKEN,
        "Content-Type": "application/json",
      },
      data,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Dida365 API Error: ${error.response?.data?.message || error.message}`);
  }
}

// Tool: Create a new task
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "createTask",
        description: "Create a new task in Dida365",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Task title",
            },
            content: {
              type: "string",
              description: "Task description",
            },
            projectId: {
              type: "string",
              description: "Project ID",
            },
            dueDate: {
              type: "string",
              description: "Due date in ISO format",
            },
            priority: {
              type: "number",
              description: "Priority level (0-5)",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "getTasks",
        description: "Get list of tasks from Dida365",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "Filter by project ID",
            },
            status: {
              type: "string",
              description: "Filter by status",
            },
            limit: {
              type: "number",
              description: "Limit number of results",
            },
          },
        },
      },
      {
        name: "updateTask",
        description: "Update an existing task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Task ID to update",
            },
            title: {
              type: "string",
              description: "New title",
            },
            content: {
              type: "string",
              description: "New description",
            },
            status: {
              type: "string",
              description: "New status",
            },
            priority: {
              type: "number",
              description: "New priority",
            },
          },
          required: ["taskId"],
        },
      },
      {
        name: "deleteTask",
        description: "Delete a task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Task ID to delete",
            },
          },
          required: ["taskId"],
        },
      },
      {
        name: "createProject",
        description: "Create a new project",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Project name",
            },
            description: {
              type: "string",
              description: "Project description",
            },
            color: {
              type: "string",
              description: "Project color",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "getProjects",
        description: "Get list of projects",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "updateProject",
        description: "Update an existing project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "Project ID to update",
            },
            name: {
              type: "string",
              description: "New project name",
            },
            description: {
              type: "string",
              description: "New project description",
            },
          },
          required: ["projectId"],
        },
      },
      {
        name: "deleteProject",
        description: "Delete a project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "Project ID to delete",
            },
          },
          required: ["projectId"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "createTask":
        const taskData = await makeDidaRequest("/tasks", "POST", {
          title: args.title,
          content: args.content,
          projectId: args.projectId,
          dueDate: args.dueDate,
          priority: args.priority || 0,
        });
        return {
          content: [
            {
              type: "text",
              text: `Task created successfully: ${JSON.stringify(taskData)}`,
            },
          ],
        };

      case "getTasks":
        const tasks = await makeDidaRequest("/tasks");
        return {
          content: [
            {
              type: "text",
              text: `Tasks retrieved: ${JSON.stringify(tasks)}`,
            },
          ],
        };

      case "updateTask":
        const updatedTask = await makeDidaRequest(`/tasks/${args.taskId}`, "PUT", {
          title: args.title,
          content: args.content,
          status: args.status,
          priority: args.priority,
        });
        return {
          content: [
            {
              type: "text",
              text: `Task updated successfully: ${JSON.stringify(updatedTask)}`,
            },
          ],
        };

      case "deleteTask":
        await makeDidaRequest(`/tasks/${args.taskId}`, "DELETE");
        return {
          content: [
            {
              type: "text",
              text: "Task deleted successfully",
            },
          ],
        };

      case "createProject":
        const projectData = await makeDidaRequest("/projects", "POST", {
          name: args.name,
          description: args.description,
          color: args.color,
        });
        return {
          content: [
            {
              type: "text",
              text: `Project created successfully: ${JSON.stringify(projectData)}`,
            },
          ],
        };

      case "getProjects":
        const projects = await makeDidaRequest("/projects");
        return {
          content: [
            {
              type: "text",
              text: `Projects retrieved: ${JSON.stringify(projects)}`,
            },
          ],
        };

      case "updateProject":
        const updatedProject = await makeDidaRequest(`/projects/${args.projectId}`, "PUT", {
          name: args.name,
          description: args.description,
        });
        return {
          content: [
            {
              type: "text",
              text: `Project updated successfully: ${JSON.stringify(updatedProject)}`,
            },
          ],
        };

      case "deleteProject":
        await makeDidaRequest(`/projects/${args.projectId}`, "DELETE");
        return {
          content: [
            {
              type: "text",
              text: "Project deleted successfully",
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dida365 MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});