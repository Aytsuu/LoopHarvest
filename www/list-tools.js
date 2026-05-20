/* eslint-disable */
const { spawn } = require('child_process');

// Spawn the MCP server
const mcp = spawn('npx', ['-y', '@mui/mcp@latest'], {
  shell: true
});

let output = '';
mcp.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString());
  try {
    // If we receive responses, let's see if we can parse them
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        const json = JSON.parse(line);
        if (json.result && json.result.tools) {
          console.log('SUCCESS! Tools list:', JSON.stringify(json.result.tools, null, 2));
          mcp.kill();
          process.exit(0);
        }
      }
    }
  } catch (err) {
    // Ignore JSON parse errors for incomplete lines
  }
});

mcp.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

mcp.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});

// JSON-RPC sequence
// 1. Initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

// Write initialize request
mcp.stdin.write(JSON.stringify(initRequest) + '\n');

// 2. We'll wait a bit then send list tools request
setTimeout(() => {
  const listRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  mcp.stdin.write(JSON.stringify(listRequest) + '\n');
}, 1000);
