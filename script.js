//  fetch and parse CSV data
async function fetchCSV() {
    const response = await fetch('salaries.csv');
    const data = await response.text();
    return parseCSV(data);
}

//  parse CSV data
function parseCSV(data) {
    // Remove header
    const rows = data.split('\n').slice(1); 
    const records = rows.map(row => {
        const [work_year, , , job_title, , , salary_in_usd] = row.split(',');
        return { year: parseInt(work_year), jobTitle: job_title, salaryInUSD: parseFloat(salary_in_usd) };
    });
    
    return records;
}

// calculate summary data
function calculateSummary(records) {
    const filteredRecords = records.filter(record => record.jobTitle === 'ML Engineer');
    const result = {};

    filteredRecords.forEach(record => {
        if (!result[record.year]) {
            result[record.year] = { totalJobs: 0, totalSalary: 0 };
        }
        result[record.year].totalJobs += 1;
        result[record.year].totalSalary += record.salaryInUSD;
    });

    return Object.keys(result).map(year => ({
        year: parseInt(year),
        totalJobs: result[year].totalJobs,
        avgSalary: result[year].totalSalary / result[year].totalJobs
    }));
}

// populate the main table with data
function populateTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${row.totalJobs}</td>
            <td>${row.avgSalary.toFixed(2)}</td>
        `;
        tr.addEventListener('click', () => displayJobTitles(row.year));
        tableBody.appendChild(tr);
    });
}

// display job titles in the secondary table
function displayJobTitles(year) {
    const jobTitlesBody = document.getElementById('jobTitlesBody');
    jobTitlesBody.innerHTML = '';
    const yearRecords = records.filter(record => record.year === year);
    const jobTitleCounts = yearRecords.reduce((acc, record) => {
        if (!acc[record.jobTitle]) {
            acc[record.jobTitle] = 0;
        }
        acc[record.jobTitle] += 1;
        return acc;
    }, {});

    Object.keys(jobTitleCounts).forEach(jobTitle => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${jobTitle}</td>
            <td>${jobTitleCounts[jobTitle]}</td>
        `;
        jobTitlesBody.appendChild(tr);
    });
}

//  sort the table
function sortTable(columnIndex) {
    const table = document.getElementById('mainTable');
    const rowsArray = Array.from(table.rows).slice(1);
    const isAscending = table.rows[0].cells[columnIndex].getAttribute('data-order') === 'asc';
    const newOrder = isAscending ? 'desc' : 'asc';

    rowsArray.sort((a, b) => {
        const cellA = a.cells[columnIndex].innerText;
        const cellB = b.cells[columnIndex].innerText;
        //  Year and Total Jobs columns
        if (columnIndex === 0 || columnIndex === 1) { 
            return isAscending ? cellA - cellB : cellB - cellA;
        } 
        // Average Salary column
        else { 
            return isAscending ? parseFloat(cellA) - parseFloat(cellB) : parseFloat(cellB) - parseFloat(cellA);
        }
    });

    rowsArray.forEach(row => table.tBodies[0].appendChild(row));
    table.rows[0].cells[columnIndex].setAttribute('data-order', newOrder);
}

//  draw the line chart
function drawChart(data) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    const chartData = {
        labels: data.map(item => item.year),
        datasets: [{
            label: 'Total Jobs',
            data: data.map(item => item.totalJobs),
            borderColor: 'blue',
            fill: false
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize the table and chart with data from CSV
let records = [];
document.addEventListener('DOMContentLoaded', async () => {
    records = await fetchCSV();
    const summaryData = calculateSummary(records);
    populateTable(summaryData);
    drawChart(summaryData);
});
