import TransactionModel from "../models/transactionModel.js";

//fetch transaction history
const fetchTransactionHistory = async (req, res) => {
    try {
        const transactionHistory = await TransactionModel.find()
            .populate('sender', 'firstname lastname accountNumber')
            .populate('receiver', 'firstname lastname accountNumber');
        if (!transactionHistory) {
            return res.status(404).json({ message: 'No transaction history found.' })
        }
        if (transactionHistory) {
        }
        res.status(200).json(transactionHistory);
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}


const fetchUserTransactionHistory = async (req, res) => {
    const {id} = req.query;
    try {
        const transactionHistory = await TransactionModel.find({$or: [{sender: id}, {receiver: id}]})
            .populate('sender', 'firstname lastname accountNumber')
            .populate('receiver', 'firstname lastname accountNumber');
        if (!transactionHistory) {
            return res.status(404).json({ message: 'No transaction history found.' })
        }
        res.status(200).json(transactionHistory);
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

export { fetchTransactionHistory, fetchUserTransactionHistory };