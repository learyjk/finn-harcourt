export async function delay(timeInSeconds: number) {
  await new Promise((resolve) => setTimeout(resolve, timeInSeconds * 1000));
}
