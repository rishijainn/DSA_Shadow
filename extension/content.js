let lastUrl = location.href;
let lastSubmissionId = null;
let submissionInProgress = false;

// Track clicks on the Submit button
document.addEventListener("click", (e) => {
  const submitBtn = e.target.closest(
    '[data-e2e-locator="console-submit-button"]',
  );
  if (submitBtn) {
    submissionInProgress = true;
    console.log("🚀 DSA Shadow: Submission initiated");
  }
});

// === Session Sync Logic ===
if (location.hostname === "localhost") {
  const syncSession = () => {
    if (!chrome.runtime?.id) return;
    const sessionEl = document.getElementById("dsa-shadow-session");
    const userId = sessionEl?.getAttribute("data-user-id");
    if (userId) {
      chrome.storage.local.set({ dsa_user_id: userId }, () => {
        if (chrome.runtime.lastError) return;
        console.log("✅ DSA Shadow: Session synced");
      });
    }
  };
  syncSession();
  setInterval(syncSession, 5000);
}
// ===========================

// Robust Observer: Watches for DOM changes to catch "Accepted" modal regardless of URL
const observer = new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkForSubmission();
  } else {
    if (!window.submissionCheckTimeout) {
      window.submissionCheckTimeout = setTimeout(() => {
        checkForSubmission();
        window.submissionCheckTimeout = null;
      }, 1500);
    }
  }
});

if (document.body) {
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}

async function checkForSubmission() {
  // 1. Must be a result area that just appeared or updated
  const isSubmissionPage = location.href.includes("/submissions/");
  const hasIntent = submissionInProgress || isSubmissionPage;

  // 2. Stronger result detection
  const resultEl =
    document.querySelector('[data-e2e-locator="submission-result"]') ||
    document.querySelector(".text-success.text-title-medium"); // New UI specific

  if (!resultEl || !resultEl.textContent.includes("Accepted")) return;

  const problemIdMatch = location.href.match(/\/problems\/([^\/]+)/);
  const problemId = problemIdMatch ? problemIdMatch[1] : "unknown";

  const currentCheckId = problemId + "-" + resultEl.textContent.trim();

  // If we haven't see a submission intent yet AND we just loaded the page,
  // initialize lastSubmissionId to prevent immediate popup.
  if (lastSubmissionId === null && !submissionInProgress && !isSubmissionPage) {
    lastSubmissionId = currentCheckId;
    return;
  }

  if (lastSubmissionId === currentCheckId) return;

  // Only trigger if we had intent or the URL is a specific submission result
  if (!hasIntent) return;

  lastSubmissionId = currentCheckId;
  submissionInProgress = false; // Reset intent

  const titleize = (slug) => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const rawTitle =
    document.querySelector('[data-cy="question-title"]')?.textContent?.trim() ||
    document.querySelector(".text-title-large")?.textContent?.trim() ||
    document.querySelector("h4.text-label-1")?.textContent?.trim() ||
    document.querySelector(".mr-2.text-title-large")?.textContent?.trim() ||
    problemId;

  let problemTitle = rawTitle.replace(/^\d+\.\s*/, "");

  // Validation: If title is just a number or too short, use titleized problemId
  if (problemTitle === "0" || !isNaN(problemTitle) || problemTitle.length < 2) {
    problemTitle = titleize(problemId);
  }
  console.log(
    "✅ DSA Shadow detected successful submission:",
    problemId,
    problemTitle,
  );

  if (chrome.runtime?.id) {
    chrome.storage.local.set(
      {
        pendingSubmission: {
          problem_id: problemId,
          problem_title: problemTitle,
        },
      },
      () => {
        if (chrome.runtime.lastError) return;
        showPopup(problemTitle);
      },
    );
  }
}

