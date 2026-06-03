export interface ProjectEquation {
  label: string;
  equation: string;
  note: string;
}

export interface ProjectSection {
  title: string;
  body: string[];
  bullets?: string[];
}

export interface ProjectDetail {
  slug: string;
  eyebrow: string;
  title: string;
  deck: string;
  stack: string[];
  equations?: ProjectEquation[];
  sections: ProjectSection[];
}

export const projectDetails: Record<string, ProjectDetail> = {
  "diffusion-ebm": {
    slug: "diffusion-ebm",
    eyebrow: "Masked diffusion + factor graphs",
    title: "diffusion-ebm",
    deck:
      "A research prototype that asks whether explicit factor-graph structure can improve multi-mask agreement when a masked-diffusion language model only supplies per-position logits.",
    stack: ["Python 3.12", "PyTorch", "JAX", "transformers", "THRML", "marimo", "CUDA"],
    equations: [
      {
        label: "Factor graph objective",
        equation:
          "p(x \\mid c) \\propto \\exp\\!\\left(\\sum_i \\phi_i(x_i; c) + \\sum_{(i,j)} \\psi_{ij}(x_i, x_j; c)\\right)",
        note:
          "The language model supplies unary scores for each masked position. Equality or learned pairwise factors add cross-position structure that is absent from independent sampling."
      },
      {
        label: "Block-Gibbs update",
        equation:
          "p(x_B \\mid x_{\\setminus B}, c) \\propto \\exp\\!\\left(\\sum_{i \\in B} \\phi_i(x_i) + \\sum_{(i,j) \\in \\partial B} \\psi_{ij}(x_i, x_j)\\right)",
        note:
          "THRML samples blocks of categorical variables jointly so agreement constraints can be satisfied within a fixed neural-forward budget."
      }
    ],
    sections: [
      {
        title: "Problem",
        body: [
          "Masked-diffusion language models can produce strong local token distributions while still filling related holes inconsistently. The project uses deliberately small prompt templates where several masked positions should agree, then compares joint sampling against Mask-Predict and top-k ancestral baselines.",
          "The point is not to build a production decoder. It is to isolate one question: when neural forwards are expensive, can symbolic or learned factors recover useful joint signal from a single model call?"
        ]
      },
      {
        title: "Implementation",
        body: [
          "The repository builds candidate sets from MDLM logits, constructs factor graphs with hard equality or learned pairwise factors, and evaluates agreement, perplexity, and forward-pass cost across controlled templates.",
          "Notebook and experiment entrypoints keep the workflow inspectable: smoke tests, Pareto sweeps, boundary-template analysis, and a learned-factor training scaffold."
        ],
        bullets: [
          "Core comparison: THRML joint sampling versus Mask-Predict and independent top-k sampling.",
          "Boundary cases: long-distance agreement, multiple groups, distractors, polysemy, and degenerate candidate sets.",
          "Learned-factor scaffold: Joint-Transition NCE over masked-position hidden states."
        ]
      },
      {
        title: "What it shows",
        body: [
          "On the controlled equality tasks, the factor graph can reach perfect agreement with one language-model forward where iterative baselines spend more forwards and still miss harder constraints.",
          "The useful lesson is mechanical: if the candidate state space contains a valid joint assignment, explicit structure can make that assignment reachable without asking the neural model to rediscover it repeatedly."
        ]
      }
    ]
  },
  valurile: {
    slug: "valurile",
    eyebrow: "Rust CFD workspace",
    title: "Valurile",
    deck:
      "A Rust lattice-Boltzmann CFD workspace with solver, GPU visualization, CUDA/OpenGL interop experiments, and an egui desktop interface for interactive flow analysis.",
    stack: ["Rust", "CUDA", "OpenGL", "egui", "wgpu", "ndarray", "rayon"],
    equations: [
      {
        label: "D2Q9 BGK update",
        equation:
          "f_i(x + c_i\\Delta t, t + \\Delta t) = f_i(x,t) - \\frac{1}{\\tau}\\left(f_i(x,t) - f_i^{eq}(x,t)\\right)",
        note:
          "The LBM solver evolves particle distribution functions through collision and streaming steps rather than directly solving the Navier-Stokes variables."
      },
      {
        label: "Lattice viscosity and Reynolds number",
        equation: "\\nu_{lbm} = \\frac{\\tau - 0.5}{3}, \\qquad Re = \\frac{U L}{\\nu}",
        note:
          "The mapping code preserves the physical Reynolds number while choosing stable lattice velocity, grid spacing, and relaxation time."
      }
    ],
    sections: [
      {
        title: "Scope",
        body: [
          "Valurile is the newer Rust CFD project, separate from the older browser Stream Sim demo. It organizes the solver, visualization core, CLI, and desktop interface as a Rust workspace.",
          "The application supports cylinder and airfoil obstacles, real-to-lattice parameter mapping, force history, drag/lift history, and selectable visualization fields."
        ]
      },
      {
        title: "Implementation",
        body: [
          "The solver side includes CPU and CUDA-oriented lattice-Boltzmann paths. The view layer uses egui docking tabs for simulation, plotting, logs, STL loading, JSON inspection, and code editing.",
          "The GPU path focuses on interactive feedback: velocity magnitude, density, pressure, and vorticity can be visualized while the simulation advances."
        ],
        bullets: [
          "Domain mapping from meters and m/s into lattice units.",
          "Airfoil code and angle controls plus cylinder obstacle setup.",
          "Force, Cd, and Cl histories registered for plotting."
        ]
      },
      {
        title: "Why it matters",
        body: [
          "The project is a practical bridge between engineering analysis and software systems work: numerical stability, GPU rendering, data layout, UI feedback, and physical nondimensionalization all have to line up."
        ]
      }
    ]
  },
  repx: {
    slug: "repx",
    eyebrow: "Build provenance",
    title: "repx",
    deck:
      "A Rust and eBPF tool for tracing build processes, canonicalizing file operations, and verifying reproducible process attestations with Merkle roots.",
    stack: ["Rust", "Aya eBPF", "Linux", "SHA-256", "serde", "clap", "Nix"],
    equations: [
      {
        label: "Merkle parent hash",
        equation: "H_{parent} = SHA256(H_{left} \\parallel H_{right})",
        note:
          "Canonical build operations become leaves. A single root hash summarizes the observed process while preserving enough tree structure to locate divergence."
      },
      {
        label: "Verification condition",
        equation: "verified := root_{expected} = root_{actual}",
        note:
          "Verification reruns the command under the same tracing policy and fails if the canonicalized operation tree changes."
      }
    ],
    sections: [
      {
        title: "Problem",
        body: [
          "A build can appear reproducible at the artifact level while hiding different process behavior underneath. repx traces the process itself so file operations and watched directory accesses become part of the attestation.",
          "The goal is a compact provenance record that can eventually fit into SLSA or in-toto style supply-chain workflows."
        ]
      },
      {
        title: "Implementation",
        body: [
          "The userspace CLI exposes trace and verify commands. The eBPF probe captures process/file activity, the Rust canonicalizer normalizes operations, and the attestation module writes a JSON predicate containing the command, Merkle tree, and root hash.",
          "On mismatch, repx walks the two trees and reports divergent nodes so the failure is not just a yes/no answer."
        ],
        bullets: [
          "System-wide watch directories for build inputs and outputs.",
          "Canonical operation dumps for test assertions and diagnostics.",
          "Explicit failure when dropped events make integrity unverifiable."
        ]
      }
    ]
  },
  spacedb: {
    slug: "spacedb",
    eyebrow: "Space object database",
    title: "spacedb",
    deck:
      "A 3D space-object catalog and orbital analysis tool for satellites and debris, combining catalog ingestion, propagation, filtering, and WGPU rendering.",
    stack: ["Rust", "egui", "WGPU", "satkit", "Nyx", "ANISE", "Rayon", "Space-Track"],
    equations: [
      {
        label: "Two-body core acceleration",
        equation: "a = -\\frac{\\mu r}{\\lVert r \\rVert^3} + a_{perturbations}",
        note:
          "The high-fidelity path extends the central-gravity term with selectable atmosphere, gravity, solar radiation pressure, and third-body settings."
      },
      {
        label: "Closest approach screen",
        equation: "d_{ij}(t) = \\lVert r_i(t) - r_j(t) \\rVert",
        note:
          "Collision analysis propagates candidate objects over a horizon and reports events below a configured distance threshold."
      }
    ],
    sections: [
      {
        title: "Scope",
        body: [
          "spacedb loads and searches space-object data from multiple catalog sources, propagates selected objects, and renders the result as an interactive Earth/satellite scene.",
          "The codebase has both a GUI workflow and command-line analysis modes for collision screening, decay prediction, and debris-value scoring."
        ]
      },
      {
        title: "Implementation",
        body: [
          "The GUI uses egui panels for search, browsing, object detail, filters, and time controls. A propagation worker keeps satellite state updates off the UI thread, while WGPU handles the Earth, satellites, and orbit tracks.",
          "The analysis module supports SGP4 for speed and numerical high-fidelity options when atmosphere, gravity model, SRP, and third-body effects matter."
        ],
        bullets: [
          "Search index and filters over NORAD IDs, object metadata, TLE age, altitude, and velocity.",
          "Catalog cache inputs for GCAT, DISCOS, Space-Track, and related object data.",
          "Parallel analysis commands for large candidate sets."
        ]
      }
    ]
  },
  "fem-live-demo": {
    slug: "fem-live-demo",
    eyebrow: "WebAssembly engineering demo",
    title: "FEM Live Demo",
    deck:
      "A preserved browser-based finite-element simulation demo delivered as static WebAssembly and canvas rendering through GitHub Pages.",
    stack: ["Rust", "WebAssembly", "Canvas", "Static hosting"],
    equations: [
      {
        label: "Linear finite-element system",
        equation: "K u = f",
        note:
          "The assembled stiffness matrix K maps nodal displacement unknowns u to externally applied loads f under the selected constraints."
      },
      {
        label: "Element stiffness form",
        equation: "K_e = \\int_{\\Omega_e} B^T D B\\,d\\Omega",
        note:
          "The exact element implementation depends on the demo model, but the page is framed around the standard stiffness assembly idea."
      }
    ],
    sections: [
      {
        title: "Scope",
        body: [
          "This is a small live engineering visualization that remains useful as a quick browser demo. It is not part of the newer Astro site code; it is preserved as a static asset under the same public path.",
          "The migration keeps the demo folder intact so WebAssembly loading and relative asset paths continue to work after GitHub Pages deployment."
        ]
      },
      {
        title: "Why it stays live",
        body: [
          "A portfolio page can describe numerical engineering work, but a live simulation makes it easier to see the practical implementation layer: initialization, rendering, browser constraints, and the load path from Rust output to WebAssembly."
        ]
      }
    ]
  },
  "stream-sim": {
    slug: "stream-sim",
    eyebrow: "Browser fluid demo",
    title: "Stream Sim",
    deck:
      "A standalone browser fluid simulation demo from the current site, kept separate from Valurile and preserved with its original dashboard-style controls.",
    stack: ["JavaScript", "Canvas", "Pyodide", "HTML/CSS"],
    equations: [
      {
        label: "Projection target",
        equation: "\\nabla \\cdot u = 0",
        note:
          "The solver iteratively adjusts pressure and face velocities to reduce divergence and approximate incompressible flow."
      },
      {
        label: "Semi-Lagrangian advection",
        equation: "q_{next}(x) = q_{current}(x - \\Delta t\\,u(x))",
        note:
          "Velocity and marker-density fields are sampled backward along the flow to update the grid each step."
      }
    ],
    sections: [
      {
        title: "Scope",
        body: [
          "Stream Sim is the older web-native demo, not the Valurile Rust workspace. It runs in the browser, draws into a canvas, and exposes controls for pressure, smoke, streamlines, over-relaxation, and simulation reset.",
          "The code builds an airfoil profile, marks solid cells, applies inflow conditions, and steps a grid-based incompressible-fluid approximation."
        ]
      },
      {
        title: "Implementation",
        body: [
          "The demo stores staggered velocity components, pressure, cell solidity, and marker density in typed arrays. Each simulation step applies gravity, pressure projection, boundary extrapolation, velocity advection, and marker-density advection.",
          "It uses Pyodide for small airfoil-data preprocessing, then drives the visualization with JavaScript and canvas."
        ]
      }
    ]
  },
  "eddy-current-braking": {
    slug: "eddy-current-braking",
    eyebrow: "Embedded controls + magnetic simulation",
    title: "Eddy Current Braking System",
    deck:
      "A hardware and simulation project combining Rust firmware, motor control, live telemetry, and Python/NGSolve studies for magnetic eddy-current braking.",
    stack: ["Rust no_std", "Arduino Due", "egui", "UART", "Python", "NGSolve", "Nix"],
    equations: [
      {
        label: "PI control law",
        equation: "u = k_S\\,\\operatorname{sign}(\\omega_{ref}) + k_V\\omega_{ref} + k_p e + k_i\\int e\\,dt",
        note:
          "The firmware supports feedforward-only and feedforward-plus-PI speed control with output clamps, slew limits, and target ramping."
      },
      {
        label: "Eddy-current intuition",
        equation: "J = \\sigma(E + v \\times B)",
        note:
          "The magnetic braking model is driven by induced currents from conductor motion through a magnetic field."
      }
    ],
    sections: [
      {
        title: "Scope",
        body: [
          "The project includes embedded firmware for an Arduino Due, a native egui dashboard, standalone Arduino test sketches, and a Python magnetic braking simulation workspace.",
          "The firmware reads an AS5048A magnetic encoder over SPI, drives an H-bridge with PWM, and reports command/state telemetry over UART."
        ]
      },
      {
        title: "Implementation",
        body: [
          "The Rust firmware is built around explicit modes: idle, manual duty, feedforward, and PI control. The dashboard provides live tuning and plots for motion and internal control signals.",
          "The simulation side uses NGSolve/Netgen and marimo notebooks to explore eddy-current braking behavior before or alongside hardware testing."
        ],
        bullets: [
          "Manual duty and target-speed control modes.",
          "Velocity estimation with EMA smoothing and N-sample windows.",
          "Nix workflows for firmware, dashboard, flashing, and simulation."
        ]
      }
    ]
  }
};
