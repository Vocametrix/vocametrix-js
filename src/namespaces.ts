/**
 * Ergonomic namespace classes exposed on VocametrixClient.
 *
 * Each namespace hides upload patterns, case-style differences, SSE auth quirks,
 * and the start_sec=0 falsy bug from callers.
 */

import {
  AudioInput,
  fetchWithRetry,
  uploadAssignFileId,
  uploadBlobUrl,
  sseStream,
  SseEvent,
} from "./_http.js";
import { VocametrixServerError, VocametrixValidationError } from "./exceptions.js";
import type {
  GetCalculateAvqiResponses,
  GetCalculateDsiResponses,
  GetCalculateCppResponses,
  GetCalculateHnrMultibandResponses,
  GetJitterShimmerResponses,
  GetCalculateAmbitusResponses,
  PostPronunciationAssessmentResponses,
  PostTextToSpeechResponses,
  PostAnalyzePhonemesLiveResponses,
  GetTherapyResultBySessionIdResponses,
  GetCalculateProsodySimilarityResponses,
  GetGemapsExtractResponses,
  PostSoundLevelResponses,
  GetCalculateH1H2Responses,
  GetCalculateSpectralAdvancedResponses,
  GetCalculateSzRatioResponses,
  GetCalculateGneResponses,
  GetCalculateFormantStatisticsResponses,
  GetCalculateAbiResponses,
  GetCalculateVoiceDynamicsResponses,
} from "./_generated/types.gen.js";

/** Voice-range values the DSI formula needs besides the recording. */
export interface DsiVoiceRange {
  /** Maximum phonation time, seconds. */
  mpt: number;
  /** Highest F0 reached, Hz. */
  maximumF0: number;
  /** Softest intensity, dB SPL: needs a calibrated measurement. */
  minimumIntensity: number;
  age: number;
  /** 1 male, 2 female, 3 other. */
  gender: 1 | 2 | 3;
}

export interface TranscriptionEvent {
  status: string;
  progress: number | undefined;
  displayText: string | undefined;
  isTerminalSuccess: boolean;
  isTerminalFailure: boolean;
  raw: SseEvent;
}

function asJson<T>(resp: { json(): Promise<unknown> }): Promise<T> {
  return resp.json() as Promise<T>;
}

function makeTranscriptionEvent(payload: SseEvent): TranscriptionEvent {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- payload is unvalidated server JSON; status may be missing
  const normalised = (payload.status ?? "").toLowerCase();
  return {
    status: payload.status,
    progress: payload.progress,
    displayText: payload.displayText,
    isTerminalSuccess: normalised === "succeeded",
    isTerminalFailure: ["failed", "error"].includes(normalised),
    raw: payload,
  };
}

export class AvqiNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async calculate(
    sustainedVowel: AudioInput,
    connectedSpeech: AudioInput,
    version: "v03.01" | "v02.03" = "v03.01",
    email?: string,
  ): Promise<GetCalculateAvqiResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const csId = await uploadAssignFileId(this.baseUrl, this.authHeaders, connectedSpeech, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId, csFileId: csId, version });
    const resp = await fetchWithRetry(`${this.baseUrl}/api/calculate-avqi?${params.toString()}`, {
      headers: this.authHeaders,
    });
    return asJson<GetCalculateAvqiResponses[200]>(resp);
  }
}

export class DsiNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async calculate(
    sustainedVowel: AudioInput,
    voiceRange: DsiVoiceRange,
    email?: string,
  ): Promise<GetCalculateDsiResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({
      svFileId: svId,
      mpt: String(voiceRange.mpt),
      maximumF0: String(voiceRange.maximumF0),
      minimumIntensity: String(voiceRange.minimumIntensity),
      age: String(voiceRange.age),
      gender: String(voiceRange.gender),
    });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-dsi?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateDsiResponses[200]>(resp);
  }
}

export class CppNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async calculate(sustainedVowel: AudioInput, email?: string): Promise<GetCalculateCppResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-cpp?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateCppResponses[200]>(resp);
  }
}

export class HnrNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async calculate(
    sustainedVowel: AudioInput,
    age: number,
    gender: 1 | 2 = 1,
    email?: string,
  ): Promise<GetCalculateHnrMultibandResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId, age: String(age), gender: String(gender) });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-hnr-multiband?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateHnrMultibandResponses[200]>(resp);
  }
}

