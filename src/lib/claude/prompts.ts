export const seatingChartPrompt = `You are designing a seating chart for an N-person dinner.

Input: guest list + layout type (long_table or rounds) + any pinned positions.

Output: a JSON object with three options. Each has:
- layoutType
- seats: ordered array of guest IDs
- rationale: 2-3 sentences on the strategy
- keyPairings: array of 2-4 specific pairings with one-sentence reasoning

Rules:
- Pair people who haven't obviously met based on notes
- Mix stages and sectors at each end of the table
- Avoid placing direct competitors next to each other
- Place the host strategically (center of long table, anchor of largest round)
- Respect pinned positions
- For long_table layout, output \`seats\` as a flat array of guest IDs in order around the table.
- For rounds layout, output \`seats\` as an array of arrays, where each inner array is one round table (target 6-8 guests).
- Output ONLY the JSON object.`;

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

export const nudgesPrompt = `You are drafting RSVP nudges for unconfirmed guests of a private {eventType}.

Input: event context + array of guests (name, company, status, notes).

Output: a JSON array, one object per guest, each with:
- guestId (preserve from input)
- variants: { warm, neutral, urgent }

Rules per variant:
- 2-4 sentences
- Use contractions
- No em dashes, no buzzwords
- Reference event by date and location
- Sign off with host's first name only
- Output ONLY the JSON array.`;

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
