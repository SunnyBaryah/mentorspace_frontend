import { io } from "socket.io-client";
import * as mediasoup from "mediasoup-client";
import type {
  DtlsParameters,
  MediaKind,
  RtpCapabilities,
  RtpParameters,
  Transport,
} from "mediasoup-client/types";
import type { SubscribedPayload } from "../interfaces/ISubscribedPayload";

export const socket = io("http://localhost:9000");

let device: mediasoup.Device; // replace with proper mediasoup Device type
let producerTransport;
let consumerTransport: Transport;
// let producer;
let consumer;

// ---------- Initialize on connection ----------
socket.on("connect", () => {
  console.log("✅ Connected to server");
  socket.emit("message", { type: "getRouterRtpCapabilities" });
});

// ---------- Utility Functions ----------

const getUserMedia = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    console.log("🎥 Got local media stream");
    return stream;
  } catch (err) {
    console.error("❌ Failed to get user media:", err);
    throw err;
  }
};

const loadDevice = async (rtpCapabilities: RtpCapabilities) => {
  try {
    device = new mediasoup.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    console.log("✅ Device loaded with router capabilities");
  } catch (err) {
    console.error("❌ Failed to load device:", err);
    throw err;
  }
};

// ---------- Publish (send) ----------
export const publish = async () => {
  if (!device) {
    console.warn("⚠️ Device not loaded yet");
    return;
  }

  socket.emit("message", {
    type: "createProducerTransport",
    forceTcp: false,
    rtpCapabilities: device.rtpCapabilities,
  });
};

// ---------- Subscribe (receive) ----------
export const subscribe = async () => {
  socket.emit("message", {
    type: "createConsumerTransport",
    forceTcp: false,
  });
};

// ---------- Message Handler ----------
socket.on("message", async (message) => {
  console.log("📩 Received message:", message);

  switch (message.type) {
    case "routerCapabilities":
      await loadDevice(message.data);
      break;

    case "producerTransportCreated":
      await handleProducerTransport(message.data);
      break;

    case "producerConnected":
      console.log("✅ Producer transport connected");
      break;

    case "produced":
      console.log("✅ Producer created:", message.data.id);
      break;

    case "subTransportCreated":
      await handleConsumerTransport(message.data);
      break;

    case "subConnected":
      console.log("✅ Consumer transport connected");
      socket.emit("message", {
        type: "consume",
        rtpCapabilities: device.rtpCapabilities,
      });
      break;

    case "subscribed":
      await handleSubscribed(message.data);
      break;

    case "resumed":
      console.log("✅ Consumer resumed");
      break;

    default:
      console.warn("Unknown message type:", message.type);
  }
});

// ---------- Producer Transport Handler ----------
const handleProducerTransport = async (
  params: ConstructorParameters<typeof Transport>[0] // params type from Transport constructor
): Promise<void> => {
  producerTransport = device.createSendTransport(params);

  producerTransport.on(
    "connect",
    (
      { dtlsParameters }: { dtlsParameters: DtlsParameters },
      callback: () => void,
      _errback: (error: Error) => void
    ) => {
      socket.emit("message", {
        type: "connectProducerTransport",
        dtlsParameters,
      });

      socket.once("message", (msg) => {
        if (msg.type === "producerConnected") callback();
      });
    }
  );

  producerTransport.on(
    "produce",
    async (
      {
        kind,
        rtpParameters,
      }: { kind: MediaKind; rtpParameters: RtpParameters; appData?: any },
      callback: ({ id }: { id: string }) => void,
      _errback: (error: Error) => void
    ) => {
      socket.emit("message", { type: "produce", kind, rtpParameters });

      socket.once("message", (msg) => {
        if (msg.type === "produced" && msg.data?.id) {
          callback({ id: msg.data.id }); // ✅ Pass object, not string
        }
      });
    }
  );

  const stream = await getUserMedia();
  const videoTrack = stream.getVideoTracks()[0];

  const localVideo = document.getElementById(
    "localVideo"
  ) as HTMLVideoElement | null;
  if (localVideo) {
    localVideo.srcObject = stream;
    localVideo.muted = true;
    await localVideo.play();
  }

  await producerTransport.produce({ track: videoTrack });
  console.log("✅ Producer started");
};

// ---------- Consumer Transport Handler ----------
const handleConsumerTransport = async (
  params: ConstructorParameters<typeof Transport>[0]
): Promise<void> => {
  consumerTransport = device.createRecvTransport(params);

  consumerTransport.on(
    "connect",
    (
      { dtlsParameters }: { dtlsParameters: DtlsParameters },
      callback: () => void,
      _errback: (error: Error) => void
    ) => {
      socket.emit("message", {
        type: "connectConsumerTransport",
        dtlsParameters,
      });

      socket.once("message", (msg) => {
        if (msg.type === "subConnected") {
          callback();
        }
      });
    }
  );
};

// ---------- Handle Subscribed (consume) ----------
const handleSubscribed = async ({
  producerId,
  id,
  kind,
  rtpParameters,
  error,
}: SubscribedPayload): Promise<void> => {
  if (error) {
    console.error("❌ Subscription error:", error);
    return;
  }

  consumer = await consumerTransport.consume({
    id,
    producerId,
    kind,
    rtpParameters,
  });

  const remoteStream = new MediaStream();
  remoteStream.addTrack(consumer.track);

  const remoteVideo = document.getElementById(
    "remoteVideo"
  ) as HTMLVideoElement | null;
  if (remoteVideo) {
    remoteVideo.srcObject = remoteStream;

    remoteVideo.onloadedmetadata = async () => {
      try {
        await remoteVideo.play();
        console.log("🎥 Remote video playing");
      } catch (err) {
        console.error("❌ Error playing remote video", err);
      }
    };
  }

  socket.emit("message", { type: "resume" });
};

export function sendClientMessage({
  message,
  roomId,
}: {
  message: string;
  roomId: number;
}) {
  socket.emit("user-message", message, roomId);
}

export async function getRoomMessages(roomId: number) {
  try {
    const response = await socket
      .timeout(5000)
      .emitWithAck("get-messages", roomId);
    console.log(`Messages for room (${roomId}):`, response.messages);
    if (response.status === "ok") return response.messages;
  } catch (err) {
    console.error("❌ Get room messages error:", err);
  }
}

export function JoinRoom(roomId: number) {
  socket.emit("user-join-room", roomId);
}
