export function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function respond<T>(data: T, ms = 200): Promise<T> {
  if (ms > 0) {
    await delay(ms);
  }
  return data;
}

let autoIncrement = 1000;

export function generateId(prefix: string): string {
  autoIncrement += 1;
  return `${prefix}-${autoIncrement}`;
}
