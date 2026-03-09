require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');

const companies = [
    { company: 'Stripe', role: 'Senior Frontend Engineer', stage: 'Interviewing', salary: { min: 180000, max: 220000 }, location: 'San Francisco, CA', remote: 'hybrid', rating: 5, lastContact: new Date(Date.now() - 3 * 86400000), appliedAt: new Date(Date.now() - 14 * 86400000), skills: ['React', 'TypeScript', 'GraphQL'] },
    { company: 'Figma', role: 'Staff Software Engineer', stage: 'Screening', salary: { min: 200000, max: 250000 }, location: 'New York, NY', remote: 'hybrid', rating: 5, lastContact: new Date(Date.now() - 8 * 86400000), appliedAt: new Date(Date.now() - 10 * 86400000), skills: ['React', 'WebGL', 'TypeScript'] },
    { company: 'Linear', role: 'Product Engineer', stage: 'Final Round', salary: { min: 160000, max: 190000 }, location: 'Remote', remote: 'remote', rating: 5, lastContact: new Date(Date.now() - 1 * 86400000), appliedAt: new Date(Date.now() - 21 * 86400000), skills: ['React', 'Node.js', 'TypeScript'] },
    { company: 'Vercel', role: 'Developer Experience Engineer', stage: 'Offer', salary: { min: 175000, max: 210000 }, location: 'Remote', remote: 'remote', rating: 4, lastContact: new Date(), appliedAt: new Date(Date.now() - 30 * 86400000), skills: ['Next.js', 'AWS', 'DevOps'] },
    { company: 'Notion', role: 'Senior React Developer', stage: 'Applied', salary: { min: 150000, max: 185000 }, location: 'San Francisco, CA', remote: 'hybrid', rating: 4, lastContact: new Date(Date.now() - 12 * 86400000), appliedAt: new Date(Date.now() - 12 * 86400000), skills: ['React', 'Electron', 'TypeScript'] },
    { company: 'Loom', role: 'Full-Stack Engineer', stage: 'Saved', salary: { min: 155000, max: 195000 }, location: 'San Francisco, CA', remote: 'remote', rating: 3, skills: ['React', 'Python', 'AWS'] },
    { company: 'Retool', role: 'Frontend Lead', stage: 'Screening', salary: { min: 170000, max: 210000 }, location: 'San Francisco, CA', remote: 'hybrid', rating: 4, lastContact: new Date(Date.now() - 15 * 86400000), appliedAt: new Date(Date.now() - 16 * 86400000), skills: ['React', 'SQL', 'TypeScript'] },
    { company: 'Planetscale', role: 'Developer Advocate', stage: 'Closed', salary: { min: 140000, max: 170000 }, location: 'Remote', remote: 'remote', rating: 3, status: 'rejected', lastContact: new Date(Date.now() - 20 * 86400000), appliedAt: new Date(Date.now() - 35 * 86400000), skills: ['SQL', 'Node.js', 'Writing'] },
    { company: 'Supabase', role: 'Software Engineer', stage: 'Applied', salary: { min: 145000, max: 175000 }, location: 'Remote', remote: 'remote', rating: 4, lastContact: new Date(Date.now() - 9 * 86400000), appliedAt: new Date(Date.now() - 9 * 86400000), skills: ['PostgreSQL', 'Elixir', 'React'] },
    { company: 'Railway', role: 'Fullstack Engineer', stage: 'Saved', salary: { min: 130000, max: 165000 }, location: 'Remote', remote: 'remote', rating: 3, skills: ['Go', 'React', 'Docker'] },
];

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🌱 Connected, seeding...');

    // Remove old demo data
    const existingUser = await User.findOne({ email: 'demo@jobtrack.pro' });
    if (existingUser) {
        await Application.deleteMany({ userId: existingUser._id });
        await User.deleteOne({ _id: existingUser._id });
    }

    const user = await User.create({
        name: 'Alex Johnson',
        email: 'demo@jobtrack.pro',
        password: 'demo123456',
        profile: {
            title: 'Senior Software Engineer',
            location: 'San Francisco, CA',
            targetRole: 'Engineering Manager',
            targetSalary: 220000,
            skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Python'],
        },
        streaks: { daysApplied: 12, interviewsBooked: 5, offersReceived: 1 },
    });

    for (const data of companies) {
        await Application.create({ ...data, userId: user._id });
    }

    // Seed mood log
    for (let i = 10; i >= 0; i--) {
        const score = Math.floor(Math.random() * 3) + 3;
        user.moodLog.push({ date: new Date(Date.now() - i * 2 * 86400000), score, note: '' });
    }
    await user.save();

    console.log('✅ Seed complete! Demo user: demo@jobtrack.pro / demo123456');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
