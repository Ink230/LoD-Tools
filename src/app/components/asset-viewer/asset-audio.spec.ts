import { describe, expect, it } from 'vitest';
import { decodeSpuSample, encodeWav, listSpuSamples } from './asset-audio';

function block(flags: number, firstPackedSample = 0) {
  const bytes = new Uint8Array(16);
  bytes[1] = flags;
  bytes[2] = firstPackedSample;
  return bytes;
}

describe('SPU ADPCM helpers', () => {
  it('decodes SC-compatible low-nibble-first ADPCM and loop metadata', () => {
    const bytes = block(1, 0x21);
    const sample = decodeSpuSample(bytes);
    expect(sample.bytesRead).toBe(16);
    expect(sample.samples).toHaveLength(28);
    expect(sample.samples[0]).toBeCloseTo(0.125);
    expect(sample.samples[1]).toBeCloseTo(0.25);
    expect(sample.loopStart).toBeNull();
    expect(sample.loopEnd).toBeNull();

    const looped = new Uint8Array(32);
    looped.set(block(4), 0);
    looped.set(block(3), 16);
    expect(decodeSpuSample(looped).loopStart).toBe(0);
    expect(decodeSpuSample(looped).loopEnd).toBe(56);
  });

  it('lists end-delimited samples and encodes browser-playable WAV bytes', () => {
    const source = new Uint8Array(32);
    source.set(block(1), 0);
    source.set(block(1), 16);
    expect(listSpuSamples(source)).toEqual([{ offset: 0, length: 16 }, { offset: 16, length: 16 }]);
    const wav = encodeWav(Float32Array.from([-1, 0, 1]), 22050);
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe('RIFF');
    expect(new DataView(wav.buffer).getUint32(24, true)).toBe(22050);
    expect(new DataView(wav.buffer).getInt16(44, true)).toBe(-32767);
  });

  it('fails on truncated, invalid, and unaligned SPU data', () => {
    expect(() => decodeSpuSample(new Uint8Array(15))).toThrow('Truncated');
    expect(() => decodeSpuSample(block(1), 44100, 1)).toThrow('16-byte-aligned');
    const invalid = block(1);
    invalid[0] = 0x0d;
    expect(() => decodeSpuSample(invalid)).toThrow('Invalid SPU ADPCM shift');
    expect(() => listSpuSamples(new Uint8Array(17))).toThrow('Truncated');
  });

  it('classifies SC empty sound-bank placeholders as having no samples', () => {
    expect(listSpuSamples(new Uint8Array())).toEqual([]);
    expect(listSpuSamples(new TextEncoder().encode('dammya\r\n'))).toEqual([]);
    expect(decodeSpuSample(new TextEncoder().encode('dammya\r\n')).samples).toHaveLength(0);
  });
});
