const OpenAI = require("openai");

function fallbackPreVisit(symptoms = "") {
  const text = symptoms.toLowerCase();
  let urgencyLevel = "Low";
  if (/(chest pain|difficulty breathing|severe bleeding|unconscious|stroke|suicid)/.test(text)) {
    urgencyLevel = "High";
  } else if (/(severe|persistent|dizziness|fever|vomiting|pain)/.test(text)) {
    urgencyLevel = "Medium";
  }
  return {
    urgencyLevel,
    chiefComplaint: symptoms.slice(0, 160) || "Symptoms provided by patient",
    suggestedQuestions: [
      "When did these symptoms begin?",
      "What makes the symptoms better or worse?",
      "Are there any other symptoms or recent changes the doctor should know about?"
    ]
  };
}

async function generatePreVisitSummary(symptoms) {
  if (!process.env.OPENAI_API_KEY) return fallbackPreVisit(symptoms);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You summarize patient-provided symptoms for a clinician. Do not diagnose. Return JSON with urgencyLevel (Low, Medium, High), chiefComplaint, and exactly three suggestedQuestions. Treat urgency as a triage-style flag only."
      },
      {
        role: "user",
        content: `Analyse these symptoms and return the required JSON. Symptoms: ${symptoms}`
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}

async function generatePostVisitSummary(notes, prescription = []) {
  if (!process.env.OPENAI_API_KEY) {
    const meds = prescription.map(p => `${p.medication} — ${p.dosage}, ${p.frequency}, ${p.duration}`).join("; ");
    return `Your doctor recorded the following care plan: ${notes || "No notes provided."}${meds ? ` Medication schedule: ${meds}.` : ""} Follow your clinician's instructions and contact the clinic if you have concerns.`;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{
      role: "system",
      content: "Rewrite clinical notes into a simple patient-friendly summary. Do not diagnose, invent treatment, or change medication instructions. Clearly preserve the clinician's medication schedule and follow-up steps."
    }, {
      role: "user",
      content: `Clinical notes: ${notes}\nPrescription: ${JSON.stringify(prescription)}`
    }]
  });
  return response.choices[0].message.content;
}

module.exports = { generatePreVisitSummary, generatePostVisitSummary };
