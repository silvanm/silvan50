#!/usr/bin/env python3
"""
Test Runner for Triangle Slideshow

This script provides a command-line interface for running tests.
"""

import argparse
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description="Run tests for Triangle Slideshow")

    parser.add_argument(
        "--module",
        "-m",
        choices=["transition", "processor", "slideshow", "all"],
        default="all",
        help="Which module to test (default: all)",
    )

    parser.add_argument(
        "--coverage", "-c", action="store_true", help="Run with coverage report"
    )

    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Run in verbose mode"
    )

    args = parser.parse_args()

    # Base command
    cmd = ["pytest"]

    # Add verbose flag if requested
    if args.verbose:
        cmd.append("-v")

    # Add coverage if requested
    if args.coverage:
        cmd.append("--cov=triangle_slideshow")
        cmd.append("--cov-report=term")

    # Determine which tests to run
    if args.module == "all":
        cmd.append("tests/")
    else:
        cmd.append(f"tests/test_triangle_slideshow/test_{args.module}.py")

    # Run the tests
    try:
        print(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, check=True)
        return 0
    except subprocess.CalledProcessError as e:
        print(f"Tests failed with exit code {e.returncode}")
        return e.returncode


if __name__ == "__main__":
    sys.exit(main())
