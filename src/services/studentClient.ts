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
  params: TransportOptions & { iceServers?: RTCIceServer[] }
): Promise<void> {
  if (!device) throw new Error("Device not initialized");

  console.log("🔧 Creating consumer transport with params:", {
    id: params.id,
    iceServers: params.iceServers,
    iceCandidatesCount: params.iceCandidates?.length,
  });

  recvTransport = device.createRecvTransport({
    ...params,
    // ✅ Pass ICE servers to the transport
    iceServers: params.iceServers || [{ urls: "stun:stun.l.google.com:19302" }],
    // 🔥 FORCE relay mode - Railway blocks direct connections
    iceTransportPolicy: "relay",
  });

  console.log("⚠️ Using relay-only mode (required for Railway)");

  // Monitor ICE gathering
  recvTransport.on("icegatheringstatechange", (state) => {
    console.log(`🧊 ICE Gathering State: ${state}`);
  });

  recvTransport.on(
    "connect",
    (
      { dtlsParameters }: { dtlsParameters: DtlsParameters },
      callback: () => void,
      errback: (error: Error) => void
    ) => {
      console.log("🔌 Connecting consumer transport...");

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

  // ✅ Monitor connection state with detailed logging
  recvTransport.on("connectionstatechange", async (state) => {
    console.log(`🔄 Transport connection state: ${state}`);

    if (state === "connected") {
      console.log("✅ WebRTC connection established successfully!");

      // Log some basic stats
      try {
        const stats = await recvTransport!.getStats();
        const candidatePair = Array.from(stats.values()).find(
          (s: any) => s.type === "candidate-pair" && s.state === "succeeded"
        );
        if (candidatePair) {
          console.log("📊 Active connection:", {
            localCandidateType: candidatePair.local?.candidateType,
            remoteCandidateType: candidatePair.remote?.candidateType,
            protocol: candidatePair.local?.protocol,
          });
        }
      } catch (err) {
        console.warn("Could not get stats:", err);
      }
    } else if (state === "failed") {
      console.error("❌ Transport connection failed!");
      console.error("This usually means:");
      console.error("  1. Server IP (announcedIp) is incorrect");
      console.error("  2. Firewall blocking UDP/TCP ports");
      console.error("  3. TURN server not working properly");
    } else if (state === "closed") {
      console.error("❌ Transport connection closed!");
    }
  });

  socket.emit("message", {
    type: "consume",
    rtpCapabilities: device.rtpCapabilities,
  });
}

const activeProducerIds = new Set();

async function consumeStream(data: ConsumeStreamData): Promise<void> {
  if (!recvTransport) throw new Error("No recvTransport available");
  if (!window.remoteStream) throw new Error("No remote stream available");
  // Ignore if this producer is already being consumed
  if (activeProducerIds.has(data.producerId)) {
    console.log(`⚠️ Already consuming producer ${data.producerId}`);
    return;
  }
  activeProducerIds.add(data.producerId);

  const consumer: Consumer = await recvTransport.consume({
    id: data.id,
    producerId: data.producerId,
    kind: data.kind,
    rtpParameters: data.rtpParameters,
  });

  window.remoteStream.addTrack(consumer.track);

  if (videoElementRef) {
    await attachStreamToVideo(videoElementRef, window.remoteStream);
  }

  try {
    consumer.resume();
    console.log(`✅ Consumer resumed for kind: ${consumer.kind}`);
  } catch (err) {
    console.warn("❌ Failed to resume consumer:", err);
  }
}

// let lastPlayPromise = null;

async function attachStreamToVideo(
  videoElem: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  if (!videoElem) return;

  // Defensive: if no tracks yet, wait briefly for a track to appear
  if (!stream || stream.getTracks().length === 0) {
    console.warn(
      "⚠️ attachStreamToVideo called but stream has no tracks. Waiting up to 2s for tracks..."
    );
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Timeout waiting for tracks.");
        resolve();
      }, 2000);

      const onTrackAdded = () => {
        if (stream.getTracks().length > 0) {
          clearTimeout(timeout);
          stream.removeEventListener("addtrack", onTrackAdded as any);
          resolve();
        }
      };

      // Some browsers fire addtrack on MediaStream object
      // but TS doesn't know the exact signature — cast to any
      (stream as any).addEventListener?.("addtrack", onTrackAdded);
    });
  }

  try {
    // ensure muted BEFORE play to help autoplay policies
    videoElem.autoplay = true;
    videoElem.muted = true;
    videoElem.playsInline = true;

    // assign srcObject synchronously
    videoElem.srcObject = stream;

    console.log(
      "📺 Assigned srcObject. Tracks:",
      stream.getTracks().map((t) => ({
        kind: t.kind,
        readyState: t.readyState,
        enabled: t.enabled,
      }))
    );

    // wait for metadata or first frame before calling play
    const waitForPlayable = () =>
      new Promise<void>((resolve) => {
        let resolved = false;

        const tryResolve = () => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve();
        };

        const onLoadedMetadata = () => {
          console.log("📹 Video element loadedmetadata");
          tryResolve();
        };

        const onCanPlay = () => {
          console.log("📹 Video element canplay");
          tryResolve();
        };

        const onError = (ev: Event) => {
          console.error("❌ Video element error event:", ev);
          tryResolve();
        };

        const onFrame = () => {
          console.log(
            "📸 Received first video frame (requestVideoFrameCallback)"
          );
          tryResolve();
        };

        function cleanup() {
          videoElem.removeEventListener("loadedmetadata", onLoadedMetadata);
          videoElem.removeEventListener("canplay", onCanPlay);
          videoElem.removeEventListener("error", onError);
          if (
            (videoElem as any).cancelVideoFrameCallback &&
            (videoElem as any).__vframeHandle
          ) {
            try {
              (videoElem as any).cancelVideoFrameCallback(
                (videoElem as any).__vframeHandle
              );
            } catch (e) {}
          }
        }

        videoElem.addEventListener("loadedmetadata", onLoadedMetadata);
        videoElem.addEventListener("canplay", onCanPlay);
        videoElem.addEventListener("error", onError);

        // If supported, use requestVideoFrameCallback for robust first-frame detection
        if ((videoElem as any).requestVideoFrameCallback) {
          (videoElem as any).__vframeHandle = (
            videoElem as any
          ).requestVideoFrameCallback(onFrame);
        }

        // safety timeout
        setTimeout(() => {
          console.warn("⚠️ waitForPlayable timeout (5s)");
          tryResolve();
        }, 5000);
      });

    await waitForPlayable();

    try {
      await videoElem.play();
      console.log("✅ Remote stream playing!");
    } catch (err: any) {
      console.error("❌ Error calling play():", err);
    }
  } catch (err) {
    console.error("❌ attachStreamToVideo error:", err);
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

  activeProducerIds.clear();
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
