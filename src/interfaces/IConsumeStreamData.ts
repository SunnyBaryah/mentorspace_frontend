import type { MediaKind, RtpParameters } from "mediasoup-client/types";

export interface ConsumeStreamData {
  id: string;
  producerId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
}