export class JitterShimmerNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async calculate(sustainedVowel: AudioInput, email?: string): Promise<GetJitterShimmerResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/jitter-shimmer?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetJitterShimmerResponses[200]>(resp);
  }
}

export class VrpNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async calculate(
    sustainedVowel: AudioInput,
    age = 30,
    gender: 1 | 2 = 1,
    email?: string,
  ): Promise<GetCalculateAmbitusResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({
      svFileId: svId,
      age: String(age),
      gender: String(gender),
    });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-ambitus?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateAmbitusResponses[200]>(resp);
  }
}

export class PronunciationNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
  ) {}

  async assess(
    audio: AudioInput,
    referenceText: string,
    locale = "en-US",
  ): Promise<PostPronunciationAssessmentResponses[200]> {
    const blobURL = await uploadBlobUrl(this.baseUrl, this.authHeaders, audio);
    const resp = await fetchWithRetry(`${this.baseUrl}/api/pronunciation-assessment`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ blobURL, referenceText, locale }),
    });
    return asJson<PostPronunciationAssessmentResponses[200]>(resp);
  }
}

export class TranscriptionNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly apiKey: string,
  ) {}

  async *stream(
    audio: AudioInput,
    locale = "en-US",
  ): AsyncGenerator<TranscriptionEvent> {
    const blobUrl = await uploadBlobUrl(this.baseUrl, this.authHeaders, audio);
    const resp = await fetchWithRetry(`${this.baseUrl}/api/offline-speech-to-text`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ blobURL: blobUrl, locale }),
    });
    const startBody = (await resp.json()) as { transcriptionId?: unknown };
    if (typeof startBody.transcriptionId !== "string" || startBody.transcriptionId.length === 0) {
      throw new VocametrixServerError(
        `offline-speech-to-text response missing 'transcriptionId' (got ${JSON.stringify(startBody)})`,
      );
    }
    const transcriptionId = startBody.transcriptionId;

    for await (const payload of sseStream(this.baseUrl, transcriptionId, this.apiKey)) {
      const event = makeTranscriptionEvent(payload);
      // A progress event already says "Succeeded"; the "complete" event that
      // follows has no status, only contentUrl, a link to the Azure transcript
      // JSON. That event is the real end, so the text is fetched there.
      const contentUrl = payload["contentUrl"];
      if (typeof contentUrl === "string") {
        const transcript = (await (await fetchWithRetry(contentUrl, {})).json()) as {
          combinedRecognizedPhrases?: { display?: string }[];
        };
        event.status = "Succeeded";
        event.isTerminalSuccess = true;
        event.displayText = transcript.combinedRecognizedPhrases?.[0]?.display;
      } else if (event.isTerminalSuccess) {
        event.isTerminalSuccess = false;
      }
      yield event;
    }
  }
}

export class TtsNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
  ) {}

  async synthesize(
    text: string,
    locale = "en-US",
    voiceName?: string,
  ): Promise<PostTextToSpeechResponses[200]> {
    const body: Record<string, string> = { text, language: locale };
    if (voiceName) body["voice"] = voiceName;
    const resp = await fetchWithRetry(`${this.baseUrl}/api/text-to-speech`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return asJson<PostTextToSpeechResponses[200]>(resp);
  }
}

export class PhonemeNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async detect(
    audio: AudioInput,
    language = "fr-FR",
    email?: string,
  ): Promise<PostAnalyzePhonemesLiveResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const fileId = await uploadAssignFileId(this.baseUrl, this.authHeaders, audio, effectiveEmail);
    const resp = await fetchWithRetry(`${this.baseUrl}/api/analyze-phonemes-live`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, language }),
    });
    return asJson<PostAnalyzePhonemesLiveResponses[200]>(resp);
  }
}

