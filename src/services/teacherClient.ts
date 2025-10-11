import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import type {
  Producer,
  RtpCapabilities,
  Transport,
  TransportOptions,
} from "mediasoup-client/types";
import type { LinePoint } from "../interfaces/ILinePoint";
import type { DrawLinePayload } from "../interfaces/IDrawLinePayload";
import type { CursorMovePayload } from "../interfaces/ICursorMovePayload";
import { socket_url } from "@/constants";

type ChatMessage = string;

const socket = io(socket_url);

let device: mediasoupClient.Device;
let videoProducer: Producer | null = null;
let audioProducer: Producer | null = null;
let sendTransport: Transport | null = null;
let localStream: MediaStream | null = null;

let videoTrack: MediaStreamTrack | null = null;
let audioTrack: MediaStreamTrack | null = null;

export async function startStream(
  videoElement: HTMLVideoElement
): Promise<void> {
  if (!socket.connected) {
    await new Promise<void>((resolve) =>
      socket.once("connect", () => resolve())
    );
    console.log("✅ Connected to signaling server");
  }

  // Get camera and mic stream (for students)
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  videoTrack = localStream.getVideoTracks()[0] ?? null;
  audioTrack = localStream.getAudioTracks()[0] ?? null;

  if (videoElement) {
    videoElement.srcObject = localStream;
    try {
      await videoElement.play();
      console.log("✅ Local camera video playing");
    } catch (err) {
      console.error("❌ Failed to play local video:", err);
    }
  }

  socket.emit("message", { type: "getRouterRtpCapabilities" });

  socket.on("message", async (message) => {
    switch (message.type) {
      case "routerCapabilities":
        await loadDevice(message.data); // message.data is RtpCapabilities
        socket.emit("message", { type: "createProducerTransport" });
        break;

      case "producerTransportCreated":
        await createSendTransport(message.data); // message.data is TransportOptions
        break;

      default:
        console.warn("⚠️ Unhandled socket message:", message.type);
        break;
    }
  });
}

async function loadDevice(routerRtpCapabilities: RtpCapabilities) {
  device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities });
  console.log("✅ Device loaded");
}

async function createSendTransport(params: TransportOptions) {
  sendTransport = device.createSendTransport(params);

  sendTransport.on("connect", ({ dtlsParameters }, callback) => {
    socket.emit("message", {
      type: "connectProducerTransport",
      dtlsParameters,
    });
    callback();
  });

  sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
    socket.emit("message", {
      type: "produce",
      kind,
      rtpParameters,
    });

    socket.once("message", (message) => {
      if (message.type === "produced") {
        callback({ id: message.data.id });
      }
    });
  });

  if (videoTrack) {
    videoProducer = await sendTransport.produce({ track: videoTrack });
    console.log("✅ Video producer created");
  }

  if (audioTrack) {
    audioProducer = await sendTransport.produce({ track: audioTrack });
    console.log("✅ Audio producer created");
  }
}

// --- Toggle camera & mic --- //
export function toggleCamera(enable: boolean) {
  if (videoProducer) {
    enable ? videoProducer.resume() : videoProducer.pause();
    console.log(enable ? "📸 Camera resumed" : "📸 Camera paused");
  }
}

export function toggleMic(enable: boolean) {
  if (audioProducer) {
    enable ? audioProducer.resume() : "pause";
    console.log(enable ? "🎤 Mic resumed" : "🎤 Mic paused");
  }
}

// --- Leave stream and cleanup --- //
export async function leaveStream(videoElement: HTMLVideoElement) {
  console.log("👋 Leaving stream, cleaning up...");

  socket.emit("teacher-leave-room");

  if (videoProducer) {
    await videoProducer.close();
    videoProducer = null;
  }
  if (audioProducer) {
    await audioProducer.close();
    audioProducer = null;
  }
  if (sendTransport) {
    await sendTransport.close();
    sendTransport = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (videoElement) {
    videoElement.srcObject = null;
  }

  console.log("✅ Stream left and camera closed");
}

// --- Chat --- //
export function joinRoom(roomId: string) {
  socket.emit("user-join-room", roomId);
}

export function sendMessage(message: ChatMessage, roomId: string): void {
  socket.emit("user-message", message, roomId);
}

export function onNewMessage(callback: (message: ChatMessage) => void): void {
  socket.on("new-message", callback);
}

// ---- Whiteboard ---- //
export function sendWhiteboardLine(from: LinePoint, to: LinePoint): void {
  const payload: DrawLinePayload = { from, to };
  socket.emit("draw-line", payload);
}

export function updateCursor(x: number, y: number): void {
  const payload: CursorMovePayload = { x, y };
  socket.emit("cursor-move", payload);
}

export { socket };
