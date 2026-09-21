/**
 * Read a plain-text streaming response (AI SDK `toTextStreamResponse`),
 * calling `onText` with the accumulated text as chunks arrive.
 */
export async function readTextStream(
  response: Response,
  onText: (accumulated: string) => void,
): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onText(accumulated);
  }

  accumulated += decoder.decode();
  return accumulated;
}
