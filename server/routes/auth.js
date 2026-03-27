const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, getDataPath } = require('../utils/db');

// Two staff members with unique PINs
const STAFF1_PIN = process.env.STAFF1_PIN || '1111';
const STAFF2_PIN = process.env.STAFF2_PIN || '2222';
const OWNER_PIN = process.env.OWNER_PIN || '463880';

router.post('/login', async (req, res) => {
    const { pin } = req.body;

    let settings = {};
    try { settings = await readJSON(getDataPath('settings.json')); } catch (e) { settings = {}; }

    // Dynamic PIN loading
    const s1Pin = settings.staff1Pin || process.env.STAFF1_PIN || '1111';
    const s2Pin = settings.staff2Pin || process.env.STAFF2_PIN || '2222';
    const oPin  = settings.ownerPin || process.env.OWNER_PIN || '463880';

    let role = null;
    let employeeId = null;

    if (pin === s1Pin) {
        role = 'staff';
        employeeId = 'Karyawan 1';
    } else if (pin === s2Pin) {
        role = 'staff';
        employeeId = 'Karyawan 2';
    } else if (pin === oPin) {
        role = 'owner';
        employeeId = 'Owner';
    }

    if (!role) {
        return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }

    if (role === 'staff') {
        try {
            let attendance = [];
            try { attendance = await readJSON(getDataPath('attendance.json')); } catch (e) { attendance = []; }
            
            // Map pin to stable staffId and dynamic name
            let staffId = '';
            let staffName = '';
            if (pin === s1Pin) {
                staffId = 'staff1';
                staffName = settings.staff1Name || 'Karyawan 1';
            } else if (pin === s2Pin) {
                staffId = 'staff2';
                staffName = settings.staff2Name || 'Karyawan 2';
            }

            const now = new Date();
            // Always calculate WIB date regardless of server timezone
            const wibOffset = 7 * 60 * 60 * 1000;
            const wibTime = new Date(now.getTime() + wibOffset);
            const today = wibTime.toISOString().split('T')[0]; // 'YYYY-MM-DD' in WIB
            
            // Backward compatibility logic: check generic name OR stable id
            const alreadyLogged = attendance.find(a => 
                (a.employeeId === staffId || a.employeeId === employeeId) && a.date === today
            );
            
            if (!alreadyLogged) {
                // Store loginTime as WIB ISO string so display is human-readable
                const wibIsoString = wibTime.toISOString().replace('Z', '+07:00');
                attendance.push({
                    employeeId: staffId, // Use stable ID
                    employeeName: staffName, // Store dynamic name for logging
                    date: today,
                    loginTime: wibIsoString // Store as WIB time
                });
                await writeJSON(getDataPath('attendance.json'), attendance);
                console.log(`[AUTH] ${staffName} (${staffId}) logged in. Attendance recorded.`);
            }
            
            // Override legacy employeeId response with dynamic name for frontend UI
            employeeId = staffName; 
        } catch (error) {
            console.error('Failed to log attendance:', error);
        }
    }

    return res.json({ success: true, role, employeeId });
});

module.exports = router;
