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

const transformerStages = [
  {
    id: "input",
    label: "Stage 01",
    title: "Input state sequence",
    short: "16 x 44 states",
    shape: "16 x 44",
    operation: "A padded sequence of up to 16 state vectors enters the model, with each token carrying the full 44-dimensional observation.",
    purpose:
      "This gives the policy short-horizon temporal context, which is useful when cabinet opening depends on motion history rather than a single frame.",
    notes:
      "The sequence length is fixed at 16. Padding is present, so later pooling uses the last non-padded token rather than a naive final index."
  },
  {
    id: "projection",
    label: "Stage 02",
    title: "Input projection",
    short: "Linear 44 -> 256",
    shape: "16 x 256",
    operation: "Each 44D token is projected through a learned linear layer into a 256-dimensional model space.",
    purpose:
      "The projection lifts the handcrafted state into a wider latent space where attention and feed-forward layers can combine features more flexibly.",
    notes:
      "This is a per-token operation, so the temporal dimension is preserved while feature width expands from 44 to 256."
  },
  {
    id: "positional",
    label: "Stage 03",
    title: "Learned positional embedding",
    short: "1 x 16 x 256",
    shape: "16 x 256 + pos",
    operation: "A learned positional tensor of shape (1, 16, 256) is added to the projected sequence.",
    purpose:
      "Without positional information, the transformer would treat the history as an unordered set. Learned embeddings tell it which state came earlier or later.",
    notes:
      "Because the embedding is learned, the model can specialize each of the 16 time slots for this control task."
  },
  {
    id: "encoder",
    label: "Stage 04",
    title: "4-layer transformer encoder",
    short: "4 x encoder blocks",
    shape: "16 x 256",
    operation:
      "The backbone is a 4-layer TransformerEncoder with batch_first=True, norm_first=True, GELU activation, 8-head attention, and FFN width 1024.",
    purpose:
      "This is where temporal integration happens. Attention lets the model compare current alignment against earlier reach and contact states.",
    notes:
      "Each block uses MultiheadAttention(256, 8), so each head has dimension 32. The feed-forward path is 256 -> 1024 -> 256 with dropout 0.1 and two LayerNorms."
  },
  {
    id: "pooling",
    label: "Stage 05",
    title: "Last valid token pooling",
    short: "select final non-pad",
    shape: "256",
    operation:
      "Instead of using a CLS token or mean pooling, the network extracts the last non-padded token from the encoded sequence.",
    purpose:
      "This matches the control setting well: the action should depend most directly on the most recent valid observation, informed by its attended history.",
    notes:
      "This pooling choice avoids blending padded tokens into the summary and keeps the representation tied to the current control step."
  },
  {
    id: "head",
    label: "Stage 06",
    title: "Final norm and action head",
    short: "LN -> MLP -> 12",
    shape: "12D action",
    operation:
      "A LayerNorm is applied to the pooled 256D feature, followed by Linear(256 -> 256), GELU, Dropout(0.1), and Linear(256 -> 12).",
    purpose:
      "The head converts a temporally informed latent into the action space needed by the robot controller.",
    notes:
      "The model predicts a normalized 12D action vector. At inference, actions are denormalized, static dimensions are restored, and the gripper dimension is thresholded to -1 or 1."
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

const transformerFlow = document.getElementById("transformer-flow");
const transformerNodes = new Map();

function renderTransformerFlow() {
  transformerStages.forEach((stage) => {
    const node = document.createElement("button");
    node.className = "transformer-node";
    node.dataset.stageId = stage.id;
    node.innerHTML = `
      <span class="transformer-node-label">${stage.label}</span>
      <strong>${stage.title}</strong>
      <p>${stage.short}</p>
    `;
    transformerFlow.appendChild(node);
    transformerNodes.set(stage.id, node);
  });
}

function updateTransformerDetail(stageId) {
  const stage = transformerStages.find((item) => item.id === stageId);
  if (!stage) {
    return;
  }

  transformerNodes.forEach((node, nodeId) => {
    node.classList.toggle("active", nodeId === stageId);
  });

  document.getElementById("transformer-stage-label").textContent = stage.label;
  document.getElementById("transformer-stage-shape").textContent = stage.shape;
  document.getElementById("transformer-title").textContent = stage.title;
  document.getElementById("transformer-summary").textContent = `${stage.title} is the ${stage.label.toLowerCase()} in the policy network.`;
  document.getElementById("transformer-operation").textContent = stage.operation;
  document.getElementById("transformer-purpose").textContent = stage.purpose;
  document.getElementById("transformer-notes").textContent = stage.notes;
}

renderTransformerFlow();

transformerNodes.forEach((node, stageId) => {
  node.addEventListener("click", () => updateTransformerDetail(stageId));
});

updateTransformerDetail("encoder");

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
