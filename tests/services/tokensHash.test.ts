import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { sha256Hex } from '../../src/services/tokens/TokensService';

// The client hashes the raw token and stores only the hash; the Edge Function
// hashes the incoming bearer token the same way to look the row up. Both are
// plain lowercase-hex SHA-256 of the UTF-8 bytes — this pins that.
describe('token hashing', () => {
  it('matches a reference SHA-256 implementation', async () => {
    const token = 'cmx_0123456789abcdef';
    const reference = createHash('sha256').update(token, 'utf8').digest('hex');
    expect(await sha256Hex(token)).toBe(reference);
  });

  it('is 64 lowercase hex chars and deterministic', async () => {
    const a = await sha256Hex('cmx_abc123');
    expect(a).toBe(await sha256Hex('cmx_abc123'));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs for different inputs', async () => {
    expect(await sha256Hex('cmx_a')).not.toBe(await sha256Hex('cmx_b'));
  });
});
