import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { scoreRisk } from "../src/lib/risk";

const prisma = new PrismaClient();

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function yearsAgo(n: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - n, 5, 15));
}
const pick = <T>(arr: T[], i: number) => arr[i % arr.length];

async function main() {
  console.log("🌱 Seeding database...");

  // --- Default Organization (tenant) ---
  const org = await prisma.organization.upsert({
    where: { slug: "greenwood" },
    update: {},
    create: {
      name: "Greenwood International School",
      slug: "greenwood",
      email: "info@greenwood.edu",
      phone: "+880 2 9000000",
      address: "Mirpur, Dhaka-1216",
      status: "ACTIVE",
    },
  });
  const schoolId = org.id;
  console.log(`✔ Organization: ${org.name} (${schoolId})`);

  // --- Subscription ---
  await prisma.subscription.upsert({
    where: { organizationId: schoolId },
    update: {},
    create: {
      organizationId: schoolId,
      tier: "PROFESSIONAL",
      status: "ACTIVE",
      maxStudents: 2000,
      maxTeachers: 200,
      maxStorageMb: 10000,
    },
  });
  console.log("✔ PROFESSIONAL subscription");

  // --- Admin user ---
  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email_schoolId: { email: "admin@greenwood.edu", schoolId } },
    update: {},
    create: { name: "School Administrator", email: "admin@greenwood.edu", password, role: "ADMIN", schoolId },
  });
  console.log("✔ Admin user: admin@greenwood.edu / admin123");

  // --- Settings ---
  const existingSetting = await prisma.setting.findFirst();
  if (!existingSetting) await prisma.setting.create({ data: { schoolId } });
  else await prisma.setting.update({ where: { id: existingSetting.id }, data: { schoolId } });

  // --- Campuses (Bangladesh) ---
  const mainCampus = await prisma.campus.upsert({
    where: { schoolId_code: { schoolId, code: "MAIN" } },
    update: {},
    create: { name: "Main Campus (Dhaka)", code: "MAIN", address: "Mirpur, Dhaka-1216", phone: "+880 2 9000000", isMain: true, schoolId },
  });
  await prisma.campus.upsert({
    where: { schoolId_code: { schoolId, code: "UTR" } },
    update: {},
    create: { name: "Uttara Branch", code: "UTR", address: "Sector 7, Uttara, Dhaka-1230", phone: "+880 2 8900000", isMain: false, schoolId },
  });
  console.log("✔ 2 campuses");

  // --- Academic session + terms ---
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearEnd = new Date(new Date().getFullYear(), 11, 31);
  const session = await prisma.academicSession.upsert({
    where: { schoolId_name: { schoolId, name: String(new Date().getFullYear()) } },
    update: {},
    create: { name: String(new Date().getFullYear()), startDate: yearStart, endDate: yearEnd, isCurrent: true, schoolId },
  });
  const termData = [
    { name: "First Term", startDate: new Date(new Date().getFullYear(), 0, 1), endDate: new Date(new Date().getFullYear(), 3, 30) },
    { name: "Half Yearly", startDate: new Date(new Date().getFullYear(), 4, 1), endDate: new Date(new Date().getFullYear(), 7, 31) },
    { name: "Annual", startDate: new Date(new Date().getFullYear(), 8, 1), endDate: new Date(new Date().getFullYear(), 11, 31) },
  ];
  for (const term of termData) {
    await prisma.term.upsert({
      where: { sessionId_name: { sessionId: session.id, name: term.name } },
      update: {},
      create: { ...term, sessionId: session.id, schoolId },
    });
  }
  console.log(`✔ 1 session, ${termData.length} terms`);

  // --- Classes + Sections (Bangla medium, day shift, main campus) ---
  const classNames = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
  const classes = [];
  for (const name of classNames) {
    const c = await prisma.class.upsert({
      where: { schoolId_name: { schoolId, name } },
      update: { medium: "BANGLA", shift: "DAY", campusId: mainCampus.id, sessionId: session.id },
      create: { name, capacity: 40, medium: "BANGLA", shift: "DAY", campusId: mainCampus.id, sessionId: session.id, schoolId },
    });
    classes.push(c);
    for (const sec of ["A", "B"]) {
      await prisma.section.upsert({
        where: { classId_name: { classId: c.id, name: sec } },
        update: {},
        create: { name: sec, classId: c.id, schoolId },
      });
    }
  }
  const allSections = await prisma.section.findMany();
  console.log(`✔ ${classes.length} classes, ${allSections.length} sections`);

  // --- Teachers ---
  const teacherData = [
    { fullName: "Md. Abdul Karim", department: "Science", subject: "Physics", qualification: "M.Sc. Physics, B.Ed", experience: 12 },
    { fullName: "Shirin Akter", department: "Mathematics", subject: "Mathematics", qualification: "M.Sc. Mathematics", experience: 8 },
    { fullName: "Mohammad Rafiqul Islam", department: "Languages", subject: "Bangla", qualification: "M.A. Bangla", experience: 6 },
    { fullName: "Nasrin Sultana", department: "Languages", subject: "English", qualification: "M.A. English", experience: 10 },
    { fullName: "Abul Kalam Azad", department: "Religion", subject: "Islamic Studies", qualification: "Kamil", experience: 15 },
    { fullName: "Farhana Yeasmin", department: "Science", subject: "Biology", qualification: "M.Sc. Zoology", experience: 7 },
  ];
  const teachers = [];
  for (let i = 0; i < teacherData.length; i++) {
    const t = teacherData[i];
    const teacher = await prisma.teacher.upsert({
      where: { schoolId_teacherId: { schoolId, teacherId: `TCH-${1001 + i}` } },
      update: {},
      create: {
        teacherId: `TCH-${1001 + i}`,
        ...t,
        email: `teacher${1001 + i}@greenwood.edu`,
        phone: `+8801${String(800000000 + i * 111111).padStart(9, "0")}`,
        joiningDate: yearsAgo(t.experience),
        salary: 35000 + i * 2500,
        status: "ACTIVE",
        campusId: mainCampus.id,
        schoolId,
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
      where: { schoolId_code: { schoolId, code: subjectData[i].code } },
      update: {},
      create: {
        ...subjectData[i],
        classId: pick(classes, i).id,
        teacherId: pick(teachers, i).id,
        schoolId,
      },
    });
  }
  console.log(`✔ ${subjectData.length} subjects`);

  // --- Parents ---
  const parentNames = ["Robert Smith", "Maria Garcia", "David Johnson", "Linda Williams", "Michael Brown", "Sarah Davis"];
  const parents = [];
  for (let i = 0; i < parentNames.length; i++) {
    const p = await prisma.parent.upsert({
      where: { schoolId_parentId: { schoolId, parentId: `PAR-${2001 + i}` } },
      update: {},
      create: {
        parentId: `PAR-${2001 + i}`,
        fullName: parentNames[i],
        email: `${parentNames[i].split(" ")[0].toLowerCase()}${i}@example.com`,
        phone: `+1 555 02${String(10 + i).padStart(2, "0")}`,
        occupation: pick(["Engineer", "Doctor", "Teacher", "Business Owner", "Accountant", "Architect"], i),
        emergencyContact: `+1 555 09${String(10 + i).padStart(2, "0")}`,
        schoolId,
      },
    });
    parents.push(p);
  }
  console.log(`✔ ${parents.length} parents`);

  // --- Students ---
  const firstNames = ["Rahim", "Karim", "Ayesha", "Fatema", "Tanvir", "Nusrat", "Sadia", "Rakib", "Mim", "Sabbir", "Jannat", "Arif"];
  const lastNames = ["Uddin", "Islam", "Akter", "Hossain", "Rahman", "Chowdhury", "Ahmed", "Khan", "Begum", "Sarkar", "Miah", "Hasan"];
  const genders: ("MALE" | "FEMALE")[] = ["MALE", "FEMALE"];
  let created = 0;
  for (let i = 0; i < 24; i++) {
    const fullName = `${pick(firstNames, i)} ${pick(lastNames, i + 3)}`;
    const cls = pick(classes, i);
    const sec = allSections.find((s: { classId: string }) => s.classId === cls.id) ?? allSections[0];
    await prisma.student.upsert({
      where: { schoolId_studentId: { schoolId, studentId: `STU-${3001 + i}` } },
      update: {},
      create: {
        studentId: `STU-${3001 + i}`,
        fullName,
        gender: pick(genders, i),
        dateOfBirth: yearsAgo(6 + (i % 5)),
        bloodGroup: pick(["A+", "B+", "O+", "AB+", "O-"], i),
        phone: `+8801${String(700000000 + i * 111111).padStart(9, "0")}`,
        email: `${fullName.split(" ")[0].toLowerCase()}${i}@student.greenwood.edu`,
        classId: cls.id,
        sectionId: sec.id,
        rollNumber: String(i + 1).padStart(2, "0"),
        admissionDate: daysFromNow(-(30 + i * 3)),
        guardianName: pick(parentNames, i),
        parentId: pick(parents, i).id,
        status: "ACTIVE",
        medium: "BANGLA",
        shift: "DAY",
        campusId: mainCampus.id,
        sessionId: session.id,
        schoolId,
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
        create: { studentId: someStudents[i].id, date, status: pick(attStatuses, i + d), schoolId },
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
        schoolId,
      },
    });
    feeCount++;
  }
  console.log(`✔ ${feeCount} fee records`);

  // --- Exams ---
  const exam = await prisma.exam.create({
    data: { name: "Mid-Term Examination 2025", classId: classes[0].id, startDate: daysFromNow(20), endDate: daysFromNow(27), schoolId },
  });
  console.log(`✔ 1 exam`);

  // --- Results ---
  const subjects = await prisma.subject.findMany({ take: 3 });
  const examStudents = await prisma.student.findMany({ where: { classId: classes[0].id }, take: 8 });
  let resultCount = 0;
  for (let i = 0; i < examStudents.length; i++) {
    for (let j = 0; j < subjects.length; j++) {
      const marks = 45 + ((i * 7 + j * 13) % 55);
      const pct = marks;
      const grade = pct >= 80 ? "A+" : pct >= 70 ? "A" : pct >= 60 ? "A-" : pct >= 50 ? "B" : pct >= 40 ? "C" : pct >= 33 ? "D" : "F";
      await prisma.result.upsert({
        where: { studentId_examId_subjectId: { studentId: examStudents[i].id, examId: exam.id, subjectId: subjects[j].id } },
        update: {},
        create: { studentId: examStudents[i].id, examId: exam.id, subjectId: subjects[j].id, marks, totalMarks: 100, grade },
      });
      resultCount++;
    }
  }
  console.log(`✔ ${resultCount} results`);

  // --- Board registrations ---
  const boardStudents = await prisma.student.findMany({ where: { classId: classes[classes.length - 1].id }, take: 6 });
  const boardNames = ["Dhaka", "Rajshahi", "Chittagong", "Comilla", "Sylhet", "Jessore"];
  const currentYear = new Date().getFullYear();
  let boardCount = 0;
  for (let i = 0; i < boardStudents.length; i++) {
    await prisma.boardRegistration.upsert({
      where: { studentId_boardExam_examYear: { studentId: boardStudents[i].id, boardExam: "JSC", examYear: currentYear } },
      update: {},
      create: {
        studentId: boardStudents[i].id,
        boardExam: "JSC",
        examYear: currentYear,
        regNumber: `${currentYear}${String(100000 + i).padStart(6, "0")}`,
        rollNumber: String(200000 + i),
        boardName: pick(boardNames, i),
        status: i % 3 === 0 ? "APPROVED" : i % 3 === 1 ? "REGISTERED" : "PENDING",
        schoolId,
      },
    });
    boardCount++;
  }
  console.log(`✔ ${boardCount} board registrations`);

  // --- Finance: fee categories ---
  const categoryData = [
    { name: "Monthly Tuition", type: "TUITION" as const, recurrence: "MONTHLY" as const, amount: 2000 },
    { name: "Admission Fee", type: "ADMISSION" as const, recurrence: "ONE_TIME" as const, amount: 5000 },
    { name: "Exam Fee", type: "EXAM" as const, recurrence: "TERM" as const, amount: 800 },
    { name: "Transport Fee", type: "TRANSPORT" as const, recurrence: "MONTHLY" as const, amount: 1200 },
    { name: "Hostel Fee", type: "HOSTEL" as const, recurrence: "MONTHLY" as const, amount: 3500 },
    { name: "Coaching Batch Fee", type: "COACHING" as const, recurrence: "MONTHLY" as const, amount: 1500 },
  ];
  const categories = [];
  for (const c of categoryData) {
    const cat = await prisma.feeCategory.upsert({
      where: { schoolId_name: { schoolId, name: c.name } },
      update: {},
      create: { name: c.name, type: c.type, recurrence: c.recurrence, schoolId },
    });
    categories.push(cat);
    await prisma.feeStructure.create({ data: { categoryId: cat.id, amount: c.amount, label: `${c.name} — default`, schoolId } });
  }
  console.log(`✔ ${categories.length} fee categories + structures`);

  // --- Finance: invoices + payments ---
  const allStudents = await prisma.student.findMany({ take: 8 });
  const tuition = categories[0];
  const examCat = categories[2];
  let invCount = 0, payCount = 0;
  for (let i = 0; i < allStudents.length; i++) {
    const stu = allStudents[i];
    const subtotal = 2000 + 800;
    const discount = i % 4 === 0 ? 200 : 0;
    const total = subtotal - discount;
    const inv = await prisma.invoice.create({
      data: {
        invoiceNo: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(6, "0")}`,
        studentId: stu.id,
        dueDate: daysFromNow(15),
        period: `${new Date().getFullYear()}-01`,
        subtotal, discountTotal: discount, total, paidTotal: 0,
        status: "ISSUED",
        schoolId,
        items: {
          create: [
            { categoryId: tuition.id, description: "Monthly Tuition — January", amount: 2000, discount },
            { categoryId: examCat.id, description: "Exam Fee — First Term", amount: 800, discount: 0 },
          ],
        },
      },
    });
    invCount++;
    if (i % 3 === 0) {
      const method = (["BKASH", "NAGAD", "CASH"] as const)[i % 3];
      await prisma.payment.create({ data: { invoiceId: inv.id, amount: total, method, status: "SUCCESS", gateway: method === "CASH" ? null : method, gatewayRef: method === "CASH" ? null : `${method}-TXN-${1000 + i}`, schoolId } });
      await prisma.invoice.update({ where: { id: inv.id }, data: { paidTotal: total, status: "PAID" } });
      payCount++;
    } else if (i % 3 === 1) {
      const part = Math.round(total / 2);
      await prisma.payment.create({ data: { invoiceId: inv.id, amount: part, method: "BKASH", status: "SUCCESS", gateway: "BKASH", gatewayRef: `BKASH-TXN-${2000 + i}`, schoolId } });
      await prisma.invoice.update({ where: { id: inv.id }, data: { paidTotal: part, status: "PARTIAL" } });
      payCount++;
    }
  }
  console.log(`✔ ${invCount} invoices, ${payCount} payments`);

  // --- Concessions ---
  if (allStudents.length > 0) {
    await prisma.concession.create({ data: { studentId: allStudents[0].id, type: "SCHOLARSHIP", mode: "PERCENTAGE", value: 25, reason: "Merit scholarship", schoolId } });
    await prisma.concession.create({ data: { studentId: allStudents[1]?.id ?? allStudents[0].id, type: "WAIVER", mode: "FIXED", value: 1000, reason: "Financial hardship waiver", schoolId } });
  }
  console.log("✔ concessions");

  // --- Library ---
  const libCategories = ["Fiction", "Science", "History", "Religion", "Children", "Reference"];
  const catRecords: Record<string, { id: string }> = {};
  for (const name of libCategories) {
    catRecords[name] = await prisma.bookCategory.upsert({ where: { schoolId_name: { schoolId, name } }, update: {}, create: { name, schoolId } });
  }
  const authorNames = ["Humayun Ahmed", "Kazi Nazrul Islam", "Rabindranath Tagore", "Zafar Iqbal", "Begum Rokeya"];
  const authorRecords: Record<string, { id: string }> = {};
  for (const name of authorNames) {
    authorRecords[name] = await prisma.author.upsert({ where: { schoolId_name: { schoolId, name } }, update: {}, create: { name, schoolId } });
  }
  const publisherNames = ["Anyaprokash", "Prothoma Prokashan", "Sheba Prokashoni", "Bangla Academy"];
  const publisherRecords: Record<string, { id: string }> = {};
  for (const name of publisherNames) {
    publisherRecords[name] = await prisma.publisher.upsert({ where: { schoolId_name: { schoolId, name } }, update: {}, create: { name, schoolId } });
  }

  const bookData = [
    { title: "Himu", author: "Humayun Ahmed", category: "Fiction", publisher: "Anyaprokash", language: "Bangla", isbn: "9789845020301", shelf: "A", rack: "R1", copies: 3 },
    { title: "Misir Ali Omnibus", author: "Humayun Ahmed", category: "Fiction", publisher: "Anyaprokash", language: "Bangla", isbn: "9789845020302", shelf: "A", rack: "R1", copies: 2 },
    { title: "Sanchayita", author: "Rabindranath Tagore", category: "Reference", publisher: "Bangla Academy", language: "Bangla", isbn: "9789845020303", shelf: "B", rack: "R2", copies: 2 },
    { title: "Bidrohi", author: "Kazi Nazrul Islam", category: "Reference", publisher: "Bangla Academy", language: "Bangla", isbn: "9789845020304", shelf: "B", rack: "R2", copies: 1 },
    { title: "Tumi Kothay", author: "Zafar Iqbal", category: "Children", publisher: "Prothoma Prokashan", language: "Bangla", isbn: "9789845020305", shelf: "C", rack: "R3", copies: 4 },
    { title: "Sultana's Dream", author: "Begum Rokeya", category: "Fiction", publisher: "Sheba Prokashoni", language: "English", isbn: "9789845020306", shelf: "C", rack: "R3", copies: 2 },
  ];

  let bookCount = 0, copyCount = 0;
  const createdCopies: { id: string; bookId: string }[] = [];
  for (const b of bookData) {
    const book = await prisma.book.create({ data: {
      title: b.title, isbn: b.isbn, language: b.language, shelf: b.shelf, rack: b.rack, schoolId,
      categoryId: catRecords[b.category]?.id ?? null,
      authorId: authorRecords[b.author]?.id ?? null,
      publisherId: publisherRecords[b.publisher]?.id ?? null,
    }});
    bookCount++;
    const prefix = `BK-${book.id.slice(-4).toUpperCase()}`;
    for (let i = 0; i < b.copies; i++) {
      const copy = await prisma.bookCopy.create({ data: { bookId: book.id, copyCode: `${prefix}-${String(i + 1).padStart(2, "0")}`, schoolId } });
      createdCopies.push({ id: copy.id, bookId: book.id });
      copyCount++;
    }
  }
  console.log(`✔ ${bookCount} books, ${copyCount} copies`);

  // --- Book loans ---
  const libStudents = await prisma.student.findMany({ take: 4 });
  let loanCount = 0;
  for (let i = 0; i < Math.min(3, libStudents.length, createdCopies.length); i++) {
    const copy = createdCopies[i];
    const returned = i === 0;
    await prisma.bookLoan.create({ data: {
      copyId: copy.id, borrowerType: "STUDENT", studentId: libStudents[i].id,
      dueDate: daysFromNow(returned ? -3 : 14),
      status: returned ? "RETURNED" : "ISSUED",
      returnedAt: returned ? new Date() : null,
      fineAmount: returned ? 30 : 0, finePaid: returned,
    }});
    if (!returned) await prisma.bookCopy.update({ where: { id: copy.id }, data: { status: "ISSUED" } });
    loanCount++;
  }
  console.log(`✔ ${loanCount} book loans`);

  // --- Transport ---
  const driver1 = await prisma.driver.upsert({ where: { licenseNo: "DHK-1001" }, update: { schoolId }, create: { name: "Karim Mia", phone: "01710000001", licenseNo: "DHK-1001", schoolId } });
  const driver2 = await prisma.driver.upsert({ where: { licenseNo: "DHK-1002" }, update: { schoolId }, create: { name: "Rahim Uddin", phone: "01710000002", licenseNo: "DHK-1002", schoolId } });
  const veh1 = await prisma.vehicle.upsert({ where: { regNumber: "DHAKA-METRO-GA-11-1234" }, update: { schoolId }, create: { regNumber: "DHAKA-METRO-GA-11-1234", type: "BUS", capacity: 40, driverId: driver1.id, status: "ACTIVE", schoolId } });
  const veh2 = await prisma.vehicle.upsert({ where: { regNumber: "DHAKA-METRO-GA-11-5678" }, update: { schoolId }, create: { regNumber: "DHAKA-METRO-GA-11-5678", type: "MINIBUS", capacity: 25, driverId: driver2.id, status: "ACTIVE", schoolId } });
  const route1 = await prisma.transportRoute.create({ data: {
    name: "Mirpur - School", code: "R-01", fare: 1200, vehicleId: veh1.id, schoolId,
    stops: { create: [
      { name: "Mirpur 10", sequence: 1, pickupTime: "07:00" },
      { name: "Kazipara", sequence: 2, pickupTime: "07:15" },
      { name: "Shewrapara", sequence: 3, pickupTime: "07:25" },
    ] },
  }, include: { stops: true } });
  const route2 = await prisma.transportRoute.create({ data: {
    name: "Uttara - School", code: "R-02", fare: 1500, vehicleId: veh2.id, schoolId,
    stops: { create: [
      { name: "Uttara Sector 7", sequence: 1, pickupTime: "06:50" },
      { name: "Airport", sequence: 2, pickupTime: "07:10" },
    ] },
  }, include: { stops: true } });
  const transportStudents = await prisma.student.findMany({ take: 5 });
  let assignCount = 0;
  for (let i = 0; i < transportStudents.length; i++) {
    const route = i % 2 === 0 ? route1 : route2;
    await prisma.studentTransport.create({ data: {
      studentId: transportStudents[i].id, routeId: route.id, stopId: route.stops[0]?.id ?? null, status: "ACTIVE",
    }});
    assignCount++;
  }
  console.log(`✔ 2 drivers, 2 vehicles, 2 routes, ${assignCount} transport assignments`);

  // --- Hostel ---
  const boysHostel = await prisma.hostelBuilding.create({ data: { name: "Boys Hostel A", gender: "MALE", warden: "Mr. Alam", schoolId } });
  const girlsHostel = await prisma.hostelBuilding.create({ data: { name: "Girls Hostel B", gender: "FEMALE", warden: "Ms. Nasrin", schoolId } });
  const room101 = await prisma.hostelRoom.create({ data: { buildingId: boysHostel.id, roomNo: "101", capacity: 4, monthlyFee: 3500, status: "AVAILABLE" } });
  await prisma.hostelRoom.create({ data: { buildingId: boysHostel.id, roomNo: "102", capacity: 4, monthlyFee: 3500, status: "AVAILABLE" } });
  await prisma.hostelRoom.create({ data: { buildingId: girlsHostel.id, roomNo: "201", capacity: 3, monthlyFee: 4000, status: "AVAILABLE" } });
  const hostelStudents = await prisma.student.findMany({ take: 2 });
  let hostelAlloc = 0;
  for (const s of hostelStudents) {
    await prisma.hostelAllocation.create({ data: { roomId: room101.id, studentId: s.id, status: "ACTIVE" } });
    hostelAlloc++;
  }
  console.log(`✔ 2 hostel buildings, 3 rooms, ${hostelAlloc} allocations`);

  // --- SMS ---
  const tplFee = await prisma.smsTemplate.create({ data: { name: "Fee Reminder", category: "FEE_REMINDER", body: "Dear guardian, the monthly fee for {name} is due. Please pay by the 10th.", schoolId } });
  await prisma.smsTemplate.create({ data: { name: "Holiday Notice", category: "HOLIDAY", body: "The school will remain closed on {date} due to a public holiday.", schoolId } });
  await prisma.smsTemplate.create({ data: { name: "Exam Schedule", category: "RESULT", body: "Half-yearly exams begin next Sunday. Please check the routine.", schoolId } });
  await prisma.smsTemplate.create({ data: { name: "Attendance Absent", category: "ATTENDANCE", body: "Dear guardian, {name} was marked absent on {date}. Please contact the school.", schoolId } });
  await prisma.smsTemplate.create({ data: { name: "Result Published", category: "RESULT", body: "Result for {name} is published. GPA: {gpa}. Congratulations!", schoolId } });
  await prisma.smsTemplate.create({ data: { name: "Emergency Broadcast", category: "EMERGENCY", body: "URGENT: {message}. - Greenwood School", schoolId } });
  await prisma.smsTemplate.create({ data: { name: "Admission Confirmation", category: "ADMISSION", body: "Dear {name}, your admission application ({ref}) has been received. We will contact you shortly.", schoolId } });
  await prisma.smsTemplate.create({ data: { name: "OTP Verification", category: "OTP", body: "Your Greenwood verification code is {code}. It expires in 5 minutes.", schoolId } });

  const sentMsg = await prisma.smsMessage.create({ data: {
    title: "Fee Reminder - June", body: tplFee.body, category: "FEE_REMINDER", audience: "PARENTS", status: "SENT",
    templateId: tplFee.id, provider: "SSL_WIRELESS", sentAt: new Date(), totalCount: 3, sentCount: 2, deliveredCount: 1, failedCount: 1, schoolId,
    recipients: { create: [
      { name: "Parent A", phone: "+8801711111111", status: "DELIVERED", attempts: 1, providerRef: "SSL-1001", deliveredAt: new Date() },
      { name: "Parent B", phone: "+8801722222222", status: "SENT", attempts: 1, providerRef: "SSL-1002" },
      { name: "Parent C", phone: "+8801733333333", status: "FAILED", attempts: 1, error: "Handset unreachable" },
    ] },
  } });
  void sentMsg;
  console.log("✔ 8 sms templates, 1 sent message with delivery data");

  // --- Admissions ---
  const admSession = await prisma.admissionSession.create({ data: {
    name: "Admission 2026 - Class 6", year: 2026, classApplied: "Class 6", seats: 3, isOpen: true,
    startDate: daysFromNow(-10), endDate: daysFromNow(20), schoolId,
  } });
  await prisma.admissionSession.create({ data: {
    name: "Admission 2026 - Class 9 (Science)", year: 2026, classApplied: "Class 9", seats: 2, isOpen: true, schoolId,
  } });
  const applicants = [
    { name: "Nusrat Jahan", guardian: "Abdul Karim", phone: "01710000101", score: 95, status: "SHORTLISTED" as const, cls: "Class 6" },
    { name: "Ayesha Rahman", guardian: "Mizanur Rahman", phone: "01710000102", score: 88, status: "UNDER_REVIEW" as const, cls: "Class 6" },
    { name: "Tanvir Hasan", guardian: "Delwar Hossain", phone: "01710000103", score: 82, status: "SUBMITTED" as const, cls: "Class 6" },
    { name: "Sadia Islam", guardian: "Rafiqul Islam", phone: "01710000104", score: 76, status: "SUBMITTED" as const, cls: "Class 6" },
    { name: "Rakib Ahmed", guardian: "Jashim Uddin", phone: "01710000105", score: 68, status: "WAITLISTED" as const, cls: "Class 6" },
    { name: "Farhan Kabir", guardian: "Nurul Kabir", phone: "01710000106", score: 91, status: "SUBMITTED" as const, cls: "Class 6" },
  ];
  let appCount = 0;
  for (const a of applicants) {
    await prisma.application.create({ data: {
      sessionId: admSession.id, applicantName: a.name, gender: "MALE", guardianName: a.guardian, guardianPhone: a.phone,
      classApplied: a.cls, score: a.score, status: a.status, previousSchool: "Local Primary School", schoolId,
    } });
    appCount++;
  }
  console.log(`✔ 2 admission sessions, ${appCount} applications`);

  // --- AI Dropout Risk ---
  const riskStudents = await prisma.student.findMany({ take: 8, select: { id: true } });
  let riskCount = 0;
  for (const rs of riskStudents) {
    const [attendance, invoices, results] = await Promise.all([
      prisma.attendance.groupBy({ by: ["status"], where: { studentId: rs.id }, _count: { _all: true } }),
      prisma.invoice.findMany({ where: { studentId: rs.id }, select: { total: true, paidTotal: true, status: true } }),
      prisma.result.findMany({ where: { studentId: rs.id }, select: { marks: true, totalMarks: true } }),
    ]);
    const attMap: Record<string, number> = {};
    for (const a of attendance) attMap[a.status] = a._count._all;
    const totalDays = Object.values(attMap).reduce((x, n) => x + n, 0);
    const present = (attMap.PRESENT ?? 0) + (attMap.LATE ?? 0);
    const attendanceRate = totalDays > 0 ? (present / totalDays) * 100 : null;
    const duesAmount = invoices.filter((i: { total: number; paidTotal: number; status: string }) => i.status !== "CANCELLED" && i.status !== "PAID")
      .reduce((x: number, i: { total: number; paidTotal: number }) => x + Math.max(0, (i.total ?? 0) - (i.paidTotal ?? 0)), 0);
    const avgResult = results.length > 0
      ? results.reduce((x: number, r: { marks: number; totalMarks: number }) => x + (r.marks / (r.totalMarks || 100)) * 100, 0) / results.length : null;
    const risk = scoreRisk({ attendanceRate, duesAmount, avgResult });
    await prisma.riskAssessment.create({ data: {
      studentId: rs.id, score: risk.score, level: risk.level, attendanceRate, duesAmount, avgResult, factors: risk.factors.join("; "), schoolId,
    } });
    riskCount++;
  }
  console.log(`✔ ${riskCount} risk assessments`);

  // --- Payment gateway transactions ---
  const payInvoices = await prisma.invoice.findMany({ take: 3, orderBy: { createdAt: "asc" } });
  let gatewayPayCount = 0;
  const gateways = ["BKASH", "NAGAD", "SSLCOMMERZ"] as const;
  for (let i = 0; i < payInvoices.length; i++) {
    const inv = payInvoices[i];
    const gw = gateways[i % gateways.length];
    const ref = `TRX-${gw}-${1000 + i}`;
    const amount = Math.min(inv.total, 1000 + i * 500);
    await prisma.paymentTransaction.create({ data: { invoiceId: inv.id, gateway: gw, event: "INITIATE", status: "PENDING", amount, gatewayRef: ref, message: "Checkout session created." } });
    const payment = await prisma.payment.create({ data: { invoiceId: inv.id, amount, method: gw, status: "SUCCESS", gateway: gw, gatewayRef: ref, schoolId } });
    await prisma.paymentTransaction.create({ data: { paymentId: payment.id, invoiceId: inv.id, gateway: gw, event: "WEBHOOK", status: "SUCCESS", amount, gatewayRef: ref } });
    const payments = await prisma.payment.findMany({ where: { invoiceId: inv.id, status: { in: ["SUCCESS", "REFUNDED"] } } });
    const paidTotal = payments.reduce((s: number, p: { amount: number; refundedAmount: number }) => s + (p.amount - (p.refundedAmount ?? 0)), 0);
    const status = paidTotal >= inv.total ? "PAID" : paidTotal > 0 ? "PARTIAL" : inv.status;
    await prisma.invoice.update({ where: { id: inv.id }, data: { paidTotal, status } });
    gatewayPayCount++;
  }
  console.log(`✔ ${gatewayPayCount} gateway payments + transaction logs`);

  // --- Parent Portal: routine, homework, messages, leave ---
  const ppClass = await prisma.class.findFirst();
  const ppSection = ppClass ? await prisma.section.findFirst({ where: { classId: ppClass.id } }) : null;
  const ppSubjects = await prisma.subject.findMany({ take: 4 });
  const ppTeacher = await prisma.teacher.findFirst();
  const ppStudent = await prisma.student.findFirst({ orderBy: { studentId: "asc" } });
  if (ppClass && ppSubjects.length) {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const;
    const times = [["09:00", "09:45"], ["09:50", "10:35"], ["10:40", "11:25"], ["11:45", "12:30"]];
    let slots = 0;
    for (const day of days) {
      for (let p = 0; p < Math.min(4, ppSubjects.length); p++) {
        await prisma.routineSlot.create({ data: {
          classId: ppClass.id, sectionId: ppSection?.id ?? null, subjectId: ppSubjects[p].id, teacherId: ppTeacher?.id ?? null,
          day, startTime: times[p][0], endTime: times[p][1], room: `Room ${201 + p}`, schoolId,
        } });
        slots++;
      }
    }
    await prisma.homework.create({ data: { classId: ppClass.id, sectionId: ppSection?.id ?? null, subjectId: ppSubjects[0].id, teacherId: ppTeacher?.id ?? null, title: "Algebra worksheet", details: "Complete exercises 1–10 from chapter 3.", dueDate: daysFromNow(3), schoolId } });
    await prisma.homework.create({ data: { classId: ppClass.id, sectionId: ppSection?.id ?? null, subjectId: ppSubjects[1]?.id ?? ppSubjects[0].id, teacherId: ppTeacher?.id ?? null, title: "Reading comprehension", details: "Read the passage and answer the questions.", dueDate: daysFromNow(5), schoolId } });
    console.log(`✔ ${slots} routine slots, 2 homework items`);

    if (ppStudent) {
      const firstHw = await prisma.homework.findFirst({ orderBy: { dueDate: "asc" } });
      if (firstHw) {
        await prisma.homework.update({ where: { id: firstHw.id }, data: { attachmentUrl: "/uploads/demo-worksheet.pdf" } });
        await prisma.homeworkSubmission.upsert({
          where: { homeworkId_studentId: { homeworkId: firstHw.id, studentId: ppStudent.id } },
          update: {},
          create: { homeworkId: firstHw.id, studentId: ppStudent.id, content: "Completed all exercises.", totalMarks: 100, status: "SUBMITTED" },
        });
      }
    }

    // --- Online examination ---
    const qbSubject = ppSubjects[2] ?? ppSubjects[0];
    await prisma.question.createMany({
      data: [
        { subjectId: qbSubject.id, teacherId: ppTeacher?.id ?? null, classId: ppClass.id, type: "MCQ", text: "What is 7 × 8?", options: ["54", "56", "58", "64"], correctOption: 1, marks: 2, tags: "math", schoolId },
        { subjectId: qbSubject.id, teacherId: ppTeacher?.id ?? null, classId: ppClass.id, type: "MCQ", text: "Capital of Bangladesh?", options: ["Chittagong", "Dhaka", "Sylhet", "Khulna"], correctOption: 1, marks: 2, tags: "general", schoolId },
        { subjectId: qbSubject.id, teacherId: ppTeacher?.id ?? null, classId: ppClass.id, type: "MCQ", text: "Which is a prime number?", options: ["9", "15", "17", "21"], correctOption: 2, marks: 2, tags: "math", schoolId },
        { subjectId: qbSubject.id, teacherId: ppTeacher?.id ?? null, classId: ppClass.id, type: "WRITTEN", text: "Explain the water cycle in 2–3 sentences.", modelAnswer: "Evaporation → condensation → precipitation.", marks: 5, tags: "science", schoolId },
        { subjectId: qbSubject.id, teacherId: ppTeacher?.id ?? null, classId: ppClass.id, type: "WRITTEN", text: "Solve: 3x + 5 = 20.", modelAnswer: "x = 5", marks: 5, tags: "math", schoolId },
      ],
    });
    const examQs = await prisma.question.findMany({ take: 5, orderBy: { createdAt: "asc" } });
    if (examQs.length) {
      await prisma.onlineExam.create({
        data: {
          title: "Demo Online Quiz",
          classId: ppClass.id, subjectId: qbSubject.id, teacherId: ppTeacher?.id ?? null,
          description: "A short auto-graded demo exam covering math and general knowledge.",
          startTime: new Date(Date.now() - 60 * 60 * 1000),
          endTime: daysFromNow(1),
          durationMinutes: 15,
          totalMarks: 16,
          passMark: 8,
          negativeMark: 0,
          shuffleQuestions: false,
          status: "LIVE",
          schoolId,
          questions: { create: examQs.map((q, i) => ({ questionId: q.id, order: i, marks: q.marks })) },
        },
      });
      console.log(`✔ question bank (${examQs.length}) + 1 live online exam`);
    }
  }
  if (ppStudent && ppTeacher) {
    await prisma.parentMessage.create({ data: { studentId: ppStudent.id, teacherId: ppTeacher.id, sender: "PARENT", body: "Assalamu alaikum, how is my child doing in class?", schoolId } });
    await prisma.parentMessage.create({ data: { studentId: ppStudent.id, teacherId: ppTeacher.id, sender: "TEACHER", body: "Walaikum assalam. Steady progress this term, keep encouraging reading at home.", schoolId } });
    await prisma.leaveRequest.create({ data: { studentId: ppStudent.id, fromDate: daysFromNow(2), toDate: daysFromNow(3), reason: "Family wedding out of town.", status: "PENDING", schoolId } });
    console.log("✔ parent messages + 1 leave request");
  }

  // --- Notices ---
  const notices = [
    { title: "Annual Sports Day 2025", content: "Our annual sports day will be held on March 15th. All students are encouraged to participate.", audience: "ALL", pinned: true, schoolId },
    { title: "Parent-Teacher Conference", content: "Scheduled for February 28th. Please book slots via the parent portal.", audience: "PARENTS", pinned: true, schoolId },
    { title: "Mid-Term Examination Schedule", content: "Mid-term exams begin February 10th. Timetables shared with students.", audience: "STUDENTS", pinned: false, schoolId },
    { title: "Library Week", content: "Reading challenges and book fairs from January 20th to 24th.", audience: "ALL", pinned: false, schoolId },
  ];
  for (const n of notices) await prisma.notice.create({ data: n });
  console.log(`✔ ${notices.length} notices`);

  // --- Events ---
  const events = [
    { title: "Science Fair 2025", description: "Students showcase innovative projects.", location: "Main Auditorium", startDate: daysFromNow(10), endDate: daysFromNow(10), status: "UPCOMING" as const, schoolId },
    { title: "Cultural Festival", description: "A celebration of music, dance, and drama.", location: "School Grounds", startDate: daysFromNow(25), endDate: daysFromNow(26), status: "UPCOMING" as const, schoolId },
    { title: "Inter-School Debate", description: "Regional debate championship.", location: "Conference Hall", startDate: daysFromNow(40), endDate: daysFromNow(40), status: "UPCOMING" as const, schoolId },
  ];
  for (const e of events) await prisma.event.create({ data: e });
  console.log(`✔ ${events.length} events`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
