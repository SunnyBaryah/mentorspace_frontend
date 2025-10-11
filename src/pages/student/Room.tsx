import { useEffect, useRef, useState } from "react";
import {
  joinStream,
  joinRoom,
  sendMessage,
  onNewMessage,
  leaveRoom,
  getMessages,
  socket,
} from "../../services/studentClient";
import { useParams } from "react-router-dom";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "../css/StudentPage.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Params = {
  roomId: string;
};

export default function StudentRoom() {
  // ✅ roomId comes from URL params, convert it to number
  const { roomId } = useParams<Params>();

  // ✅ Ref types
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

  // ✅ State types
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [hasStream, setHasStream] = useState<boolean>(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!roomId) return;
    console.log(`🚪 Joining room: ${roomId}`);
    joinRoom(roomId);

    const handleNewMessage = (msg: string) =>
      setChatMessages((prev) => [...prev, msg]);
    onNewMessage(handleNewMessage);

    getMessages(roomId, (messages: string[]) => {
      setChatMessages(messages);
      console.log("💬 Fetched old messages:", messages);
    });

    const handleNewProducer = async () => {
      console.log("✅ Teacher is now streaming! Auto joining stream...");
      if (videoRef.current) {
        try {
          await joinStream(videoRef.current);
          setIsConnected(true);
          setHasStream(true);
          console.log("✅ Stream joined successfully");
        } catch (error) {
          console.error("❌ Failed to join stream:", error);
        }
      }
    };

    socket.on("new-producer", handleNewProducer);

    socket.on("whiteboard-update", (newElements: ExcalidrawElement[]) => {
      console.log("🟢 Whiteboard updated, elements received", newElements);

      if (!whiteboardOpen) {
        setWhiteboardOpen(true);
      }

      if (excalidrawAPIRef.current) {
        console.log("✅ Excalidraw API detected, updating scene");
        excalidrawAPIRef.current.updateScene({
          elements: newElements,
        });
      } else {
        console.log("⚠️ Excalidraw API not yet ready, ignoring update");
      }
    });

    socket.on("whiteboard-close", () => {
      console.log("🔴 Whiteboard closed by teacher");
      if (excalidrawAPIRef.current) {
        excalidrawAPIRef.current.updateScene({ elements: [] });
      }
      setWhiteboardOpen(false);
    });

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      console.log(`🚪 Leaving room: ${roomId}`);
      leaveRoom();
      socket.off("new-producer", handleNewProducer);
      socket.off("whiteboard-update");
      socket.off("whiteboard-close");
      socket.off("connect");
      socket.off("disconnect");
      setChatMessages([]);
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (msg.trim() && roomId) {
      sendMessage(msg, roomId);
      setMsg("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Callback when Excalidraw API is ready
  const handleExcalidrawAPI = (api: ExcalidrawImperativeAPI) => {
    console.log("✅ Excalidraw API is now ready", api);
    excalidrawAPIRef.current = api;
    socket.emit("request-whiteboard-state", roomId);
  };

  const handleVideoPlay = () => {
    console.log("📹 Video play event fired");
    setIsVideoPlaying(true);
  };

  const handleVideoWaiting = () => {
    console.log("📹 Video waiting event fired");
    setIsVideoPlaying(false);
  };

  const handleVideoCanPlay = () => {
    console.log("📹 Video can play - attempting to play");
    if (videoRef.current && hasStream) {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleVideoLoadedData = () => {
    console.log("📹 Video data loaded");
    setIsVideoPlaying(true); // Set playing state when data is loaded
  };

  return (
    <div className="flex flex-col py-28 px-1 min-h-dvh bg-gradient-to-br from-[#070F2B] to-[#535C91]">
      <div className="student-header">
        <h2>Learning Session</h2>
        <div className="room-id bg-[#070F2B] w-4/5 lg:w-3/5 mx-auto px-4 py-1 rounded-lg">
          <p className="break-all">Room: {roomId}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-5 w-4/5 mx-auto">
        <div className="flex flex-col justify-center bg-[#9290C3] pt-5 pb-2 px-7 rounded-xl w-full xl:w-3/5 max-w-[727px] shadow-lg">
          {/* Status Indicator */}
          <div
            className={`status-indicator flex justify-center items-center font-light ${
              hasStream && isVideoPlaying
                ? "status-connected"
                : "status-waiting"
            }`}
          >
            <div className="status-dot"></div>
            {hasStream && isVideoPlaying
              ? "Connected to Live Stream"
              : "Waiting for Teacher..."}
          </div>

          <div className="relative">
            <div
              className={`flex justify-center ${
                whiteboardOpen
                  ? "absolute z-10 w-2/5 top-25 right-15 aspect-video"
                  : ""
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                controls
                playsInline
                muted // Add muted to help with autoplay policies
                className="video-element"
                onPlay={handleVideoPlay}
                onWaiting={handleVideoWaiting}
                onLoadStart={() => {
                  console.log("📹 Video load started");
                  setIsVideoPlaying(false);
                }}
                onLoadedData={handleVideoLoadedData}
                onCanPlay={handleVideoCanPlay}
                onError={(e) => {
                  console.error("❌ Video error:", e);
                }}
                style={{ display: hasStream ? "block" : "none" }} // Show video when stream is available
              />
              {!hasStream && (
                <div className="video-placeholder lg:text-lg font-light">
                  <div className="icon">🎓</div>
                  <div className="text">Waiting for Teacher Stream</div>
                  <div className="subtext">
                    The lesson will begin when your teacher starts streaming
                  </div>
                </div>
              )}
            </div>

            {whiteboardOpen && (
              <div className="whiteboard-container fade-in">
                <div className="whiteboard-header">
                  <span>📝</span>
                  <span>Interactive Whiteboard</span>
                </div>
                <div className="whiteboard-element">
                  <Excalidraw
                    excalidrawAPI={handleExcalidrawAPI}
                    viewModeEnabled
                    theme="light"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="chat-section grow-1 bg-[#535C91] shadow-lg">
          <div className="chat-header">
            <span>💬</span>
            <span>Live Chat</span>
          </div>

          <div className="chat-messages">
            <ul>
              {chatMessages.length === 0 ? (
                <li className="chat-message empty-state">
                  No messages yet. Say hello to your teacher!
                </li>
              ) : (
                chatMessages.map((m, i) => (
                  <li key={i} className="chat-message">
                    {m}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="flex gap-2 justify-between items-center">
            <Input
              className="h-[40px] bg-white"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question or share your thoughts..."
            />
            <Button
              className="h-[40px] chat-send-btn"
              onClick={handleSendMessage}
            >
              <span>Send</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div
        className={`connection-status ${
          isConnected ? "connection-good" : "connection-waiting"
        }`}
      >
        <div className="status-dot"></div>
        {isConnected ? "Connected" : "Connecting..."}
      </div>
    </div>
  );
}
