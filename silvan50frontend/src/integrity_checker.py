#!/usr/bin/env python3

import json
import sys
from typing import Dict, List, Any, Tuple


def load_slideshow_data(filepath: str) -> Dict[str, Any]:
    """Load slideshow data from JSON file."""
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        sys.exit(1)


def check_slide_integrity(data: Dict[str, Any]) -> List[str]:
    """Check basic slide data integrity."""
    issues = []

    # Check if slides exist
    if "slides" not in data:
        issues.append("ERROR: No 'slides' property found in data")
        return issues

    # Check if transitions exist
    if "transitions" not in data:
        issues.append("ERROR: No 'transitions' property found in data")
        return issues

    slides = data["slides"]
    transitions = data["transitions"]

    # Check if slides is a list
    if not isinstance(slides, list):
        issues.append("ERROR: 'slides' is not a list")
        return issues

    # Check if transitions is a list
    if not isinstance(transitions, list):
        issues.append("ERROR: 'transitions' is not a list")
        return issues

    # Check if there are at least 2 slides (needed for transitions)
    if len(slides) < 2:
        issues.append(f"ERROR: Not enough slides ({len(slides)}) for transitions")

    # Check that slides have triangles
    for i, slide in enumerate(slides):
        if "triangles" not in slide:
            issues.append(f"ERROR: Slide {i} has no 'triangles' property")
        elif not isinstance(slide["triangles"], list):
            issues.append(f"ERROR: Slide {i} 'triangles' is not a list")
        elif len(slide["triangles"]) == 0:
            issues.append(f"WARNING: Slide {i} has no triangles")

        if "name" not in slide:
            issues.append(f"WARNING: Slide {i} has no name")

    return issues


def check_transition_integrity(data: Dict[str, Any]) -> List[str]:
    """Check transitions for integrity issues."""
    issues = []
    slides = data["slides"]
    transitions = data["transitions"]

    # Check each transition
    for i, transition in enumerate(transitions):
        # Check required properties
        if "from" not in transition:
            issues.append(f"ERROR: Transition {i} has no 'from' property")
            continue
        if "to" not in transition:
            issues.append(f"ERROR: Transition {i} has no 'to' property")
            continue
        if "pairings" not in transition:
            issues.append(f"ERROR: Transition {i} has no 'pairings' property")
            continue

        from_idx = transition["from"]
        to_idx = transition["to"]
        pairings = transition["pairings"]

        # Check indices are valid
        if from_idx < 0 or from_idx >= len(slides):
            issues.append(f"ERROR: Transition {i} 'from' index {from_idx} out of range")
            continue
        if to_idx < 0 or to_idx >= len(slides):
            issues.append(f"ERROR: Transition {i} 'to' index {to_idx} out of range")
            continue

        if not isinstance(pairings, list):
            issues.append(f"ERROR: Transition {i} 'pairings' is not a list")
            continue

        from_slide = slides[from_idx]
        to_slide = slides[to_idx]

        # Check each pairing
        from_indices_used = set()
        to_indices_used = set()

        for j, pairing in enumerate(pairings):
            # Check required properties
            if "from_index" not in pairing:
                issues.append(
                    f"ERROR: Pairing {j} in transition {i} has no 'from_index'"
                )
                continue
            if "to_index" not in pairing:
                issues.append(f"ERROR: Pairing {j} in transition {i} has no 'to_index'")
                continue

            from_triangle_idx = pairing["from_index"]
            to_triangle_idx = pairing["to_index"]

            # Check indices are valid
            if from_triangle_idx < 0 or from_triangle_idx >= len(
                from_slide["triangles"]
            ):
                issues.append(
                    f"ERROR: Transition {i} pairing {j} has 'from_index' {from_triangle_idx} out of range"
                )
                continue

            if to_triangle_idx < 0 or to_triangle_idx >= len(to_slide["triangles"]):
                issues.append(
                    f"ERROR: Transition {i} pairing {j} has 'to_index' {to_triangle_idx} out of range"
                )
                continue

            # Check for duplicate use of triangles
            if from_triangle_idx in from_indices_used:
                issues.append(
                    f"ERROR: Transition {i} reuses 'from' triangle {from_triangle_idx} multiple times"
                )
            else:
                from_indices_used.add(from_triangle_idx)

            if to_triangle_idx in to_indices_used:
                issues.append(
                    f"ERROR: Transition {i} reuses 'to' triangle {to_triangle_idx} multiple times"
                )
            else:
                to_indices_used.add(to_triangle_idx)

        # Check for unpaired triangles
        num_from_triangles = len(from_slide["triangles"])
        num_to_triangles = len(to_slide["triangles"])

        if len(from_indices_used) < num_from_triangles:
            unpaired = set(range(num_from_triangles)) - from_indices_used
            issues.append(
                f"WARNING: Transition {i} has {len(unpaired)} unpaired 'from' triangles: {sorted(unpaired)}"
            )

        if len(to_indices_used) < num_to_triangles:
            unpaired = set(range(num_to_triangles)) - to_indices_used
            issues.append(
                f"WARNING: Transition {i} has {len(unpaired)} unpaired 'to' triangles: {sorted(unpaired)}"
            )

    return issues


