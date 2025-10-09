import type {
  DtlsParameters,
  MediaKind,
  RtpParameters,
} from "mediasoup-client/types";

export interface MessagePayload {
  type: string;
  dtlsParameters?: DtlsParameters;
  kind?: MediaKind;
  rtpParameters?: RtpParameters;
  data?: { id: string };
}
