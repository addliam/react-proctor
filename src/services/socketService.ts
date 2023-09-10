import { socket } from "../socket";

// callback approach
const connect = (callback: any) => {
  socket.on("connect", () => {
    const socketId = socket.id;
    callback(socketId);
  });
};

const emitLogEvent = (eventId: String) => {
  let data = {
    evento_id: eventId,
  };
  socket.timeout(5000).emit("log-event", data, () => {});
};

const emitStart = (
  userId: String,
  testId: String,
  duracionSegundos: Number
) => {
  let data = {
    usuario_id: userId,
    test_id: testId,
    tiempo: duracionSegundos,
  };
  socket.timeout(5000).emit("start", data, () => {});
};

export const socketService = { connect, emitLogEvent, emitStart };
