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
    let userID = null; // Initialize userId for the socket
  // let roomID = null
    // Handle "join-room" event
    socket.on("join-room", ({ roomId, userId, peerId }) => {
      console.log('Joind', userId,peerId)
      // Store userId and associate with roomId
      if(rooms[roomId] && rooms[roomId].length){
        let usersInRoom =[]
        
        for (let u of rooms[roomId]){
          usersInRoom.push({userId:u.userId,socketId:u.socket.id,peerId:u.peerId}) 
          // Emit the list of users in the room to the current user
        }
        console.log('sed users in room',usersInRoom)
        socket.emit("users in room", {usersInRoom});
      }      
        
      userID=userId 
    //  roomID=roomId
      socket.join(roomId);
      // console.log('users',rooms[roomId])
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
        else{
          rooms[roomId].map(u=>{
            if(u.userId===userId){
              return {userId,peerId,socket}
            }
            return u
          })
        }

      }
     


      // Notify all clients in the room about the new user
      // io.to(roomId).emit("user-connected", { userId, socketId: socket.id });
    });
 
    // Handle "disconnect" event
   
    socket.on("disconnect", () => {
     
        // Notify other users in the room about the disconnected user
        const roomId = Object.keys(rooms).find((roomId) =>
          rooms[roomId].some((user) => user.socket.id === socket.id)
        );
        // console.log('rooms', rooms[roomId].pop())
        if (roomId) {
          const [user]= rooms[roomId].filter(u=>u.socket.id===socket.id)
          console.log('user left', user)
          // Remove the disconnected user from the room
          rooms[roomId] = rooms[roomId].filter((user) => user.socket.id !== socket.id);

          // Emit a 'user left' event to notify other users in the room
          io.to(roomId).emit("user left", { userId:user.userId,socketId:user.socket.id });
//  console.log(first)
          // Perform any additional cleanup tasks if needed
          // console.log(`User ${user.userId} has disconnected`);
        } 
       
    });
    
  } catch (err) {
    console.error("Error occurred in socket connection:", err.message);
  }
});


server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));


