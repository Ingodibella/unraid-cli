import { describe, expect, it, vi } from 'vitest';
import { ConfirmationCancelledError } from '../../../src/core/errors/index.js';
import {
  DEFAULT_SAFETY_CLASS,
  SAFETY_CLASS_REGISTRY,
  SafetyClass,
  resolveSafetyClass,
} from '../../../src/core/safety/classifier.js';
import { confirmSafetyAction, isInteractiveTty, type PromptAdapter } from '../../../src/core/safety/confirmation.js';
import { assertSafety } from '../../../src/core/safety/guards.js';

describe('safety classifier', () => {
  it('defaults unknown commands to S0', () => {
    expect(resolveSafetyClass('system.info')).toBe(SafetyClass.S0);
    expect(resolveSafetyClass('unknown.command')).toBe(DEFAULT_SAFETY_CLASS);
  });

  it('maps write commands to the expected safety classes', () => {
    expect(SAFETY_CLASS_REGISTRY['containers.start']).toBe(SafetyClass.S1);
    expect(SAFETY_CLASS_REGISTRY['array.stop']).toBe(SafetyClass.S2);
    expect(SAFETY_CLASS_REGISTRY['notifications.delete']).toBe(SafetyClass.S3);
  });
});

describe('safety confirmation', () => {
  it('uses stdout.isTTY for tty detection', () => {
    expect(isInteractiveTty({ isTTY: true })).toBe(true);
    expect(isInteractiveTty({ isTTY: false })).toBe(false);
    expect(isInteractiveTty()).toBe(Boolean(process.stdout.isTTY));
  });

  it('returns immediately when --yes is set', async () => {
    const prompt = vi.fn<PromptAdapter>().mockResolvedValue(true);

    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S1,
        commandPath: 'containers.start',
        yes: true,
        stdout: { isTTY: false },
        prompt,
      }),
    ).resolves.toBeUndefined();

    expect(prompt).not.toHaveBeenCalled();
  });

  it('prompts in tty for S1 commands and proceeds on confirmation', async () => {
    const prompt = vi.fn<PromptAdapter>().mockResolvedValue(true);

    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S1,
        commandPath: 'containers.start',
        stdout: { isTTY: true },
        prompt,
      }),
    ).resolves.toBeUndefined();

    expect(prompt).toHaveBeenCalledWith('Confirm reversible action for containers.start? [y/N] ');
  });

  it('rejects S1 commands in non-tty without --yes', async () => {
    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S1,
        commandPath: 'containers.start',
        stdout: { isTTY: false },
      }),
    ).rejects.toMatchObject({
      name: 'ConfirmationCancelledError',
      exitCode: 10,
      message: 'Confirmation required for containers.start. Re-run with --yes.',
    });
  });

  it('requires --yes for S2 commands even in tty mode', async () => {
    const prompt = vi.fn<PromptAdapter>().mockResolvedValue(true);

    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S2,
        commandPath: 'array.stop',
        stdout: { isTTY: true },
        prompt,
      }),
    ).rejects.toMatchObject({
      name: 'ConfirmationCancelledError',
      exitCode: 10,
      message: 'Critical action array.stop requires --yes.',
    });

    expect(prompt).not.toHaveBeenCalled();
  });

  it('shows a tty reminder for S2 commands when --yes is set', async () => {
    const prompt = vi.fn<PromptAdapter>().mockResolvedValue(true);

    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S2,
        commandPath: 'array.stop',
        yes: true,
        stdout: { isTTY: true },
        prompt,
      }),
    ).resolves.toBeUndefined();

    expect(prompt).toHaveBeenCalledWith('Critical action array.stop requested with --yes. Press y to continue, anything else to cancel: ');
  });

  it('requires both --yes and --force for S3 commands', async () => {
    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S3,
        commandPath: 'notifications.delete',
        yes: true,
        stdout: { isTTY: true },
      }),
    ).rejects.toMatchObject({
      name: 'ConfirmationCancelledError',
      exitCode: 10,
      message: 'Destructive action notifications.delete requires both --yes and --force.',
    });
  });

  it('shows an extra warning for S3 commands when flags are present', async () => {
    const prompt = vi.fn<PromptAdapter>().mockResolvedValue(true);

    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S3,
        commandPath: 'notifications.delete',
        yes: true,
        force: true,
        stdout: { isTTY: true },
        prompt,
      }),
    ).resolves.toBeUndefined();

    expect(prompt).toHaveBeenCalledWith(
      'Danger: notifications.delete is destructive and cannot be undone. Press y to continue, anything else to cancel: ',
    );
  });

  it('throws ConfirmationCancelledError when the user declines a tty prompt', async () => {
    const prompt = vi.fn<PromptAdapter>().mockResolvedValue(false);

    await expect(
      confirmSafetyAction({
        safetyClass: SafetyClass.S1,
        commandPath: 'containers.start',
        stdout: { isTTY: true },
        prompt,
      }),
    ).rejects.toBeInstanceOf(ConfirmationCancelledError);
  });
});

describe('safety guards', () => {
  it('lets S0 commands pass without flags', async () => {
    await expect(assertSafety('system.info', {})).resolves.toBeUndefined();
  });

  it('enforces non-tty S1 rules through the guard', async () => {
    await expect(
      assertSafety('containers.start', {}, { stdout: { isTTY: false } }),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Confirmation required for containers.start. Re-run with --yes.',
    });
  });

  it('enforces S2 rules through the guard', async () => {
    await expect(
      assertSafety('array.stop', {}, { stdout: { isTTY: true } }),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Critical action array.stop requires --yes.',
    });
  });

  it('enforces S3 rules through the guard', async () => {
    await expect(
      assertSafety('notifications.delete', { yes: true }, { stdout: { isTTY: true } }),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Destructive action notifications.delete requires both --yes and --force.',
    });
  });
});