export class StutteringNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async classify(
    audio: AudioInput,
    pollIntervalMs = 5000,
    timeoutMs = 620_000,
    email?: string,
  ): Promise<GetTherapyResultBySessionIdResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const fileId = await uploadAssignFileId(this.baseUrl, this.authHeaders, audio, effectiveEmail);
    const startResp = await fetchWithRetry(`${this.baseUrl}/api/classify-stuttering`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    const startBody = (await startResp.json()) as { session_id?: unknown };
    if (typeof startBody.session_id !== "string" || startBody.session_id.length === 0) {
      throw new VocametrixServerError(
        `classify-stuttering response missing 'session_id' (got ${JSON.stringify(startBody)})`,
      );
    }
    const sessionId = startBody.session_id;

    const deadline = Date.now() + timeoutMs;
    let completed = false;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      const statusResp = await fetchWithRetry(
        `${this.baseUrl}/api/therapy-status/${sessionId}`,
        { headers: this.authHeaders },
      );
      const statusBody = (await statusResp.json()) as Record<string, string>;
      const state = (statusBody["status"] ?? statusBody["state"] ?? "").toLowerCase();
      if (["completed", "succeeded", "done"].includes(state)) {
        completed = true;
        break;
      }
      if (["failed", "error"].includes(state)) {
        throw new VocametrixServerError(`Stuttering classification failed: ${JSON.stringify(statusBody)}`);
      }
    }

    if (!completed) {
      throw new VocametrixServerError(
        `Stuttering classification timed out after ${String(timeoutMs)}ms (session=${sessionId})`,
      );
    }

    const resultResp = await fetchWithRetry(
      `${this.baseUrl}/api/therapy-result/${sessionId}`,
      { headers: this.authHeaders },
    );
    return asJson<GetTherapyResultBySessionIdResponses[200]>(resultResp);
  }
}

export class ProsodyNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async similarity(
    model: AudioInput,
    learner: AudioInput,
    email?: string,
  ): Promise<GetCalculateProsodySimilarityResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const modelFileId = await uploadAssignFileId(this.baseUrl, this.authHeaders, model, effectiveEmail);
    const userFileId = await uploadAssignFileId(this.baseUrl, this.authHeaders, learner, effectiveEmail);
    const params = new URLSearchParams({ modelFileId, userFileId });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-prosody-similarity?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateProsodySimilarityResponses[200]>(resp);
  }
}

export class EgemapsNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async extract(audio: AudioInput, email?: string): Promise<GetGemapsExtractResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const fileId = await uploadAssignFileId(this.baseUrl, this.authHeaders, audio, effectiveEmail);
    const params = new URLSearchParams({ fileId });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/gemaps-extract?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetGemapsExtractResponses[200]>(resp);
  }
}

export class SoundLevelNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
  ) {}

  async measure(
    audio: AudioInput,
    startSec = 0.001,
    endSec?: number,
  ): Promise<PostSoundLevelResponses[200]> {
    if (startSec === 0) {
      throw new VocametrixValidationError(
        "startSec=0 is invalid: the backend treats 0 as falsy. Pass startSec=0.001 or greater.",
      );
    }

    const blobUrl = await uploadBlobUrl(this.baseUrl, this.authHeaders, audio);
    // stop_sec is required; a value past the end of the file means "to the end".
    const body = { blobUrl, start_sec: startSec, stop_sec: endSec ?? 999999 };
    const resp = await fetchWithRetry(`${this.baseUrl}/api/soundLevel`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return asJson<PostSoundLevelResponses[200]>(resp);
  }
}

export class AdvancedVoiceAnalysisNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
    private readonly email: string,
  ) {}

  async calculateH1H2(
    sustainedVowel: AudioInput,
    gender: 1 | 2 = 1,
    email?: string,
  ): Promise<GetCalculateH1H2Responses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId, gender: String(gender) });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-h1-h2?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateH1H2Responses[200]>(resp);
  }

  async calculateSpectral(
    sustainedVowel: AudioInput,
    age: number,
    gender: 1 | 2 = 1,
    email?: string,
  ): Promise<GetCalculateSpectralAdvancedResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId, age: String(age), gender: String(gender) });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-spectral-advanced?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateSpectralAdvancedResponses[200]>(resp);
  }

  async calculateSzRatio(
    sustainedS: AudioInput,
    sustainedZ: AudioInput,
    patientAge: number,
    gender: 1 | 2 = 1,
    email?: string,
  ): Promise<GetCalculateSzRatioResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const sFileId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedS, effectiveEmail);
    const zFileId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedZ, effectiveEmail);
    const params = new URLSearchParams({
      sFileId,
      zFileId,
      patientAge: String(patientAge),
      gender: String(gender),
    });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-sz-ratio?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateSzRatioResponses[200]>(resp);
  }

  async calculateGne(
    sustainedVowel: AudioInput,
    email?: string,
  ): Promise<GetCalculateGneResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-gne?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateGneResponses[200]>(resp);
  }

  async calculateFormantStatistics(
    sustainedVowel: AudioInput,
    age: number,
    gender: 1 | 2 = 1,
    email?: string,
  ): Promise<GetCalculateFormantStatisticsResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId, age: String(age), gender: String(gender) });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-formant-statistics?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateFormantStatisticsResponses[200]>(resp);
  }

  async calculateAbi(
    sustainedVowel: AudioInput,
    connectedSpeech: AudioInput,
    email?: string,
  ): Promise<GetCalculateAbiResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const csId = await uploadAssignFileId(this.baseUrl, this.authHeaders, connectedSpeech, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId, csFileId: csId });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-abi?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateAbiResponses[200]>(resp);
  }

  async calculateVoiceDynamics(
    sustainedVowel: AudioInput,
    age: number,
    gender: 1 | 2 = 1,
    email?: string,
  ): Promise<GetCalculateVoiceDynamicsResponses[200]> {
    const effectiveEmail = email ?? this.email;
    const svId = await uploadAssignFileId(this.baseUrl, this.authHeaders, sustainedVowel, effectiveEmail);
    const params = new URLSearchParams({ svFileId: svId, age: String(age), gender: String(gender) });
    const resp = await fetchWithRetry(
      `${this.baseUrl}/api/calculate-voice-dynamics?${params.toString()}`,
      { headers: this.authHeaders },
    );
    return asJson<GetCalculateVoiceDynamicsResponses[200]>(resp);
  }
}

export class AiAgentsNamespace {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeaders: Record<string, string>,
  ) {}

  async therapyPlan(
    sessionMetadata: Record<string, unknown>,
    wav2vecOutput: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const resp = await fetchWithRetry(`${this.baseUrl}/api/therapy-planning-agent`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionMetadata, wav2vecOutput }),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async speechExercise(
    patientProfile: Record<string, unknown>,
    difficulty = "medium",
  ): Promise<Record<string, unknown>> {
    const resp = await fetchWithRetry(`${this.baseUrl}/api/speech-exercise-generator`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ patientProfile, difficulty }),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async syntaxCheck(text: string, language = "en"): Promise<Record<string, unknown>> {
    const resp = await fetchWithRetry(`${this.baseUrl}/api/syntax-checker-agent`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async spellCheck(text: string, language = "en"): Promise<Record<string, unknown>> {
    const resp = await fetchWithRetry(`${this.baseUrl}/api/spell-agent`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async interpretMetrics(
    metrics: Record<string, unknown>,
    praatResults?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { metrics };
    if (praatResults !== undefined) body["praatResults"] = praatResults;
    const resp = await fetchWithRetry(`${this.baseUrl}/api/voice-metrics-interpreter`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async adaptiveExercise(
    patientId: string,
    sessionHistory: unknown[],
  ): Promise<Record<string, unknown>> {
    const resp = await fetchWithRetry(`${this.baseUrl}/api/adaptive-exercise-agent`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, sessionHistory }),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async frenchToIpa(phoneticInput: unknown[]): Promise<Record<string, unknown>> {
    const resp = await fetchWithRetry(`${this.baseUrl}/api/french-to-ipa-agent`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ phoneticInput }),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async wordList(
    targetPhoneme: string,
    difficulty = "medium",
    locale = "en-US",
  ): Promise<Record<string, unknown>> {
    const resp = await fetchWithRetry(`${this.baseUrl}/api/word-list-generator`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ targetPhoneme, difficulty, locale }),
    });
    return asJson<Record<string, unknown>>(resp);
  }

  async therapistAssistant(
    query: string,
    context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { query };
    if (context !== undefined) body["context"] = context;
    const resp = await fetchWithRetry(`${this.baseUrl}/api/speech-therapist-assistant`, {
      method: "POST",
      headers: { ...this.authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return asJson<Record<string, unknown>>(resp);
  }
}
