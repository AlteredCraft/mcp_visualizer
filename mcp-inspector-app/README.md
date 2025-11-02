# MCP Inspector Teaching App

An educational tool that visualizes Model Context Protocol (MCP) communication between an LLM-powered chat interface and MCP servers. Teaches users how MCP orchestrates tool calling through transparent, real-time message flow visualization.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

Then open your browser to:
- **Root Timeline**: [http://localhost:3001](http://localhost:3001) - Minimal pedagogical visualization
- **Demo Page**: [http://localhost:3001/demo](http://localhost:3001/demo) - Feature-rich interactive interface

## Architecture

The application uses a **five-column actor-based grid** that mirrors sequence diagrams:

```
┌─────────────┬──────────────┬──────────────┬──────────────┬─────────────────┐
│  Host App   │  Host ↔ LLM  │     LLM      │  Host ↔ MCP  │   MCP Server    │
│    (20%)    │    (15%)     │    (15%)     │    (15%)     │      (35%)      │
└─────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
```

**Critical Design Principle**: The LLM never directly communicates with MCP servers. The Host App orchestrates all communication.

For detailed architecture, visual design specifications, and implementation notes, see [CLAUDE.md](../CLAUDE.md).

## Project Structure

```
mcp-inspector-app/
├── app/
│   ├── page.tsx               # Root timeline (minimal UI)
│   ├── demo/                  # Demo page (feature-rich UI)
│   └── api/
│       ├── events/            # SSE event streaming
│       └── workflow/          # Workflow execution endpoints
├── components/
│   ├── timeline/              # Timeline UI components
│   ├── shared/                # Shared components (ChatInterface, StatsDisplay)
│   ├── grid/                  # Grid row/cell components
│   ├── cells/                 # Actor and lane cell types
│   └── controls/              # UI controls (SuggestedQueries, SessionControls)
├── hooks/
│   └── useSSEConnection.ts    # Shared SSE connection logic
├── lib/
│   ├── layout-engine.ts       # Automatic spacer insertion
│   ├── phase-detector.ts      # Phase boundary detection
│   └── mcp-client/            # MCP client singleton
├── store/
│   └── timeline-store.ts      # Zustand state management
└── types/
    └── domain.ts              # Core domain types
```

## Development Modules

This project was built incrementally across 11 modules:

### Core Infrastructure (Modules 1-5)
- **Module 1**: Column definitions for five-actor layout
- **Module 2**: Domain types and data structures
- **Module 3**: Grid rendering system (TimelineRow, RowCell)
- **Module 4**: Actor and lane cell components
- **Module 5**: Layout engine with automatic spacer insertion

### Backend Integration (Modules 6-8)
- **Module 6A**: MCP client singleton with stdio transport
- **Module 6B**: Stateful MCP integration with SSE streaming
- **Module 7**: LLM integration with Claude API
- **Module 8**: Complete 5-phase workflow orchestration

### UI & Polish (Modules 9-11)
- **Module 9**: Interactive features (expand/collapse, syntax highlighting)
- **Module 10**: Testing and performance validation (49 passing tests)
- **Module 11**: Actor-based timeline implementation (final UI polish)

Each module has detailed documentation in `docs/Module N - Title.md`.

## Key Features

### Real-Time Visualization
- Server-Sent Events (SSE) for live timeline updates
- Automatic reconnection on connection loss
- Strict vertical alignment shows causality

### Shared Component Architecture
- **`hooks/useSSEConnection.ts`**: Centralized SSE connection logic
- **`components/shared/ChatInterface.tsx`**: Minimal/full chat variants
- **`components/shared/StatsDisplay.tsx`**: Statusbar/panel stats variants
- **Zustand store**: Single source of truth (no state duplication)

### Interactive Features
- Click message cards to expand/collapse JSON payloads
- Syntax highlighting for JSON content
- Real-time status bar with connection info
- Export session logs and timeline data

### Visual Design
- Color-coded message cards (green=request, blue=response, purple=notification)
- Console badges for different log types
- Phase headers spanning all columns
- Monospace fonts for code/JSON

## Pre-configured MCP Server

**AWS Documentation MCP Server**
- Auto-connects on startup
- No API keys required (uses public AWS docs)
- Tools: `search_documentation`, `read_documentation`, `recommend`

## Environment Setup

Create `.env.local`:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

## Testing

### Unit Tests
```bash
npm test
```

49 passing tests covering:
- Layout engine spacer insertion
- Phase detection logic
- Row building algorithms
- Component rendering

### Performance
- React.memo optimizations on TimelineRow and RowCell
- Efficient spacer insertion algorithm
- Smooth scrolling with 100+ events
- No memory leaks detected

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **LLM**: Claude (Anthropic API)
- **Protocol**: Model Context Protocol (MCP)

## Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Architecture details, visual design specs, AI assistant instructions
- **`docs/`** - Module documentation and detailed specifications
- **`docs/mcp-inspector-actor-based.html`** - HTML mockup reference

## Contributing

When contributing:

1. Follow the modular architecture
2. Document changes in module documentation
3. Maintain test coverage
4. Ensure vertical alignment is preserved
5. Use shared components (avoid duplication)

## License

MIT

## Acknowledgments

Built with Model Context Protocol (MCP) by Anthropic
- MCP Specification: https://modelcontextprotocol.io
- AWS Documentation MCP Server: https://github.com/awslabs/aws-documentation-mcp-server
