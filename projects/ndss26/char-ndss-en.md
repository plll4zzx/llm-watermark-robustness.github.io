
<p align="center">
    <img src="projects/ndss26/Picture5.png" width="700">
</p>

&dagger; Equal contribution

* *Paper link*: [Character-Level Perturbations Disrupt LLM Watermarks | Abstract](https://arxiv.org/abs/2509.09112)
* *Code link*: [CharacterRemoval4WM](https://github.com/plll4zzx/CharacterRemoval4WM)

Our paper **Character-Level Perturbations Disrupt LLM Watermarks** has been accepted to the *Network and Distributed System Security (NDSS)* Symposium 2026.
Large Language Model (LLM) watermarking, which embeds detectable signals during text generation, has been regarded as a promising solution for copyright protection, misuse prevention, and AI-generated content detection. However, a key challenge lies in accurately assessing the robustness of watermark schemes. Current evaluations rely on watermark removal attacks, yet most existing attacks are suboptimal, leading to a misconception that successful removal always requires either large perturbation budgets or powerful adversaries’ capabilities.

In this work, we systematically investigate the robustness of LLM watermarking:

* We formalize the system model and define two realistic threat models with limited detector access.

<p align="center">
    <img src="projects/ndss26/Picture2.png" width="500">
</p>

* We analyze different perturbation types and demonstrate that character-level perturbations (e.g., typos, deletions, homoglyphs) achieve stronger removal performance by disrupting tokenization, allowing a single modification to affect multiple tokens.
<p align="center">
    <img src="projects/ndss26/Picture3.png" width="500">
</p>

* We propose a reference-detector-guided genetic algorithm to optimize perturbations, and design a compound character-level attack that effectively bypasses potential defenses.
<p align="center">
    <img src="projects/ndss26/Picture4.png" width="500">
</p>

Experiments on five representative watermarking schemes and two widely used LLMs consistently confirm the superiority of character-level perturbations. Our findings highlight critical vulnerabilities in current watermarking techniques and emphasize the urgent need for more robust mechanisms
<p align="center">
    <img src="projects/ndss26/Picture1.png" width="500">
</p>