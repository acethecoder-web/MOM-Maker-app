import mammoth from "mammoth";

export async function extractTextFromDocx(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}