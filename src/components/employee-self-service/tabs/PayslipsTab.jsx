import React from 'react';
import { format } from 'date-fns';
import { DollarSign, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PayslipsTab({ payrolls, isDownloading, onDownload }) {
	return (
		<Card className="overflow-hidden rounded-2xl border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-md">
			<CardHeader className="border-b border-slate-200">
				<CardTitle>My Payslips</CardTitle>
			</CardHeader>
			<CardContent className="p-6">
				{payrolls.length === 0 ? (
					<div className="py-12 text-center">
						<DollarSign className="mx-auto mb-4 h-16 w-16 text-slate-300" />
						<p className="text-slate-500">No payslips available</p>
					</div>
				) : (
					<div className="space-y-3">
						{payrolls.map((payroll) => (
							<div key={payroll.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
								<div>
									<p className="font-semibold text-slate-900">
										{format(new Date(`${payroll.month}-01`), 'MMMM yyyy')}
									</p>
									<p className="text-sm text-slate-600">
										Net Salary: {payroll.net_salary.toLocaleString()} SAR
									</p>
								</div>
								<div className="flex gap-2">
									<Badge
										className={
											payroll.status === 'paid'
												? 'bg-green-100 text-green-700'
												: payroll.status === 'approved'
													? 'bg-blue-100 text-blue-700'
													: 'bg-yellow-100 text-yellow-700'
										}
									>
										{payroll.status}
									</Badge>
									<Button
										size="sm"
										variant="outline"
										disabled={isDownloading}
										onClick={() => onDownload(payroll)}
										aria-label={`Download payslip for ${payroll.month}`}
									>
										<Download className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}