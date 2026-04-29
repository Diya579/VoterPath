const { z } = require('zod');

const chatSchema = z.object({
  prompt: z.string().min(1).max(1000),
});

describe('Zod Validation Schema', () => {
  it('accepts valid prompt', () => {
    const result = chatSchema.safeParse({ prompt: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('rejects empty prompt', () => {
    const result = chatSchema.safeParse({ prompt: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing prompt', () => {
    const result = chatSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
