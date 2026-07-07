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
  scrap: {
    slug: "scrap",
    eyebrow: "Senior design / AIAA SciTech 2027",
    title: "SCRAP",
    deck:
      "A servicing spacecraft concept that contactlessly detumbles orbital debris with a robot-arm-mounted YBCO superconducting coil, then captures it — with the coil's multiphysics, the mission planning, and the control problem all backed by working simulation code.",
    stack: ["Python", "FEniCSx", "Gmsh", "Rust", "PETSc", "magpylib", "DDPG"],
    equations: [
      {
        label: "Eddy-current detumbling torque",
        equation:
          "\\tau = -\\frac{\\sigma_{eff} V}{\\mu_0^2}\\,(B \\times (\\omega \\times B))",
        note:
          "A time-varying field through the target's conductive structure induces eddy currents whose secondary field opposes the relative rotation, bleeding off angular momentum without contact.",
      },
      {
        label: "HTS E-J power law",
        equation: "E = E_c\\left(\\frac{J}{J_c(T, B)}\\right)^{n}",
        note:
          "The coil quench simulation resolves the sharp superconducting-to-normal transition through the E-J power law, with critical current density dependent on local temperature and field.",
      },
    ],
    sections: [
      {
        title: "Concept",
        body: [
          "Most orbital debris is tumbling, and you cannot grapple what you cannot slow down. SCRAP slows it down without touching it: a high-temperature superconducting coil at the end-effector of a robotic arm induces eddy currents in the target's conductive structure, removing angular momentum before capture. No plume impingement, no mechanical contact with an uncooperative object.",
          "The extended abstract for AIAA SciTech 2027 covers the concept of operations, mission planning, subsystem design, and risk assessment, with co-authors spanning Lockheed Martin, Astranis, and Boeing.",
        ],
      },
      {
        title: "My contributions",
        body: [
          "The concept only closes if the coil survives its own physics. I built a coupled electromagnetic-thermal quench simulation of the YBCO pancake coil in FEniCSx: an H-formulation EM solve with E-J power-law resistivity and per-turn tape meshing, staggered against an axisymmetric heat equation with radiation and cold-finger boundary conditions. It answers two questions that decide feasibility: how much transport current the coil tolerates, and whether passive radiative cooling alone holds it below its 92 K critical temperature.",
          "Mission planning runs on spacedb, the space-object database and servicing-route planner built alongside this project, and DDPG reinforcement-learning agents were trained on the eddy-current detumbling dynamics to explore closed-loop control.",
        ],
        bullets: [
          "Quench detection, adaptive time-stepping, and per-turn loss/hotspot resolution.",
          "Field-strength versus operating-range trades for the coil at the target's center of mass.",
          "Target selection and multi-target servicing routes over the full public catalog.",
        ],
      },
    ],
  },
  "diffusion-ebm": {
    slug: "diffusion-ebm",
    eyebrow: "Thermodynamic sampling vs GPUs for molecular design",
    title: "Thermodynamic Sampling Unit Research",
    deck:
      "How much of a protein or drug design library can you discover per joule, and does thermodynamic sampling hardware actually beat a GPU at it? This is an honest, reproducible energy comparison on real coevolutionary physics, careful throughout about the gap between a headline number and a deliverable.",
    stack: ["Python", "JAX", "NumPy", "THRML", "PyTorch"],
    equations: [
      {
        label: "Potts design landscape",
        equation:
          "H(x) = \\sum_{i} h_i(x_i) + \\sum_{(i,j) \\in E} J_{ij}(x_i, x_j)",
        note:
          "The design problem is a sparse 20-state Potts model over sequence positions, the standard sequence-statistical model of a protein family. Each target motif should sit in its own deep, separated basin.",
      },
      {
        label: "Sampling-stage energy ratio",
        equation:
          "R_{\\text{sampling}} = c_{\\text{flip}} \\cdot r \\approx 100 \\times 10^{4} = 10^{6}",
        note:
          "A digital Potts flip costs about a hundred operations, and the published p-bit anchor dissipates about ten thousand times less energy per flip. For equal library coverage the sampling stage is about a million times cheaper on the device.",
      },
      {
        label: "End-to-end ceiling",
        equation: "R \\le \\frac{1 + D/F}{D/F}",
        note:
          "The deliverable is the whole pipeline, not the sampling stage. Exact target matching costs the same on both platforms and is not accelerated, so it caps the end-to-end ratio no matter how cheap sampling becomes.",
      },
    ],
    sections: [
      {
        title: "The question",
        body: [
          "A thermodynamic sampling unit draws samples from a Boltzmann distribution by letting a physical system relax under its own thermal noise, rather than computing each sample with arithmetic on a processor. Extropic and others pitch this as cheaper, better sampling.",
          "I wanted a concrete answer to a narrower question that a protein or drug design team would actually care about. For a fixed energy budget, how much of a target library of distinct functional sequences can you find, and does the device beat a GPU at finding it?",
        ],
      },
      {
        title: "Why per-sample accuracy is the wrong axis",
        body: [
          "The usual pitch is that the hardware draws better individual samples, and that claim is hard to defend. Over a long sequence of exact-ground-truth tests on frustrated Potts models, annealed importance sampling, a single-machine classical algorithm, matched or beat parallel tempering and block-Gibbs on every quantity I could check exactly. It anneals from infinite temperature, so its chains never have to cross an energy barrier. On accuracy alone the device has no moat.",
          "Design workloads do not live on that axis anyway. Protein design, library screening, and coevolutionary generative modeling all want many valid, distinct candidates spanning a landscape, produced under a hard energy budget. The figure of merit is coverage per joule, and that is where a sampler's cheap draws start to matter.",
        ],
      },
      {
        title: "The sampling-energy result",
        body: [
          "On the sampling stage the arithmetic is clean. A digital Potts flip costs about a hundred operations, and the published p-bit energy anchor is about ten thousand times cheaper per flip, so the sampling-stage energy ratio is about a million. For equal coverage of a twenty-target library the device spends roughly a million times less sampling energy than a GPU, and at a small fixed budget the gap is qualitative, about one percent coverage on the GPU against full coverage on the device.",
          "To pin down what the device has to beat, I ran a coverage gate across 59 randomized landscapes and measured the trials needed for a 99 percent chance of covering all twenty targets, scoring with a genuine Hamming-recovery metric rather than a lenient nearest-label one.",
        ],
        bullets: [
          "Requirement of roughly ten thousand trials by point estimate, up to about twenty-five thousand under a conservative posterior screen.",
          "Coupon-collector scaling, so full coverage needs on the order of K log K chains on either platform and the only lever is the energy per chain.",
          "The genuine recovery metric makes the coverage gap sharper, not weaker, than a lenient assignment metric would.",
        ],
      },
      {
        title: "The honest end-to-end story",
        body: [
          "A million-to-one sampling ratio is not what a real query delivers. A usable coverage run also programs the device, reads out every sample, and matches each readout against the targets on a host. That digital matching stage costs the same on both platforms and is not sped up by the sampler, so it caps the end-to-end ratio the way a serial fraction caps a parallel speedup.",
          "Under a latency proxy that ceiling is a few thousand, far below the sampling ratio, and the true end-to-end energy ratio stays unmeasured because no public device specification supports one. The encoding of a twenty-state variable is a second-order effect next to that digital bottleneck. The point is that the binding constraint is the pipeline, not the device, and quoting the raw sampling ratio would hide it.",
        ],
      },
      {
        title: "Stress test on real protein physics",
        body: [
          "A synthetic landscape guarantees clean, separated basins. Real protein design does not. I rebuilt the objective on real RAS-superfamily couplings, a mean-field model of the family and an independently calibrated pseudo-likelihood model of human KRAS, and added a binding reward on the real contact graph. The coverage advantage then depends on two conditions. The target sequences have to form separate basins, and those basins have to be reachable by a short sampling run. Natural within-family targets fail the first one, because they share a conserved core that the design pressure reinforces until every target collapses into a single consensus basin.",
          "That collapse is a property of rewarding the whole sequence, not of real physics. Real multi-specificity binders share a fold and differ only at a localized binding interface. Placing the reward only on interface contacts over a stable scaffold restores full separation and near-complete coverage from targets that are more than eighty percent identical overall. A forty percent interface reaches ninety-six percent coverage where whole-sequence reward reaches about a third, so the energy arithmetic survives on realistic design problems once the objective is written the way practitioners actually write it.",
        ],
      },
      {
        title: "Where this started",
        body: [
          "The project began on a different question. I paired a pretrained masked-diffusion language model with a THRML block-Gibbs sampler over a sparse factor graph, to see whether explicit structure could improve agreement across several masked positions at a fixed number of neural forward passes. Joint decoding beat independent argmax by seven to fifteen points on held-out text.",
          "Testing the stronger claim that classical samplers could not escape the same barriers, I found that they could, which is what turned the work toward the energy-and-coverage question above. Everything is CPU simulation with review-gated claims. An early million-to-one headline was scoped down to a precise conditional one, the pipeline reproduces bit for bit, and it passes nine of nine regression tests.",
        ],
      },
    ],
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
  },
  "any-nix-bootstrap": {
    slug: "any-nix-bootstrap",
    eyebrow: "Trust-minimized bootstrapping",
    title: "any-nix-bootstrap",
    deck:
      "How much software must you trust before you can trust your compiler? This project drives the answer down to an 813-byte auditable seed, then builds all the way up to any modern Nix package, offline, from one hash-verified ball of sources.",
    stack: ["POSIX sh", "live-bootstrap", "GNU Guix", "Nix", "musl", "qemu"],
    sections: [
      {
        title: "The chain",
        body: [
          "Starting from live-bootstrap's hex0/kaem seed binaries (813 bytes of auditable machine code), the chain builds up through GCC 15, musl, Python, and Guile; uses that sysroot to build GNU Guix from source; uses Guix to build Nix; and finally builds any requested nixpkgs package — with every source hash-pinned in a single manifest and no network access during builds.",
          "The project is deliberately data-over-code: the manifest of SHA256-verified sources is the project, and the driver is a thin POSIX-sh orchestrator with one file per stage and one adapter per environment (chroot, qemu, bare metal). The qemu and metal paths produce self-building boot media that bootstrap themselves from the seed, air-gapped.",
        ],
      },
      {
        title: "Status and war stories",
        body: [
          "Stage 1, which takes the seed to a full GCC 15/musl/Python/Guile sysroot, has executed end-to-end on real hardware, verified against 314 hash-pinned distfiles including deterministically regenerated git tarballs. Stage 2, Guix on musl, is deep in its first real execution. Stages 3 and 4 are written and statically verified.",
          "The debugging log is half the value: rebuilding Guile shared to fix a C-extension segfault, stubbing musl's missing execinfo.h, and repeatedly fixing 2003-era K&R code that GCC 15's new C23 default now rejects. Bootstrapping is archaeology with a linker.",
        ],
      },
    ],
  },
};
