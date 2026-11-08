"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { authFetch } from "@/lib/api-utils";
import { getSocket } from "@/lib/socket";
import Peer, { type Instance as PeerInstance, type SignalData } from "simple-peer";
import { useCallback, useEffect, useRef, useState } from "react";

export type CallMode = "AUDIO" | "VIDEO";
export type CallPhase = "idle" | "ringing" | "calling" | "connecting" | "in-call" | "ended";

export type CallTarget = {
  id: string;
  name?: string | null;
};

export type IncomingCallInfo = {
  sessionId: string;
  fromUserId: string;
  fromName?: string | null;
  callType: CallMode;
  scheduleId?: string | null;
  startedAt: string;
};

export type ActiveCallInfo = {
  sessionId: string;
  peerUserId: string;
  peerName?: string | null;
  callType: CallMode;
  scheduleId?: string | null;
  initiatedByMe: boolean;
};

export type RealtimeCallController = {
  phase: CallPhase;
  incomingCall: IncomingCallInfo | null;
  activeCall: ActiveCallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
  isMuted: boolean;
  isCameraEnabled: boolean;
  startCall: (args: { target: CallTarget; callType: CallMode; scheduleId?: string | null }) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
};

type SignalPayload = {
  sessionId: string;
  signal: SignalData;
  fromUserId: string;
  toUserId: string;
};

type IncomingPayload = {
  sessionId: string;
  fromUserId: string;
  toUserId: string;
  fromName?: string | null;
  callType: CallMode;
  scheduleId?: string | null;
  startedAt: string;
  signal?: SignalData;
};

type EndPayload = {
  sessionId: string;
  fromUserId: string;
  toUserId: string;
  reason?: string;
};

function getMediaConstraints(callType: CallMode): MediaStreamConstraints {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video:
      callType === "VIDEO"
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24, max: 30 },
          }
        : false,
  };
}

