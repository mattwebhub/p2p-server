import { z } from 'zod';

// Signal message types
export const SignalTypeEnum = z.enum(['sdp', 'ice', 'host-change', 'kick']);
export type SignalType = z.infer<typeof SignalTypeEnum>;

// Base signal message schema
export const BaseSignalMessageSchema = z.object({
  type: SignalTypeEnum,
  senderId: z.string(),
  timestamp: z.number().optional().default(() => Date.now()),
});

// SDP signal message schema
export const SdpSignalMessageSchema = BaseSignalMessageSchema.extend({
  type: z.literal('sdp'),
  targetId: z.string(),
  sdp: z.object({
    type: z.enum(['offer', 'answer']),
    sdp: z.string(),
  }),
});
export type SdpSignalMessage = z.infer<typeof SdpSignalMessageSchema>;

// ICE signal message schema
export const IceSignalMessageSchema = BaseSignalMessageSchema.extend({
  type: z.literal('ice'),
  targetId: z.string(),
  ice: z.object({
    candidate: z.string(),
    sdpMid: z.string().nullable(),
    sdpMLineIndex: z.number().nullable(),
  }),
});
export type IceSignalMessage = z.infer<typeof IceSignalMessageSchema>;

// Host change signal message schema
export const HostChangeSignalMessageSchema = BaseSignalMessageSchema.extend({
  type: z.literal('host-change'),
  newHostId: z.string(),
});
export type HostChangeSignalMessage = z.infer<typeof HostChangeSignalMessageSchema>;

// Kick signal message schema
export const KickSignalMessageSchema = BaseSignalMessageSchema.extend({
  type: z.literal('kick'),
  targetId: z.string(),
  reason: z.string().optional(),
});
export type KickSignalMessage = z.infer<typeof KickSignalMessageSchema>;

// Union of all signal message schemas
export const SignalMessageSchema = z.discriminatedUnion('type', [
  SdpSignalMessageSchema,
  IceSignalMessageSchema,
  HostChangeSignalMessageSchema,
  KickSignalMessageSchema,
]);
export type SignalMessage = z.infer<typeof SignalMessageSchema>;