def check_bidirectional_transitions(data: Dict[str, Any]) -> List[str]:
    """Check if transitions are properly bidirectional."""
    issues = []
    transitions = data["transitions"]

    # Create a mapping of transitions
    transition_map = {}
    for i, transition in enumerate(transitions):
        from_idx = transition["from"]
        to_idx = transition["to"]
        key = (from_idx, to_idx)
        transition_map[key] = i

    # Check if transitions exist for all slide pairs
    slides = data["slides"]
    num_slides = len(slides)

    for i in range(num_slides):
        next_slide = (i + 1) % num_slides
        if (i, next_slide) not in transition_map:
            issues.append(
                f"ERROR: Missing transition from slide {i} to slide {next_slide}"
            )

    # Check for reciprocal transitions
    for i, transition in enumerate(transitions):
        from_idx = transition["from"]
        to_idx = transition["to"]

        # Check if there's a reverse transition
        reverse_key = (to_idx, from_idx)
        if reverse_key not in transition_map:
            issues.append(
                f"WARNING: No reverse transition from slide {to_idx} to slide {from_idx}"
            )

    return issues


def check_pairing_consistency(data: Dict[str, Any]) -> List[str]:
    """Check if pairings are consistent between forward and reverse transitions."""
    issues = []
    transitions = data["transitions"]

    # Create a mapping of transitions
    transition_map = {}
    for i, transition in enumerate(transitions):
        from_idx = transition["from"]
        to_idx = transition["to"]
        key = (from_idx, to_idx)
        transition_map[key] = i

    # Check each transition
    for i, transition in enumerate(transitions):
        from_idx = transition["from"]
        to_idx = transition["to"]

        # Check if there's a reverse transition
        reverse_key = (to_idx, from_idx)
        if reverse_key not in transition_map:
            continue  # Already reported by check_bidirectional_transitions

        reverse_idx = transition_map[reverse_key]
        reverse_transition = transitions[reverse_idx]

        # Build mapping of pairings
        forward_pairings = {}
        for pairing in transition["pairings"]:
            from_triangle = pairing["from_index"]
            to_triangle = pairing["to_index"]
            forward_pairings[from_triangle] = to_triangle

        # Build mapping of reverse pairings
        reverse_pairings = {}
        for pairing in reverse_transition["pairings"]:
            from_triangle = pairing["from_index"]
            to_triangle = pairing["to_index"]
            reverse_pairings[from_triangle] = to_triangle

        # Check consistency
        for from_triangle, to_triangle in forward_pairings.items():
            if to_triangle in reverse_pairings:
                reverse_match = reverse_pairings[to_triangle]
                if reverse_match != from_triangle:
                    issues.append(
                        f"ERROR: Inconsistent pairing: Triangle {from_triangle} in slide {from_idx} "
                        f"pairs to {to_triangle} in slide {to_idx}, but in reverse, "
                        f"triangle {to_triangle} pairs to {reverse_match} (expected {from_triangle})"
                    )

    return issues


def check_triangle_counts(data: Dict[str, Any]) -> List[str]:
    """Check if all slides have the same number of triangles."""
    issues = []
    slides = data["slides"]

    if not slides:
        return issues

    # Get the number of triangles in each slide
    triangle_counts = [len(slide["triangles"]) for slide in slides]

    # Check if all slides have the same number of triangles
    if len(set(triangle_counts)) > 1:
        for i, count in enumerate(triangle_counts):
            issues.append(
                f"INFO: Slide {i} ({slides[i].get('name', 'unnamed')}) has {count} triangles"
            )

        min_count = min(triangle_counts)
        max_count = max(triangle_counts)

        if min_count != max_count:
            issues.append(
                f"WARNING: Slides have different numbers of triangles (min: {min_count}, max: {max_count})"
            )

            # Find which slides have more triangles than needed
            for i, count in enumerate(triangle_counts):
                if count > min_count:
                    issues.append(
                        f"INFO: Slide {i} has {count - min_count} extra triangles"
                    )
    else:
        issues.append(
            f"INFO: All slides have the same number of triangles ({triangle_counts[0]})"
        )

    return issues


def main():
    if len(sys.argv) != 2:
        print("Usage: python integrity_checker.py path/to/slideshow.json")
        sys.exit(1)

    filepath = sys.argv[1]
    data = load_slideshow_data(filepath)

    # Run all checks
    all_issues = []
    all_issues.extend(check_slide_integrity(data))
    all_issues.extend(check_transition_integrity(data))
    all_issues.extend(check_bidirectional_transitions(data))
    all_issues.extend(check_pairing_consistency(data))
    all_issues.extend(check_triangle_counts(data))

    # Print results
    if all_issues:
        print(f"Found {len(all_issues)} issues:")
        for issue in all_issues:
            print(f"- {issue}")

        # Count errors vs warnings vs info
        errors = sum(1 for issue in all_issues if issue.startswith("ERROR"))
        warnings = sum(1 for issue in all_issues if issue.startswith("WARNING"))
        infos = sum(1 for issue in all_issues if issue.startswith("INFO"))

        print(
            f"\nSummary: {errors} errors, {warnings} warnings, {infos} informational messages"
        )

        if errors > 0:
            return 1
    else:
        print("No issues found! Slideshow data is valid.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
