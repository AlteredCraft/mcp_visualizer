/**
 * AppHeader Component
 *
 * Main application header with title and recording status indicator.
 */
export function AppHeader() {
  return (
    <header
      className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between"
      data-component="app-header"
    >
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          MCP Inspector
        </h1>
        <span className="text-sm text-gray-500">
          Teaching App
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-red-700">RECORDING</span>
        </div>
      </div>
    </header>
  );
}
