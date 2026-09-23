import http from "node:http";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";

const port = parseInt(process.env.PORT || "8081", 10);
const host = process.env.HOST || "0.0.0.0";

logging.set_level(logging.INFO);

const server = http.createServer();

server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.endsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

// Health endpoint (HTTP) so ops tooling can probe the container without a WS handshake.
server.on("request", (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || host}`);
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "wisp", uptime: Math.round(process.uptime()) }));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(port, host, () => {
  console.log(`Wisp server listening on ws://${host}:${port}/wisp/`);
});
