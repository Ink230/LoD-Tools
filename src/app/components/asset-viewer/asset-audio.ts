const POSITIVE_SPU_ADPCM_TABLE = [0, 60, 115, 98, 122];
const NEGATIVE_SPU_ADPCM_TABLE = [0, 0, -52, -55, -60];
const BLOCK_BYTES = 16;
const SAMPLES_PER_BLOCK = 28;
const MAX_SAMPLES = 1_000_000;

export interface SpuSample {
  samples: Float32Array;
  sampleRate: number;
  loopStart: number | null;
  loopEnd: number | null;
  bytesRead: number;
}

export interface SpuSampleRange { offset: number; length: number; }

function isEmptySpuBank(bytes: Uint8Array) {
  // Extracted empty banks use the retail placeholder marker, rather than an ADPCM block
  return bytes.length === 0 || (bytes.length === 8 && new TextDecoder().decode(bytes) === 'dammya\r\n');
}

function validateOffset(bytes: Uint8Array, offset: number) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= bytes.length || offset % BLOCK_BYTES !== 0) throw new Error('SPU sample offset must be a 16-byte-aligned position within the source');
}

function signedNibble(value: number) { return value & 8 ? value - 16 : value; }

export function decodeSpuSample(bytes: Uint8Array, sampleRate = 44100, startOffset = 0): SpuSample {
  if (!Number.isSafeInteger(sampleRate) || sampleRate <= 0 || sampleRate > 384000) throw new Error('Invalid SPU sample rate');
  if (isEmptySpuBank(bytes)) return { samples: new Float32Array(), sampleRate, loopStart: null, loopEnd: null, bytesRead: 0 };
  validateOffset(bytes, startOffset);
  const values: number[] = [];
  let old = 0;
  let older = 0;
  let loopStart: number | null = null;
  let loopEnd: number | null = null;
  let offset = startOffset;

  while (true) {
    if (offset + BLOCK_BYTES > bytes.length) throw new Error(`Truncated SPU ADPCM block at 0x${offset.toString(16)}`);
    if (values.length + SAMPLES_PER_BLOCK > MAX_SAMPLES) throw new Error(`SPU sample exceeds the ${MAX_SAMPLES.toLocaleString()} sample limit`);
    const header = bytes[offset];
    const flags = bytes[offset + 1];
    const shiftBits = header & 0xf;
    const filter = Math.min(header >>> 4 & 7, 4);
    if (shiftBits > 12) throw new Error(`Invalid SPU ADPCM shift ${shiftBits} at 0x${offset.toString(16)}`);
    if ((flags & 4) !== 0 && loopStart === null) loopStart = values.length;
    const shift = 12 - shiftBits;
    for (let i = 0; i < SAMPLES_PER_BLOCK; i++) {
      const packed = bytes[offset + 2 + (i >> 1)];
      const nibble = signedNibble(i & 1 ? packed >>> 4 : packed & 0xf);
      const sample = Math.max(-0x8000, Math.min(0x7fff, (nibble << shift) + Math.trunc((old * POSITIVE_SPU_ADPCM_TABLE[filter] + older * NEGATIVE_SPU_ADPCM_TABLE[filter] + 32) / 64)));
      values.push(sample / 0x8000);
      older = old;
      old = sample;
    }
    offset += BLOCK_BYTES;
    if ((flags & 1) !== 0) {
      loopEnd = values.length;
      return { samples: Float32Array.from(values), sampleRate, loopStart, loopEnd: (flags & 2) !== 0 ? loopEnd : null, bytesRead: offset - startOffset };
    }
  }
}

export function listSpuSamples(bytes: Uint8Array): SpuSampleRange[] {
  if (isEmptySpuBank(bytes)) return [];
  const samples: SpuSampleRange[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const start = offset;
    let blocks = 0;
    while (true) {
      if (offset + BLOCK_BYTES > bytes.length) throw new Error(`Truncated SPU ADPCM block at 0x${offset.toString(16)}`);
      if (++blocks * SAMPLES_PER_BLOCK > MAX_SAMPLES) throw new Error(`SPU sample at 0x${start.toString(16)} exceeds the ${MAX_SAMPLES.toLocaleString()} sample limit`);
      if ((bytes[offset] & 0xf) > 12) throw new Error(`Invalid SPU ADPCM shift at 0x${offset.toString(16)}`);
      const end = (bytes[offset + 1] & 1) !== 0;
      offset += BLOCK_BYTES;
      if (end) break;
    }
    samples.push({ offset: start, length: offset - start });
  }
  return samples;
}

export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  if (!Number.isSafeInteger(sampleRate) || sampleRate <= 0 || sampleRate > 384000) throw new Error('Invalid WAV sample rate');
  if (samples.length > 0x1fffffff) throw new Error('WAV sample count exceeds RIFF size limits');
  const output = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(output.buffer);
  const writeText = (offset: number, text: string) => text.split('').forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  writeText(0, 'RIFF');
  view.setUint32(4, output.length - 8, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let index = 0; index < samples.length; index++) view.setInt16(44 + index * 2, Math.round(Math.max(-1, Math.min(1, samples[index])) * 0x7fff), true);
  return output;
}
