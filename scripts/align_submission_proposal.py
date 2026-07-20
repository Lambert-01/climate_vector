#!/usr/bin/env python3
"""Apply evidence-boundary edits to the converted Nexa proposal DOCX."""

from __future__ import annotations

import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"
NS = {"w": W_NS}

REPLACEMENTS = {
    0: "Title: AI-Enabled Community-Based Early Warning Systems Integrating Essential Climate Variables and Aedes Mosquito Surveillance for Dengue Prevention in the African Great Lakes Region",
    6: "This project proposes an integrated One Health approach combining climate science, entomology, metatranscriptomic surveillance, mathematical modelling, and community engagement to generate and prospectively validate climate-informed dengue risk signals in selected Rwanda pilot sites. Evidence from neighboring Great Lakes settings will provide exploratory regional context and inform future external validation and scale-up.",
    8: "Aim: To understand how climate variability and environmental change influence Aedes mosquito ecology and dengue virus emergence, and to develop and prospectively validate climate-informed early-action signals and community-based surveillance workflows in selected Rwanda pilot sites, with exploratory regional context from neighboring Great Lakes settings.",
    13: "RQ4. To what extent can essential climate variables, standardized entomological observations, and genomic evidence generate calibrated dengue risk signals with useful operational lead time?",
    15: "RQ6. How can regularly updated risk intelligence and human-reviewed signals support timely public health preparedness and targeted surveillance?",
    32: "Objective 3. Develop and prospectively validate the DengueEW-GL proof-of-concept platform (https://climate-vector-web.vercel.app/) by integrating essential climate variables, standardized Aedes surveillance, dengue virus genomic data, population context, and human-mobility data where governed access is available. Statistical and machine-learning approaches, including generalized additive and mixed-effects models, distributed-lag models, Random Forest, Gradient Boosting, and Bayesian spatiotemporal models, will be evaluated only after valid outcomes and sufficient coverage exist. The platform will provide regularly updated weekly or monthly climate-vector risk intelligence, uncertainty, interactive maps, and human-reviewed early-action signals linked to field verification and authorized response. High-resolution products will focus on selected Rwanda pilot sites; neighboring Great Lakes settings will be shown as exploratory context for future external validation.",
    34: "Objective 4. Establish a community-based surveillance component through focus group discussions, photovoice, and co-design with community health workers, schools, local leaders, farmers, and environmental health officers. Mobile reporting will capture standing water, containers, potential breeding sites, environmental conditions, mosquito nuisance observations, photographs, coordinates, consent, and follow-up. Community members will not be expected to identify mosquito species or quantify abundance. Trained entomology teams will verify mosquito identity and abundance using standardized field methods. Participation, data quality, validation time, completed actions, knowledge, and source-reduction practices will be evaluated throughout the pilot.",
    63: "Despite increasing reports of dengue in the African Great Lakes region, surveillance remains fragmented and largely reactive. Essential climate variables, standardized entomological observations, genomic evidence, and community environmental reports are rarely integrated into a governed decision-support workflow that can be prospectively evaluated. Evidence on climate-Aedes relationships and dengue virus emergence in Rwanda and neighboring ecosystems remains limited, while local actors lack timely mechanisms to report potential breeding conditions and receive verified follow-up.",
    64: "Our innovation addresses this gap through DengueEW-GL, an AI-enabled, climate-informed early warning and community surveillance proof of concept. It will integrate climate intelligence, prospective Aedes surveillance, dengue genomic data, and verified community reports to generate regularly updated risk intelligence and human-reviewed early-action signals for targeted surveillance and preparedness.",
    69: "DengueEW-GL is an AI-enabled community-based early warning proof of concept that integrates essential climate variables, standardized Aedes surveillance, dengue genomic evidence, and verified community environmental reports. It will be operationally implemented and validated in selected Rwanda pilot sites. Regional climate and vector-occurrence evidence from neighboring Great Lakes countries will support cross-border preparedness analysis and inform future external validation and scale-up.",
    71: "Statistical and machine-learning methods will be compared through predefined validation protocols. Outputs will include regularly updated climate-vector risk intelligence, uncertainty estimates, interactive pilot-site maps, and human-reviewed signals linked to field verification. The project will evaluate whether these outputs improve targeting, lead time, resource allocation, and response completion; it will not assume that predictive performance or operational thresholds are already validated.",
    72: "A distinctive component is community co-design. Mobile tools will enable participants to report standing water, containers, potential breeding sites, environmental conditions, mosquito nuisance observations, photographs, and locations. Trained entomology teams will verify mosquito identity and abundance. Focus group discussions and photovoice will support locally relevant preparedness and adaptation solutions.",
    74: "The innovation contributes to Nexa priorities by strengthening resilience to climate-related dengue risk, integrating climate and health surveillance workflows, empowering local actors to contribute verifiable environmental evidence, and producing actionable data for preparedness, targeted surveillance, operational learning, and future policy decisions.",
    89: "DengueEW-GL is innovative because it moves dengue preparedness from fragmented, reactive information toward governed, climate-informed surveillance and decision support. In selected Rwanda pilot sites, it will integrate essential climate variables, standardized Aedes observations, genomic evidence, and verified community reports in one traceable platform. The proof of concept will test whether regularly updated risk intelligence improves the timeliness and targeting of verification and preparedness actions.",
    90: "The innovation combines three complementary advances. First, it integrates essential climate variables, standardized entomological observations, genomic evidence, geospatial context, and governed analytics in one traceable platform. Models will be developed in stages and evaluated with temporal and geographic holdouts, calibration, discrimination, lead time, and false-alert burden. Second, communities contribute reports of standing water, containers, potential breeding sites, environmental conditions, and photographs; trained teams verify mosquito identity and abundance. Third, a One Health collaboration across health, environment, climate, agriculture, and technology institutions will co-design review thresholds, response workflows, and a pathway for future cross-border validation.",
    91: "Compared with fragmented surveillance, DengueEW-GL will provide regularly updated, reviewable risk intelligence that combines climate, Aedes, genomic, and community evidence. It is designed to support earlier preparedness and targeted action while keeping uncertainty, evidence provenance, and approval authority visible.",
    96: "The innovation contributes to Nexa's priority outcomes by strengthening climate adaptation, health-system resilience, community participation, and evidence-based action against climate-sensitive dengue risk. It will enable communities and authorized health actors to identify changing environmental conditions, prioritize surveillance, verify signals, and prepare earlier, while prospective evaluation determines whether the approach improves outcomes.",
    97: "The innovation integrates climate, environmental, entomological, genomic, and verified community data to identify priority places and periods for surveillance. Timely risk intelligence, human-reviewed signals, and climate-sensitive maps will support preventive action while prospective validation determines scientific and operational performance.",
    98: "The study will establish an integrated surveillance platform for currently fragmented data streams. Health authorities will access regularly updated decision-support views for targeted vector control, preparedness planning, and resource allocation. The platform will support a shift toward proactive risk management without presenting unvalidated signals as confirmed outbreaks.",
    99: "Through consented mobile reporting, community members will contribute observations of standing water, containers, potential breeding sites, environmental conditions, mosquito nuisance, photographs, and locations. Trained entomology teams will verify mosquito identity and abundance.",
    100: "The study will produce pilot-site Aedes distribution maps, climate-risk assessments, genomic evidence, uncertainty-labelled risk intelligence, and prospective model-validation results. Exploratory regional context maps will support preparedness analysis without implying validated cross-border prediction. These outputs will inform climate adaptation, dengue prevention, and public health planning.",
    101: "Because dengue risk and human movement cross borders, the project will use neighboring-country climate and public vector-occurrence data for exploratory context and shared learning. Operational implementation and validation will occur in selected Rwanda pilot sites; cross-border prediction will require future partner agreements, harmonized surveillance, and external validation.",
    107: "The platform will integrate climate and environmental variables with standardized entomological, genomic, and verified community evidence. It will identify conditions and locations that warrant closer surveillance, while field verification and prospective validation determine whether signals correspond to observed Aedes or dengue outcomes.",
    108: "By combining climate science, digital technologies, genomics, and community participation, the innovation will strengthen capacity to anticipate, prepare for, and respond to climate-sensitive dengue risk. It supports proactive adaptation while retaining human review, uncertainty, and evidence thresholds.",
    137: "The team will integrate essential climate variables, standardized entomological data, genomic results, and verified community reports into the pre-developed DengueEW-GL platform (https://climate-vector-web.vercel.app/). Candidate statistical and machine-learning models will be tested only when outcome, effort, spatial, and temporal requirements are met. The platform will present uncertainty, interactive maps, and human-reviewed signals linked to field verification and response workflows.",
    138: "Milestones: the community reporting workflow will be field-tested; prospective Aedes and genomic records will be quality-controlled; candidate models will be evaluated with predefined validation metrics; and authorized health actors will test the review, verification, assignment, acknowledgment, and follow-up workflow.",
    144: "The project will evaluate technical reliability, model calibration and discrimination, community participation, operational lead time, false-alert burden, response completion, and adoption of preventive practices. Findings will be shared through policy briefs, technical reports, peer-reviewed outputs, and regional learning activities. A sustainability and scale-up roadmap will define the evidence and partnerships required for expansion.",
    147: "Continuous monitoring, stakeholder feedback, and participatory evaluation will refine the innovation. Candidate models will be updated under versioned protocols as quality-controlled surveillance and climate data become available. Community feedback will improve usability, risk communication, and preparedness actions. Pilot evidence will determine technical robustness, operational value, and readiness for any expansion beyond selected Rwanda sites.",
    155: "During testing, community members and community health workers will use the mobile reporting workflow to document standing water, containers, potential breeding sites, environmental conditions, mosquito nuisance observations, photographs, and locations. Trained entomology teams will verify mosquito identity and abundance. Usability, accessibility, participation, validation time, and completed follow-up will be evaluated in real-world settings, including among participants with limited digital literacy.",
    162: "Integrating climate, entomological, genomic, and community data creates risks related to quality, interoperability, completeness, and model validity. The project will use standardized protocols, provenance, automated and manual quality checks, model-readiness gates, versioned analyses, and prospective validation. Missing outcomes will remain explicitly blocked rather than imputed as evidence.",
    164: "Climate effects on mosquito populations may be nonlinear, delayed, and location-specific. The project will test biologically plausible lag structures, quantify uncertainty, assess temporal and geographic transferability, and co-design operational thresholds only after prospective evidence and health-authority review.",
    176: "The innovation will strengthen resilience through development and prospective validation of climate-sensitive dengue risk intelligence. It will integrate multiple evidence streams into a regularly updated decision-support platform, enable community participation through co-designed reporting, and produce Aedes distribution, climate-risk, genomic, operational, and model-validation evidence for public health planning and climate adaptation.",
    177: "Key deliverables will include an operational DengueEW-GL pilot platform; standardized Aedes, climate, genomic, and community workflows; regularly updated pilot-site risk maps with uncertainty; a dengue genomic registry; community sentinel networks; human-reviewed early-action and response workflows; prospective model-validation results; and recommendations for climate-resilient dengue surveillance and control.",
    183: "The proof of concept will test whether an AI-enabled, climate-informed, community-based system can generate useful and prospectively validated dengue risk signals by integrating climate and environmental data, standardized Aedes surveillance, dengue virus genomic evidence, and verified community reports. It will also assess technical, operational, ethical, and financial feasibility in selected Rwanda pilot sites.",
    184: "The central hypothesis is that governed integration of these data streams will provide more timely, calibrated, and actionable risk intelligence than fragmented surveillance, enabling local actors to target verification and preparedness earlier. Predictive and operational performance will be measured rather than assumed.",
    187: "A functional platform integrating climate, environmental, entomological, genomic, and verified community data will operate in selected pilot districts. Regularly updated dashboards, uncertainty-labelled maps, and human-reviewed signals will be accessible to authorized public health stakeholders.",
    189: "Candidate models will generate monthly risk estimates and priority maps when minimum evidence requirements are met. Performance will be evaluated prospectively using calibration, sensitivity, specificity, precision, recall, ROC-AUC, PR-AUC, Brier score, operational lead time, geographic and temporal holdouts, and false-alert burden. Thresholds will be agreed with health authorities; no single accuracy percentage will determine success.",
    193: "Community sentinel networks will report standing water, containers, potential breeding sites, environmental conditions, mosquito nuisance observations, photographs, and locations. Trained entomology teams will verify mosquito identity and abundance. At least 70% of trained participants will be targeted for regular reporting, while participation quality, consent, validation, and follow-up will also be monitored.",
    205: "A baseline, midline, and endline evaluation will be conducted over the 24-month period. The platform will provide regularly updated operational metrics to support adaptive learning, model review, and system refinement.",
}


