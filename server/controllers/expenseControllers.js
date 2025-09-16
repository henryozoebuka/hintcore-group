import ExpenseModel from '../models/expenseModel.js';
import UserModel from '../models/userModel.js';
import GroupModel from '../models/groupModel.js';
import mongoose from "mongoose";

export const createExpense = async (req, res) => {
  const {
    title,
    description,
    amount,
    published = false,
  } = req.body;

  const { userId, currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  if (!title || !description || !amount) {
    return res.status(400).json({
      message: "Title, description, and amount are required.",
    });
  }

  try {
    const groupExists = await GroupModel.findById(currentGroupId);
    if (!groupExists) {
      return res.status(404).json({ message: "Group not found." });
    }

    const expenseData = {
      group: currentGroupId,
      title,
      description,
      createdBy: userId,
      published,
    };

    if (amount) expenseData.amount = Number(amount);

    const newExpense = new ExpenseModel(expenseData);

    await newExpense.save();

    return res.status(201).json({ message: `${expenseData.title[0].toUpperCase() + expenseData.title.slice(1)} created successfully.` });
  } catch (error) {
    console.error("Create Expense Error:", error);
    return res.status(500).json({
      message: "An error occurred while creating the expense.",
    });
  }
};

export const manageExpenses = async (req, res) => {
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const filter = { group: currentGroupId };

    // Count total expenses for pagination
    const totalExpenses = await ExpenseModel.countDocuments(filter);

    // Fetch paginated expenses
    const expenses = await ExpenseModel.find(filter)
      .select('title published createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalPages = Math.ceil(totalExpenses / limit);

    res.status(200).json({
      expenses,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const manageExpense = async (req, res) => {
  const { id } = req.params;
  const { currentGroupId } = req.user;

  if (!id) {
    return res.status(400).json({ message: "Expense ID is required." });
  }

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(currentGroupId)
  ) {
    return res.status(400).json({ message: "Invalid ID(s) format." });
  }

  try {
    const expense = await ExpenseModel.findOne({
      _id: id,
      group: currentGroupId,
    })
      .populate("createdBy", "fullName")
      .lean();

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    return res.status(200).json({ expense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching expense." });
  }
};

export const manageSearchExpenses = async (req, res) => {
  try {
    const { titleOrDescription, startDate, endDate, published, page = 1, limit = 10 } = req.query;
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID." });
    }

    const group = await GroupModel.findById(currentGroupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // 🟢 Build query
    let query = { group: currentGroupId };

    // Title or Content search
    if (titleOrDescription) {
      query.$or = [
        { title: { $regex: titleOrDescription.trim(), $options: "i" } },
        { description: { $regex: titleOrDescription.trim(), $options: "i" } },
      ];
    }

    // 🟢 Date Range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // end of the day
        query.createdAt.$lte = end;
      }
    }

    // 🟢 Published filter
    if (published !== undefined) {
      if (published === 'true' || published === 'false') {
        query.published = published === 'true';
      } else {
        return res.status(400).json({ message: "`published` must be 'true' or 'false'." });
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      ExpenseModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ExpenseModel.countDocuments(query),
    ]);

    return res.status(200).json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Search Expenses Error:", error);
    return res.status(500).json({ message: "An error occurred while searching expenses." });
  }
};

export const manageFetchEditExpense = async (req, res) => {
  const { id } = req.params;
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId) || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid expense or group ID." });
  }

  try {
    const expense = await ExpenseModel.findOne({ _id: id, group: currentGroupId }).select('title description amount published').lean();
    if (!expense) return res.status(404).json({ message: "Expense not found." });

    return res.status(200).json({ expense });
  } catch (error) {
    console.error("Fetch Edit Expense Error:", error);
    res.status(500).json({ message: "Server error while fetching expense." });
  }
};

export const manageUpdateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, published } = req.body;
    const { currentGroupId } = req.user;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(currentGroupId)
    ) {
      return res.status(400).json({ message: 'Invalid ID(s) format.' });
    }

    const expense = await ExpenseModel.findOneAndUpdate(
      { _id: id, group: currentGroupId },
      { title, description, amount, published },
      { new: true, runValidators: true } // Important!
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({
      message: `${expense.title[0].toUpperCase() + expense.title.slice(1)} updated successfully!`,
    });
  } catch (err) {
    console.error('Update Expense Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const manageSearchExpenseReports = async (req, res) => {
  try {
    const {
      titleOrDescription = "",
      startDate = "",
      endDate = "",
      published = "",
      createdBy = "",
      minAmount,
      maxAmount,
      exportCsv = false,
      page = 1,
      limit = 10,
    } = req.query;

    const exportCsvBool = String(exportCsv) === "true";
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID." });
    }

    const group = await GroupModel.findById(currentGroupId).lean();
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Base query
    const query = { group: currentGroupId };
    const andConditions = [];

    // Title or Description (partial, case-insensitive)
    if (titleOrDescription && titleOrDescription.trim() !== "") {
      const q = titleOrDescription.trim();
      andConditions.push({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      });
    }

    // CreatedAt range
    if ((startDate && startDate !== "") || (endDate && endDate !== "")) {
      const createdAt = {};
      if (startDate && startDate !== "") createdAt.$gte = new Date(startDate);
      if (endDate && endDate !== "") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.$lte = end;
      }
      andConditions.push({ createdAt });
    }

    // Published
    if (published !== "") {
      andConditions.push({ published: published === "true" });
    }

    // createdBy: treat as fullName string (partial, case-insensitive)
    if (createdBy && createdBy.trim() !== "") {
      const matchedUsers = await UserModel.find({
        fullName: { $regex: createdBy.trim(), $options: "i" },
      })
        .select("_id")
        .lean();

      if (!matchedUsers || matchedUsers.length === 0) {
        // No matching creators -> return empty result immediately
        return res.status(200).json({
          expenses: [],
          total: 0,
          totalPages: exportCsvBool ? 1 : 0,
          currentPage: exportCsvBool ? 1 : pageNum,
        });
      }

      const userIds = matchedUsers.map((u) => u._id);
      andConditions.push({ createdBy: { $in: userIds } });
    }
    // Amount Range Filter
    if (minAmount || maxAmount) {
      const amountFilter = {};
      if (minAmount !== undefined && minAmount !== "") {
        amountFilter.$gte = parseFloat(minAmount);
      }
      if (maxAmount !== undefined && maxAmount !== "") {
        amountFilter.$lte = parseFloat(maxAmount);
      }
      andConditions.push({ amount: amountFilter });
    }

    // Apply AND conditions
    if (andConditions.length > 0) query.$and = andConditions;

    // Build query + populate members and creator fullName
    const baseQuery = ExpenseModel.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName") // creator fullName

    // Pagination if not export
    let expenses;
    if (exportCsvBool) {
      expenses = await baseQuery.exec();
    } else {
      expenses = await baseQuery.skip((pageNum - 1) * limitNum).limit(limitNum).exec();
    }

    const total = exportCsvBool ? expenses.length : await ExpenseModel.countDocuments(query);

    // Build response with computed totals and correct createdBy fullName
    const expensesWithSummary = expenses.map((p) => {

      return {
        _id: p._id,
        title: p.title,
        description: p.description,
        published: p.published,
        createdBy: p.createdBy?.fullName || "",
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        amount: p.amount || 0,
      };
    });

    return res.status(200).json({
      expenses: expensesWithSummary,
      total,
      totalPages: exportCsvBool ? 1 : Math.ceil(total / limitNum),
      currentPage: exportCsvBool ? 1 : pageNum,
    });
  } catch (error) {
    console.error("Search expenses Error:", error);
    return res.status(500).json({ message: "An error occurred while searching expenses." });
  }
};

