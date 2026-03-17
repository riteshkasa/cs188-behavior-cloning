const pipelineContent = [
  {
    label: "Step 01",
    title: "Collect expert rollouts",
    body:
      "Behavior cloning starts with demonstrations. For this project, successful cabinet-opening trajectories from RoboCasa365 serve as the supervision signal for the learned policy."
  },
  {
    label: "Step 02",
    title: "Reprocess observations",
    body:
      "Instead of accepting the default state at face value, the team revisits the simulation data to recover object-centric geometric facts such as handle position and relative distance."
  },
  {
    label: "Step 03",
    title: "Expand the state vector",
    body:
      "The final object-aware representation becomes a 44-dimensional vector, combining robot state with cabinet-specific spatial information that is directly relevant to the task."
  },
  {
    label: "Step 04",
    title: "Train and evaluate",
    body:
      "With the richer representation in place, the policy can be trained and compared against a simpler baseline to test whether object awareness improves cabinet-opening performance."
  }
];

const pipelineSteps = document.querySelectorAll(".pipeline-step");
const pipelinePanel = document.getElementById("pipeline-panel");

pipelineSteps.forEach((step) => {
  step.addEventListener("click", () => {
    const index = Number(step.dataset.step);
    const selected = pipelineContent[index];

    pipelineSteps.forEach((item) => item.classList.remove("active"));
    step.classList.add("active");

    pipelinePanel.innerHTML = `
      <p class="pipeline-label">${selected.label}</p>
      <h3>${selected.title}</h3>
      <p>${selected.body}</p>
    `;
  });
});

const toggles = document.querySelectorAll(".toggle");
const modePanels = {
  "robot-only": document.getElementById("robot-only-panel"),
  "object-aware": document.getElementById("object-aware-panel")
};

toggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const mode = toggle.dataset.mode;

    toggles.forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-selected", "false");
    });

    Object.values(modePanels).forEach((panel) => panel.classList.remove("active"));

    toggle.classList.add("active");
    toggle.setAttribute("aria-selected", "true");
    modePanels[mode].classList.add("active");
  });
});

const distanceSlider = document.getElementById("distance-slider");
const distanceValue = document.getElementById("distance-value");
const distanceStatus = document.getElementById("distance-status");
const robotArm = document.getElementById("robot-arm");

function updateDistanceScene(value) {
  distanceValue.textContent = `${value} cm`;
  robotArm.style.setProperty("--arm-distance", `${value}%`);

  if (value > 72) {
    distanceStatus.textContent = "Searching for the handle";
  } else if (value > 42) {
    distanceStatus.textContent = "Approaching the target";
  } else if (value > 20) {
    distanceStatus.textContent = "Aligned for contact";
  } else {
    distanceStatus.textContent = "Ready to pull";
  }
}

updateDistanceScene(distanceSlider.value);

distanceSlider.addEventListener("input", (event) => {
  updateDistanceScene(event.target.value);
});