export function useRealtimeCall() {
  const { user } = useAuth();
  const socket = getSocket();

  const [phase, setPhase] = useState<CallPhase>("idle");
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const phaseRef = useRef<CallPhase>("idle");
  const incomingRef = useRef<IncomingCallInfo | null>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeCallRef = useRef<ActiveCallInfo | null>(null);
  const pendingSignalsRef = useRef<Map<string, SignalData[]>>(new Map());
  const hasSentIncomingInviteRef = useRef(false);
  const _ringtoneRef = useRef<HTMLAudioElement | null>(null); // reserved for future use
  const isAcceptingRef = useRef(false);
  const endingSessionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    incomingRef.current = incomingCall;
  }, [incomingCall]);

  const updateSession = useCallback(
    async (sessionId: string, action: "connect" | "end" | "missed" | "declined" | "failed", endedReason?: string) => {
      try {
        await authFetch(`/api/calls/sessions/${sessionId}`, {
          method: "PATCH",
          body: JSON.stringify({ action, endedReason }),
        });
      } catch (err) {
        console.warn("[Call Hook] Failed to update session metadata:", err);
      }
    },
    []
  );

  const stopAndClearStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraEnabled(true);
  }, []);

  const destroyPeer = useCallback(() => {
    if (peerRef.current) {
      try {
        peerRef.current.removeAllListeners();
        peerRef.current.destroy();
      } catch (err) {
        console.warn("[Call Hook] Error during peer destruction:", err);
      }
      peerRef.current = null;
    }
  }, []);

  const sendSignalEvent = useCallback(
    async (event: "incoming-call" | "call-signal" | "call-accepted" | "call-ended", payload: Record<string, unknown>) => {
      if (!socket || !socket.connected) {
        console.warn("[Call Hook] Socket disconnected. Cannot send event:", event);
        return;
      }
      socket.emit(event, payload);
    },
    [socket]
  );

  const ensureLocalStream = useCallback(async (callType: CallMode) => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
        const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(callType));
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
    } catch (err) {
        console.error("[Call Hook] Media access failed:", err);
        // If VIDEO failed, try audio-only as fallback
        if (callType === "VIDEO") {
          console.warn("[Call Hook] Video failed, falling back to audio-only");
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = audioStream;
            setLocalStream(audioStream);
            setIsCameraEnabled(false);
            return audioStream;
          } catch (audioErr) {
            console.error("[Call Hook] Audio fallback also failed:", audioErr);
          }
        }
        throw new Error("Unable to access camera or microphone. Please check permissions.");
    }
  }, []);

  const applyPendingSignals = useCallback((sessionId: string, peer: PeerInstance) => {
    const queued = pendingSignalsRef.current.get(sessionId) || [];
    if (!queued.length) return;

    queued.forEach((signal) => {
      try {
        peer.signal(signal);
      } catch (err) {
        console.warn("[Call Hook] Failed to apply queued signal:", err);
      }
    });

    pendingSignalsRef.current.delete(sessionId);
  }, []);

  const endCurrentCall = useCallback(
    async (reason = "ended", remoteRequested = false) => {
      const current = activeCallRef.current;
      
      // If no active call, check if we're in ringing/calling state and reset
      if (!current) {
        destroyPeer();
        stopAndClearStreams();
        setPhase("idle");
        setIncomingCall(null);
        return;
      }

      if (endingSessionIdsRef.current.has(current.sessionId)) return;
      endingSessionIdsRef.current.add(current.sessionId);

      if (!remoteRequested && user?.id) {
        try {
          await sendSignalEvent("call-ended", {
            sessionId: current.sessionId,
            fromUserId: user.id,
            toUserId: current.peerUserId,
            reason,
          });
        } catch (err) {
          console.warn("[Call Hook] Failed to send end signal:", err);
        }
      }

      await updateSession(current.sessionId, "end", reason);

      destroyPeer();
      stopAndClearStreams();
      pendingSignalsRef.current.delete(current.sessionId);

      setActiveCall(null);
      activeCallRef.current = null;
      setPhase("ended");
      setTimeout(() => setPhase("idle"), 800);

      endingSessionIdsRef.current.delete(current.sessionId);
    },
    [destroyPeer, sendSignalEvent, stopAndClearStreams, updateSession, user?.id]
  );

  const queueOrApplySignal = useCallback((payload: SignalPayload) => {
    const current = activeCallRef.current;

    if (current && current.sessionId === payload.sessionId && peerRef.current) {
      try {
        peerRef.current.signal(payload.signal);
      } catch (err) {
        console.warn("[Call Hook] Direct signal application failed:", err);
      }
      return;
    }

    const queued = pendingSignalsRef.current.get(payload.sessionId) || [];
    queued.push(payload.signal);
    pendingSignalsRef.current.set(payload.sessionId, queued);
  }, []);

  const createPeer = useCallback(
    (
      opts: {
        initiator: boolean;
        sessionId: string;
        peerUserId: string;
        callType: CallMode;
        scheduleId?: string | null;
      },
      stream: MediaStream
    ) => {
      destroyPeer(); // Ensure no leftover peers

      const peer = new Peer({
        initiator: opts.initiator,
        trickle: true,
        stream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
          ],
        },
      });

      peer.on("signal", async (signal: SignalData) => {
        if (!user?.id) return;

        if (opts.initiator && !hasSentIncomingInviteRef.current) {
          hasSentIncomingInviteRef.current = true;
          await sendSignalEvent("incoming-call", {
            sessionId: opts.sessionId,
            fromUserId: user.id,
            toUserId: opts.peerUserId,
            fromName: user.name,
            callType: opts.callType,
            scheduleId: opts.scheduleId || null,
            startedAt: new Date().toISOString(),
            signal,
          } satisfies IncomingPayload);
          return;
        }

        await sendSignalEvent("call-signal", {
          sessionId: opts.sessionId,
          fromUserId: user?.id,
          toUserId: opts.peerUserId,
          signal,
        } satisfies SignalPayload);
      });

      peer.on("stream", (nextRemoteStream) => {
        console.log("[Call Hook] Remote stream received");
        setRemoteStream(nextRemoteStream);
      });

      peer.on("connect", async () => {
        console.log("[Call Hook] Peer connection established");
        setPhase("in-call");
        await updateSession(opts.sessionId, "connect");
      });

      peer.on("close", () => {
        console.log("[Call Hook] Peer connection closed");
        // Only end call if we were actually connected. During calling/connecting,
        // close events are normal (peer hasn't answered yet).
        if (phaseRef.current === "in-call") {
          void endCurrentCall("peer-closed", true);
        }
      });

      peer.on("error", (eventError: Error) => {
        console.error("[Call Hook] Peer error:", eventError);
        // Don't auto-terminate the call for errors during the calling/connecting phase.
        // ICE negotiation timeouts and failed candidates are normal while waiting
        // for the remote user to accept. Only treat errors as fatal during in-call.
        if (phaseRef.current === "in-call") {
          setError(eventError.message || "Connection failed. Please retry.");
          void endCurrentCall("failed", false);
        } else {
          console.warn("[Call Hook] Non-fatal peer error during", phaseRef.current, "- ignoring");
        }
      });

      peerRef.current = peer;
      applyPendingSignals(opts.sessionId, peer);

      return peer;
    },
    [applyPendingSignals, destroyPeer, endCurrentCall, sendSignalEvent, updateSession, user?.id, user?.name]
  );

  const startCall = useCallback(
    async ({ target, callType, scheduleId }: { target: CallTarget; callType: CallMode; scheduleId?: string | null }) => {
      if (!user?.id) return;
      if (!target.id || target.id === user.id) return;
      if (phase === "calling" || phase === "connecting" || phase === "in-call") return;

      setError(null);
      setIncomingCall(null);
      setPhase("calling");

      try {
        const stream = await ensureLocalStream(callType);

        const { session } = await authFetch<{ session: { id: string } }>("/api/calls/sessions", {
          method: "POST",
          body: JSON.stringify({
            calleeId: target.id,
            callType,
            scheduleId: scheduleId || null,
          }),
        });

        hasSentIncomingInviteRef.current = false;
        pendingSignalsRef.current.set(session.id, []);

        const nextActiveCall: ActiveCallInfo = {
          sessionId: session.id,
          peerUserId: target.id,
          peerName: target.name,
          callType,
          scheduleId: scheduleId || null,
          initiatedByMe: true,
        };

        setActiveCall(nextActiveCall);
        activeCallRef.current = nextActiveCall;

        createPeer(
          {
            initiator: true,
            sessionId: session.id,
            peerUserId: target.id,
            callType,
            scheduleId,
          },
          stream
        );
      } catch (startError) {
        const message = startError instanceof Error ? startError.message : "Unable to initiate connection";
        setError(message);
        setPhase("idle");
        stopAndClearStreams();
      }
    },
    [createPeer, ensureLocalStream, phase, stopAndClearStreams, user?.id]
  );

  const acceptCall = useCallback(async () => {
    if (!user?.id || !incomingCall) return;

    // CRITICAL: Clear incomingRef FIRST to prevent the race condition where
    // onCallEnded sees incomingRef still set and kills the call during accept.
    const savedIncoming = { ...incomingCall };
    setIncomingCall(null);
    incomingRef.current = null;
    isAcceptingRef.current = true;

    setError(null);
    setPhase("connecting");

    try {
      const stream = await ensureLocalStream(savedIncoming.callType);

      const nextActiveCall: ActiveCallInfo = {
        sessionId: savedIncoming.sessionId,
        peerUserId: savedIncoming.fromUserId,
        peerName: savedIncoming.fromName,
        callType: savedIncoming.callType,
        scheduleId: savedIncoming.scheduleId,
        initiatedByMe: false,
      };

      setActiveCall(nextActiveCall);
      activeCallRef.current = nextActiveCall;

      createPeer(
        {
          initiator: false,
          sessionId: savedIncoming.sessionId,
          peerUserId: savedIncoming.fromUserId,
          callType: savedIncoming.callType,
          scheduleId: savedIncoming.scheduleId,
        },
        stream
      );

      await sendSignalEvent("call-accepted", {
        sessionId: savedIncoming.sessionId,
        fromUserId: user.id,
        toUserId: savedIncoming.fromUserId,
      });

      isAcceptingRef.current = false;
    } catch (acceptError) {
      isAcceptingRef.current = false;
      const message = acceptError instanceof Error ? acceptError.message : "Unable to accept connection";
      console.error("[Call Hook] Accept call failed:", message);
      setError(message);
      setPhase("idle");
      stopAndClearStreams();
    }
  }, [createPeer, ensureLocalStream, incomingCall, sendSignalEvent, stopAndClearStreams, user?.id]);

  const declineCall = useCallback(async () => {
    if (!incomingCall || !user?.id) return;

    try {
      await sendSignalEvent("call-ended", {
        sessionId: incomingCall.sessionId,
        fromUserId: user.id,
        toUserId: incomingCall.fromUserId,
        reason: "declined",
      } satisfies EndPayload);

      await updateSession(incomingCall.sessionId, "declined", "declined");
    } catch (err) {
      console.warn("[Call Hook] Failed to send decline signal:", err);
    }

    pendingSignalsRef.current.delete(incomingCall.sessionId);
    setIncomingCall(null);
    incomingRef.current = null;
    setPhase("idle");
  }, [incomingCall, sendSignalEvent, updateSession, user?.id]);

  const endCall = useCallback(async () => {
    await endCurrentCall("ended", false);
  }, [endCurrentCall]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const hasVideo = stream.getVideoTracks().length > 0;
    if (!hasVideo) {
        // If camera was off, try to re-enable? (This is complex as it requires new stream)
        return;
    }

    const nextEnabled = !isCameraEnabled;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsCameraEnabled(nextEnabled);
  }, [isCameraEnabled]);

  useEffect(() => {
    if (!user?.id || !socket) return;

    socket.emit("join-user-room", user.id);

    const onIncomingCall = (payload: IncomingPayload) => {
      if (!payload?.toUserId || payload.toUserId !== user.id) return;
      if (!payload.sessionId || !payload.fromUserId) return;

      const hasActive =
        phaseRef.current === "calling" ||
        phaseRef.current === "connecting" ||
        phaseRef.current === "in-call" ||
        !!activeCallRef.current;

      if (hasActive) {
        console.log("[Call Hook] Busy: Rejecting incoming call from", payload.fromUserId);
        void sendSignalEvent("call-ended", {
          sessionId: payload.sessionId,
          fromUserId: user.id,
          toUserId: payload.fromUserId,
          reason: "busy",
        } satisfies EndPayload);
        void updateSession(payload.sessionId, "failed", "busy");
        return;
      }

      // Clear any leftover error from previous calls
      setError(null);

      if (payload.signal) {
        pendingSignalsRef.current.set(payload.sessionId, [payload.signal]);
      }

      setIncomingCall({
        sessionId: payload.sessionId,
        fromUserId: payload.fromUserId,
        fromName: payload.fromName,
        callType: payload.callType,
        scheduleId: payload.scheduleId,
        startedAt: payload.startedAt,
      });
      setPhase("ringing");
    };

    const onCallSignal = (payload: SignalPayload) => {
      if (!payload?.toUserId || payload.toUserId !== user.id) return;
      if (!payload.signal || !payload.sessionId) return;
      queueOrApplySignal(payload);
    };

    const onCallAccepted = (payload: { sessionId: string; toUserId: string }) => {
      if (!payload?.toUserId || payload.toUserId !== user.id) return;
      if (!activeCallRef.current) return;
      if (activeCallRef.current.sessionId !== payload.sessionId) return;
      console.log("[Call Hook] Call accepted by remote partner");
      setPhase("connecting");
    };

    const onCallEnded = (payload: EndPayload) => {
      if (!payload?.toUserId || payload.toUserId !== user.id) return;

      console.log("[Call Hook] Remote partner ended/declined call:", payload.reason);

      // If we're currently accepting the call, ignore end signals — they're stale
      if (isAcceptingRef.current) {
        console.log("[Call Hook] Ignoring call-ended during accept flow");
        return;
      }

      // Only handle incoming-call cancellation if we're still in ringing state
      if (incomingRef.current && incomingRef.current.sessionId === payload.sessionId) {
        setIncomingCall(null);
        incomingRef.current = null;
        setPhase("idle");
        void updateSession(payload.sessionId, "missed", payload.reason || "missed");
        return;
      }

      if (!activeCallRef.current || activeCallRef.current.sessionId !== payload.sessionId) return;

      void endCurrentCall(payload.reason || "ended", true);
    };

    if (socket) {
      socket.on("incoming-call", onIncomingCall);
      socket.on("call-signal", onCallSignal);
      socket.on("call-accepted", onCallAccepted);
      socket.on("call-ended", onCallEnded);
    }

    return () => {
      if (socket) {
        socket.off("incoming-call", onIncomingCall);
        socket.off("call-signal", onCallSignal);
        socket.off("call-accepted", onCallAccepted);
        socket.off("call-ended", onCallEnded);
      }

      destroyPeer();
      stopAndClearStreams();
      setIncomingCall(null);
      setActiveCall(null);
      setPhase("idle");
    };
  }, [
    destroyPeer,
    endCurrentCall,
    queueOrApplySignal,
    sendSignalEvent,
    stopAndClearStreams,
    socket,
    updateSession,
    user?.id,
  ]);

  // ─── Ringtone Effect ───
  // Play a ringtone during calling (outgoing) and ringing (incoming) phases
  useEffect(() => {
    const shouldPlay = phase === "calling" || phase === "ringing";

    if (shouldPlay) {
      try {
        // Create a ringtone using Web Audio API (no external file needed)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const createRingTone = () => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = phase === "ringing" ? "sine" : "sine";
          osc.frequency.value = phase === "ringing" ? 440 : 480;
          gain.gain.value = 0.15;
          return { osc, gain };
        };

        let intervalId: ReturnType<typeof setInterval>;
        let currentOsc: OscillatorNode | null = null;

        const playTone = () => {
          if (audioCtx.state === "closed") return;
          const { osc, gain } = createRingTone();
          osc.start();
          currentOsc = osc;
          // Ring for 1 second, silence for 2 seconds
          setTimeout(() => {
            if (audioCtx.state !== "closed") {
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
              setTimeout(() => { try { osc.stop(); } catch {} }, 150);
            }
          }, phase === "ringing" ? 800 : 1200);
        };

        playTone();
        intervalId = setInterval(playTone, phase === "ringing" ? 2500 : 3500);

        return () => {
          clearInterval(intervalId);
          try { currentOsc?.stop(); } catch {}
          try { audioCtx.close(); } catch {}
        };
      } catch (e) {
        console.warn("[Call Hook] Could not play ringtone:", e);
      }
    }
  }, [phase]);

  return {
    phase,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    error,
    isMuted,
    isCameraEnabled,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  } satisfies RealtimeCallController;
}
