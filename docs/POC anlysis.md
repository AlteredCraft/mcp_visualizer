# POC Analysis vs PRD
This document analyzes the MCP Inspector Teaching App POC against the Product Requirements Document (PRD) to identify any inaccuracies or gaps.

## **PRD Inaccuracies Identified from POC Validation**

### **1. Claude API Call Terminology (Minor - Terminology)**

**PRD Section 3.1 and throughout**

- **PRD says**: Calls to Claude use method name `generate()` with prompt and tools
- **Reality**: The Claude API uses `messages.create()`, not `generate()`. This is evident in [claude_client.py:78](vscode-webview://1rthtb9g1l3s1kbger81te5sv8ab2062gg33qtn546ohsi766p0i/mcp_visualizer/poc/claude_client.py#L78)
- **Impact**: Low - just terminology, but should be corrected for technical accuracy
- **Fix**: Change references from `generate()` to `messages.create()` or use generic terminology like "inference request"

### **2. LLM Response Structure (Moderate - Technical)**

**PRD Section 7.3 (Row 10)**

- **PRD says**: "LLM → Host App: Returns `tool_calls` object"
- **Reality**: Claude returns a response with `content` blocks, not a `tool_calls` object. The response contains content blocks of type `tool_use`, as seen in [claude_client.py:104-123](vscode-webview://1rthtb9g1l3s1kbger81te5sv8ab2062gg33qtn546ohsi766p0i/mcp_visualizer/poc/claude_client.py#L104-123)
- **Impact**: Moderate - affects how message visualization should work
- **Fix**: Change to "Returns response with `tool_use` content blocks" or similar

### **3. Multiple Tool Calls in Single Phase (Major - Workflow)**

**PRD Section 7.4 - Phase 4: Execution Round Trip**

- **PRD structure**: Shows Phase 4 as Rows 11-16, implying a single tool execution per phase
- **Reality**: When Claude selects multiple tools (verified in POC with "London + 10*5" query), ALL tool calls are executed in Phase 4 before moving to Phase 5. The POC shows two separate "PHASE 4: EXECUTION ROUND TRIP" headers for the two tools.
- **Impact**: Major - affects UI design for vertical alignment and spacer blocks
- **Fix**: Update Phase 4 description to clarify that multiple tool calls can occur sequentially within this single phase, before synthesis begins

### **4. Missing Detail on Tool Result Structure (Minor - Completeness)**

**PRD Section 7.4 (Row 15)**

- **PRD says**: "MCP Server → Host App: tools/call response with result"
- **Reality**: The tool result has a specific structure with `content` array, `structuredContent` object, `isError` flag, and `meta` field. This is visible in the POC output showing the complete result structure.
- **Impact**: Low - developers will discover this, but PRD should document it
- **Fix**: Add detail about MCP tool result structure in technical requirements section

### **5. User Consent Checkpoint Position (Minor - Clarification)**

**PRD Section 7.4 (Row 11)**

- **PRD says**: "(Optional) User consent checkpoint (shown in Host App if implemented)"
- **Reality**: When multiple tools are selected, consent would likely be requested once for all tools before ANY execution begins, not per-tool
- **Impact**: Low - PRD correctly marks as optional, but could clarify batch consent
- **Fix**: Add note that consent may cover multiple tools when batch execution occurs

### **6. Communication Lane Description Clarity (Minor - Pedagogical)**

**PRD Section 1.1**

- **PRD says**: "Column 4 displays Host App ↔ MCP Server communication, even though it skips over the LLM column"
- **Potential confusion**: The word "skips" might imply the LLM is in the physical path. The POC confirms the LLM never touches MCP traffic.
- **Impact**: Very low - mostly clear, but could be stronger
- **Fix**: Rephrase to emphasize "Column 4 shows Host App → MCP Server communication directly, with no LLM involvement, even though the LLM column appears between them"

### **7. Tool Schema Conversion Details (Minor - Technical)**

**PRD Section 7.2 (Row 7)**

- **PRD says**: "Host App formats tool schemas for LLM"
- **Reality**: Specific conversion happens - MCP's `inputSchema` becomes Claude's `input_schema`, as shown in [claude_client.py:22-46](vscode-webview://1rthtb9g1l3s1kbger81te5sv8ab2062gg33qtn546ohsi766p0i/mcp_visualizer/poc/claude_client.py#L22-46)
- **Impact**: Low - implementation detail
- **Fix**: Optional - could add technical note about schema field name mapping

### **8. Phase 3 Response Content (Minor - Accuracy)**

**PRD Section 7.3 (Row 9)**

- **PRD says**: LLM console shows "Analyzing available tools..."
- **Reality**: The actual Claude response includes BOTH a text block (explaining the action) AND tool_use blocks. The POC shows "Block 0: text (48 chars)" before the tool_use block.
- **Impact**: Low - affects LLM column visualization
- **Fix**: Note that Claude's planning response can include explanatory text alongside tool selections

### **9. Missing: Tool Result Formatting for Claude (Moderate - Technical)**

**PRD doesn't mention**: The conversion step from MCP tool result to Claude's expected format

- **Reality**: MCP returns results with a `content` array structure, but Claude expects `tool_result` blocks with `tool_use_id` and simple content strings. This conversion happens in [claude_client.py:125-148](vscode-webview://1rthtb9g1l3s1kbger81te5sv8ab2062gg33qtn546ohsi766p0i/mcp_visualizer/poc/claude_client.py#L125-148)
- **Impact**: Moderate - this is a key Host App responsibility that should be documented
- **Fix**: Add to Phase 4 or technical requirements that Host App converts MCP result format to Claude's tool_result format

### **10. Message Recording Structure - Missing Tool-Specific Fields (Minor - Data Model)**

**PRD Section 9.1**

- **PRD structure**: Shows basic event structure but doesn't include tool-specific metadata
- **Reality**: Events should capture tool names, tool IDs, argument details for debugging and playback
- **Impact**: Low - affects future playback features
- **Fix**: Expand metadata structure to include `toolName`, `toolId`, `arguments`, `resultContent`

---

## **Summary**

**Critical for immediate PRD correction:**

1. **#3** - Multiple tool calls within Phase 4 (affects UI design significantly)
2. **#9** - MCP→Claude tool result conversion (missing key Host App responsibility)
3. **#2** - LLM response structure (content blocks vs tool_calls object)

**Should be corrected for accuracy:**

- #1, #4, #5, #6, #7, #8, #10

**Overall Assessment**: The PRD is remarkably accurate to the actual MCP protocol. The main gaps are around Claude API specifics and the handling of multiple tool calls within a single planning phase.
