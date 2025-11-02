'use client';

import React, { useState, useEffect } from 'react';
import { MCPServerRecord } from '@/lib/storage/mcp-servers';

export default function MCPServersPage() {
  const [servers, setServers] = useState<MCPServerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServerRecord | null>(null);

  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/mcp-servers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load servers');
      }

      setServers(data.servers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this server?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mcp-servers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete server');
      }

      await loadServers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete server');
    }
  };

  const handleToggleEnabled = async (server: MCPServerRecord) => {
    try {
      const response = await fetch(`/api/admin/mcp-servers/${server.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !server.enabled }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update server');
      }

      await loadServers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update server');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-600">Loading servers...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MCP Server Settings</h1>
          <p className="text-gray-600">
            Manage Model Context Protocol server configurations
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Add Server Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Server
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingServer) && (
          <ServerForm
            server={editingServer}
            onClose={() => {
              setShowAddForm(false);
              setEditingServer(null);
            }}
            onSave={async () => {
              await loadServers();
              setShowAddForm(false);
              setEditingServer(null);
            }}
          />
        )}

        {/* Servers List */}
        <div className="space-y-4">
          {servers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">No servers configured</p>
            </div>
          ) : (
            servers.map((server) => (
              <div
                key={server.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {server.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          server.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {server.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{server.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-700 w-24">Command:</span>
                        <code className="text-gray-900 bg-gray-50 px-2 py-1 rounded">
                          {server.command}
                        </code>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-700 w-24">Arguments:</span>
                        <code className="text-gray-900 bg-gray-50 px-2 py-1 rounded flex-1">
                          {server.args.join(' ')}
                        </code>
                      </div>
                      {Object.keys(server.env).length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700 w-24">Environment:</span>
                          <div className="flex-1">
                            {Object.entries(server.env).map(([key, value]) => (
                              <div key={key} className="text-gray-900 bg-gray-50 px-2 py-1 rounded mb-1">
                                <span className="font-mono">{key}={value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleToggleEnabled(server)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      {server.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setEditingServer(server)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(server.id)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface ServerFormProps {
  server: MCPServerRecord | null;
  onClose: () => void;
  onSave: () => void;
}

function ServerForm({ server, onClose, onSave }: ServerFormProps) {
  const [formData, setFormData] = useState({
    id: server?.id || '',
    name: server?.name || '',
    description: server?.description || '',
    command: server?.command || '',
    args: server?.args.join(' ') || '',
    env: server?.env ? Object.entries(server.env).map(([k, v]) => `${k}=${v}`).join('\n') : '',
    enabled: server?.enabled ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Parse args and env
      const args = formData.args.trim().split(/\s+/).filter(Boolean);
      const env: Record<string, string> = {};
      formData.env.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split('=');
        if (key?.trim()) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      });

      const body = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        command: formData.command,
        args,
        env,
        enabled: formData.enabled,
      };

      const url = server
        ? `/api/admin/mcp-servers/${server.id}`
        : '/api/admin/mcp-servers';
      const method = server ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save server');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {server ? 'Edit Server' : 'Add Server'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server ID *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={!!server}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="aws-docs"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier (lowercase, hyphens allowed)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AWS Documentation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search and retrieve AWS service documentation"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Command *
              </label>
              <input
                type="text"
                value={formData.command}
                onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="uvx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arguments *
              </label>
              <input
                type="text"
                value={formData.args}
                onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="awslabs.aws-documentation-mcp-server@latest"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Space-separated arguments
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environment Variables
              </label>
              <textarea
                value={formData.env}
                onChange={(e) => setFormData({ ...formData, env: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="FASTMCP_LOG_LEVEL=ERROR&#10;AWS_DOCUMENTATION_PARTITION=aws"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                One per line (KEY=value)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                Enabled
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Server'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
