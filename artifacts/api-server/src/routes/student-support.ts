import { Router, type IRouter } from "express";
import {
  AskStudentAssistantBody,
  AskStudentAssistantResponse,
  GetStudentTopicsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const topics = [
  {
    id: "attendance",
    label: "Attendance",
    description: "Check your attendance rules and shortage process.",
    prompt: "What is the minimum attendance requirement?",
  },
  {
    id: "fees",
    label: "Fees",
    description: "Get help with payment dates, receipts, and dues.",
    prompt: "How can I pay my semester fees?",
  },
  {
    id: "exams",
    label: "Exam information",
    description: "Find schedules, hall tickets, and exam guidelines.",
    prompt: "Where can I find the exam timetable?",
  },
  {
    id: "library",
    label: "Library",
    description: "Learn about borrowing, renewals, and opening hours.",
    prompt: "How many books can I borrow?",
  },
  {
    id: "faculty",
    label: "Faculty",
    description: "Locate faculty office hours and department contacts.",
    prompt: "How do I contact my faculty advisor?",
  },
  {
    id: "placement",
    label: "Placement",
    description: "Explore eligibility, drives, and career support.",
    prompt: "What are the placement eligibility rules?",
  },
  {
    id: "timetable",
    label: "Timetable",
    description: "Find class schedules and room updates.",
    prompt: "Show me today's class timetable.",
  },
  {
    id: "hod",
    label: "HOD information",
    description: "Get department office and HOD contact guidance.",
    prompt: "How can I meet the HOD?",
  },
] as const;

const responses = {
  attendance: {
    topic: "Attendance",
    answer:
      "Students should maintain at least 75% attendance in each course. If your attendance is below the threshold, contact your class advisor early to understand the condonation process and supporting documents required.",
    suggestedQuestions: [
      "How do I apply for attendance condonation?",
      "Where can I see my attendance percentage?",
    ],
  },
  fees: {
    topic: "Fees",
    answer:
      "Semester fees can be paid through the student portal under Finance → Fee Payment. Save the transaction receipt after payment. For a failed or duplicated transaction, contact the accounts office with your student ID and payment reference.",
    suggestedQuestions: [
      "Where can I download my fee receipt?",
      "What happens if I miss the fee deadline?",
    ],
  },
  exams: {
    topic: "Exam Information",
    answer:
      "Exam timetables and hall-ticket notices are published by the examination cell on the student portal and department notice board. Check your registered subjects carefully and reach out to the exam cell if two papers overlap.",
    suggestedQuestions: [
      "When will hall tickets be released?",
      "What should I bring to the exam hall?",
    ],
  },
  library: {
    topic: "Library",
    answer:
      "The central library is open Monday–Saturday, 8:00 AM–8:00 PM. Students can borrow up to four books for 14 days and renew them once when there is no reservation. Use the library portal to search the catalogue before visiting.",
    suggestedQuestions: [
      "How do I renew a library book?",
      "Can I access journals off campus?",
    ],
  },
  faculty: {
    topic: "Faculty",
    answer:
      "You can find faculty office hours, department email addresses, and advisor details in the Faculty Directory on the student portal. For academic guidance, start with your assigned class advisor before escalating to the department office.",
    suggestedQuestions: [
      "Where is the faculty directory?",
      "Who is my class advisor?",
    ],
  },
  placement: {
    topic: "Placement",
    answer:
      "Placement updates, company drives, and registration links are posted by the Career Development Centre. Keep your profile, resume, and academic details current. Eligibility differs by company, so review each drive notice before registering.",
    suggestedQuestions: [
      "Where can I register for placement drives?",
      "Are internships listed on the placement portal?",
    ],
  },
  timetable: {
    topic: "Timetable",
    answer:
      "Your latest class timetable is available in the student portal under Academics → Timetable. Check the portal before your first class each day for room changes, substitutions, or cancelled sessions.",
    suggestedQuestions: [
      "How do I report a timetable clash?",
      "Where are room changes announced?",
    ],
  },
  hod: {
    topic: "HOD Information",
    answer:
      "The department office can help you request an appointment with the Head of Department. Bring your student ID and a short summary of your request. The department notice board lists office hours and the latest contact details.",
    suggestedQuestions: [
      "How do I submit a request to the HOD?",
      "Where is the department office?",
    ],
  },
} as const;

function identifyTopic(question: string): keyof typeof responses {
  const normalized = question.toLowerCase();
  const keywordGroups: Array<[keyof typeof responses, string[]]> = [
    ["attendance", ["attendance", "absent", "shortage", "condonation"]],
    ["fees", ["fee", "fees", "payment", "receipt", "dues", "accounts"]],
    ["exams", ["exam", "examination", "hall ticket", "paper", "semester test"]],
    ["library", ["library", "book", "journal", "catalogue", "renew"]],
    ["faculty", ["faculty", "advisor", "professor", "teacher", "office hour"]],
    ["placement", ["placement", "career", "internship", "company", "resume"]],
    ["timetable", ["timetable", "schedule", "class", "room", "lecture"]],
    ["hod", ["hod", "head of department", "department office"]],
  ];

  for (const [topic, keywords] of keywordGroups) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return topic;
    }
  }

  return "attendance";
}

router.get("/topics", (_req, res) => {
  res.json(GetStudentTopicsResponse.parse(topics));
});

router.post("/chat", (req, res) => {
  const parsed = AskStudentAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter a question first." });
    return;
  }

  const topic = identifyTopic(parsed.data.question);
  res.json(AskStudentAssistantResponse.parse(responses[topic]));
});

export default router;