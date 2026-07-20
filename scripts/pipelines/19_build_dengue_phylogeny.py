#!/usr/bin/env python3
"""Build a reviewed-input dengue neighbor-joining tree from aligned consensus FASTA."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from Bio import AlignIO, Phylo
from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("aligned_fasta", type=Path, help="Laboratory-reviewed aligned consensus FASTA")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/genomics"))
    args = parser.parse_args()
    if not args.aligned_fasta.is_file():
        raise SystemExit(f"Input not found: {args.aligned_fasta}")
    alignment = AlignIO.read(args.aligned_fasta, "fasta")
    if len(alignment) < 3:
        raise SystemExit("At least three reviewed sequences are required for a phylogeny.")
    if len({record.id for record in alignment}) != len(alignment):
        raise SystemExit("Sequence identifiers must be unique.")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    tree = DistanceTreeConstructor().nj(DistanceCalculator("identity").get_distance(alignment))
    tree_path = args.output_dir / "dengue_neighbor_joining.newick"
    Phylo.write(tree, tree_path, "newick")
    checksum = hashlib.sha256(tree_path.read_bytes()).hexdigest()
    manifest = {
        "artifact_type": "phylogeny_newick", "method": "neighbor_joining_identity_distance",
        "software_version": "Biopython", "sequence_count": len(alignment),
        "alignment_length": alignment.get_alignment_length(), "input": str(args.aligned_fasta),
        "output": str(tree_path), "file_checksum": checksum,
        "created_at": datetime.now(timezone.utc).isoformat(), "review_status": "pending_review",
        "claim_boundary": "Exploratory laboratory product; epidemiological interpretation requires genomic and phylogenetic review.",
    }
    (args.output_dir / "dengue_neighbor_joining.manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
