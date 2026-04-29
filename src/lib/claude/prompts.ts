export const parseRsvpsPrompt = `You are parsing freeform RSVP data into a clean guest list.

Input: a blob of text from email replies, a spreadsheet, or notes.

Output: a JSON array of guest objects. Each object has:
- name (string)
- company (string, may be empty)
- role (string, e.g., "Founder & CEO", may be empty)
- status (one of: "confirmed", "pending", "declined", "tentative")
- email (string, may be empty)
- notes (string, free-text context including dietary restrictions, relationships, conflicts)

Rules:
- If status is unclear, mark "pending"
- Extract dietary restrictions into notes prefixed with "Dietary: "
- Preserve relationship context in notes
- Output ONLY the JSON array. No preamble, no markdown fences.`;
