import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function yearsAgo(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}
const pick = <T>(arr: T[], i: number) => arr[i % arr.length];

async function main() {
  console.log("🌱 Seeding database...");

  // --- Admin user ---
  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@greenwood.edu" },
    update: {},
    create: { name: "School Administrator", email: "admin@greenwood.edu", password, role: "ADMIN" },
  });
  console.log("✔ Admin user: admin@greenwood.edu / admin123");

  // --- Settings ---
  const existingSetting = await prisma.setting.findFirst();
  if (!existingSetting) await prisma.setting.create({ data: {} });

  // --- Classes + Sections ---
  const classNames = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
  const classes = [];
  for (const name of classNames) {
    const c = await prisma.class.upsert({
      where: { name },
      update: {},
      create: { name, capacity: 40 },
    });
    classes.push(c);
    for (const sec of ["A", "B"]) {
      await prisma.section.upsert({
        where: { classId_name: { classId: c.id, name: sec } },
        update: {},
        create: { name: sec, classId: c.id },
      });
    }
  }
  const allSections = await prisma.section.findMany();
  console.log(`✔ ${classes.length} classes, ${allSections.length} sections`);

  // --- Teachers ---
  const teacherData = [
    { fullName: "Dr. Eleanor Vance", department: "Science", subject: "Physics", qualification: "Ph.D. Physics", experience: 12 },
    { fullName: "Mr. James Okoro", department: "Mathematics", subject: "Calculus", qualification: "M.Sc. Mathematics", experience: 8 },
    { fullName: "Ms. Priya Nair", department: "Languages", subject: "English", qualification: "M.A. English", experience: 6 },
    { fullName: "Mr. Daniel Cho", department: "Humanities", subject: "History", qualification: "M.A. History", experience: 10 },
    { fullName: "Mrs. Sofia Rossi", department: "Arts", subject: "Visual Arts", qualification: "MFA", experience: 5 },
    { fullName: "Mr. Ahmed Hassan", department: "Physical Education", subject: "Athletics", qualification: "B.Sc. Sports", experience: 7 },
  ];
  const teachers = [];
  for (let i = 0; i < teacherData.length; i++) {
    const t = teacherData[i];
    const teacher = await prisma.teacher.upsert({
      where: { teacherId: `TCH-${1001 + i}` },
      update: {},
      create: {
        teacherId: `TCH-${1001 + i}`,
        ...t,
        email: `${t.fullName.split(" ").pop()!.toLowerCase()}@greenwood.edu`,
        phone: `+1 555 01${String(10 + i).padStart(2, "0")}`,
        joiningDate: yearsAgo(t.experience),
        salary: 45000 + i * 3000,
        status: "ACTIVE",
      },
    });
    teachers.push(teacher);
  }
  console.log(`✔ ${teachers.length} teachers`);

  // --- Subjects ---
  const subjectData = [
    { name: "Mathematics", code: "MATH101" },
    { name: "English", code: "ENG101" },
    { name: "Physics", code: "PHY101" },
    { name: "History", code: "HIS101" },
    { name: "Visual Arts", code: "ART101" },
    { name: "Physical Education", code: "PE101" },
  ];
  for (let i = 0; i < subjectData.length; i++) {
    await prisma.subject.upsert({
      where: { code: subjectData[i].code },
      update: {},
      create: {
        ...subjectData[i],
        classId: pick(classes, i).id,
        teacherId: pick(teachers, i).id,
      },
    });
  }
  console.log(`✔ ${subjectData.length} subjects`);

  // --- Parents ---
  const parentNames = ["Robert Smith", "Maria Garcia", "David Johnson", "Linda Williams", "Michael Brown", "Sarah Davis"];
  const parents = [];
  for (let i = 0; i < parentNames.length; i++) {
    const p = await prisma.parent.upsert({
      where: { parentId: `PAR-${2001 + i}` },
      update: {},
      create: {
        parentId: `PAR-${2001 + i}`,
        fullName: parentNames[i],
        email: `${parentNames[i].split(" ")[0].toLowerCase()}${i}@example.com`,
        phone: `+1 555 02${String(10 + i).padStart(2, "0")}`,
        occupation: pick(["Engineer", "Doctor", "Teacher", "Business Owner", "Accountant", "Architect"], i),
        emergencyContact: `+1 555 09${String(10 + i).padStart(2, "0")}`,
      },
    });
    parents.push(p);
  }
  console.log(`✔ ${parents.length} parents`);

  // --- Students ---
  const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas", "Mia", "Jack"];
  const lastNames = ["Smith", "Garcia", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas"];
  const genders: ("MALE" | "FEMALE")[] = ["MALE", "FEMALE"];
  let created = 0;
  for (let i = 0; i < 24; i++) {
    const fullName = `${pick(firstNames, i)} ${pick(lastNames, i + 3)}`;
    const cls = pick(classes, i);
    const sec = allSections.find((s: { classId: string }) => s.classId === cls.id) ?? allSections[0];
    await prisma.student.upsert({
      where: { studentId: `STU-${3001 + i}` },
      update: {},
      create: {
        studentId: `STU-${3001 + i}`,
        fullName,
        gender: pick(genders, i),
        dateOfBirth: yearsAgo(6 + (i % 5)),
        bloodGroup: pick(["A+", "B+", "O+", "AB+", "O-"], i),
        phone: `+1 555 03${String(10 + i).padStart(2, "0")}`,
        email: `${fullName.split(" ")[0].toLowerCase()}${i}@student.greenwood.edu`,
        classId: cls.id,
        sectionId: sec.id,
        rollNumber: String(i + 1).padStart(2, "0"),
        admissionDate: daysFromNow(-(30 + i * 3)),
        guardianName: pick(parentNames, i),
        parentId: pick(parents, i).id,
        status: "ACTIVE",
      },
    });
    created++;
  }
  console.log(`✔ ${created} students`);

  // --- Attendance (last 5 days for first 12 students) ---
  const someStudents = await prisma.student.findMany({ take: 12 });
  const attStatuses: ("PRESENT" | "ABSENT" | "LATE" | "EXCUSED")[] = ["PRESENT", "PRESENT", "PRESENT", "LATE", "ABSENT", "EXCUSED"];
  let attCount = 0;
  for (let d = 1; d <= 5; d++) {
    const date = daysFromNow(-d);
    date.setHours(0, 0, 0, 0);
    for (let i = 0; i < someStudents.length; i++) {
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: someStudents[i].id, date } },
        update: {},
        create: { studentId: someStudents[i].id, date, status: pick(attStatuses, i + d) },
      });
      attCount++;
    }
  }
  console.log(`✔ ${attCount} attendance records`);

  // --- Fees ---
  let feeCount = 0;
  for (let i = 0; i < someStudents.length; i++) {
    const amount = 6200;
    const paid = i % 3 === 0 ? amount : i % 3 === 1 ? amount / 2 : 0;
    await prisma.fee.create({
      data: {
        studentId: someStudents[i].id,
        title: "Term 1 Tuition",
        amount,
        paidAmount: paid,
        dueDate: daysFromNow(15),
        status: paid >= amount ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
      },
    });
    feeCount++;
  }
  console.log(`✔ ${feeCount} fee records`);

  // --- Exams ---
  const exam = await prisma.exam.create({
    data: { name: "Mid-Term Examination 2025", classId: classes[0].id, startDate: daysFromNow(20), endDate: daysFromNow(27) },
  });
  console.log(`✔ 1 exam`);

  // --- Results (for exam's class students) ---
  const subjects = await prisma.subject.findMany({ take: 3 });
  const examStudents = await prisma.student.findMany({ where: { classId: classes[0].id }, take: 8 });
  let resultCount = 0;
  for (let i = 0; i < examStudents.length; i++) {
    for (let j = 0; j < subjects.length; j++) {
      const marks = 45 + ((i * 7 + j * 13) % 55);
      const pct = marks;
      const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "F";
      await prisma.result.upsert({
        where: { studentId_examId_subjectId: { studentId: examStudents[i].id, examId: exam.id, subjectId: subjects[j].id } },
        update: {},
        create: { studentId: examStudents[i].id, examId: exam.id, subjectId: subjects[j].id, marks, totalMarks: 100, grade },
      });
      resultCount++;
    }
  }
  console.log(`✔ ${resultCount} results`);

  // --- Notices ---
  const notices = [
    { title: "Annual Sports Day 2025", content: "Our annual sports day will be held on March 15th. All students are encouraged to participate.", audience: "ALL", pinned: true },
    { title: "Parent-Teacher Conference", content: "Scheduled for February 28th. Please book slots via the parent portal.", audience: "PARENTS", pinned: true },
    { title: "Mid-Term Examination Schedule", content: "Mid-term exams begin February 10th. Timetables shared with students.", audience: "STUDENTS", pinned: false },
    { title: "Library Week", content: "Reading challenges and book fairs from January 20th to 24th.", audience: "ALL", pinned: false },
  ];
  for (const n of notices) await prisma.notice.create({ data: n });
  console.log(`✔ ${notices.length} notices`);

  // --- Events ---
  const events = [
    { title: "Science Fair 2025", description: "Students showcase innovative projects.", location: "Main Auditorium", startDate: daysFromNow(10), endDate: daysFromNow(10), status: "UPCOMING" as const },
    { title: "Cultural Festival", description: "A celebration of music, dance, and drama.", location: "School Grounds", startDate: daysFromNow(25), endDate: daysFromNow(26), status: "UPCOMING" as const },
    { title: "Inter-School Debate", description: "Regional debate championship.", location: "Conference Hall", startDate: daysFromNow(40), endDate: daysFromNow(40), status: "UPCOMING" as const },
  ];
  for (const e of events) await prisma.event.create({ data: e });
  console.log(`✔ ${events.length} events`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
