import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const RESERVED_IDS = Object.freeze([
  "what", "regulated", "lease", "residents", "seeker", "organisations", "numbers",
]);

const sourceFile = new URL("../src/content/faq-community.json", import.meta.url);
const reserved = new Set(RESERVED_IDS);

function validateId(value) {
  if (typeof value !== "string" || value.length > 64 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("Use an ID of up to 64 lowercase letters, numbers and single hyphens, beginning with a letter.");
  }
  if (reserved.has(value)) throw new Error("This ID belongs to a protected core FAQ. Choose another ID.");
  return value;
}

function plainText(value, label, maximum) {
  if (typeof value !== "string") throw new Error(`${label} must be plain text.`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)) {
    throw new Error(`${label} contains unsupported control characters.`);
  }
  if (/[<>`]/u.test(value) || /!?\[[^\]]*\]\([^)]*\)/u.test(value)) {
    throw new Error(`${label} must not contain HTML, code or formatted links.`);
  }
  if (/\u2014/u.test(value)) throw new Error(`${label} must use a comma, full stop or hyphen instead of an em dash.`);
  if (/-----BEGIN[^\r\n]*PRIVATE KEY-----|\b(?:gh[pousr]_[a-z0-9_]{20,}|github_pat_[a-z0-9_]{20,}|sk-[a-z0-9]{20,})\b|\b(?:password|secret|api[ _-]?key|access[ _-]?token)\s*[:=]\s*\S+/iu.test(value)) {
    throw new Error(`${label} appears to contain credentials. Remove them before continuing.`);
  }
  const text = value.trim().replace(/\s+/gu, " ");
  if (!text || text.length > maximum) throw new Error(`${label} must contain 1 to ${maximum} characters.`);
  return text;
}

export function parseAnswer(value) {
  if (typeof value !== "string" || value.length > 12000) {
    throw new Error("The answer must be plain text, up to 12000 characters.");
  }
  const paragraphs = value.replace(/\r\n?/gu, "\n").split(/\n\s*\n|\|\|/u);
  if (paragraphs.length > 8) throw new Error("Use no more than eight answer paragraphs.");
  return paragraphs.map((paragraph) => plainText(paragraph, "Each answer paragraph", 2000));
}

export function validateCommunityFaq(entries) {
  if (!Array.isArray(entries)) throw new Error("The community FAQ source must be an array.");
  const seen = new Set();
  return entries.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        Object.keys(entry).sort().join(",") !== "a,id,q") {
      throw new Error("Each published FAQ must contain only id, q and a. Never add enquiry or sender details.");
    }
    const id = validateId(entry.id);
    if (seen.has(id)) throw new Error("The community FAQ source contains a duplicate ID.");
    seen.add(id);
    if (!Array.isArray(entry.a) || entry.a.length < 1 || entry.a.length > 8) {
      throw new Error("Each FAQ must contain one to eight answer paragraphs.");
    }
    const a = entry.a.map((paragraph) => plainText(paragraph, "Each answer paragraph", 2000));
    if (a.join("\n\n").length > 12000) throw new Error("The answer exceeds 12000 characters.");
    return { id, q: plainText(entry.q, "The question", 240), a };
  });
}

// Human review owns accuracy, permission and anonymity. Text checks cannot establish those.
export function applyFaqChange(entries, input) {
  if (!input || (input.approved !== true && input.approved !== "true")) {
    throw new Error("Confirm accuracy, publication permission and removal of personal details before publishing.");
  }
  if (!["publish", "update", "remove"].includes(input.action)) throw new Error("Choose publish, update or remove.");
  const id = validateId(input.id);
  const next = validateCommunityFaq(entries);
  const index = next.findIndex((entry) => entry.id === id);
  if (input.action === "publish" && index !== -1) throw new Error("This ID already exists. Use update or choose another ID.");
  if (input.action !== "publish" && index === -1) throw new Error("This ID does not exist. Check the published FAQ source.");
  if (input.action === "remove") return next.filter((entry) => entry.id !== id);

  const entry = { id, q: plainText(input.question, "The question", 240), a: parseAnswer(input.answer) };
  if (input.action === "publish") next.push(entry);
  else next[index] = entry;
  return next;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== "--validate")) throw new Error("Use no arguments to publish from workflow inputs, or --validate to check the source.");
  let entries;
  try {
    entries = JSON.parse(await readFile(sourceFile, "utf8"));
  } catch {
    throw new Error("The community FAQ source could not be read as JSON.");
  }
  if (args[0] === "--validate") {
    validateCommunityFaq(entries);
    console.log("Community FAQ source is valid.");
    return;
  }
  const next = applyFaqChange(entries, {
    action: process.env.FAQ_ACTION,
    id: process.env.FAQ_ID,
    question: process.env.FAQ_QUESTION,
    answer: process.env.FAQ_ANSWER,
    approved: process.env.FAQ_APPROVED,
  });
  await writeFile(sourceFile, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log("Approved community FAQ change prepared.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
