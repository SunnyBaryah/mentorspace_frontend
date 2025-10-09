import debounce from "lodash.debounce";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  startStream,
  joinRoom,
  sendMessage,
  onNewMessage,
  toggleCamera,
  toggleMic,
  leaveStream,
  socket,
} from "../../services/teacherClient";
import { getMessages } from "../../services/studentClient";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "../css/TeacherPage.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// type ChatMessage = {
//   user: string;
//   text: string;
//   timestamp: number;
// };

export default function TeacherRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const numericRoomId = roomId ? Number(roomId) : null;
  const navigate = useNavigate();

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const excalidrawAPI = useRef<ExcalidrawImperativeAPI | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // State
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [cameraOn, setCameraOn] = useState<boolean>(true);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState<boolean>(false);
  const [whiteboardElements, setWhiteboardElements] = React.useState<
    ExcalidrawElement[]
  >([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  useEffect(() => {
    if (!numericRoomId) return;

    joinRoom(numericRoomId);
    onNewMessage((msg: string) => setChatMessages((prev) => [...prev, msg]));

    getMessages(numericRoomId, (messages: string[]) => {
      setChatMessages(messages);
      console.log("💬 Fetched old messages:", messages);
    });
  }, [numericRoomId]);

  useEffect(() => {
    if (excalidrawAPI.current) {
      console.log("✅ Excalidraw API ready:", excalidrawAPI.current);
      // Example: excalidrawAPI.current.resetScene();
    }
  }, [excalidrawAPI.current]);

  const emitWhiteboardUpdate = debounce((elements) => {
    socket.emit("whiteboard-update", elements);
  }, 100);

  const handleStartStreamConfirmed = async () => {
    if (!videoRef.current) return;
    await startStream(videoRef.current);
    setStreaming(true);

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      const recorder = new MediaRecorder(displayStream);
      recorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lecture-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        console.log("💾 Recording automatically saved to PC");
      };

      recorder.start();
      console.log("🎥 Tab recording started");
    } catch (err) {
      console.error("❌ Failed to start tab recording:", err);
    }
  };

  const handleStartStream = () => {
    setShowInstructions(true);
  };

  const handleLeaveStream = async () => {
    if (!videoRef.current) return;
    await leaveStream(videoRef.current);
    setStreaming(false);
    setCameraOn(true);
    setMicOn(true);

    if (whiteboardOpen) {
      socket.emit("whiteboard-close");
    }
    setWhiteboardOpen(false);

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    navigate("/");
    window.location.reload();
  };

  const handleToggleCamera = () => {
    const newState = !cameraOn;
    toggleCamera(newState);
    setCameraOn(newState);
  };

  const handleToggleMic = () => {
    const newState = !micOn;
    toggleMic(newState);
    setMicOn(newState);
  };

  const handleSendMessage = () => {
    if (msg.trim() && numericRoomId) {
      sendMessage(msg, numericRoomId);
      setMsg("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const toggleWhiteboard = () => {
    if (!whiteboardOpen) {
      setWhiteboardOpen(true);
    } else {
      socket.emit("whiteboard-close");
      setWhiteboardOpen(false);
    }
  };

  const handleWhiteboardChange = (
    elements: readonly ExcalidrawElement[],
    _appState: AppState,
    _files: BinaryFiles
  ) => {
    // setWhiteboardElements([...elements]); // spread makes it mutable
    emitWhiteboardUpdate(elements);
  };

  return (
    <div className="flex flex-col py-28 px-1 min-h-dvh bg-gradient-to-br from-[#070F2B] to-[#535C91]">
      <div className="teacher-header ">
        <h2>Teaching Session</h2>
        <div className="room-id bg-[#070F2B] w-4/5 lg:w-3/5 mx-auto px-4 py-1 rounded-lg">
          <p className="break-all">Room: {roomId}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-5 w-4/5 mx-auto">
        <div className="flex flex-col justify-between bg-[#9290C3] pt-5 pb-2 px-7 rounded-xl w-full xl:w-3/5 max-w-[727px] shadow-lg">
          {/* Status Indicator */}
          <div
            className={`flex justify-center items-center gap-2 py-2 rounded-3xl mb-4 font-light ${
              streaming ? "status-streaming" : "status-offline"
            }`}
          >
            <div className="status-dot"></div>
            {streaming ? "Live Streaming" : "Currently Offline"}
          </div>

          <div className="relative">
            <div
              className={`flex justify-center ${
                whiteboardOpen
                  ? "absolute z-10 w-2/5 top-30 right-15 aspect-video"
                  : ""
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                className="video-element"
                style={{ display: streaming ? "block" : "none" }}
              />
              {!streaming && (
                <div className="video-placeholder lg:text-lg font-light">
                  📹 Video will appear here when streaming starts
                </div>
              )}
            </div>
            {whiteboardOpen && (
              <div className="whiteboard-container">
                <div className="whiteboard-element">
                  <Excalidraw
                    excalidrawAPI={(api: ExcalidrawImperativeAPI) =>
                      (excalidrawAPI.current = api)
                    }
                    onChange={handleWhiteboardChange}
                    initialData={{ elements: whiteboardElements }}
                    theme="light"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="w-full mx-auto py-4 flex flex-wrap gap-2 justify-center ">
            {!streaming ? (
              <Button
                className="w-full h-[45px] hover:cursor-pointer chat-send-btn lg:text-lg bg-gradient-to-br from-[#070F2B] to-[#535C91]"
                onClick={handleStartStream}
              >
                🎥 Start Stream & Recording
              </Button>
            ) : (
              <>
                <button
                  className={`btn grow-1 flex justify-center ${
                    cameraOn ? "btn-warning" : "btn-secondary"
                  }`}
                  onClick={handleToggleCamera}
                >
                  {cameraOn ? "📹 Camera Off" : "📹 Camera On"}
                </button>
                <button
                  className={`btn grow-1 flex justify-center ${
                    micOn ? "btn-warning" : "btn-secondary"
                  }`}
                  onClick={handleToggleMic}
                >
                  {micOn ? "🎤 Mic Off" : "🎤 Mic On"}
                </button>
                <button
                  className="btn grow-1 flex justify-center  btn-success"
                  onClick={toggleWhiteboard}
                >
                  {whiteboardOpen
                    ? "📝 Close Whiteboard"
                    : "📝 Open Whiteboard"}
                </button>
                <button
                  className="btn grow-1 flex justify-center  btn-danger"
                  onClick={handleLeaveStream}
                >
                  🚪 Leave Stream
                </button>
              </>
            )}
          </div>
        </div>

        <div className="chat-section grow-1 bg-[#535C91] shadow-lg">
          <div className="chat-header font-light">💬 Live Chat</div>

          <div className="chat-messages">
            <ul>
              {chatMessages.length === 0 ? (
                <li className="chat-message empty-state">
                  No messages yet. Start the conversation!
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
              placeholder="Type your message..."
            />
            <Button
              className="h-[40px] chat-send-btn"
              onClick={handleSendMessage}
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="modal-overlay">
          <div className="modal-content bg-[#e9ecef]">
            <h3>🎯 Important Instructions Before Starting</h3>
            <ul>
              <li>
                🔹{" "}
                <strong>
                  Open this teacher page in a separate Chrome window
                </strong>{" "}
                (not as a tab in a multi-tab window).
              </li>
              <li>
                🔹 When prompted, select{" "}
                <strong>
                  the entire window where this teacher page is open
                </strong>{" "}
                to share.
              </li>
              <li>
                🔹 <strong>Do not press "Stop sharing" manually</strong> during
                the session. Use "Leave Stream & Stop Recording" button instead.
              </li>
            </ul>
            <Button
              className="h-[40px] chat-send-btn w-full text-lg"
              onClick={() => {
                setShowInstructions(false);
                handleStartStreamConfirmed();
              }}
            >
              ✅ I Understand, Start Stream
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
