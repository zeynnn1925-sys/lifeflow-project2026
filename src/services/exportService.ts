/**
 * Utility to convert an array of objects into a CSV string and trigger a download.
 */
export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  if (!data || !data.length) return;

  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header.toLowerCase()] || row[header] || '';
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTransactions = (transactions: any[]) => {
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Notes'];
  const data = transactions.map(tx => ({
    Date: tx.date,
    Description: tx.description,
    Amount: tx.amount,
    Type: tx.type,
    Category: tx.category,
    Notes: tx.notes || ''
  }));
  exportToCSV(data, `lifeflow_transactions_${new Date().toISOString().split('T')[0]}`, headers);
};

export const exportTasks = (tasks: any[]) => {
  const headers = ['Date', 'Title', 'StartTime', 'EndTime', 'Completed'];
  const data = tasks.map(task => ({
    Date: task.date,
    Title: task.title,
    StartTime: task.startTime,
    EndTime: task.endTime,
    Completed: task.completed ? 'Yes' : 'No'
  }));
  exportToCSV(data, `lifeflow_tasks_${new Date().toISOString().split('T')[0]}`, headers);
};