function showPopup(problemTitle) {
  document.getElementById("dsa-shadow-popup")?.remove();

  const popup = document.createElement("div");
  popup.id = "dsa-shadow-popup";
  popup.innerHTML = `
    <div style="
      position: fixed; bottom: 24px; right: 24px;
      background: #1e1e2e; color: white;
      padding: 20px; border-radius: 16px;
      width: 300px; z-index: 999999;
      font-family: Arial, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      border: 1px solid #313244;
    ">
      <style>
        .dsa-loader {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          width: 14px;
          height: 14px;
          animation: dsa-spin 1s linear infinite;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes dsa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      </style>
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">🎯 DSA Shadow</div>
      <div style="font-size: 12px; color: #aaa; margin-bottom: 16px;">${problemTitle}</div>

      <div style="font-size: 13px; margin-bottom: 8px;">Did you use AI or hints?</div>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button id="hint-yes" style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid #444; background: #313244; color: white; cursor: pointer;">Yes</button>
        <button id="hint-no" style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid #444; background: #313244; color: white; cursor: pointer;">No</button>
      </div>

      <div style="font-size: 13px; margin-bottom: 8px;">How did it feel?</div>
      <div style="display: flex; gap: 4px; margin-bottom: 20px;">
        <button id="diff-forgot" style="flex:1; padding: 8px 4px; border-radius: 8px; border: 1px solid #444; background: #313244; color: white; cursor: pointer; font-size: 11px;">Forgot</button>
        <button id="diff-easy" style="flex:1; padding: 8px 4px; border-radius: 8px; border: 1px solid #444; background: #313244; color: white; cursor: pointer; font-size: 11px;">Easy</button>
        <button id="diff-medium" style="flex:1; padding: 8px 4px; border-radius: 8px; border: 1px solid #444; background: #313244; color: white; cursor: pointer; font-size: 11px;">Med</button>
        <button id="diff-hard" style="flex:1; padding: 8px 4px; border-radius: 8px; border: 1px solid #444; background: #313244; color: white; cursor: pointer; font-size: 11px;">Hard</button>
      </div>

      <button id="dsa-submit-btn" style="
        width: 100%; padding: 10px;
        background: #3b82f6; color: white;
        border: none; border-radius: 8px;
        font-weight: bold; cursor: pointer; font-size: 14px;
      ">Submit</button>

      <button id="dsa-dismiss-btn" style="
        width: 100%; padding: 8px; margin-top: 8px;
        background: transparent; color: #666;
        border: none; cursor: pointer; font-size: 12px;
      ">Dismiss</button>
    </div>
  `;
  document.body.appendChild(popup);

  let hintUsed = null;
  let difficulty = null;

  // Hint buttons
  document.getElementById("hint-yes").addEventListener("click", () => {
    hintUsed = true;
    document.getElementById("hint-yes").style.background = "#3b82f6";
    document.getElementById("hint-no").style.background = "#313244";
  });

  document.getElementById("hint-no").addEventListener("click", () => {
    hintUsed = false;
    document.getElementById("hint-yes").style.background = "#313244";
    document.getElementById("hint-no").style.background = "#3b82f6";
  });

  // Difficulty buttons
  ["forgot", "easy", "medium", "hard"].forEach((d) => {
    const btn = document.getElementById(`diff-${d}`);
    if (btn) {
      btn.addEventListener("click", () => {
        difficulty = d.charAt(0).toUpperCase() + d.slice(1);
        ["forgot", "easy", "medium", "hard"].forEach((x) => {
          const otherBtn = document.getElementById(`diff-${x}`);
          if (otherBtn) {
            otherBtn.style.background =
              x === d ? (d === "forgot" ? "#ef4444" : "#3b82f6") : "#313244";
          }
        });
      });
    }
  });

  // Dismiss button
  document.getElementById("dsa-dismiss-btn").addEventListener("click", () => {
    document.getElementById("dsa-shadow-popup").remove();
  });

  // Submit button
  document.getElementById("dsa-submit-btn").addEventListener("click", () => {
    if (hintUsed === null || !difficulty) {
      alert("Please select both options!");
      return;
    }

    const submitBtn = document.getElementById("dsa-submit-btn");
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="dsa-loader"></span> Submitting...';

    chrome.storage.local.get(
      ["dsa_user_id", "pendingSubmission"],
      async (data) => {
        if (!data.dsa_user_id) {
          alert("Please sign in at localhost:3000 first!");
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          return;
        }

        try {
          const res = await fetch(
            "https://dsa-shadow.vercel.app/api/log-submission",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: data.dsa_user_id,
                problem_id: data.pendingSubmission.problem_id,
                problem_title: data.pendingSubmission.problem_title,
                hint_used: hintUsed,
                difficulty_feel: difficulty,
              }),
            },
          );

          const result = await res.json();
          if (result.success) {
            await fetch("https://dsa-shadow.vercel.app/api/mark-complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: data.dsa_user_id,
                problem_id: data.pendingSubmission.problem_id,
              }),
            });

            document.getElementById("dsa-shadow-popup").remove();
            const toast = document.createElement("div");
            toast.innerHTML = `<div style="position:fixed;bottom:24px;right:24px;background:#22c55e;color:white;padding:12px 20px;border-radius:12px;z-index:999999;font-family:Arial,sans-serif;font-weight:bold;">✅ Logged to DSA Shadow!</div>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
          }
        } catch (err) {
          alert("Error logging submission. Is the server running?");
          console.error(err);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      },
    );
  });
}
