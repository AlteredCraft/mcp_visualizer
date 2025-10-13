# MCP Inspector Teaching App

An educational tool that visualizes Model Context Protocol (MCP) communication between an LLM-powered chat interface and MCP servers. The goal is to teach users how MCP orchestrates tool calling through transparent, real-time message flow visualization.

## Overview

MCP Inspector provides a **five-column actor-based grid visualization** that demonstrates the complete lifecycle of MCP tool invocation, from user query to final response. The interface mirrors sequence diagrams with strict vertical alignment to show causality and temporal relationships.

## Live Demo

Start the development server:

```bash
npm run dev
```

Then open your browser to:
- **Actor-Based Timeline**: [http://localhost:3004/timeline](http://localhost:3004/timeline) - Main educational visualization
- **Demo Page**: [http://localhost:3004/demo](http://localhost:3004/demo) - Alternative interface

## Architecture

### Five-Column Actor-Based Layout

```
┌─────────────┬──────────────┬──────────────┬──────────────┬─────────────────┐
│  Host App   │  Host ↔ LLM  │     LLM      │  Host ↔ MCP  │   MCP Server    │
│    (20%)    │    (15%)     │    (15%)     │    (15%)     │      (35%)      │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────┤
│ Chat UI     │ Message      │ Inference    │ Message      │ Tool execution  │
│ Console     │ Cards        │ Processing   │ Cards        │ External APIs   │
│ logs        │ (ingress/    │              │ (ingress/    │ Console logs    │
│             │  egress)     │              │  egress)     │                 │
└─────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
```

**Critical Design Principle**: The LLM never directly communicates with MCP servers. The Host App orchestrates all communication. This is the primary pedagogical point.

### Five-Phase MCP Workflow

1. **Initialization & Negotiation**: `initialize` → response → `initialized` notification
2. **Discovery & Contextualization**: `tools/list` → Host formats schemas for LLM
3. **Model-Driven Selection**: First LLM inference (planning) → returns `tool_calls`
4. **Execution Round Trip**: `tools/call` → MCP server delegates to external API → result
5. **Synthesis & Final Response**: Second LLM inference (synthesis) → final natural language response

**Key Teaching Point**: The LLM makes TWO calls - one for planning (tool selection) and one for synthesis (final response).

## Pre-configured MCP Server

**AWS Documentation MCP Server** (https://github.com/awslabs/aws-documentation-mcp-server)
- No API keys required (uses public AWS documentation)
- Auto-connects on startup
- Tools: `search_documentation`, `read_documentation`, `recommend`

## Project Structure

```
mcp-inspector-app/
├── app/
│   ├── timeline/           # Actor-based timeline route (Module 11)
│   ├── demo/               # Alternative demo interface (Module 9)
│   └── api/
│       ├── events/         # SSE event streaming
│       └── workflow/       # Workflow execution endpoints
├── components/
│   ├── timeline/           # Timeline UI components
│   ├── grid/               # Grid row/cell components
│   └── cells/              # Actor and lane cell types
├── lib/
│   ├── layout-engine.ts    # Automatic spacer insertion (Module 5)
│   ├── phase-detector.ts   # Phase boundary detection (Module 8)
│   └── mcp-client/         # MCP client singleton
├── store/
│   └── timeline-store.ts   # Zustand state management
├── types/
│   └── domain.ts           # Core domain types
└── docs/                   # Module documentation
```

## Development Modules

This project was built incrementally with comprehensive documentation:

### Core Infrastructure

- **Module 1**: Column definitions for five-actor layout
- **Module 2**: Domain types and data structures
- **Module 3**: Grid rendering system (TimelineRow, RowCell)
- **Module 4**: Actor and lane cell components
- **Module 5**: Layout engine with automatic spacer insertion

### Backend Integration

- **Module 6A**: MCP client singleton with stdio transport
- **Module 6B**: Stateful MCP integration with SSE streaming
- **Module 7**: LLM integration with Claude API
- **Module 8**: Complete 5-phase workflow orchestration

### UI & Polish

- **Module 9**: Interactive features (expand/collapse, syntax highlighting)
- **Module 10**: Testing and performance validation (49 passing tests, React.memo optimizations)
- **Module 11**: Actor-based timeline implementation (corrected layout to match HTML mockup)

Each module has detailed documentation in `docs/Module N - Title.md`.

## Key Features

### Real-Time Event Streaming
- Server-Sent Events (SSE) for live timeline updates
- Automatic reconnection on connection loss
- Events recorded for playback and analysis

### Visual Design
- **Message Cards**: Color-coded borders (green=request, blue=response, purple=notification)
- **Console Blocks**: Colored badges for different log types (USER INPUT, SYSTEM, INTERNAL, etc.)
- **Phase Headers**: Sticky headers spanning all columns with phase duration
- **Vertical Alignment**: Strict alignment shows causality

### Interactive Features
- Click message cards to expand/collapse full JSON payloads
- Syntax highlighting for JSON content
- Smooth scrolling with overflow handling
- Real-time status bar with connection info

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Documentation MCP server (installed separately)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Setup

Create `.env.local`:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

## Testing & Validation

### Unit Tests
```bash
npm test
```

49 passing tests covering:
- Layout engine spacer insertion
- Phase detection logic
- Row building algorithms
- Component rendering

### Browser Validation
```bash
npm run dev
```

Then navigate to [http://localhost:3004/timeline](http://localhost:3004/timeline)

Validated features:
- Column widths: Exact match (20% | 15% | 15% | 15% | 35%)
- Vertical alignment: Perfect (all cells equal height)
- Message interactions: Expand/collapse working
- SSE streaming: Real-time event updates
- Performance: Smooth rendering with 100+ events

## Documentation

### Core Documentation
- `CLAUDE.md` - Project instructions for Claude Code
- `docs/Module N - Title.md` - Detailed module documentation
- `docs/mcp-inspector-actor-based.html` - HTML mockup reference

### API Documentation
- Event recording structure documented in Module 8
- MCP client API in Module 6A
- SSE streaming protocol in Module 6B

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **LLM**: Claude (Anthropic API)
- **Protocol**: Model Context Protocol (MCP)

## Contributing

This is an educational project. When contributing:

1. Follow the modular architecture (create new modules for significant features)
2. Document all changes in module documentation
3. Maintain test coverage
4. Validate against HTML mockup design
5. Ensure vertical alignment is preserved

## Performance Considerations

- React.memo optimizations on TimelineRow and RowCell
- Efficient spacer insertion algorithm
- SSE connection with automatic reconnection
- No memory leaks detected during extended testing
- Smooth scrolling with 100+ events

## Future Enhancements

Potential modules for future development:

- **Module 12**: Session persistence and playback controls
- **Module 13**: Export timeline to PDF/PNG
- **Module 14**: Step-through debugging mode
- **Module 15**: Multi-session comparison view
- **Module 16**: Performance profiling dashboard

## License

MIT

## Support

For issues or questions:
- Check module documentation in `docs/`
- Review HTML mockup: `docs/mcp-inspector-actor-based.html`
- See `CLAUDE.md` for architectural guidance

## Acknowledgments

Built with Model Context Protocol (MCP) by Anthropic
- MCP Specification: https://modelcontextprotocol.io
- AWS Documentation MCP Server: https://github.com/awslabs/aws-documentation-mcp-server
