// Mock data representing a school with ID = 1 (Springfield Public School)
// This mirrors the structure of the real MySQL database schema

export const mockSchool = {
    id: 1,
    name: "Springfield Public School",
    email: "admin@springfield.edu",
    mobile: "+91 98765 43210",
    coupon_prefix: "SPS",
    image: null,
};

export const mockTeachers = [
    { id: 101, name: "Amit Sharma", email: "amit.sharma@school.edu", mobile: "9876543210", designation: "Science Teacher", institute_name: "Springfield Public School", city: "Mumbai" },
    { id: 102, name: "Priya Gupta", email: "priya.gupta@school.edu", mobile: "9876543211", designation: "Mathematics Teacher", institute_name: "Springfield Public School", city: "Mumbai" },
    { id: 103, name: "Rahul Verma", email: "rahul.verma@school.edu", mobile: "9876543212", designation: "English Teacher", institute_name: "Springfield Public School", city: "Pune" },
    { id: 104, name: "Sneha Patel", email: "sneha.patel@school.edu", mobile: "9876543213", designation: "Hindi Teacher", institute_name: "Springfield Public School", city: "Mumbai" },
    { id: 105, name: "Vikram Singh", email: "vikram.singh@school.edu", mobile: "9876543214", designation: "History Teacher", institute_name: "Springfield Public School", city: "Nashik" },
    { id: 106, name: "Anita Rao", email: "anita.rao@school.edu", mobile: "9876543215", designation: "Biology Teacher", institute_name: "Springfield Public School", city: "Mumbai" },
    { id: 107, name: "Suresh Kumar", email: "suresh.kumar@school.edu", mobile: "9876543216", designation: "Chemistry Teacher", institute_name: "Springfield Public School", city: "Pune" },
    { id: 108, name: "Meera Nair", email: "meera.nair@school.edu", mobile: "9876543217", designation: "Art Teacher", institute_name: "Springfield Public School", city: "Mumbai" },
    { id: 109, name: "Rajesh Joshi", email: "rajesh.joshi@school.edu", mobile: "9876543218", designation: "PE Teacher", institute_name: "Springfield Public School", city: "Thane" },
    { id: 110, name: "Divya Mehta", email: "divya.mehta@school.edu", mobile: "9876543219", designation: "Computer Science Teacher", institute_name: "Springfield Public School", city: "Mumbai" },
];

export const mockWorkshops = [
    {
        id: 1,
        workshop_id: "WS-2024-001",
        name: "Advanced Teaching Methodologies",
        trainer_name: "Dr. Arun Kumar",
        start_date: "2026-03-20",
        category_id: 1,
        type: 0,
        number_of_users: 32,
    },
    {
        id: 2,
        workshop_id: "WS-2024-002",
        name: "Digital Classroom Integration",
        trainer_name: "Prof. Sanjay Mehta",
        start_date: "2026-04-05",
        category_id: 2,
        type: 0,
        number_of_users: 28,
    },
    {
        id: 3,
        workshop_id: "WS-2024-003",
        name: "Student Mental Health Awareness",
        trainer_name: "Dr. Priya Sharma",
        start_date: "2026-04-18",
        category_id: 3,
        type: 0,
        number_of_users: 45,
    },
    {
        id: 4,
        workshop_id: "WS-2023-010",
        name: "STEM Education Fundamentals",
        trainer_name: "Dr. Vivek Rao",
        start_date: "2025-12-15",
        category_id: 1,
        type: 1,
        number_of_users: 38,
    },
    {
        id: 5,
        workshop_id: "WS-2023-011",
        name: "Effective Communication for Educators",
        trainer_name: "Ms. Rachel Thomas",
        start_date: "2026-01-20",
        category_id: 2,
        type: 1,
        number_of_users: 41,
    },
    {
        id: 6,
        workshop_id: "WS-2023-012",
        name: "Inclusive Education Practices",
        trainer_name: "Dr. Neha Gupta",
        start_date: "2026-02-10",
        category_id: 3,
        type: 1,
        number_of_users: 35,
    },
];

export const mockEnrollments = [
    { user_id: 101, user_name: "Amit Sharma", email: "amit.sharma@school.edu", mobile: "9876543210", is_attended: 1, attended_duration: 90, is_school: 2, order_id: "ORD-001" },
    { user_id: 102, user_name: "Priya Gupta", email: "priya.gupta@school.edu", mobile: "9876543211", is_attended: 1, attended_duration: 75, is_school: 1, order_id: "ORD-002" },
    { user_id: 103, user_name: "Rahul Verma", email: "rahul.verma@school.edu", mobile: "9876543212", is_attended: 0, attended_duration: 25, is_school: 1, order_id: "ORD-003" },
    { user_id: 104, user_name: "Sneha Patel", email: "sneha.patel@school.edu", mobile: "9876543213", is_attended: 1, attended_duration: 120, is_school: 2, order_id: "ORD-004" },
    { user_id: 105, user_name: "Vikram Singh", email: "vikram.singh@school.edu", mobile: "9876543214", is_attended: 1, attended_duration: 60, is_school: 2, order_id: "ORD-005" },
    { user_id: 106, user_name: "Anita Rao", email: "anita.rao@school.edu", mobile: "9876543215", is_attended: 0, attended_duration: 0, is_school: 1, order_id: "ORD-006" },
    { user_id: 107, user_name: "Suresh Kumar", email: "suresh.kumar@school.edu", mobile: "9876543216", is_attended: 1, attended_duration: 95, is_school: 2, order_id: "ORD-007" },
    { user_id: 108, user_name: "Meera Nair", email: "meera.nair@school.edu", mobile: "9876543217", is_attended: 1, attended_duration: 80, is_school: 1, order_id: "ORD-008" },
];

export const mockMonthlyEnrollments = [
    { month: "Aug", count: 18 },
    { month: "Sep", count: 25 },
    { month: "Oct", count: 32 },
    { month: "Nov", count: 28 },
    { month: "Dec", count: 38 },
    { month: "Jan", count: 42 },
    { month: "Feb", count: 35 },
    { month: "Mar", count: 45 },
];

export const mockStats = {
    totalTeachers: mockTeachers.length,
    upcomingWorkshops: mockWorkshops.filter(w => w.type === 0).length,
    completedWorkshops: mockWorkshops.filter(w => w.type === 1).length,
    totalEnrollments: mockWorkshops.reduce((sum, w) => sum + w.number_of_users, 0),
};
