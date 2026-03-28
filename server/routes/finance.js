const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, getDataPath } = require('../utils/db');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get all expenses
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await readJSON(getDataPath('expenses.json')) || [];
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Add new expense
router.post('/expenses', async (req, res) => {
  try {
    const { name, amount, category, date } = req.body;
    const expenses = await readJSON(getDataPath('expenses.json')) || [];
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const newExpense = {
        id: generateId(),
        name,
        amount: parseInt(amount),
        category,
        date: date || wibTime.toISOString().split('T')[0],
        timestamp: now.toISOString()
    };
    expenses.push(newExpense);
    await writeJSON(getDataPath('expenses.json'), expenses);
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete expense
router.delete('/expenses/:id', async (req, res) => {
    try {
      const expenses = await readJSON(getDataPath('expenses.json')) || [];
      const filtered = expenses.filter(e => e.id !== req.params.id);
      await writeJSON(getDataPath('expenses.json'), filtered);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
});

// Get finance summary
router.get('/summary', async (req, res) => {
    try {
        const { date, month } = req.query; // format 'YYYY-MM' or 'YYYY-MM-DD'
        const transactions = await readJSON(getDataPath('transactions.json')) || [];
        const expenses = await readJSON(getDataPath('expenses.json')) || [];
        const attendance = await readJSON(getDataPath('attendance.json')) || [];

        // Filter valid data
        let filteredTrans = transactions;
        let filteredExp = expenses;
        let filteredAtt = attendance;
        
        if (date) {
            filteredTrans = transactions.filter(t => t.timestamp.split('T')[0] === date);
            filteredExp = expenses.filter(e => e.date === date);
            filteredAtt = attendance.filter(a => a.date === date);
        } else if (month) {
            filteredTrans = transactions.filter(t => t.timestamp.startsWith(month));
            filteredExp = expenses.filter(e => e.date.startsWith(month));
            filteredAtt = attendance.filter(a => a.date.startsWith(month));
        }

        const totalIncome = filteredTrans.reduce((sum, t) => sum + t.total, 0);
        const totalExpense = filteredExp.reduce((sum, e) => sum + e.amount, 0);

        // Fetch settings for dynamic salary and names
        const settings = await readJSON(getDataPath('settings.json')) || {};
        const staff1Name = settings.staff1Name || 'Karyawan 1';
        const staff2Name = settings.staff2Name || 'Karyawan 2';
        const baseSalary = settings.baseSalary ? parseInt(settings.baseSalary) : 1000000;

        // Calculate Salary Base from settings.
        // Pro-rata based on attendance: Max 30 days. Example: count / 30 * baseSalary
        const staff1Attendance = filteredAtt.filter(a => a.employeeId === 'staff1' || a.employeeId === 'Karyawan 1').length;
        const staff2Attendance = filteredAtt.filter(a => a.employeeId === 'staff2' || a.employeeId === 'Karyawan 2').length;
        
        let totalSalary = 0;
        if (month) { // Only calculate realistically for monthly
           totalSalary = (staff1Attendance / 30 * baseSalary) + (staff2Attendance / 30 * baseSalary);
        } else if (date) { // Daily estimation
           totalSalary = (staff1Attendance * (baseSalary/30)) + (staff2Attendance * (baseSalary/30));
        } else { // overall
           totalSalary = (staff1Attendance * (baseSalary/30)) + (staff2Attendance * (baseSalary/30));
        }

        const profit = totalIncome - totalExpense - totalSalary;

        res.json({
            totalIncome,
            totalExpense,
            totalSalary: Math.round(totalSalary),
            profit: Math.round(profit),
            staff1Attendance,
            staff2Attendance,
            staff1Name,
            staff2Name,
            baseSalary,
            attendanceList: filteredAtt
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
