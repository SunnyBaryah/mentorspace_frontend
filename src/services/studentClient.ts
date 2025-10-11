import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import type {
  Consumer,
  DtlsParameters,
  RtpCapabilities,
  Transport,
  TransportOptions,
} from "mediasoup-client/types";
import type { ConsumeStreamData } from "../interfaces/IConsumeStreamData";
import type { GetMessagesResponse } from "../interfaces/IGetMessagesResponse";
import { socket_url } from "@/constants";
declare global {
  interface Window {
    remoteStream?: MediaStream;
  }
}

type Message = string;

const socket = io(socket_url);
let device: mediasoupClient.Device;
let recvTransport: Transport | null = null;
let isConsuming: boolean = false; // 💡 Flag to avoid duplicate flows
let videoElementRef: HTMLVideoElement | null = null;
window.remoteStream = new MediaStream(); // Shared global stream

socket.on("connect", () => {
  console.log("✅ Connected to signaling server");
});

function registerSocketListeners() {
  socket.on("message", async (message) => {
    console.log("💬 Server message received:", message.type);

    switch (message.type) {
      case "routerCapabilities":
        await loadDevice(message.data);
        break;

      case "subTransportCreated":
        await createConsumerTransport(message.data);
        break;

      case "subConnected":
        socket.emit("message", {
          type: "consume",
          rtpCapabilities: device.rtpCapabilities,
        });
        break;

      case "subscribed":
        await consumeStream(message.data);
        break;
    }
  });

  socket.on("new-producer", () => {
    console.log("🚩 New producer available! Starting receive flow");
    if (isConsuming) {
      console.log("⚠️ Already consuming. Ignoring duplicate new-producer.");
      return;
    }
    isConsuming = true;
    socket.emit("message", { type: "getRouterRtpCapabilities" });
  });
}

registerSocketListeners();

export async function joinStream(
  videoElement: HTMLVideoElement
): Promise<void> {
  console.log("👂 Waiting for teacher to start streaming...");
  videoElementRef = videoElement;

  // Attach if already received stream before join
  if (window.remoteStream && window.remoteStream.getTracks().length > 0) {
    console.log("🎞️ Stream already ready — attaching now");
    await attachStreamToVideo(videoElementRef, window.remoteStream);
  }
}

async function loadDevice(routerRtpCapabilities: RtpCapabilities) {
  device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities });
  console.log("✅ Device loaded");
  socket.emit("message", { type: "createConsumerTransport" });
}

async function createConsumerTransport(
  params: TransportOptions
): Promise<void> {
  if (!device) throw new Error("Device not initialized");

  recvTransport = device.createRecvTransport(params);

  recvTransport.on(
    "connect",
    (
      { dtlsParameters }: { dtlsParameters: DtlsParameters },
      callback: () => void,
      errback: (error: Error) => void
    ) => {
      console.log("connectConsumerTransport sent to server");

      socket.emit("message", {
        type: "connectConsumerTransport",
        dtlsParameters,
      });

      socket.once("message", (message: { type: string; data?: unknown }) => {
        if (message.type === "subConnected") {
          console.log("✅ Consumer transport connected");
          callback();
        } else {
          errback(new Error("❌ Failed to connect consumer transport"));
        }
      });
    }
  );

  socket.emit("message", {
    type: "consume",
    rtpCapabilities: device.rtpCapabilities,
  });
}

async function consumeStream(data: ConsumeStreamData): Promise<void> {
  if (!recvTransport) {
    throw new Error("❌ No recvTransport available");
  }

  console.log("🎥 Consuming stream now, kind:", data.kind);

  const consumer: Consumer = await recvTransport.consume({
    id: data.id,
    producerId: data.producerId,
    kind: data.kind,
    rtpParameters: data.rtpParameters,
  });

  console.log("Track kind:", consumer.track.kind);

  // Ensure remoteStream exists
  if (!window.remoteStream) {
    window.remoteStream = new MediaStream();
  }

  // Add track to global stream
  window.remoteStream.addTrack(consumer.track);

  // Attach to video element if available
  if (videoElementRef) {
    await attachStreamToVideo(videoElementRef, window.remoteStream);
  } else {
    console.log("📥 Track added, but video element not yet set");
  }

  try {
    await consumer.resume();
    console.log(`✅ Consumer resumed for kind: ${consumer.kind}`);
  } catch (err) {
    console.warn("❌ Failed to resume consumer:", err);
  }
}

let lastPlayPromise = null;

async function attachStreamToVideo(
  videoElem: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  if (!videoElem) return;

  try {
    videoElem.pause();
  } catch (e) {}

  videoElem.srcObject = stream;
  videoElem.muted = false; // Enable audio from teacher

  try {
    lastPlayPromise = videoElem.play();
    await lastPlayPromise;
    console.log("✅ Remote stream playing!");
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.warn(
        "⚠️ Play aborted, likely due to pause during race — ignoring."
      );
    } else {
      console.error("❌ Error playing video:", err);
    }
  }
}

// --- Room Cleanup Logic --- //
export function leaveRoom() {
  console.log("🚪 Leaving room, cleaning up...");

  if (window.remoteStream) {
    window.remoteStream.getTracks().forEach((track) => {
      track.stop();
    });
    window.remoteStream = new MediaStream();
  }

  if (recvTransport) {
    try {
      recvTransport.close();
    } catch (e) {
      console.warn("⚠️ Error closing recvTransport:", e);
    }
    recvTransport = null;
  }

  // Remove listeners to avoid conflicts
  socket.removeAllListeners("message");
  socket.removeAllListeners("new-producer");

  isConsuming = false; // Reset flag

  // Re-register listeners for next room
  registerSocketListeners();

  console.log("✅ Cleanup complete. Ready to join new room.");
}

// --- Chat functions --- //
export function joinRoom(roomId: string) {
  console.log("Room joined : ", roomId);
  socket.emit("user-join-room", roomId);
}

export function sendMessage(message: string, roomId: string) {
  socket.emit("user-message", message, roomId);
}

export function onNewMessage(callback: (message: Message) => void): void {
  socket.on("new-message", callback);
}

export function getMessages(
  roomId: string,
  callback: (messages: Message[]) => void
): void {
  socket.emit("get-messages", roomId, (response: GetMessagesResponse) => {
    if (response.status === "ok") {
      callback(response.messages);
    } else {
      console.warn("❌ Failed to fetch messages");
    }
  });
}

export { socket };
