function toMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(value) {
  const h = String(Math.floor(value / 60)).padStart(2, "0");
  const m = String(value % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function buildSlots(start, end, duration) {
  const slots = [];
  for (let t = toMinutes(start); t + duration <= toMinutes(end); t += duration) {
    slots.push({ startTime: fromMinutes(t), endTime: fromMinutes(t + duration) });
  }
  return slots;
}

module.exports = { buildSlots };
