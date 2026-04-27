const templates = {
    teacher: [
        {
            question: "How was the teaching?",
            type: "select",
            options: ["Excellent", "Good", "Average"]
        },
        {
            question: "Rate the course (1-5)",
            type: "number"
        }
    ],
    event: [
        {
            question: "How was the event?",
            type: "radio",
            options: ["Awesome", "Good", "Okay"]
        },
        {
            question: "Would you attend again?",
            type: "radio",
            options: ["Yes", "No"]
        }
    ]
};

let currentTemplate = "teacher";

let responses = {};
let ratings = [];
let history = [];

let barChart, pieChart;

const API_BASE = 'http://localhost:5000';

// 🌙 APPLY SAVED THEME
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

// LOAD QUESTIONS
function loadQuestions(template) {
    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    templates[template].forEach((q, index) => {
        let html = `<label>${q.question}</label>`;

        if (q.type === "select") {
            html += `<select id="q${index}">`;
            q.options.forEach(opt => html += `<option>${opt}</option>`);
            html += `</select>`;
        }

        else if (q.type === "radio") {
            q.options.forEach(opt => {
                html += `<div>
                    <input type="radio" name="q${index}" value="${opt}" required> ${opt}
                </div>`;
            });
        }

        else if (q.type === "number") {
            html += `<input type="number" id="q${index}" min="1" max="5" required>`;
        }

        container.innerHTML += html + "<br>";
    });
}

// FETCH DATA FROM BACKEND
async function fetchData() {
    try {
        const res = await fetch(`${API_BASE}/responses`);
        const data = await res.json();

        responses = {};
        ratings = [];
        history = [];

        data.forEach(item => {
            history.push(item.entry);
            item.entry.forEach((ans, idx) => {
                if (!responses[ans]) responses[ans] = 0;
                responses[ans]++;
                // Assuming rating is the second question for teacher
                if (currentTemplate === 'teacher' && idx === 1 && !isNaN(ans)) {
                    ratings.push(parseInt(ans));
                }
            });
        });

        updateCharts();
        updateAnalytics();
        updateHistory();
    } catch (err) {
        console.error('Failed to fetch data:', err);
    }
}

// SUBMIT DATA TO BACKEND
async function submitData(entry) {
    try {
        await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry })
        });
        fetchData(); // Refresh data
    } catch (err) {
        console.error('Failed to submit:', err);
    }
}

// TEMPLATE CHANGE
document.getElementById("templateSelect").addEventListener("change", function () {
    currentTemplate = this.value;
    loadQuestions(currentTemplate);
    fetchData(); // Refresh data for new template
});

// SUBMIT FORM
document.getElementById("surveyForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let entry = [];

    templates[currentTemplate].forEach((q, index) => {
        let answer;

        if (q.type === "radio") {
            answer = document.querySelector(`input[name="q${index}"]:checked`).value;
        } else {
            answer = document.getElementById(`q${index}`).value;
        }

        entry.push(answer);
    });

    submitData(entry);
});

// CHARTS
function updateCharts() {
    let labels = Object.keys(responses);
    let data = Object.values(responses);

    let isDark = document.body.classList.contains("dark");

    let textColor = isDark ? "white" : "black";

    let barCtx = document.getElementById("barChart").getContext("2d");
    let pieCtx = document.getElementById("pieChart").getContext("2d");

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();

    barChart = new Chart(barCtx, {
        type: "bar",
        data: {
            labels,
            datasets: [{ label: "Responses", data }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColor }
                },
                y: {
                    ticks: { color: textColor }
                }
            }
        }
    });

    pieChart = new Chart(pieCtx, {
        type: "pie",
        data: {
            labels,
            datasets: [{ data }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        }
    });
}

// ANALYTICS
function updateAnalytics() {
    let total = ratings.length;

    let avg = total
        ? (ratings.reduce((a, b) => a + b, 0) / total).toFixed(2)
        : 0;

    let top = Object.keys(responses).length
        ? Object.keys(responses).reduce((a, b) =>
            responses[a] > responses[b] ? a : b
        )
        : "-";

    document.getElementById("total").innerText = total;
    document.getElementById("average").innerText = avg;
    document.getElementById("top").innerText = top;
}

// HISTORY TABLE
function updateHistory() {
    let tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";

    history.forEach(row => {
        let tr = "<tr><td>" + row.join(" | ") + "</td></tr>";
        tbody.innerHTML += tr;
    });
}

// RESET DATA
async function resetData() {
    try {
        await fetch(`${API_BASE}/reset`, { method: 'DELETE' });
        fetchData();
    } catch (err) {
        console.error('Failed to reset:', err);
    }
}

// EXPORT CSV
async function exportCSV() {
    await fetchData();
    let csv = "Responses\n";

    history.forEach(row => {
        csv += row.join(",") + "\n";
    });

    let blob = new Blob([csv], { type: "text/csv" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "survey.csv";
    a.click();
}

// DARK MODE TOGGLE
function toggleDarkMode() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );

    updateCharts(); // refresh chart colors
}

// INITIAL LOAD
loadQuestions(currentTemplate);
fetchData();