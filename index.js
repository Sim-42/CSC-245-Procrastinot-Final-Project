const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.helloWorld = onRequest((request, response) => {
  logger.info("Request Path:", request.path);
  logger.info("Query:", request.query);
  logger.info("Body:", request.body);
  logger.info("Headers:", request.headers);
  console.log("Headers:", request.headers);

  // Handle GET /rooms/{roomId}
  if (request.method === "GET" && request.path.startsWith("/rooms/")) {
    const roomId = request.path.split("/")[2];
    if (roomId === "r_123") {
      return response.status(200).json({
        id: "r_123",
        name: "Algebra Hour",
        mode: "pomodoro",
        inviteCode: "AB12CD"
      });
    } else {
      return response.status(404).json({ message: "roomId not found" });
    }
  }

  // Handle POST /rooms
  if (request.method === "POST" && request.path === "/rooms") {
    const data = request.body;

    if (!data.name || !data.mode) {
      return response.status(400).json({ message: "invalid payload" });
    }

    // Return dummy created room
    return response.status(201).json({
      id: "r_123",
      name: data.name,
      mode: data.mode,
      inviteCode: "AB12CD"
    });
  }

  // Fallback for unrecognized paths
  return response.status(404).json({ message: "Unrecognized path." });
});
