import { promises as fs } from 'fs';
import path from 'path';
import { MCPServerConfig } from '@/types/mcp';

/**
 * Extended MCP Server Configuration with metadata
 */
export interface MCPServerRecord {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    expectedTools?: Array<{
      name: string;
      description: string;
    }>;
  };
}

/**
 * Storage file structure
 */
interface MCPServersData {
  servers: MCPServerRecord[];
}

/**
 * Convert MCPServerRecord to MCPServerConfig
 */
export function toMCPServerConfig(record: MCPServerRecord): MCPServerConfig {
  return {
    id: record.id,
    name: record.name,
    command: record.command,
    args: record.args,
    env: record.env,
  };
}

/**
 * MCP Server Storage Service (File-based JSON)
 */
class MCPServerStorage {
  private filePath: string;
  private cache: MCPServersData | null = null;

  constructor() {
    // Store in data directory relative to project root
    this.filePath = path.join(process.cwd(), 'data', 'mcp-servers.json');
  }

  /**
   * Read all servers from storage
   */
  async readAll(): Promise<MCPServerRecord[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed: MCPServersData = JSON.parse(data);
      this.cache = parsed;
      return parsed.servers;
    } catch (error) {
      // If file doesn't exist, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn('[MCPServerStorage] Storage file not found, returning empty array');
        return [];
      }
      throw error;
    }
  }

  /**
   * Find server by ID
   */
  async findById(id: string): Promise<MCPServerRecord | null> {
    const servers = await this.readAll();
    return servers.find((s) => s.id === id) || null;
  }

  /**
   * Find enabled servers
   */
  async findEnabled(): Promise<MCPServerRecord[]> {
    const servers = await this.readAll();
    return servers.filter((s) => s.enabled);
  }

  /**
   * Create a new server
   */
  async create(server: Omit<MCPServerRecord, 'createdAt' | 'updatedAt'>): Promise<MCPServerRecord> {
    const servers = await this.readAll();

    // Check for duplicate ID
    if (servers.find((s) => s.id === server.id)) {
      throw new Error(`Server with ID "${server.id}" already exists`);
    }

    const now = new Date().toISOString();
    const newServer: MCPServerRecord = {
      ...server,
      createdAt: now,
      updatedAt: now,
    };

    servers.push(newServer);
    await this.writeAll(servers);
    return newServer;
  }

  /**
   * Update an existing server
   */
  async update(id: string, updates: Partial<Omit<MCPServerRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<MCPServerRecord> {
    const servers = await this.readAll();
    const index = servers.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Server with ID "${id}" not found`);
    }

    const updatedServer: MCPServerRecord = {
      ...servers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    servers[index] = updatedServer;
    await this.writeAll(servers);
    return updatedServer;
  }

  /**
   * Delete a server
   */
  async delete(id: string): Promise<void> {
    const servers = await this.readAll();
    const filtered = servers.filter((s) => s.id !== id);

    if (filtered.length === servers.length) {
      throw new Error(`Server with ID "${id}" not found`);
    }

    await this.writeAll(filtered);
  }

  /**
   * Write all servers to storage
   */
  private async writeAll(servers: MCPServerRecord[]): Promise<void> {
    const data: MCPServersData = { servers };
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    this.cache = data;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = null;
  }
}

// Singleton instance
export const mcpServerStorage = new MCPServerStorage();
