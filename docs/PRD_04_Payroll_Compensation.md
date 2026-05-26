# PRD 04 — Payroll & Compensation

## Salary Information

### Record Salary Details
- Base salary
- Pay grade/level
- Currency
- Effective date of current salary

### Salary History
- Track all salary changes over time
- Record reason for change (promotion, annual increase, adjustment)
- Show who approved the change
- Keep audit trail

### Allowances
Types:
- Basic allowance
- Housing allowance
- Transport allowance
- Meal allowance
- Utility
- Entertainment
- 13th Month

Rules:
- Can be fixed amount or percentage of salary
- Can be taxable or non-taxable

### Benefits (Employee/Employer)
- Health insurance
- Pension/retirement plan
- NSITF
- ITF

## Running Payroll

### Payroll Setup
- Define payroll period (e.g., "January 2026: Jan 1-31, pay date: Jan 31")
- Select which employees to include
- Set cutoff date for changes

### Automatic Calculations

**Earnings:**
- Base salary (prorated if employee joined mid-month)
- All allowances
- Total Gross Pay

**Deductions:**
- Income tax (based on tax brackets)
- Employee Pension
- Loan repayments (from loan module)
- Total Deductions

**Final Calculation:**
- Net Pay = Gross Pay - Deductions

### Review & Approval
- HR reviews the payroll before processing
- Can make adjustments if needed
- Requires approval before finalizing
- Once approved, cannot be changed

### After Approval
- Generates payslips for all employees
- Can integrate with accounting software (future)
- Can integrate with bank for payment processing (future)

### Special Situations
- New joiners (prorate salary)
- Employees on unpaid leave (reduce salary proportionally)
- Employees who resigned mid-month (calculate final pay)
- Salary advances (deduct from current month)

### Payroll Reports
- Payroll summary (total cost)
- Department-wise payroll
- Payroll register (detailed breakdown)
- Tax deduction summary
- Bank transfer file

## Payslips

### Generate Payslips
Create professional-looking PDF payslip for each employee showing:
- Employee details
- Payroll period
- Earnings breakdown (salary + each allowance)
- Deductions breakdown (tax + each deduction)
- Year-to-date totals
- Net pay in words and figures

### Distribution
- Automatically email payslips to employees on pay day
- Employees can download from their portal
- Keep archive of all historical payslips

### Access Control
- Employees can only see their own payslips
- HR can see all payslips
- Managers cannot see team payslips (confidential)

### Customization
- Customize payslip template with company logo
- Add company message or notes
