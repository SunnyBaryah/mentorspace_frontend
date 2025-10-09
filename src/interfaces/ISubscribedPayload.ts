import type { MediaKind, RtpParameters } from "mediasoup-client/types";

export interface SubscribedPayload {
  producerId: string;
  id: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  error?: string;
}