export const manageDeleteExpense = async (req, res) => {
  const { id } = req.params;
  const { currentGroupId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const group = await GroupModel.findById(currentGroupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    // 🔒 Ensure expense belongs to the same group
    if (expense.group.toString() !== currentGroupId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this expense." });
    }

    await expense.deleteOne();

    return res.status(200).json({ message: `${expense.title[0].toUpperCase() + expense.title.slice(1)} deleted successfully.` });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    return res.status(500).json({ message: "An error occurred while deleting the expense." });
  }
};

export const manageDeleteExpenses = async (req, res) => {
  try {
    const { ids } = req.body;
    const { currentGroupId } = req.user;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No expense IDs provided." });
    }

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID in token." });
    }

    // Validate each incoming id
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "One or more provided expense IDs are invalid.",
        invalidIds,
      });
    }

    // Ensure group exists
    const group = await GroupModel.findById(currentGroupId).select("_id");
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Convert to ObjectId instances
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    // Find expenses that match the requested ids AND belong to this group
    const expensesInGroup = await ExpenseModel.find({
      _id: { $in: objectIds },
      group: currentGroupId,
    }).select("_id");

    if (!expensesInGroup || expensesInGroup.length === 0) {
      return res.status(404).json({
        message: "No matching expenses found that belong to your group.",
      });
    }

    const toDeleteIds = expensesInGroup.map((p) => p._id);

    // Perform deletion (only for expenses in the user's group)
    const deleteResult = await ExpenseModel.deleteMany({ _id: { $in: toDeleteIds } });

    const deletedCount = deleteResult.deletedCount || 0;

    return res.status(200).json({
      message: `${deletedCount} expense${deletedCount > 1 ? 's' : ''} deleted successfully.`,
      deletedCount,
    });
  } catch (err) {
    console.error("Error deleting expenses:", err);
    return res.status(500).json({ message: "Server error. Failed to delete expenses." });
  }
};