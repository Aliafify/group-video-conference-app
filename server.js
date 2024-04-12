require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const path = require("path");

const io = socket(server,{
    cors:{ 
      origin:["http://localhost:3000","*"] ,
      credentials: true,
    }   
    });

// -------define static directory----
app.use(express.static("build"));
app.use(express.static(path.resolve(__dirname, "./build")));
app.get("/*", function (req, res) {
  res.sendFile(
    path.resolve( 
      __dirname,
      "./build/index.html" || "./client/public/index.html"
    ),
    function (err) {
      if (err) {
        res.status(500).send(err);
      }
    }
  ); 
});
const users = {};
const rooms  = {}  
const socketToRoom = {};
// Initialize an object to store rooms and users


// Listen for socket connections
io.on("connection", (socket) => {
  try {
    // Handle "join-room" event
    socket.on("join-room", ({ roomId, userId, peerId }) => {
      // Store userId and associate with roomId
 
      socket.join(roomId);

      // Initialize the room's user array if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = [{peerId,userId,socket}];
      }

      // Check if the user is already in the room
      else if(rooms[roomId]){
        const userExists = rooms[roomId].some((user) => user.userId === userId);
        if (!userExists) {
          // Add the socket to the room's user array
          rooms[roomId].push({ userId,peerId, socket });
        }

      }
const usersInRoom =rooms[roomId].map(u=>{
  return {userId:u.userId,socketId:u.socket.id,peerId:u.peerId}
})

      // Get all users in the room except the current user
      // const usersInRoom = rooms[roomId].filter((user) => user.userId !== userId);

      // Emit the list of users in the room to the current user
      socket.emit("users in room", {usersInRoom});

      // Notify all clients in the room about the new user
      // io.to(roomId).emit("user-connected", { userId, socketId: socket.id });
    });
 
    // Handle "disconnect" event
    // socket.on("disconnect", () => {
    //   // Find the room that the disconnected user belongs to
    //   const room = Object.entries(rooms).find(([roomId, users]) =>
    //     users.some((user) => user.socket.id === socket.id)
    //   );

    //   if (room) {
    //     const [roomId, users] = room;
    //     // Remove the disconnected user from the room
    //     rooms[roomId] = users.filter((user) => user.socket.id !== socket.id);

    //     // Notify all clients in the room about the call end
    //     io.to(roomId).emit("callEnded");
    //   }
    // }); 

    // Handle "share-screen" event
    // socket.on("share-screen", ({ stream }) => {
    //   // Emit the screen share stream to all clients in the room
    //   const room = Object.entries(rooms).find(([roomId, users]) =>
    //     users.some((user) => user.socket.id === socket.id)
    //   );

    //   if (room) {
    //     const [roomId, users] = room;
    //     io.to(roomId).emit("shared-screen", { stream });
    //   }
    // });
  } catch (err) {
    console.error("Error occurred in socket connection:", err.message);
  }
});


server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));


