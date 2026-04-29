export const briefingCardPrompt = `You are creating a host briefing card for a private dinner. The host needs to walk in knowing who's at the table and have something specific to ask each guest.

Input: event context (name, date, venue, host name, host context) + confirmed guest list.

Output: a JSON object with:
- eventSummary (1 sentence on the dinner's purpose)
- guests: array of objects, each with:
  - guestId (preserve from input)
  - name
  - company
  - role
  - bioLine (one sentence, factual, no fluff)
  - workingOn (one sentence on what they're focused on, inferred from notes)
  - askThemAbout (one specific conversation prompt)

Rules:
- Bio lines are factual, never speculative
- "Ask them about" prompts are specific to this person, not generic
- If notes are thin, write a shorter bio rather than inventing details
- Output ONLY the JSON object.`;

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
