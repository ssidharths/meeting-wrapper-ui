let webinars = [];

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const API_BASE = "http://3.109.212.49";

uploadArea.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
});
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    uploadFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    uploadFile(e.target.files[0]);
  }
});

function uploadFile(file) {
  if (!file.name.match(/\.(xlsx|xls)$/)) {
    return showNotification("Please select a valid Excel file", "error");
  }

  showProgress(0);
  const progressBar = document.getElementById("progressBar");
  progressBar.classList.remove("hidden");

  const formData = new FormData();
  formData.append("excel", file);

  fetch(`${API_BASE}/api/v1/upload`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      webinars = data.webinars || [];
      showProgress(100);
      setTimeout(() => progressBar.classList.add("hidden"), 400);
      updateUI();
      showNotification(data.message || "Uploaded!", "success");
    })
    .catch((err) => {
      console.error(err);
      progressBar.classList.add("hidden");
      showNotification("Upload failed", "error");
    });
}

function updateUI() {
  updateStatistics();
  updateWebinarsTable();
  document.getElementById("statsSection").classList.remove("hidden");
  document.getElementById("controlsSection").classList.remove("hidden");
  document.getElementById("webinarsSection").classList.remove("hidden");
}

function updateStatistics() {
  document.getElementById("totalWebinars").textContent = webinars.length;
  document.getElementById("scheduledWebinars").textContent = webinars.filter(
    (w) => w.status === "scheduled"
  ).length;
  document.getElementById("totalAttendees").textContent = webinars.reduce(
    (sum, w) => sum + w.attendees.length,
    0
  );
  document.getElementById("upcomingWebinars").textContent = webinars.filter(
    (w) => new Date(w.date) > new Date()
  ).length;
}

function scheduleWebinar(id) {
  fetch(`${API_BASE}/api/v1/schedule/${id}/`, { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      webinars = data.webinars;
      updateUI();
      showNotification("Webinar scheduled successfully", "success");
    })
    .catch((err) => {
      console.error(err);
      showNotification("Failed to schedule webinar", "error");
    });
}

document.getElementById("scheduleAllBtn").addEventListener("click", () => {
  fetch(`${API_BASE}/api/v1/schedule`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      webinars = data.webinars;
      updateUI();
      showNotification("All webinars scheduled successfully", "success");
    })
    .catch((err) => {
      console.error(err);
      showNotification("Failed to schedule all webinars", "error");
    });
});

document.getElementById("sendEmailsBtn").addEventListener("click", () => {
  fetch(`${API_BASE}/api/v1/reminder/email`, { method: "POST" })
    .then((res) => res.json())
    .then((data) => showNotification(`📧 ${data.sent} emails sent`, "success"))
    .catch(() => showNotification("❌ Failed to send emails", "error"));
});

document.getElementById("sendWhatsAppBtn").addEventListener("click", () => {
  fetch(`${API_BASE}/api/v1/reminder/whatsapp`, { method: "POST" })
    .then((res) => res.json())
    .then((data) =>
      showNotification(`📱 ${data.sent} WhatsApp messages sent`, "success")
    )
    .catch(() => showNotification("❌ WhatsApp reminder failed", "error"));
});

function updateWebinarsTable() {
  const tbody = document.getElementById("webinarsTableBody");
  tbody.innerHTML = "";
  webinars.forEach((webinar) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${webinar.webinar_id}</td>
      <td>${webinar.name}</td>
      <td>${webinar.date} ${webinar.time}</td>
      <td>${webinar.presenter_name}<br><small>${
      webinar.presenter_email
    }</small></td>
      <td>${webinar.attendees.length}</td>
      <td><span class="status ${webinar.status || "pending"}">${(
      webinar.status || "pending"
    ).toUpperCase()}</span></td>
      <td>
        <div class="link-container">
${
    webinar.attendees.length
    ? `<button class="link-btn" onclick="showAttendeeLinks('${webinar.webinar_id}')">👥 Attendee</button>`
    : ""
}
          ${
            webinar.presenter_link
              ? `<a href="${webinar.presenter_link}" class="link-btn" target="_blank">👨‍💼 Presenter</a>`
              : ""
          }
        </div>
      </td>
<td>
  ${
    webinar.status !== "scheduled"
      ? `<button class="btn btn-success" style="font-size: 0.8em; padding: 5px 10px;" onclick="scheduleWebinar('${webinar.webinar_id}')">📅 Schedule</button>`
      : ""
  }
  <button class="btn" style="font-size: 0.8em; padding: 5px 10px;" onclick="viewWebinarDetails('${
    webinar.webinar_id
  }')">View</button>
  ${
  webinar.status === "scheduled"
    ? `<button class="btn btn-secondary" style="font-size: 0.8em; padding: 5px 10px;" onclick="downloadReport('${webinar.webinar_id}')">📥 Download Report</button>`
    : ""
}
</td>
    `;
    tbody.appendChild(row);
  });
}

function showProgress(percent) {
  document.getElementById("progressFill").style.width = percent + "%";
}

function showNotification(message, type) {
  const el = document.getElementById("notification");
  el.textContent = message;
  el.className = `notification ${type} show`;
  setTimeout(() => el.classList.remove("show"), 3000);
}

function viewWebinarDetails(id) {
  const webinar = webinars.find((w) => w.webinar_id === id);
  if (!webinar) return;
  const list = webinar.attendees
    .map((a) => `<li>${a.name} (${a.email})</li>`)
    .join("");
  document.getElementById("webinarDetails").innerHTML = `
    <h4>${webinar.name}</h4>
    <p><strong>Date:</strong> ${webinar.date}</p>
    <p><strong>Presenter:</strong> ${webinar.presenter_name} (${webinar.presenter_email})</p>
    <p><strong>Attendees:</strong></p>
    <ul>${list}</ul>
  `;
  document.getElementById("webinarModal").style.display = "block";
}

function closeModal() {
  document.getElementById("webinarModal").style.display = "none";
}

function downloadReport(webinarId) {
    window.open(`${API_BASE}/api/v1/attendance/${webinarId}`, '_blank');
  }
  

window.onclick = (e) => {
  if (e.target === document.getElementById("webinarModal")) closeModal();
};

function showAttendeeLinks(webinarId) {
    const webinar = webinars.find(w => w.webinar_id === webinarId);
    if (!webinar) return;
  
    const list = webinar.attendees.map(a => {
      const joinUrl = `${API_BASE}/api/v1/join/${webinarId}/${encodeURIComponent(a.email)}`;
      return `<li><strong>${a.name}</strong> – <a href="${joinUrl}" target="_blank">${joinUrl}</a></li>`;
    }).join("");
  
    document.getElementById("attendeeLinksList").innerHTML = list;
    document.getElementById("attendeeLinksModal").style.display = "block";
  }
  
  function closeAttendeeLinksModal() {
    document.getElementById("attendeeLinksModal").style.display = "none";
  }
  