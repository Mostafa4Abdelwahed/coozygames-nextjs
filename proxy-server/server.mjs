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

server.listen(port, host, () => {
  console.log(`Wisp server listening on ws://${host}:${port}/wisp/`);
});
