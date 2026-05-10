import { hash } from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}

export function isStrongEnoughPassword(password: string): boolean {
  return password.length >= 8;
}
