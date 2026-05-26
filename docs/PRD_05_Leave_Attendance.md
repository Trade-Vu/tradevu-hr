# PRD 05 — Leave & Attendance

## Leave Types

### Define Leave Types
For each leave type, set:
- Name (e.g., "Annual Leave," "Sick Leave," "Maternity Leave")
- How many days per year
- Whether it's paid or unpaid
- Whether it requires approval
- Whether it can be carried forward to next year
- Maximum days that can be carried forward
- How many days notice required (editable)
- If they require handover note
- Selection of Relief Officer for each one
- If they require proof before applying (e.g., sick certificate)

### Leave Types
- Annual Leave (vacation)
- Sick Leave
- Maternity Leave
- Paternity Leave
- Compassionate Leave (bereavement)
- Unpaid Leave
- Study Leave
- Public Holidays

### Accrual Rules
- All at once (e.g., 20 days on Jan 1)
- Monthly accrual (e.g., 1.67 days per month)
- After probation
- Proration for new joiners

## Leave Requests

### Employee Requests Leave
1. Employee opens leave request form
2. Selects leave type
3. Chooses dates (from - to)
4. System calculates number of days automatically (excluding weekends/holidays)
5. Shows current leave balance
6. Warns if insufficient balance
7. Adds reason/comments
8. Can attach documents (like medical certificate)
9. Submits request

### Approval Workflow
1. Request goes to employee's manager
2. Manager reviews: balance, team calendar, work impact
3. Manager can: Approve, Reject (with reason), Request more information

### Multi-level Approval
After Manager approves → goes to Admin/HR for final leg approval.

### Notifications
- Employee gets email when approved/rejected
- Calendar invite created when approved
- Reminder before leave starts

### Leave Calendar
- Visual calendar showing who's on leave when
- Helps managers plan workload
- Shows team availability

### Special Cases
- Half-day leave
- Multiple non-continuous days
- Emergency leave (retroactive requests)
- Cancel approved leave

## Leave Balances

### Balance Tracking
For each employee, for each leave type, track:
- Total entitled for the year
- Used (approved leaves)
- Pending (waiting for approval)
- Available (what's left)
- Carried forward from previous year

### Automatic Updates
- When leave approved → deduct from balance
- When leave rejected → return to balance
- When leave cancelled → return to balance
- At year-end → handle carry-forward automatically

### Reports
- Leave utilization by employee
- Leave utilization by department
- Employees with low leave usage
- Leave liability (financial impact of unused leave)

### Visibility
- Employees see their own balances in dashboard
- Managers see their team's balances
- HR sees everyone's balances

## Attendance Tracking

### Clock In/Out
- Employees can clock in when they arrive
- Clock out when they leave
- Record time stamps
- Optional: capture location (for remote workers)

### Attendance Records
- Daily attendance register
- Shows: Present, Absent, On Leave, Late, Half-day
- Integrates with leave system

### Late Arrivals & Early Departures
- Define standard work hours (e.g., 9 AM - 5 PM)
- System flags late arrivals
- System flags early departures
- Can set grace period (e.g., 15 minutes)

### Attendance Reports
- Individual attendance summary (monthly)
- Department attendance summary
- Late-coming report
- Absenteeism report

### Manual Adjustments
- HR can manually mark attendance if needed
- Can add notes/reasons for adjustments
- Keeps record of who made the adjustment
