import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getUncachableYouTubeClient, extractVideoId } from "./youtube";
import type { WSMessage, ChatUserStatus } from "@shared/schema";
import { registerLicenseRoutes } from "./license/routes";

interface WSClient extends WebSocket {
  userId?: string;
  userName?: string;
  userRole?: string;
  isAlive?: boolean;
}

const connectedUsers = new Map<string, WSClient>();
const pinnedMessages = new Set<string>();
const blockedUsers = new Set<string>();
const mutedUsers = new Set<string>();

function isAdmin(role?: string): boolean {
  return role === 'admin';
}

function isModeratorOrAdmin(role?: string): boolean {
  return role === 'admin' || role === 'moderator';
}

export async function registerRoutes(app: Express): Promise<Server> {
  registerLicenseRoutes(app);
  
  app.post("/api/youtube/video-info", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      const youtube = await getUncachableYouTubeClient();
      const response = await youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const title = video.snippet?.title || "";
      const views = parseInt(video.statistics?.viewCount || "0", 10);

      res.json({ title, views });
    } catch (error) {
      console.error("YouTube API error:", error);
      res.status(500).json({ error: "Failed to fetch video information" });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WSClient) => {
    console.log('New WebSocket connection established');
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'user_status':
            ws.userId = message.data.userId;
            ws.userName = message.data.userName;
            ws.userRole = message.data.userRole;
            connectedUsers.set(message.data.userId, ws);
            
            broadcastToAll(message);
            sendUserList(ws);
            break;

          case 'chat_message':
            if (blockedUsers.has(message.data.userId)) {
              console.log(`Blocked user ${message.data.userId} attempted to send message`);
              return;
            }
            if (mutedUsers.has(message.data.userId)) {
              console.log(`Muted user ${message.data.userId} attempted to send message`);
              return;
            }
            broadcastToOthers(message, ws);
            break;

          case 'message_read':
          case 'user_typing':
            broadcastToAll(message);
            break;

          case 'message_pinned':
            if (!isAdmin(ws.userRole)) {
              console.log(`Non-admin user ${ws.userId} attempted to pin message`);
              return;
            }
            if (message.data.isPinned) {
              pinnedMessages.add(message.data.messageId);
            } else {
              pinnedMessages.delete(message.data.messageId);
            }
            broadcastToAll(message);
            break;

          case 'user_blocked':
            if (!isAdmin(ws.userRole)) {
              console.log(`Non-admin user ${ws.userId} attempted to block user`);
              return;
            }
            blockedUsers.add(message.data.userId);
            broadcastToAll(message);
            break;

          case 'user_muted':
            if (!isAdmin(ws.userRole)) {
              console.log(`Non-admin user ${ws.userId} attempted to mute user`);
              return;
            }
            mutedUsers.add(message.data.userId);
            broadcastToAll(message);
            break;

          case 'user_unblocked':
            if (!isAdmin(ws.userRole)) {
              console.log(`Non-admin user ${ws.userId} attempted to unblock user`);
              return;
            }
            blockedUsers.delete(message.data.userId);
            broadcastToAll(message);
            break;

          case 'user_unmuted':
            if (!isAdmin(ws.userRole)) {
              console.log(`Non-admin user ${ws.userId} attempted to unmute user`);
              return;
            }
            mutedUsers.delete(message.data.userId);
            broadcastToAll(message);
            break;

          case 'chat_cleared':
            if (!isAdmin(ws.userRole)) {
              console.log(`Non-admin user ${ws.userId} attempted to clear chat`);
              return;
            }
            pinnedMessages.clear();
            broadcastToAll(message);
            break;

          case 'request_user_list':
            sendUserList(ws);
            break;

          default:
            console.log('Unknown message type:', message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        connectedUsers.delete(ws.userId);
        
        const statusMessage: WSMessage = {
          type: 'user_status',
          data: {
            userId: ws.userId,
            userName: ws.userName || '',
            userRole: ws.userRole || '',
            status: 'offline',
            lastSeen: new Date().toISOString(),
          }
        };
        broadcastToAll(statusMessage);
      }
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WSClient) => {
      if (ws.isAlive === false) {
        if (ws.userId) {
          connectedUsers.delete(ws.userId);
        }
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  function broadcastToAll(message: WSMessage) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client: WSClient) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  function broadcastToOthers(message: WSMessage, excludeClient: WSClient) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client: WSClient) => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  function sendUserList(ws: WSClient) {
    const userList: ChatUserStatus[] = Array.from(connectedUsers.values())
      .filter(client => client.userId)
      .map(client => ({
        userId: client.userId!,
        userName: client.userName!,
        userRole: client.userRole!,
        status: 'online' as const,
        lastSeen: new Date().toISOString(),
      }));

    const message: WSMessage = {
      type: 'user_list',
      data: userList,
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  return httpServer;
}
