import { TutorProfile, User, Subject } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";

async function getUserIdsByName(regex) {
    const users = await User.find({ name: regex }).distinct("_id");
    return users.length > 0 ? { $in: users } : null;
}

async function getUserIdsByEmail(regex) {
    const users = await User.find({ email: regex }).distinct("_id");
    return users.length > 0 ? { $in: users } : null;
}

export const addTutor = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const userRecord = await User.findOne({
            email
        })

        if(!userRecord) {
            return res.status(404).json(new ApiResponse(
                false,
                null,
                "User not registered."
            ));
        }

        await TutorProfile.create({
            user: userRecord._id,
        });

        const user = await User.findByIdAndUpdate(userRecord._id, { $set: { role: "TUTOR" } });

        await mailSender(user.email, "Congratulations! You are now a tutor", `
            <p>Dear ${user.name},</p>
            <p>Congratulations! You have been successfully added as a tutor.</p>
            <p>We are excited to have you on board.</p>
        `);

        return res.status(201).json(
            new ApiResponse(true, null, "Tutor added successfully")
        );
    } catch (error) {
        console.log("Error adding tutor:", error.message);

        return res.status(500).json(new ApiResponse(false, null, "Error adding tutor", error.message));
    }
});

export const getTutors = asyncHandler(async (req, res) => {
    const { cursor, direction = "forward", limit = 10, search } = req.query;
    let query = {};
    let sort = { _id: 1 }; // default ascending (forward)

    // 🔹 Handle search
    if (search) {
        const regex = new RegExp(search, "i"); // partial + case-insensitive

        // 1️⃣ Find subject IDs that match search
        const subjectIds = await Subject.find({
            $or: [
                { name: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } }
            ]
        }).distinct("_id");

        // 2️⃣ Build OR conditions
        query.$or = [
            { user: await getUserIdsByName(regex) }, // tutor's name
            { user: await getUserIdsByEmail(regex) }, // tutor's email
            { subjects: { $in: subjectIds } }, // subjects linked
            { title: regex },             // tutor's title
            { skills: regex },            // tutor's skills
            { languages: regex },         // tutor's languages
        ];
    }

    // 🔹 Pagination handling
    if (cursor) {
        if (direction === "forward") {
            query._id = { ...query._id, $gt: new mongoose.Types.ObjectId(cursor) };
            sort = { _id: 1 };
        } else if (direction === "backward") {
            query._id = { ...query._id, $lt: new mongoose.Types.ObjectId(cursor) };
            sort = { _id: -1 };
        }
    }

    try {
        let tutors = await TutorProfile.find(query)
            .populate("user", "name email")
            .populate("subjects", "name") // include subject names
            .sort(sort)
            .limit(Number(limit));

        if (direction === "backward") {
            tutors = tutors.reverse();
        }

        const nextCursor = tutors.length > 0 ? tutors[tutors.length - 1]._id : null;
        const prevCursor = tutors.length > 0 ? tutors[0]._id : null;

        return res.status(200).json(new ApiResponse(
            true,
            { tutors, prevCursor, nextCursor },
            "Tutors retrieved successfully"
        ));
    } catch (error) {
        console.error("Error retrieving tutors:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});

export const getTutor = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
        const tutor = await TutorProfile.findOne({ user: userId }).populate("user", "name email").populate("subjects");

        if (!tutor) {
            return res.status(404).json(new ApiResponse(
                false, 
                null, 
                "Tutor not found"
            ));
        }

        return res.status(200).json(new ApiResponse(
            true, 
            tutor, 
            "Tutor retrieved successfully"
        ));
    } catch (error) {
        console.error("Error retrieving tutor:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});

export const removeTutor = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
        const tutor = await TutorProfile.findOneAndDelete({ user: userId });

        if (!tutor) {
            return res.status(404).json(new ApiResponse(false, null, "Tutor not found"));
        }

        const user = await User.findByIdAndUpdate(userId, { $set: { role: "USER" } });

        await mailSender(user.email, "You have been removed as a tutor", `
            <p>Dear ${user.name},</p>
            <p>You have been removed as a tutor.</p>
        `);

        return res.status(200).json(new ApiResponse(true, null, "Tutor removed successfully"));
    } catch (error) {
        console.error("Error removing tutor:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});

export const addSubject = asyncHandler(async (req, res) => {
    const { name, category } = req.body;

    try {
        await Subject.create({ name, category });
        return res.status(201).json(
            new ApiResponse(201, null, "Subject added successfully")
        );
    } catch (error) {
        console.error("Error adding subject:", error.message);
        return res.status(500).json(
            new ApiResponse(500, null, "Internal Server Error")
        );
    }
});

export const removeSubject = asyncHandler(async (req, res) => {
    const { subjectId } = req.params;

    try {
        const subject = await Subject.findByIdAndDelete(subjectId);

        if (!subject) {
            return res.status(404).json(new ApiResponse(false, null, "Subject not found"));
        }

        return res.status(200).json(new ApiResponse(true, null, "Subject removed successfully"));
    } catch (error) {
        console.error("Error removing subject:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});
