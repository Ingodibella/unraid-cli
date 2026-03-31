export enum SafetyClass {
  S0 = 'S0',
  S1 = 'S1',
  S2 = 'S2',
  S3 = 'S3',
}

export const DEFAULT_SAFETY_CLASS = SafetyClass.S0;

export const SAFETY_CLASS_REGISTRY: Readonly<Record<string, SafetyClass>> = Object.freeze({
  'array.start': SafetyClass.S2,
  'array.stop': SafetyClass.S2,
  'containers.pause': SafetyClass.S1,
  'containers.remove': SafetyClass.S3,
  'containers.restart': SafetyClass.S1,
  'containers.start': SafetyClass.S1,
  'containers.stop': SafetyClass.S1,
  'containers.unpause': SafetyClass.S1,
  'disks.mount': SafetyClass.S1,
  'disks.unmount': SafetyClass.S2,
  'notifications.archive': SafetyClass.S1,
  'notifications.create': SafetyClass.S1,
  'notifications.delete': SafetyClass.S3,
  'notifications.unarchive': SafetyClass.S1,
  'parity.cancel': SafetyClass.S2,
  'parity.pause': SafetyClass.S1,
  'parity.resume': SafetyClass.S1,
  'parity.start': SafetyClass.S1,
  'vms.force-stop': SafetyClass.S3,
  'vms.pause': SafetyClass.S1,
  'vms.reboot': SafetyClass.S2,
  'vms.reset': SafetyClass.S3,
  'vms.resume': SafetyClass.S1,
  'vms.start': SafetyClass.S1,
  'vms.stop': SafetyClass.S1,
});

export function resolveSafetyClass(commandPath: string): SafetyClass {
  return SAFETY_CLASS_REGISTRY[commandPath] ?? DEFAULT_SAFETY_CLASS;
}