def paragraph_text(paragraph: ET.Element) -> str:
    return "".join(node.text or "" for node in paragraph.findall(".//w:t", NS))


def replace_paragraph(paragraph: ET.Element, new_text: str) -> None:
    nodes = paragraph.findall(".//w:t", NS)
    if not nodes:
        raise ValueError("Target paragraph has no text nodes")
    nodes[0].text = new_text
    nodes[0].set(f"{{{XML_NS}}}space", "preserve")
    for node in nodes[1:]:
        node.text = ""


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    docx_path = project_root / "proposal_submission_ready.docx"
    if not docx_path.exists():
        raise SystemExit(f"Missing {docx_path}")

    with zipfile.ZipFile(docx_path) as source:
        root = ET.fromstring(source.read("word/document.xml"))
        paragraphs = root.findall(".//w:p", NS)
        for index, replacement in REPLACEMENTS.items():
            if index >= len(paragraphs):
                raise ValueError(f"Paragraph {index} is outside document")
            current = paragraph_text(paragraphs[index]).strip()
            if not current:
                raise ValueError(f"Paragraph {index} is unexpectedly empty")
            replace_paragraph(paragraphs[index], replacement)

        updated_xml = ET.tostring(root, encoding="utf-8", xml_declaration=True)
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as handle:
            temp_path = Path(handle.name)

        try:
            with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as target:
                for item in source.infolist():
                    payload = updated_xml if item.filename == "word/document.xml" else source.read(item.filename)
                    target.writestr(item, payload)
            shutil.move(temp_path, docx_path)
        finally:
            temp_path.unlink(missing_ok=True)

    print(f"Aligned {len(REPLACEMENTS)} proposal paragraphs in {docx_path.name}")


if __name__ == "__main__":
    main()
